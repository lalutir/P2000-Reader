# P2000 Reader

Real-time Dutch emergency services feed reader. Scrapes [p2000-online.net](http://www.p2000-online.net/p2000.py) and broadcasts every new alert to connected web and mobile clients via WebSocket, with Web Push and Expo push notifications.

## Repository structure

```
P2000-Reader/
├── backend/
│   ├── main.py              # FastAPI app — scraper, REST API, WebSocket, push
│   ├── requirements.txt
│   └── p2000.service        # systemd unit file
├── frontend/
│   ├── web/                 # React + Vite web app
│   │   ├── public/
│   │   │   ├── sw.js        # Service worker for Web Push
│   │   │   ├── icon.png
│   │   │   └── badge.png
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   ├── App.css
│   │   │   └── main.jsx
│   │   ├── index.html
│   │   └── vite.config.js
│   └── mobile/              # Expo React Native app (Android + iOS)
│       ├── app.json
│       ├── App.tsx
│       ├── context/
│       │   └── AlertContext.tsx
│       ├── assets/
│       └── screens/
│           ├── FeedScreen.tsx
│           └── SettingsScreen.tsx
├── caddy/
│   └── Caddyfile
├── scripts/
│   ├── deploy.sh            # Run after every git pull
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

Mobile app (Expo)
├── WebSocket → wss://lalutir.com/api/ws
└── Push      → Expo Push API → device
```

The server keeps the last 50 alerts in memory. Clients keep the last 50 in localStorage / AsyncStorage. No database is used.

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

**Cloudflare proxy (orange cloud):** Set SSL/TLS mode to **Full (strict)** in the Cloudflare dashboard (SSL/TLS → Overview). Caddy still gets a certificate from Let's Encrypt; Cloudflare validates it at the origin.

---

## Updating

After pushing changes to GitHub, run on the Droplet:

```bash
cd ~/p2000-reader
bash scripts/deploy.sh
```

This pulls the latest code, reinstalls Python deps, rebuilds the frontend, reloads Caddy, and restarts the API service.

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

The web app interval dropdown and the mobile app settings screen both send `{"type":"set_interval","seconds":N}` over the WebSocket. This takes effect immediately but resets to the service file value on restart.

---

## Viewing logs

```bash
sudo journalctl -u p2000 -f        # live backend logs
sudo journalctl -u caddy -f        # Caddy logs
```

---

## Mobile app

**Development:**

```bash
cd frontend/mobile
npm install
npx expo start
# Scan the QR code with the Expo Go app on your device
```

**Before building for production**, replace `YOUR-PROJECT-ID-HERE` in `App.tsx` with your actual Expo project ID from [expo.dev](https://expo.dev).

**Production build (EAS):**

```bash
npm install -g eas-cli
eas login
eas build --platform android   # or ios
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
