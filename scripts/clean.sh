#!/bin/bash
set -e

echo "Cleaning OrbitDB and keystore..."
rm -rf frontend/orbitdb-databases/*
rm -rf frontend/orbitdb-keystore/*

echo "Cleaning dist folder..."
rm -rf frontend/dist

echo "Cleaning build folder (keeping PNGs)..."
# Remove all non-PNG files
find ./build -type f ! -name "*.png" -delete
# Remove empty directories
find ./build -type d -empty -delete
# Remove specific directories
rm -rf ./build/bin ./build/darwin

echo "✅ Cleanup complete."