#!/usr/bin/env zsh
set -euo pipefail

# ---------------------------------------
# Remove Volta so node=22 is used
# ---------------------------------------
export PATH=$(echo "$PATH" | tr ':' '\n' | grep -v '/.volta/bin' | paste -sd ':' -)

# Load NVM so we get Node 22 instead of system/volta node
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 22

echo "Script node: $(node -v)"
which node

# --------------------------------------
# start-server.zsh
# --------------------------------------

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Starting Nous P2P Node (development)..."
cd "$BASE_DIR/frontend"

npx tsx watch \
  --tsconfig "./tsconfig.server.json" \
  --watch-path "./server/src" \
  "./server/src/setup.ts"