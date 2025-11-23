#!/usr/bin/env zsh

APP_DIR=$(pwd)
BIN_DIR="$APP_DIR/bin"
mkdir -p "$BIN_DIR"

# -----------------------------
# Remove leftover OrbitDB LOCK files
# -----------------------------
clean_locks() {
  local DB_PATH=$1
  local KEYSTORE_PATH=$2
  for path in "$DB_PATH" "$KEYSTORE_PATH"; do
    if [[ -d "$path" ]]; then
      find "$path" -name "LOCK" -exec rm -f {} \;
      echo "🧹 Removed LOCK files in $path"
    fi
  done
}

# -----------------------------
# Full clean for first run
# -----------------------------
full_clean() {
  rm -rf "$APP_DIR/frontend/orbitdb-"* "$APP_DIR/frontend/orbitdb-keystore-"*
  echo "🧹 Full DB + keystore clean"
}

# -----------------------------
# Build a peer Wails app
# -----------------------------
build_peer() {
  local NODE_ID=$1
  local KEYSTORE_PATH=$2
  local DB_PATH=$3
  local HTTP_PORT=$4
  local LIBP2P_ADDR=$5
  local VITE_PORT=$6
  local OUTPUT_BIN="$BIN_DIR/$NODE_ID"

  echo "🧹 Cleaning Wails bindings for $NODE_ID..."
  rm -rf "$APP_DIR/frontend/wailsjs/go/main"

  echo "🛠 Building $NODE_ID..."
  export NODE_ID="$NODE_ID"
  export KEYSTORE_PATH="$KEYSTORE_PATH"
  export DB_PATH="$DB_PATH"
  export HTTP_PORT="$HTTP_PORT"
  export LIBP2P_ADDR="$LIBP2P_ADDR"
  export VITE_PORT="$VITE_PORT"

  if wails build; then
    local DEFAULT_BIN="$APP_DIR/build/bin/Nous.app/Contents/MacOS/nous"
    if [[ -f "$DEFAULT_BIN" ]]; then
      cp "$DEFAULT_BIN" "$OUTPUT_BIN"
      chmod +x "$OUTPUT_BIN"
      echo "✅ $NODE_ID built successfully at $OUTPUT_BIN"
    else
      echo "❌ Wails build succeeded but binary not found at $DEFAULT_BIN"
      exit 1
    fi
  else
    echo "❌ Failed to build $NODE_ID"
    exit 1
  fi
}

# -----------------------------
# Start a peer in background with logs
# -----------------------------
start_peer() {
  local BIN_PATH=$1
  local NODE_ID=$2
  local HTTP_PORT=$3
  local LIBP2P_ADDR=$4
  local VITE_PORT=$5
  local KEYSTORE_PATH=$6
  local DB_PATH=$7

  clean_locks "$DB_PATH" "$KEYSTORE_PATH"

  export NODE_ID="$NODE_ID"
  export HTTP_PORT="$HTTP_PORT"
  export LIBP2P_ADDR="$LIBP2P_ADDR"
  export VITE_PORT="$VITE_PORT"
  export KEYSTORE_PATH="$KEYSTORE_PATH"
  export DB_PATH="$DB_PATH"

  "$BIN_PATH" > "$BIN_DIR/$NODE_ID.log" 2>&1 &
  echo "🚀 $NODE_ID started, logging to $BIN_DIR/$NODE_ID.log"

  # Wait for DB + Helia to initialize
  sleep 6
}

# -----------------------------
# Define peers as arrays
# -----------------------------
PEER1=( "nous-node-1" "./frontend/orbitdb-keystore-1" "./frontend/orbitdb-1" 9001 "/ip4/127.0.0.1/tcp/15003" 5173 )
PEER2=( "nous-node-2" "./frontend/orbitdb-keystore-2" "./frontend/orbitdb-2" 9002 "/ip4/127.0.0.1/tcp/15004" 5174 )

PEERS=( PEER1 PEER2 )

# -----------------------------
# Full clean on first run
# -----------------------------
full_clean

# -----------------------------
# Build all peers
# -----------------------------
for peer_ref in "${PEERS[@]}"; do
  peer=("${(@P)peer_ref}")
  build_peer "${peer[1]}" "${peer[2]}" "${peer[3]}" "${peer[4]}" "${peer[5]}" "${peer[6]}"
done

# -----------------------------
# Start all peers
# -----------------------------
for peer_ref in "${PEERS[@]}"; do
  peer=("${(@P)peer_ref}")
  start_peer "$BIN_DIR/${peer[1]}" "${peer[1]}" "${peer[4]}" "${peer[5]}" "${peer[6]}" "${peer[2]}" "${peer[3]}"
done

# -----------------------------
# Wait a few seconds, then connect peers manually
# -----------------------------
echo "🔗 Connecting peers..."
sleep 3

# Example: manually dialing node2 from node1
PEER1_ID=$(jq -r '.identity.id' "$BIN_DIR/nous-node-1.log" 2>/dev/null || echo "")
PEER2_ID=$(jq -r '.identity.id' "$BIN_DIR/nous-node-2.log" 2>/dev/null || echo "")

if [[ -n "$PEER1_ID" && -n "$PEER2_ID" ]]; then
  echo "🔗 Dialing node2 from node1..."
  curl -X POST "http://127.0.0.1:9001/dial" -d "{\"peer\":\"/ip4/127.0.0.1/tcp/15004/p2p/$PEER2_ID\"}" -H "Content-Type: application/json"
fi

echo "✅ All peers launched!"
echo "📖 Check logs: $BIN_DIR/*.log"