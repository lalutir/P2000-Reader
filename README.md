# P2000 Reader

Real-time Dutch emergency services feed reader. Scrapes [p2000-online.net](http://www.p2000-online.net/p2000.py) and broadcasts every new alert to connected browsers via WebSocket, with optional Web Push notifications.

## Repository structure

```
P2000-Reader/
├── backend/
│   ├── main.py              # FastAPI app — scraper, REST API, WebSocket, push
│   ├── requirements.txt
│   └── p2000.service        # systemd unit file
├── frontend/
│   └── web/                 # React + Vite web app
│       ├── public/
│       │   ├── sw.js        # Service worker for Web Push
│       │   ├── icon.png
│       │   └── badge.png
│       ├── src/
│       │   ├── App.jsx
│       │   ├── App.css
│       │   └── main.jsx
│       ├── index.html
│       └── vite.config.js
├── caddy/
│   └── Caddyfile
├── scripts/
│   ├── deploy.sh            # Run from your laptop: pushes + deploys, no SSH needed
│   ├── remote-deploy.sh     # Runs on the Droplet: rebuilds and restarts services
│   └── setup.sh             # First-time setup on a fresh Droplet
└── README.md
```

## Architecture

```
DigitalOcean Droplet
├── FastAPI (port 8000, internal)  ← scrapes p2000-online.net every N seconds
└── Caddy (ports 80/443)           ← HTTPS, serves web frontend + proxies /api/*

Cloudflare DNS → lalutir.com
├── /api/*  → FastAPI backend
└── /       → React web frontend (static build)
```

The server keeps the last 50 alerts in memory. Clients keep the last 50 in localStorage. No database is used.

---

## Local development

You need two terminals.

**Terminal 1 — backend:**

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 — frontend:**

```bash
cd frontend/web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies all `/api/*` requests (including WebSocket) to `http://localhost:8000`, so both services work together automatically.

---

## Deploying on a fresh DigitalOcean Droplet

**Prerequisites:**
- Ubuntu 22.04+ Droplet (any size)
- Caddy already installed on the Droplet
- `lalutir.com` A record in Cloudflare pointing to the Droplet IP
- SSH access as the `lalutir` user (non-root with sudo)

**Steps:**

```bash
# 1. SSH into the Droplet
ssh lalutir@<droplet-ip>

# 2. Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/lalutir/P2000-Reader/main/scripts/setup.sh | bash
```

The setup script will:
1. Install Python, Node.js, and git
2. Clone the repository to `~/p2000-reader`
3. Create a Python virtualenv and install dependencies
4. Build the React web frontend
5. Install and enable the systemd service
6. Configure and reload Caddy

**TLS certificates:** Caddy automatically obtains and renews certificates from Let's Encrypt — no manual SSL steps needed. Ports 80 and 443 must be open on the Droplet.

**Cloudflare proxy (orange cloud):** Set SSL/TLS mode to **Full (strict)** in the Cloudflare dashboard (SSL/TLS → Overview).

---

## Updating

Run this from your laptop — no manual SSH required:

```bash
bash scripts/deploy.sh
```

This pushes to GitHub, then SSHes into the Droplet and runs `scripts/remote-deploy.sh`, which pulls the latest code, reinstalls Python deps, rebuilds the frontend, reloads Caddy, and restarts the API service.

**First-time requirement:** your SSH public key must be added to the Droplet's `~/.ssh/authorized_keys` for the `lalutir` user (already done if you followed the setup steps above).

By default it targets `lalutir@142.93.232.87`. Override with environment variables if needed:

```bash
DROPLET_HOST=<ip-or-hostname> bash scripts/deploy.sh
```

| Variable | Default | Description |
|---|---|---|
| `DROPLET_USER` | `lalutir` | SSH username on the Droplet |
| `DROPLET_HOST` | `142.93.232.87` | Droplet IP address or hostname |
| `REMOTE_PATH` | `~/p2000-reader` | Path to the repo on the Droplet |
| `SSH_KEY` | *(none)* | Path to a private key, if not handled by `ssh-agent` |

---

## Changing the scrape interval

**Option 1 — permanent (survives restart):**

```bash
sudo nano /etc/systemd/system/p2000.service
# Edit: Environment=SCRAPE_INTERVAL_SECONDS=60
sudo systemctl daemon-reload && sudo systemctl restart p2000
```

Valid values (seconds): `30, 60, 120, 300, 600, 1200, 1800, 2700, 3600`

**Option 2 — live, from the app:**

Use the interval dropdown in the header. This takes effect immediately but resets to the service file value on restart.

---

## Push notifications

Click the 🔔 button in the header to enable browser push notifications. The button only appears if your browser supports it and you haven't already been asked. Notifications are sent via the Web Push standard (VAPID).

---

## Viewing logs

```bash
sudo journalctl -u p2000 -f        # live backend logs
sudo journalctl -u caddy -f        # Caddy logs
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SCRAPE_INTERVAL_SECONDS` | `30` | How often the backend fetches new alerts |

Set in `/etc/systemd/system/p2000.service` under `[Service]`.

---

## Emoji mapping

| Service | Emoji |
|---|---|
| Brandweer | 🚒 |
| Ambulance | 🚑 |
| Politie | 🚔 |
| Other | 🚨 |