# Post-Deploy Verification Checklist

Checklist completo para confirmar que un deploy blue-green en la VM llegó a producción correctamente. Ejecutar en orden: cada capa valida algo distinto.

---

## Capa 1 — GitHub Actions workflow

### 1.1 Estado del run

```bash
gh run list --repo ezekiell1988/horario-colaboradores --limit 3 --json databaseId,status,name,conclusion
```

Esperar `"status":"completed"` + `"conclusion":"success"`. Si sigue `in_progress`, hacer polling:

```bash
RUN_ID=<databaseId>
REPO=ezekiell1988/horario-colaboradores
for i in $(seq 1 80); do
  DATA=$(gh run view "$RUN_ID" --repo "$REPO" --json status,conclusion 2>/dev/null)
  STATUS=$(echo "$DATA" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  CONC=$(echo "$DATA"  | grep -o '"conclusion":"[^"]*"' | cut -d'"' -f4)
  echo "$(date +%H:%M:%S) status=$STATUS conclusion=$CONC"
  [ "$STATUS" = "completed" ] && break
  sleep 20
done
```

### 1.2 Logs relevantes del workflow

Filtrar solo las líneas que importan (pasos blue-green + smoke test):

```bash
gh run view "$RUN_ID" --repo "$REPO" --log 2>&1 \
  | grep -E '(▶|\[|✓|✗|ERROR|WARNING|nginx|docker|Health|Port|Slot|Removed|Deploy|Smoke|sha-|roll-manager)' \
  | tail -60
```

**Líneas clave a buscar:**
- `✓ Contenedor arrancado` — el nuevo contenedor levantó
- `✓ OK en intento N (Xs)` — healthcheck pasó
- `✓ nginx recargado — tráfico en :300X` — nginx apunta al nuevo slot
- `✓ Contenedores anteriores eliminados` — cleanup del slot viejo OK
- `Production HTTP status: 200` + `✅ Production is healthy` — smoke test externo OK

Si alguna línea tiene `✗` o `ERROR`, ver el paso completo:

```bash
gh run view "$RUN_ID" --repo "$REPO" --log | grep -A 10 "ERROR\|failed\|✗"
```

---

## Capa 2 — Estado de la VM

Un solo comando que cubre todo lo necesario:

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 \
  "echo '=== Contenedores activos ===' \
   && docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' \
   && echo '=== Imagenes roll-manager ===' \
   && docker images roll-manager \
   && echo '=== nginx proxy_pass ===' \
   && sudo grep proxy_pass /etc/nginx/sites-available/roll-manager.ezekl.com \
   && echo '=== Espacio en disco ===' \
   && df -h / | tail -1 \
   && echo '=== Docker system ===' \
   && docker system df"
```

### Qué verificar en la salida

| Check | Valor esperado |
|-------|---------------|
| Contenedor activo | `roll-manager-sha-<SHA>` en estado `Up X minutes` |
| Imagen | Solo `roll-manager:sha-<SHA>` (máx 2 imágenes si hubo deploy anterior) |
| `proxy_pass` | `http://127.0.0.1:3001` (o el puerto opuesto al que estaba) |
| Disco `/` | Menos del **85%** usado. Más de eso → ejecutar limpieza (ver skill) |
| Contenedor viejo | No debe aparecer `roll-manager-green` ni el SHA anterior en `docker ps` |

### Ver logs del contenedor nuevo si algo falla

```bash
SHA="<8 chars del commit>"
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 \
  "docker logs --tail 100 roll-manager-sha-$SHA"
```

---

## Capa 3 — Smoke test manual desde local

```bash
# Auth session (debe devolver 200 con JSON válido)
curl -s -w "\nHTTP %{http_code}\n" https://roll-manager.ezekl.com/api/auth/session

# Landing page (debe devolver 200)
curl -s -o /dev/null -w "Landing: HTTP %{http_code}\n" https://roll-manager.ezekl.com

# Login page (debe devolver 200)
curl -s -o /dev/null -w "Login:   HTTP %{http_code}\n" https://roll-manager.ezekl.com/login
```

Todo debe responder `200`.

---

## Capa 4 — Revisión visual con Playwright

> **Skill a invocar:** `playwright-design-review`  
> Abrir el browser integrado de VS Code o usar `open_browser_page` con las siguientes URLs y viewports.

### 4.1 Landing desktop (1280×900)

```js
await page.goto('https://roll-manager.ezekl.com', { waitUntil: 'networkidle' });
await page.setViewportSize({ width: 1280, height: 900 });
```

**Checks:**
- Hero completo visible: título, subtítulo, CTAs
- Sección features: 6 cards presentes
- Sección pricing: 2 planes
- Formulario de contacto: campos empresa, nombre, teléfono, select colaboradores
- Footer con "Admin Login"

**Overflow check:**
```js
const r = await page.evaluate(() => ({
  vw: window.innerWidth,
  docW: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth
}));
// r.overflow debe ser false
```

### 4.2 Landing mobile (390×844)

```js
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
```

**Checks:**
- Nav: solo logo + "Login →" visible (sin "Pricing" si se ocultó en mobile)
- Hero: texto en columna, sin overflow horizontal
- Cards de features: en columna o 2 cols máx
- Formulario: inputs a full width

**Overflow check idéntico** — `scrollWidth === innerWidth`.

### 4.3 Página de login

```js
await page.goto('https://roll-manager.ezekl.com/login', { waitUntil: 'networkidle' });
```

**Checks:**
- Heading "Roll Manager" visible
- Campos Email + Contraseña presentes
- Botón "Ingresar" activo
- Sin errores de consola

```js
// Revisar errores de consola
const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
// Navegar y esperar... luego:
return errors;
```

---

## Semáforo de decisión

| Resultado | Acción |
|-----------|--------|
| Todas las capas ✅ | Deploy confirmado. Actualizar `ia/05_progress.md` si aplica |
| Capa 1 falla | Ver logs del paso fallido en GHA. El rollback automático ya habrá corrido en el script |
| Capa 2: contenedor viejo no eliminado | Limpieza manual: `docker stop <nombre> && docker rm <nombre>` |
| Capa 2: disco >85% | Ejecutar limpieza (Nivel 1 del playbook en SKILL.md) antes del próximo deploy |
| Capa 3: HTTP != 200 | Ver logs del contenedor (Capa 2). Verificar variables de entorno en `.env` de la VM |
| Capa 4: overflow detectado | Abrir issue, usar `playwright-design-review` para localizar el elemento culpable |

---

## Tiempo estimado total

| Capa | Tiempo típico |
|------|--------------|
| 1 — GHA workflow completo | ~3-8 min (build Docker linux/amd64) |
| 2 — Verificación VM | ~15 segundos |
| 3 — Smoke tests curl | ~5 segundos |
| 4 — Playwright visual | ~2-3 minutos |
| **Total** | **~10-15 min** |
