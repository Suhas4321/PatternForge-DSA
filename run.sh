#!/usr/bin/env bash
# PatternForge DSA launcher.
#   ./run.sh        build the frontend if needed and serve everything at http://127.0.0.1:8010
#   ./run.sh dev    hot-reload mode: backend on :8010, Vite dev server on http://127.0.0.1:5173
#   ./run.sh test   run backend tests and validate all lesson content
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8010}"

setup() {
  if [ ! -x backend/.venv/bin/uvicorn ]; then
    echo "Setting up the Python environment..."
    python3 -m venv backend/.venv
    backend/.venv/bin/pip install -q -r backend/requirements.txt
  fi
  if [ ! -d frontend/node_modules ]; then
    echo "Installing frontend dependencies..."
    (cd frontend && npm install --silent)
  fi
}

needs_build() {
  [ ! -f frontend/dist/index.html ] && return 0
  [ -n "$(find frontend/src frontend/index.html frontend/vite.config.ts -newer frontend/dist/index.html -print -quit)" ]
}

case "${1:-serve}" in
  serve)
    setup
    if needs_build; then
      echo "Building the frontend..."
      (cd frontend && npm run build --silent)
    fi
    echo "PatternForge is running at http://127.0.0.1:${PORT}"
    cd backend && exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$PORT"
    ;;
  dev)
    setup
    (cd backend && .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$PORT" --reload \
      --reload-dir app --reload-dir ../content --reload-include '*.yaml' --reload-include '*.json') &
    BACKEND=$!
    trap 'kill $BACKEND 2>/dev/null' EXIT
    cd frontend && npm run dev -- --host 127.0.0.1
    ;;
  test)
    setup
    (cd backend && .venv/bin/python -m pytest -q -p no:warnings)
    backend/.venv/bin/python scripts/validate_content.py
    ;;
  *)
    echo "usage: ./run.sh [serve|dev|test]" >&2
    exit 1
    ;;
esac
