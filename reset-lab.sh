#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$ROOT_DIR/data"

echo "[lab] Resetting lab data under $DATA_DIR"

rm -f "$DATA_DIR/app.db"
rm -rf "$DATA_DIR/logs"
rm -rf "$DATA_DIR/uploads"

mkdir -p "$DATA_DIR/logs" "$DATA_DIR/uploads"

echo "[lab] Reseeding SQLite database..."
LAB_MODE=true DB_PATH="$DATA_DIR/app.db" node "$ROOT_DIR/src/db/seed.js"

echo "[lab] Reset complete."

