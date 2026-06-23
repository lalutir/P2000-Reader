#!/bin/bash
# Run this from your laptop to push changes and deploy to the server.
# Usage: bash scripts/push.sh
#
# Requires: ssh key added to the droplet (see setup guide in README).
# Set DROPLET_HOST as an env var or edit the line below.

set -euo pipefail

DROPLET_USER="lalutir"
DROPLET_HOST="142.93.232.87"

if [ -z "$DROPLET_HOST" ]; then
    echo "Error: DROPLET_HOST is not set."
    echo "  Export it:  export DROPLET_HOST=<your-droplet-ip>"
    echo "  Or edit DROPLET_HOST= in this script."
    exit 1
fi

echo "==> Pushing to GitHub..."
git push origin main

echo "==> Deploying on $DROPLET_USER@$DROPLET_HOST..."
# -t allocates a pseudo-TTY so sudo can prompt if NOPASSWD is not yet configured.
ssh -t "$DROPLET_USER@$DROPLET_HOST" "bash ~/p2000-reader/scripts/deploy.sh"

echo ""
echo "Done. Site is live at https://p2000.lalutir.com"
