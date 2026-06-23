#!/bin/bash
set -e

# Install system dependencies (Caddy is already installed)
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git nodejs npm

# Clone repo into home directory
BASE_DIR="$HOME/p2000-reader"
if [ -d "$BASE_DIR" ]; then
    echo "Directory $BASE_DIR already exists, pulling latest..."
    cd "$BASE_DIR" && git pull
else
    git clone https://github.com/lalutir/P2000-Reader.git "$BASE_DIR"
fi

cd "$BASE_DIR"

# Run deploy script (handles venv, frontend build, caddy, systemd)
bash scripts/deploy.sh

# Allow the deploy script to run sudo commands without a password prompt.
# This is needed so `push.sh` can deploy non-interactively over SSH.
SUDOERS_LINE="lalutir ALL=(ALL) NOPASSWD: /bin/cp, /usr/bin/systemctl, /bin/systemctl"
SUDOERS_FILE="/etc/sudoers.d/p2000-deploy"
echo "$SUDOERS_LINE" | sudo tee "$SUDOERS_FILE" > /dev/null
sudo chmod 0440 "$SUDOERS_FILE"
echo "Sudoers rule written to $SUDOERS_FILE"

echo ""
echo "Setup complete."
echo "Caddy will obtain TLS certificates automatically once DNS points to this server."
echo "Check service status: sudo systemctl status p2000"
echo "View logs: sudo journalctl -u p2000 -f"
echo ""
echo "From your laptop you can now deploy with:  bash scripts/push.sh"
