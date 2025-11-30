#!/bin/bash
set -e

echo "Cleaning OrbitDB and keystore..."
rm -rf backend/.nous/orbitdb-databases/*
rm -rf backend/.nous/orbitdb-keystore/*
rm -rf backend/.nous/helia-blocks/*

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