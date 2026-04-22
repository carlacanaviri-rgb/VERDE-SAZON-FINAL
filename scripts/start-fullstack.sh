#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "╔════════════════════════════════════════════════════╗"
echo "║    VERDE-SAZON FULLSTACK - Dev Environment        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Start backend in background
echo "[step 1/2] Iniciando Backend (puerto 3000)..."
cd "$ROOT_DIR/fast-food-api-java"
bash scripts/start-backend.sh &
BACKEND_PID=$!
echo "[ok] Backend PID: $BACKEND_PID"
echo ""

# Wait for backend to be ready
echo "[step 2/2] Esperando backend... (5s)"
sleep 5

# Start frontend in foreground
echo "[info] Iniciando Frontend (puerto 4200)..."
echo "[info] Para detener ambos servicios, presiona Ctrl+C"
echo "────────────────────────────────────────────────────"
cd "$ROOT_DIR/fast-food-app"
bash scripts/start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "✅ Servicios iniciados:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:4200"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo "[info] Deteniendo servicios..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID 2>/dev/null || true
  wait $FRONTEND_PID 2>/dev/null || true
  echo "[ok] Servicios detenidos"
}

trap cleanup EXIT

# Wait for both processes
wait

