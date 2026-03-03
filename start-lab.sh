#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export LAB_MODE=true
export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-3000}"
export ALLOW_REMOTE="${ALLOW_REMOTE:-false}"
export I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB="${I_UNDERSTAND_THIS_IS_AN_INSECURE_LAB:-no}"
export DB_PATH="${DB_PATH:-./data/app.db}"

cd "$ROOT_DIR"

echo "[lab] Starting intentionally insecure training lab on $HOST:$PORT (LAB_MODE=$LAB_MODE)"
node src/app.js

