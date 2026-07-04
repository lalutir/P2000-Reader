#!/bin/bash
# deploy.sh — Push changes and deploy to the Droplet. Run this from your
# laptop; it SSHes in and runs the remote steps for you — no manual SSH needed.
#
# Usage: bash scripts/deploy.sh
#
# Requires: your SSH key added to the Droplet (see README).
# Override the target by exporting DROPLET_USER / DROPLET_HOST / REMOTE_PATH / SSH_KEY.

set -euo pipefail

DROPLET_USER="${DROPLET_USER:-lalutir}"
DROPLET_HOST="${DROPLET_HOST:-142.93.232.87}"
REMOTE_PATH="${REMOTE_PATH:-~/p2000-reader}"
SSH_KEY="${SSH_KEY:-}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [ -n "$SSH_KEY" ]; then
    SSH_OPTS+=(-i "$SSH_KEY")
fi

TARGET="${DROPLET_USER}@${DROPLET_HOST}"

echo "==> Pushing to GitHub..."
git push origin main

echo "==> Deploying on ${TARGET}..."
# -t allocates a pseudo-TTY so sudo can prompt if NOPASSWD is not yet configured.
ssh -t "${SSH_OPTS[@]}" "$TARGET" "bash ${REMOTE_PATH}/scripts/remote-deploy.sh"

echo ""
echo "Done. Site is live at https://p2000.lalutir.com"
