#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-bluegreen.sh — Blue-green deploy para roll-manager en la VM
#
# Uso: deploy-bluegreen.sh <SHORT_SHA>
#
# Flujo:
#   1. Carga la imagen roll-manager:sha-<SHA> desde /tmp/roll-manager.tar.gz
#   2. Lee el puerto activo desde el upstream de nginx
#   3. Arranca el nuevo contenedor en el slot inactivo (3000 ↔ 3001)
#   4. Espera healthcheck (max 90s) — rollback automático si falla
#   5. Redirige nginx al nuevo slot y recarga sin downtime
#   6. Detiene y elimina el contenedor anterior
#   7. Elimina imágenes viejas (conserva las 2 más recientes) y prunes
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SHA="${1:?ERROR: Argumento SHA requerido. Uso: deploy-bluegreen.sh <SHORT_SHA>}"
IMAGE="roll-manager:sha-${SHA}"
PROJECTS_DIR="/home/azureuser/projects/roll-manager"
NGINX_CONF="/etc/nginx/sites-available/roll-manager.ezekl.com"
NEW_CONTAINER="roll-manager-sha-${SHA}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DEPLOY — ${IMAGE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Cargar imagen ─────────────────────────────────────────────────────────
echo ""
echo "▶ [1/6] Cargando imagen desde /tmp/roll-manager.tar.gz"
docker load < /tmp/roll-manager.tar.gz
rm -f /tmp/roll-manager.tar.gz
echo "  ✓ Imagen cargada: ${IMAGE}"

# ── 2. Determinar puerto activo desde nginx ──────────────────────────────────
echo ""
echo "▶ [2/6] Determinando slot activo"
ACTIVE_PORT=$(sudo grep -oP 'proxy_pass http://127\.0\.0\.1:\K[0-9]+' \
  "${NGINX_CONF}" 2>/dev/null | head -1 || echo "3000")

if [[ "${ACTIVE_PORT}" == "3000" ]]; then
  NEW_PORT=3001
else
  NEW_PORT=3000
fi

echo "  nginx apunta a: :${ACTIVE_PORT}  →  nuevo slot: :${NEW_PORT}"
echo "  Contenedor nuevo: ${NEW_CONTAINER}"

# ── 3. Arrancar nuevo contenedor en slot inactivo ────────────────────────────
echo ""
echo "▶ [3/6] Arrancando ${NEW_CONTAINER} en :${NEW_PORT}"

# Eliminar si quedó de un deploy fallido anterior
docker stop "${NEW_CONTAINER}" 2>/dev/null || true
docker rm   "${NEW_CONTAINER}" 2>/dev/null || true

docker run -d \
  --name "${NEW_CONTAINER}" \
  --network host \
  --restart unless-stopped \
  -e PORT="${NEW_PORT}" \
  --env-file "${PROJECTS_DIR}/.env" \
  "${IMAGE}"

echo "  ✓ Contenedor arrancado"

# ── 4. Health check ──────────────────────────────────────────────────────────
echo ""
echo "▶ [4/6] Health check en :${NEW_PORT} (máx 90s)"

OK=0
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${NEW_PORT}/api/auth/session" >/dev/null 2>&1; then
    echo "  ✓ OK en intento ${i} ($((i * 3))s)"
    OK=1
    break
  fi
  echo "  Esperando... (${i}/30)"
  sleep 3
done

if [[ ${OK} -eq 0 ]]; then
  echo ""
  echo "  ✗ Health check FALLÓ — haciendo rollback"
  docker stop "${NEW_CONTAINER}" 2>/dev/null || true
  docker rm   "${NEW_CONTAINER}" 2>/dev/null || true
  echo "  Rollback completo. El slot activo (:${ACTIVE_PORT}) sigue en pie."
  exit 1
fi

# ── 5. Cambiar nginx al nuevo slot ───────────────────────────────────────────
echo ""
echo "▶ [5/6] Redirigiendo nginx :${ACTIVE_PORT} → :${NEW_PORT}"

sudo sed -i \
  "s|proxy_pass http://127\.0\.0\.1:${ACTIVE_PORT};|proxy_pass http://127.0.0.1:${NEW_PORT};|" \
  "${NGINX_CONF}"

sudo nginx -t
sudo systemctl reload nginx
echo "  ✓ nginx recargado — tráfico en :${NEW_PORT}"

# ── 6. Detener contenedores del slot anterior ────────────────────────────────
echo ""
echo "▶ [6/6] Deteniendo contenedores anteriores y limpiando imágenes"

docker ps --format '{{.Names}}' \
  | grep '^roll-manager-' \
  | grep -v "^${NEW_CONTAINER}$" \
  | xargs -r docker stop 2>/dev/null || true

docker ps -a --format '{{.Names}}' \
  | grep '^roll-manager-' \
  | grep -v "^${NEW_CONTAINER}$" \
  | xargs -r docker rm 2>/dev/null || true

echo "  ✓ Contenedores anteriores eliminados"

# Conservar las 2 imágenes más recientes de roll-manager, eliminar el resto
# (docker images muestra la más nueva primero por defecto)
REMOVED=$(docker images "roll-manager" --format "{{.ID}}" \
  | tail -n +3 \
  | xargs -r docker rmi -f 2>/dev/null | wc -l || echo "0")

docker image prune -f >/dev/null
echo "  ✓ Imágenes viejas eliminadas: ${REMOVED}"

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deploy completo"
echo "  Contenedor: ${NEW_CONTAINER}"
echo "  Puerto:     :${NEW_PORT}"
echo "  Imagen:     ${IMAGE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
