#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PY="${PYTHON:-python3}"
VENV=".venv"

if [ ! -x "$VENV/bin/python" ]; then
  echo "[setup] creating virtualenv…"
  "$PY" -m venv "$VENV"
fi

STAMP="$VENV/.requirements.sha"
NEW_SHA="$(shasum requirements.txt | awk '{print $1}')"
if [ ! -f "$STAMP" ] || [ "$(cat "$STAMP" 2>/dev/null)" != "$NEW_SHA" ]; then
  echo "[setup] installing dependencies (first run takes a minute)…"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q -r requirements.txt
  echo "$NEW_SHA" > "$STAMP"
fi

if ! "$VENV/bin/python" -c "import brian2" >/dev/null 2>&1; then
  echo "[error] Brian2 failed to import in $VENV. Try: rm -rf $VENV && npm run sim" >&2
  exit 1
fi

PORT="${SIM_PORT:-8000}"
echo "[run] Brian2 simulation API on http://localhost:$PORT  (Ctrl-C to stop)"
exec "$VENV/bin/uvicorn" main:app --port "$PORT" "$@"
