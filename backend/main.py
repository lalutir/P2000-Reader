import asyncio
import base64
import collections
import hashlib
import json
import logging
import os
import re
import signal
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# --- Config ---
VALID_INTERVALS = {30, 60, 120, 300, 600, 1200, 1800, 2700, 3600}
scrape_interval: int = int(os.getenv("SCRAPE_INTERVAL_SECONDS", "30"))
if scrape_interval not in VALID_INTERVALS:
    scrape_interval = 30

BASE_DIR = Path(__file__).parent
VAPID_PRIVATE_PATH = BASE_DIR / "vapid_private.pem"
VAPID_PUBLIC_PATH = BASE_DIR / "vapid_public.pem"
VAPID_SUB = "mailto:admin@lalutir.com"
SUBSCRIPTIONS_PATH = BASE_DIR / "subscriptions.json"

P2000_URL = "http://www.p2000-online.net/p2000.py"

EMOJI_MAP = {"Brandweer": "🚒", "Ambulance": "🚑", "Politie": "🚔"}
SERVICE_CLASS_MAP = {"Br": "Brandweer", "Am": "Ambulance", "Po": "Politie"}

# Known P2000 CAD abbreviations per place — mirrors CITY_ALIASES in frontend/web/src/App.jsx.
CITY_ALIASES = {
    "Den Haag": ["SGRAVH", "S-GRAVENHAGE", "Gravenhage"],
    "'s-Hertogenbosch": ["DEN BOSCH", "Den Bosch", "S-HERTOGENBOSCH", "HERTOGENBOSCH"],
    "Rotterdam": ["RTTDM"],
    "Amsterdam": ["ADAM", "A'DAM"],
    "Schiedam": ["SCHIDM"],
    "Waddinxveen": ["WADDXV"],
    "Leeuwarden": ["LWD"],
}


def _city_matches_alert(city: str, message: str) -> bool:
    """Word-boundary-aware check mirroring cityMatchesAlert() in App.jsx."""
    for term in [city, *CITY_ALIASES.get(city, [])]:
        escaped = re.escape(term)
        if re.search(rf"(?<!\w){escaped}(?!\w)", message, re.IGNORECASE):
            return True
    return False


# --- State ---
alert_buffer: collections.deque = collections.deque(maxlen=50)
seen_ids: set = set()
connected_clients: list[WebSocket] = []
vapid_public_key_b64: str = ""

def _load_subscriptions() -> list[dict]:
    try:
        return json.loads(SUBSCRIPTIONS_PATH.read_text()) if SUBSCRIPTIONS_PATH.exists() else []
    except Exception:
        return []

def _save_subscriptions() -> None:
    SUBSCRIPTIONS_PATH.write_text(json.dumps(web_push_subscriptions))

web_push_subscriptions: list[dict] = _load_subscriptions()

# --- VAPID key management ---
def _generate_vapid_keys() -> None:
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    VAPID_PRIVATE_PATH.write_bytes(
        private_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    VAPID_PUBLIC_PATH.write_bytes(
        private_key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    logger.info("Generated new VAPID keys")


def load_or_generate_vapid() -> None:
    global vapid_public_key_b64
    if not VAPID_PRIVATE_PATH.exists():
        _generate_vapid_keys()
    pub = serialization.load_pem_public_key(VAPID_PUBLIC_PATH.read_bytes())
    raw = pub.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    vapid_public_key_b64 = base64.urlsafe_b64encode(raw).decode().rstrip("=")
    logger.info("VAPID public key loaded")


# --- Scraper ---
def _make_id(datetime_str: str, message: str) -> str:
    return hashlib.sha256(f"{datetime_str}{message}".encode()).hexdigest()[:12]


def scrape_alerts() -> list[dict]:
    try:
        resp = requests.get(P2000_URL, timeout=15)
        resp.raise_for_status()
        resp.encoding = "windows-1252"
        soup = BeautifulSoup(resp.text, "html.parser")

        results, seen = [], set()
        for row in soup.find_all(lambda t: t.name == "tr" and t.find("td", class_="DT")):
            dt_cell = row.find("td", class_="DT")
            svc_cell = row.find("td", class_=["Am", "Br", "Po"])
            rgn_cell = row.find("td", class_="Regio")
            msg_cell = row.find("td", class_=["Md", "Mdx"])
            if not (dt_cell and svc_cell and rgn_cell and msg_cell):
                continue

            datetime_str = dt_cell.text.strip()
            message = msg_cell.text.strip()
            key = (datetime_str, message)
            if key in seen:
                continue
            seen.add(key)

            svc_class = next((c for c in ["Br", "Am", "Po"] if c in (svc_cell.get("class") or [])), None)
            service = SERVICE_CLASS_MAP.get(svc_class, svc_cell.text.strip())

            results.append({
                "id": _make_id(datetime_str, message),
                "datetime": datetime_str,
                "service": service,
                "region": rgn_cell.text.strip(),
                "message": message,
                "emoji": EMOJI_MAP.get(service, "🚨"),
            })
        return results
    except Exception as e:
        logger.error(f"Scrape failed: {e}")
        return []


# --- Push notifications ---
async def _send_web_push(alert: dict) -> None:
    if not web_push_subscriptions:
        return
    from pywebpush import webpush, WebPushException

    data = json.dumps({"title": f"{alert['emoji']} {alert['service']}", "body": alert["message"]})
    dead = []
    for sub in list(web_push_subscriptions):
        if sub.get("filter_region") and sub["filter_region"] != alert.get("region", ""):
            continue
        if sub.get("filter_city") and not _city_matches_alert(sub["filter_city"], alert.get("message", "")):
            continue
        try:
            parsed = urlparse(sub["endpoint"])
            aud = f"{parsed.scheme}://{parsed.netloc}"
            claims = {"sub": VAPID_SUB, "aud": aud}
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda s=sub, c=claims: webpush(
                    subscription_info=s,
                    data=data,
                    vapid_private_key=str(VAPID_PRIVATE_PATH),
                    vapid_claims=c,
                ),
            )
        except WebPushException as e:
            if e.response and e.response.status_code in (404, 410):
                dead.append(sub)
            else:
                logger.error(f"WebPush error: {e}")
    for s in dead:
        web_push_subscriptions.remove(s)
    if dead:
        _save_subscriptions()


# --- WebSocket broadcast ---
async def _broadcast(alert: dict) -> None:
    dead = []
    msg = json.dumps(alert)
    for ws in list(connected_clients):
        try:
            await ws.send_text(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in connected_clients:
            connected_clients.remove(ws)


# --- Background scraper loop ---
async def _scraper_loop() -> None:
    global scrape_interval
    initialized = False
    logger.info("Scraper loop started")

    while True:
        alerts = await asyncio.get_event_loop().run_in_executor(None, scrape_alerts)
        new_alerts = []

        for alert in reversed(alerts):
            if alert["id"] not in seen_ids:
                seen_ids.add(alert["id"])
                alert_buffer.append(alert)
                if initialized:
                    new_alerts.append(alert)

        initialized = True

        for alert in new_alerts:
            logger.info(f"New alert: {alert['service']} – {alert['message'][:60]}")
            await _broadcast(alert)
            await _send_web_push(alert)

        await asyncio.sleep(scrape_interval)


# --- Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_or_generate_vapid()
    task = asyncio.create_task(_scraper_loop())

    def _shutdown(signum, frame):
        logger.info("Shutdown signal received")
        task.cancel()
        sys.exit(0)

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    yield

    task.cancel()
    for ws in connected_clients:
        try:
            await ws.close()
        except Exception:
            pass


# --- App ---
app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# --- REST endpoints ---
@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/alerts")
async def get_alerts():
    return list(alert_buffer)


@app.get("/api/filters")
async def get_filters():
    """Return sorted list of regions currently active in the alert buffer."""
    regions = sorted({a.get("region", "") for a in alert_buffer if a.get("region")})
    return {"regions": regions}


@app.get("/api/vapid-public-key")
async def get_vapid_key():
    return {"publicKey": vapid_public_key_b64}


class _WebPushSub(BaseModel):
    endpoint: str
    keys: dict
    filter_region: str = ""
    filter_city: str = ""


@app.post("/api/subscribe")
async def subscribe(sub: _WebPushSub):
    d = sub.model_dump()
    idx = next((i for i, s in enumerate(web_push_subscriptions) if s["endpoint"] == sub.endpoint), None)
    if idx is not None:
        web_push_subscriptions[idx] = d  # update filter preferences for existing sub
    else:
        web_push_subscriptions.append(d)
    _save_subscriptions()
    return {"ok": True}


@app.post("/api/unsubscribe")
async def unsubscribe(sub: _WebPushSub):
    global web_push_subscriptions
    web_push_subscriptions[:] = [s for s in web_push_subscriptions if s["endpoint"] != sub.endpoint]
    _save_subscriptions()
    return {"ok": True}


# --- WebSocket ---
@app.websocket("/api/ws")
async def ws_endpoint(websocket: WebSocket):
    global scrape_interval
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        await websocket.send_text(json.dumps(list(alert_buffer)))
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                if msg.get("type") == "set_interval":
                    secs = int(msg.get("seconds", scrape_interval))
                    if secs in VALID_INTERVALS:
                        scrape_interval = secs
                        logger.info(f"Interval updated to {secs}s")
            except (json.JSONDecodeError, ValueError):
                pass
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
