---
name: vm-docker-deploy
description: >
  Guía completa para desplegar proyectos Next.js/Node.js en la VM Azure demo-itqs
  (172.191.128.24) usando Docker. Documenta el patrón blue-green del servidor,
  puertos ocupados, configuración nginx con Certbot SSL, y el flujo completo de
  build + deploy. Usar cuando se pida desplegar, actualizar, o configurar la app
  en la VM, cuando se necesite crear un Dockerfile para Next.js, o cuando se
  configure nginx + SSL para un nuevo subdominio. Triggers: deploy vm, desplegar
  vm, docker deploy, vm azure, 172.191.128.24, demo-itqs, roll-manager deploy,
  nginx certbot, ssl vm, subdominio ezekl.com, port 3000, next.js docker,
  dockerfile next, standalone next, blue-green vm.
---

# Despliegue Docker en VM Azure `demo-itqs`

## Ubicación en Azure

| Campo | Valor |
|-------|-------|
| Tenant ID | `2f80d4e1-da0e-4b6d-84da-30f67e280e4b` |
| Suscripción | `Sponsorship-DEV-ITQS` |
| Subscription ID | `d9a8cd11-1beb-4255-a890-72797ac44a61` |
| Grupo de recursos | `rg-ezequiel` (case-insensitive: `rg-Ezequiel` en portal) |
| Región | `eastus` |
| Recurso (VM) | `demo-itqs` — **Standard_DS1_v2** (1 vCPU, 3.5 GB RAM) |
| DNS | `ezekl.com` vía Cloudflare (`credentials/dns-token.txt`) |

### Discos Azure asignados a la VM

| Nombre del disco | Tamaño | Tipo | Estado | Dispositivo en OS |
|-----------------|--------|------|--------|-------------------|
| `demo-itqs_OsDisk_1_4789...` | **30 GB** | Premium_LRS | Attached | `/dev/sdb` → `/` |

> El disco de datos de 64GB (`demo-itqs_disk2_e0178...`) fue eliminado el 2026-05-30. Solo queda el OS Disk.

## Datos de conexión SSH

| Campo | Valor |
|-------|-------|
| IP pública | `172.191.128.24` |
| Usuario SSH | `azureuser` |
| Clave SSH | `credentials/id_rsa.pem` (chmod 600) |
| OS | Ubuntu 24.04.3 LTS |
| Docker | 29.1.0 |
| Node.js (host) | v20.19.6 |
| nginx | 1.24.0 (Certbot-managed) |

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24
```

---

## Mapa de puertos ocupados

| Puerto | Protocolo | Proyecto / Servicio |
|--------|-----------|---------------------|
| 22 | TCP | SSH |
| 80 | TCP | nginx (HTTP → redirect HTTPS) |
| 443 | TCP | nginx (HTTPS) |
| 1431 | TCP | SQL Server |
| 1433 | TCP | SQL Server (principal) |
| 1434 | UDP | SQL Server browser |
| 5432 | TCP | PostgreSQL |
| 6379 | TCP | Redis (`clickeat-voicebot-redis`) |
| **9000** | TCP | `math-sport.ezekl.com` (Docker) |
| **3000** | TCP | `roll-manager.ezekl.com` (Docker, bind 127.0.0.1) |

---

## Patrón de proyectos existentes

### Estructura de directorios en la VM

```
/home/azureuser/projects/
├── roll-manager/          # roll-manager.ezekl.com → puerto 3000
│   ├── .env               # variables de producción (chmod 600)
│   └── roll-manager.tar.gz
├── clickeat-voicebot/     # clickeat.ezekl.com → Redis + voicebot
├── math-sport/            # math-sport.ezekl.com → puerto 9000
└── elasticsearch/         # elastic-search.ezekl.com
```

### Patrón de contenedores (blue-green)

Los contenedores activos siguen la convención `<app>-green`:

```
roll-manager-green      imagen: roll-manager-green-image    puerto: 127.0.0.1:3000
math-sport-green        imagen: math-sport-green-image      puerto: 9000
clickeat-voicebot-redis imagen: redis:7-alpine               interno
```

### Patrón nginx (con SSL Certbot)

```nginx
# /etc/nginx/sites-enabled/roll-manager.ezekl.com
server {
    server_name roll-manager.ezekl.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;  # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/roll-manager.ezekl.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/roll-manager.ezekl.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
server {
    if ($host = roll-manager.ezekl.com) {
        return 301 https://$host$request_uri;
    }
    server_name roll-manager.ezekl.com;
    listen 80;
    return 404;
}
```

---

## Dockerfile para Next.js (standalone)

Next.js debe tener `output: 'standalone'` en `next.config.ts`:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

### Dockerfile multistage (Next.js 16 + Node 20)

> Ver archivo real: `src/Dockerfile`

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Prisma generate ANTES de copiar el resto (genera binaries para linux/amd64)
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/api/auth/session || exit 1

CMD ["node", "server.js"]
```

> **Crítico — plataforma**: La VM es `linux/amd64`. Siempre buildear con `--platform linux/amd64` desde macOS (Apple Silicon) para evitar errores de binaries de Prisma.
> **Crítico — Prisma**: Correr `npx prisma generate` dentro del builder antes del `npm run build`. Sin esto el build falla porque `@prisma/client` no tiene los binaries generados.
> **Crítico — Healthcheck**: Usar `http://127.0.0.1:3000` (IPv4 explícito) en el `HEALTHCHECK`, **nunca `localhost`**. En Alpine Linux, `localhost` puede resolver a `::1` (IPv6) mientras Next.js solo escucha en `0.0.0.0` (IPv4), causando "Connection refused" aunque la app esté activa.
> **Crítico — NextAuth v5**: Incluir `trustHost: true` como primera propiedad del objeto de configuración `NextAuth({...})` en `lib/auth.ts`. Sin esto, NextAuth v5 lanza `UntrustedHost` cuando recibe requests de un host/dominio no conocido, lo que rompe la sesión y provoca redirect loops en el login. La variable `NEXTAUTH_URL` (v4) **es ignorada** por NextAuth v5; usar `AUTH_URL` o `trustHost: true`.

---

## Flujo completo de despliegue

### Paso 1: Preparar next.config.ts (standalone)

```ts
// src/next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

### Paso 2: Build local de imagen Docker

```bash
cd src/
# --platform linux/amd64 es OBLIGATORIO desde macOS Apple Silicon
docker build --platform linux/amd64 -t roll-manager-green-image .
```

### Paso 3: Exportar imagen y transferir a la VM

```bash
# Exportar y comprimir (~192 MB)
docker save roll-manager-green-image | gzip > /tmp/roll-manager.tar.gz

# Transferir via scp (desde raíz del repo)
scp -i credentials/id_rsa.pem \
  /tmp/roll-manager.tar.gz \
  azureuser@172.191.128.24:/home/azureuser/projects/roll-manager/

# Cargar en la VM
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 \
  "docker load < ~/projects/roll-manager/roll-manager.tar.gz"
```

### Paso 4: Crear .env de producción en la VM

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 "
mkdir -p ~/projects/roll-manager
cat > ~/projects/roll-manager/.env << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=sqlserver://sqlserveritqsdemos.database.windows.net:1433;database=sql-database-itqs-demos;user=itqs_demos;password=<PASSWORD>;encrypt=true;trustServerCertificate=false
NEXTAUTH_SECRET=<SECRET>
NEXTAUTH_URL=https://roll-manager.ezekl.com
AZURE_OPENAI_ENDPOINT=https://demo-itqs-resource.openai.azure.com/openai/v1
AZURE_OPENAI_API_KEY=<KEY>
AZURE_OPENAI_DEPLOYMENT=gpt-5.5
AZURE_AI_PROJECT_ENDPOINT=https://demo-itqs-resource.services.ai.azure.com/api/projects/demo-itqs
ENVEOF
chmod 600 ~/projects/roll-manager/.env
"
```

### Paso 5: Correr el contenedor

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 "
  docker stop roll-manager-green 2>/dev/null && docker rm roll-manager-green 2>/dev/null || true
  docker run -d \
    --name roll-manager-green \
    --restart unless-stopped \
    -p 127.0.0.1:3000:3000 \
    --env-file ~/projects/roll-manager/.env \
    roll-manager-green-image
"
```

> **Seguridad**: `-p 127.0.0.1:3000:3000` — bind solo a localhost. nginx es el único punto de entrada público.

### Paso 6: DNS en Cloudflare

```bash
CF_TOKEN=$(head -1 credentials/dns-token.txt)
CF_ZONE="1ab102a0434b960afd1ff5543c09c9cd"

curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "roll-manager.ezekl.com",
    "content": "172.191.128.24",
    "ttl": 1,
    "proxied": false
  }'
```

> **Nota**: `proxied: false` — el SSL lo gestiona Certbot en la VM, no Cloudflare.

### Paso 7: Configurar nginx

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 "
sudo tee /etc/nginx/sites-available/roll-manager.ezekl.com > /dev/null << 'NGINXEOF'
server {
    server_name roll-manager.ezekl.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    listen 80;
}
NGINXEOF
sudo ln -sf /etc/nginx/sites-available/roll-manager.ezekl.com \
             /etc/nginx/sites-enabled/roll-manager.ezekl.com
sudo nginx -t && sudo systemctl reload nginx
"
```

### Paso 8: SSL con Certbot

```bash
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 \
    "sudo certbot --nginx -d roll-manager.ezekl.com --non-interactive --agree-tos -m admin@itqscr.com"
```

> **Requisito**: el DNS `roll-manager.ezekl.com → 172.191.128.24` debe estar activo antes de este paso.

---

## Consideraciones críticas

### Mapa de discos de la VM

```
sda   64 GB   ⚠️  SIN MONTAR — disco de datos vacío, no usado
sdb   30 GB   disco del sistema operativo
  ├── sdb1   29 GB  /         (sistema, 83% usado al 2026-05-30)
  ├── sdb15  106 MB /boot/efi
  └── sdb16  913 MB /boot
sdc    7 GB
  └── sdc1    7 GB  /mnt      (casi vacío, 28K usados — temporal)
```

> **`sda` 64GB** está completamente vacío. Montarlo como `/data` permitiría mover SQL Server, Docker o proyectos y resolver el problema de espacio a largo plazo. Por ahora no está configurado.

### Limpieza de disco — playbook completo

Ejecutar en orden, verificando `df -h /` entre pasos:

#### Nivel 1 — Siempre seguro (sin riesgo)

```bash
SSH="ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24"

$SSH "
  # Journal logs del sistema
  sudo journalctl --vacuum-size=100M

  # Caché apt (regenerable con apt-get update)
  sudo apt-get autoremove -y
  sudo apt-get clean
  sudo rm -rf /var/lib/apt/lists/*

  # Logs rotatados (.gz, .1, .old)
  sudo find /var/log -name '*.gz' -delete
  sudo find /var/log -name '*.1' -delete
  sudo find /var/log -name '*.old' -delete

  # Caché npm global
  npm cache clean --force

  # Imágenes Docker sin ningún contenedor
  docker image prune -f
"
```

**Espacio típico liberado: ~600–900MB**

#### Nivel 2 — Seguro si el build ya está compilado

Antes de borrar, verificar que `www/` existe y tiene contenido:

```bash
# node_modules de proyectos con build ya compilado
# (el build/www se incluye en la imagen Docker, node_modules no se necesita en host)
$SSH "rm -rf /home/azureuser/projects/elasticsearch/web/node_modules"     # ~856MB
$SSH "rm -rf /home/azureuser/projects/ezekl-budget/ezekl-budget-ionic/node_modules"  # ~533MB
```

**Espacio típico liberado: ~1.4GB**

#### Nivel 3 — SQL Server logs de telemetría (XEL viejos)

Los archivos `system_health_*.xel` son logs de Extended Events, no datos de base de datos. Es seguro borrar los que no son el activo (el más reciente):

```bash
# Identificar cuál es el activo (más reciente)
$SSH "sudo ls -lt /var/opt/mssql/log/system_health*.xel | head -3"

# Borrar todos menos el más reciente
$SSH "sudo find /var/opt/mssql/log -name 'system_health*.xel' \
  -not -newer /var/opt/mssql/log/<ARCHIVO_MAS_RECIENTE>.xel -delete"
```

**Espacio típico liberado: ~350MB**

#### Resumen de limpiezas realizadas (2026-05-30)

| Acción | Espacio |
|--------|---------|
| `journalctl --vacuum` | ~336MB |
| `apt autoremove + clean` | ~50MB |
| `.npm` cache | ~550MB |
| Imagen Docker `clickeat-voicebot` (sin contenedor) | ~133MB |
| `elasticsearch/web/node_modules` | ~856MB |
| `ezekl-budget-ionic/node_modules` | ~533MB |
| `apt lists` cache | ~249MB |
| SQL Server XEL viejos | ~350MB |
| **Total liberado** | **~3.1GB** |

**Estado final:** 1.8GB → **4.9GB libres** (94% → 83%)

### Espacio en disco — monitoreo

```bash
SSH="ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24"

# Resumen rápido
$SSH "df -h / && docker system df"

# Top dirs grandes
$SSH "sudo du -h --max-depth=3 / 2>/dev/null | sort -rh | head -20"
```

El objetivo mínimo para un build Docker de Next.js es **2GB libres**. La imagen final ocupa ~400-600MB.

### RAM

La VM tiene ~334MB disponibles (`free -h`). El contenedor Next.js en producción necesita ~200-300MB. Es ajustado pero funcional. Limitar memoria del contenedor:

```bash
docker run -d --memory="400m" --memory-swap="400m" \
    --name roll-manager-green ...
```

### SQL Server local

La cadena de conexión apunta a `localhost` (o `172.191.128.24`) en el contenedor. Dado que el contenedor corre con `-p 127.0.0.1:3000:3000` (no `--network host`), para acceder al SQL Server del host usar la IP del gateway Docker:

```
DATABASE_URL=sqlserver://172.17.0.1:1433;...
# O usar --add-host=host.docker.internal:host-gateway al docker run
```

Forma correcta:
```bash
docker run -d \
  --add-host=host.docker.internal:host-gateway \
  --name roll-manager-green \
  ...
```

Y en `DATABASE_URL`: `sqlserver://host.docker.internal:1433;...`

### DNS — Cloudflare

El dominio `ezekl.com` está gestionado por **Cloudflare**. Todos los subdominios (`roll-manager.ezekl.com`, `budget.ezekl.com`, etc.) apuntan a la IP `172.191.128.24`.

#### Credenciales Cloudflare

| Campo | Valor |
|-------|-------|
| Zona | `ezekl.com` |
| Zone ID | `1ab102a0434b960afd1ff5543c09c9cd` |
| Token | en `credentials/dns-token.txt` (primera línea) |
| Estado del token | `active` |

```bash
# Leer el token desde el archivo
CF_TOKEN=$(head -1 credentials/dns-token.txt)

# Verificar que el token sigue activo
curl -s "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CF_TOKEN" | jq '.result.status'
# → "active"
```

#### Agregar registro A para un nuevo subdominio

```bash
CF_TOKEN=$(head -1 credentials/dns-token.txt)
CF_ZONE="1ab102a0434b960afd1ff5543c09c9cd"

# Crear registro A (proxied: false = DNS only, necesario para SSL con Certbot)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "A",
    "name": "roll-manager",
    "content": "172.191.128.24",
    "ttl": 1,
    "proxied": false
  }' | jq '.success, .result.id'
```

> **`proxied: false`** (DNS only / nube gris) es obligatorio para que Certbot pueda emitir el certificado SSL con el challenge HTTP-01. Si se usa proxy de Cloudflare (nube naranja), usar el challenge DNS-01 en su lugar.

#### Listar registros existentes de la zona

```bash
CF_TOKEN=$(head -1 credentials/dns-token.txt)
CF_ZONE="1ab102a0434b960afd1ff5543c09c9cd"

curl -s "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records?type=A" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq '.result[] | {name: .name, ip: .content, proxied: .proxied}'
```

#### Eliminar un registro A

```bash
CF_TOKEN=$(head -1 credentials/dns-token.txt)
CF_ZONE="1ab102a0434b960afd1ff5543c09c9cd"
RECORD_ID="<id devuelto al crear o listar>"

curl -s -X DELETE \
  "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${CF_TOKEN}" | jq '.success'
```

---

## Verificación post-deploy

> **Checklist completo:** `references/post-deploy-checklist.md`  
> Cubre 4 capas en orden: GHA workflow → VM state → smoke tests curl → revisión visual Playwright.

### Resumen rápido (comandos mínimos)

```bash
# 1. Estado del workflow (esperar conclusion=success)
gh run list --repo ezekiell1988/horario-colaboradores --limit 1 --json status,conclusion

# 2. Estado de la VM en un comando
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 \
  "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' \
   && sudo grep proxy_pass /etc/nginx/sites-available/roll-manager.ezekl.com \
   && df -h / | tail -1"

# 3. Smoke test HTTPS
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://roll-manager.ezekl.com/api/auth/session

# 4. Revisión visual → invocar skill playwright-design-review
#    open_browser_page https://roll-manager.ezekl.com  (desktop 1280×900 + mobile 390×844)
```

### Qué esperar en la VM

| Check | Valor esperado |
|-------|---------------|
| Contenedor activo | `roll-manager-sha-<SHA>` en estado `Up X minutes` |
| `proxy_pass` | Puerto opuesto al anterior (`:3000` ↔ `:3001`) |
| Disco `/` | < 85% usado |
| Contenedor viejo | Ausente de `docker ps` |

---

## CI/CD con GitHub Actions (blue-green automático)

El flujo de deploy manual está **automatizado** en `.github/workflows/deploy.yml`. Cada push a `main` ejecuta:

```
1. Build imagen --platform linux/amd64 etiquetada roll-manager:sha-<SHORT_SHA>
2. Comprime y transfiere imagen + .env a la VM via SCP
3. Copia .github/scripts/deploy-bluegreen.sh y lo ejecuta
4. El script hace blue-green:
   a. Lee puerto activo desde nginx (3000 ó 3001)
   b. Arranca nuevo contenedor en puerto inactivo
   c. Healthcheck /api/auth/session (30 reintentos × 3s = 90s max)
   d. Si pasa: sed nginx → reload (zero-downtime)
   e. Si falla: rollback automático (elimina el contenedor nuevo)
   f. Detiene y elimina el contenedor anterior
   g. Elimina imágenes viejas (conserva 2 más recientes) + image prune
5. Smoke test final contra https://roll-manager.ezekl.com
```

### Naming convention

| Componente | Patrón | Ejemplo |
|---|---|---|
| Imagen | `roll-manager:sha-<8chars>` | `roll-manager:sha-a1b2c3d4` |
| Contenedor | `roll-manager-sha-<8chars>` | `roll-manager-sha-a1b2c3d4` |
| Puerto activo | determinado por nginx conf | `proxy_pass http://127.0.0.1:3000` |

> El slot activo se determina leyendo `proxy_pass` en el nginx conf — no hay archivo de estado aparte.

### Secrets de GitHub requeridos

Configurar en `Settings → Secrets and variables → Actions`:

| Secret | Descripción |
|---|---|
| `VM_SSH_KEY` | Contenido completo de `credentials/id_rsa.pem` |
| `DATABASE_URL` | Cadena de conexión SQL Server producción |
| `NEXTAUTH_SECRET` | Clave aleatoria para JWT |
| `AZURE_OPENAI_ENDPOINT` | Endpoint AI Foundry |
| `AZURE_OPENAI_API_KEY` | API key AI Foundry |
| `AZURE_OPENAI_DEPLOYMENT` | Nombre del deployment (ej: `gpt-5.5`) |
| `AZURE_AI_PROJECT_ENDPOINT` | Endpoint del proyecto AI |

Cargar desde `.env.local` con `gh` CLI:
```bash
source <(grep -E '^(DATABASE_URL|NEXTAUTH_SECRET|AZURE_OPENAI_ENDPOINT|AZURE_OPENAI_API_KEY|AZURE_OPENAI_DEPLOYMENT|AZURE_AI_PROJECT_ENDPOINT)=' src/.env.local | sed 's/^/export /')
REPO="ezekiell1988/horario-colaboradores"
gh secret set DATABASE_URL              --repo "$REPO" --body "$DATABASE_URL"
gh secret set NEXTAUTH_SECRET           --repo "$REPO" --body "$NEXTAUTH_SECRET"
gh secret set AZURE_OPENAI_ENDPOINT     --repo "$REPO" --body "$AZURE_OPENAI_ENDPOINT"
gh secret set AZURE_OPENAI_API_KEY      --repo "$REPO" --body "$AZURE_OPENAI_API_KEY"
gh secret set AZURE_OPENAI_DEPLOYMENT   --repo "$REPO" --body "$AZURE_OPENAI_DEPLOYMENT"
gh secret set AZURE_AI_PROJECT_ENDPOINT --repo "$REPO" --body "$AZURE_AI_PROJECT_ENDPOINT"
gh secret set VM_SSH_KEY                --repo "$REPO" --body "$(cat credentials/id_rsa.pem)"
```

### Trigger manual sin push

```bash
gh workflow run deploy.yml --repo ezekiell1988/horario-colaboradores
```
