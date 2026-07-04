#!/bin/bash
# remote-deploy.sh — Runs ON the Droplet. Pulls latest code, rebuilds, and
# restarts services. Don't run this from your laptop — use scripts/deploy.sh,
# which SSHes in and calls this for you.
set -e

BASE_DIR="$HOME/p2000-reader"
cd "$BASE_DIR"
git pull

# Backend: create/update virtualenv and install deps
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
deactivate

# Web frontend: install and build
cd "$BASE_DIR/frontend/web"
npm install
npm run build
cd "$BASE_DIR"

# Caddy: update this site's snippet and reload (never touches the main Caddyfile)
sudo cp caddy/p2000.caddy /etc/caddy/conf.d/p2000.caddy
caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy

# Systemd: install and restart service
sudo cp backend/p2000.service /etc/systemd/system/p2000.service
sudo systemctl daemon-reload
sudo systemctl enable p2000
sudo systemctl restart p2000

echo "Deploy complete."
echo "API status:"
sudo systemctl status p2000 --no-pager -l
