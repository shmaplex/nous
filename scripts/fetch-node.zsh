#!/usr/bin/env zsh
# Fetch Node.js binaries for macOS, Linux, and Windows and put in dist/p2p/bin
# Archives are cached in .node-cache for reuse

set -euo pipefail

NODE_VERSION="22.21.1"
BIN_DIR="./dist/bin"
CACHE_DIR=".node-cache"

mkdir -p "$BIN_DIR"
mkdir -p "$CACHE_DIR"

echo "Fetching Node.js v$NODE_VERSION for all platforms..."

# --- macOS ---
ARCH=$(uname -m)  # x86_64 or arm64
echo "Detected macOS architecture: $ARCH"
if [ "$ARCH" = "arm64" ]; then
    MAC_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-arm64.tar.gz"
else
    MAC_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-darwin-x64.tar.gz"
fi
MAC_TAR="$CACHE_DIR/node-macos.tar.gz"
if [ ! -f "$MAC_TAR" ]; then
    echo "Downloading macOS Node..."
    curl -L "$MAC_URL" -o "$MAC_TAR"
fi
tar -xzf "$MAC_TAR" -C "$BIN_DIR" --strip-components=1
mv "$BIN_DIR/bin/node" "$BIN_DIR/node-macos"
rm -rf "$BIN_DIR/bin" "$BIN_DIR/include" "$BIN_DIR/lib" "$BIN_DIR/share"

# --- Linux ---
LINUX_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
LINUX_TAR="$CACHE_DIR/node-linux.tar.xz"
if [ ! -f "$LINUX_TAR" ]; then
    echo "Downloading Linux Node..."
    curl -L "$LINUX_URL" -o "$LINUX_TAR"
fi
tar -xf "$LINUX_TAR" -C "$BIN_DIR" --strip-components=1
mv "$BIN_DIR/bin/node" "$BIN_DIR/node-linux"
rm -rf "$BIN_DIR/bin" "$BIN_DIR/include" "$BIN_DIR/lib" "$BIN_DIR/share"

# --- Windows ---
WIN_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip"
WIN_ZIP="$CACHE_DIR/node-win.zip"
if [ ! -f "$WIN_ZIP" ]; then
    echo "Downloading Windows Node..."
    curl -L "$WIN_URL" -o "$WIN_ZIP"
fi
unzip -q "$WIN_ZIP" -d "$BIN_DIR"
mv "$BIN_DIR/node-v${NODE_VERSION}-win-x64/node.exe" "$BIN_DIR/node-win.exe"
rm -rf "$BIN_DIR/node-v${NODE_VERSION}-win-x64"

echo "All Node binaries installed to $BIN_DIR"
echo "Archives are cached in $CACHE_DIR for future builds."