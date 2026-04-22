#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4200}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

get_listening_pids() {
  cmd.exe //C "netstat -ano | findstr LISTENING | findstr :$PORT" 2>/dev/null \
    | tr -d '\r' \
    | awk '{print $5}' \
    | sort -u
}

stop_pid() {
  local pid="$1"
  if cmd.exe //C "taskkill /PID $pid /F" >/dev/null 2>&1; then
    echo "[ok] PID $pid detenido"
  else
    echo "[warn] No se pudo detener PID $pid"
  fi
}

echo "[info] Verificando puerto $PORT..."
PIDS="$(get_listening_pids || true)"

if [[ -n "${PIDS// }" ]]; then
  echo "[info] Puerto $PORT ocupado por PID(s): $PIDS"
  for pid in $PIDS; do
    if [[ "$pid" != "0" ]]; then
      stop_pid "$pid"
    fi
  done
else
  echo "[ok] Puerto $PORT libre"
fi

echo "[info] Iniciando frontend con Angular..."
cd "$PROJECT_DIR"
exec npm run start "$@"

