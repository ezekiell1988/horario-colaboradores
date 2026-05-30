# Roll Manager — Guía de despliegue completo

Registro del despliegue real de `roll-manager` en la VM `demo-itqs` (172.191.128.24).
Ejecutado el 30 de mayo de 2026.

---

## 1. Prerrequisitos en el proyecto

### 1.1 next.config.ts — modo standalone

```ts
// src/next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
};
export default nextConfig;
```

Sin `output: "standalone"` Next.js no genera `server.js` y el contenedor no arranca.

### 1.2 .dockerignore

```
node_modules
.next
.env
.env.local
.env*.local
.git
*.test.ts
**/__tests__
.agents
ia/
```

---

## 2. Dockerfile

Archivo: `src/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Prisma generate ANTES del build — genera binaries para linux/amd64
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copiar binaries de Prisma al runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/auth/session || exit 1

CMD ["node", "server.js"]
```

**Notas críticas:**
- `npx prisma generate` va en el stage `builder`, no en `runner`. Los binaries `.prisma` se copian explícitamente.
- `HOSTNAME=0.0.0.0` es necesario para que Next.js escuche en todas las interfaces dentro del contenedor.
- Se copian tanto `node_modules/.prisma` como `node_modules/@prisma` — ambos son necesarios.

---

## 3. Build local — cross-platform

```bash
cd src/

# --platform linux/amd64 es OBLIGATORIO desde macOS Apple Silicon
# Sin esto Prisma genera binaries para arm64 y crashea en la VM
docker build --platform linux/amd64 -t roll-manager-green-image .
```

Tiempo aprox: ~85 segundos la primera vez.

---

## 4. Exportar y transferir imagen a la VM

```bash
# Exportar y comprimir (~192 MB → ~182 MB gzip)
docker save roll-manager-green-image | gzip > /tmp/roll-manager.tar.gz

# Transferir (ejecutar desde la raíz del repo, donde está credentials/)
scp -i credentials/id_rsa.pem \
  /tmp/roll-manager.tar.gz \
  azureuser@172.191.128.24:/home/azureuser/projects/roll-manager/
```

Tiempo de transferencia aprox: 2-3 minutos dependiendo de la red.

---

## 5. .env de producción en la VM

Crear una sola vez. Contiene las variables reales de producción.

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

Los valores reales están en `credentials/credentials.txt` y `credentials/ai-foundry.json`.

---

## 6. Cargar imagen y arrancar contenedor

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 "
echo '=== Cargando imagen ==='
docker load < ~/projects/roll-manager/roll-manager.tar.gz

echo '=== Iniciando contenedor ==='
docker stop roll-manager-green 2>/dev/null && docker rm roll-manager-green 2>/dev/null || true

docker run -d \
  --name roll-manager-green \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file ~/projects/roll-manager/.env \
  roll-manager-green-image

sleep 8
docker ps --filter name=roll-manager-green --format 'STATUS: {{.Status}}'
docker logs roll-manager-green --tail 15
"
```

**Notas:**
- `-p 127.0.0.1:3000:3000` — bind solo a localhost. nginx es el único punto de entrada externo.
- `--restart unless-stopped` — el contenedor sobrevive reinicios de la VM.
- `docker load` de 182 MB tarda ~60-90 segundos — esperar.

---

## 7. DNS en Cloudflare

```bash
CF_TOKEN=$(head -1 credentials/dns-token.txt)
CF_ZONE="1ab102a0434b960afd1ff5543c09c9cd"

curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE}/dns_records" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type":    "A",
    "name":    "roll-manager.ezekl.com",
    "content": "172.191.128.24",
    "ttl":     1,
    "proxied": false
  }' | python3 -m json.tool | grep -E 'id|name|content|proxied'
```

**Importante:** `proxied: false` — el SSL lo gestiona Certbot en la VM.  
Con `proxied: true` Certbot no puede hacer el challenge HTTP-01 y falla.

Guardar el `id` del registro devuelto para poder borrarlo luego si hace falta.

---

## 8. nginx — reverse proxy

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 "
sudo tee /etc/nginx/sites-available/roll-manager.ezekl.com > /dev/null << 'NGINXEOF'
server {
    server_name roll-manager.ezekl.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
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

Verificar con `sudo nginx -t` antes de recargar. Si falla, revisar sintaxis (especialmente las variables `$` escapadas con `\$` dentro de heredoc).

---

## 9. SSL con Certbot (Let's Encrypt)

```bash
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 "
sudo certbot --nginx \
  -d roll-manager.ezekl.com \
  --non-interactive \
  --agree-tos \
  -m admin@itqscr.com
"
```

Certbot modifica automáticamente el bloque `server` en nginx para añadir el bloque SSL (443) y la redirección 80→443.

El certificado se guarda en:
- `/etc/letsencrypt/live/roll-manager.ezekl.com/fullchain.pem`
- `/etc/letsencrypt/live/roll-manager.ezekl.com/privkey.pem`

Expira en 90 días (renovación automática vía cron de certbot).

---

## 10. Verificación final

```bash
# Desde la VM (confiable)
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 \
  "curl -sI https://roll-manager.ezekl.com | head -4"
# Esperado: HTTP/2 200

# Contenedor corriendo
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 \
  "docker ps --filter name=roll-manager-green --format 'STATUS: {{.Status}}'"

# Logs de arranque
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 \
  "docker logs roll-manager-green --tail 10"
# Esperado: ✓ Ready in Xms
```

---

## 11. Troubleshooting

### 502 Bad Gateway
El contenedor no está corriendo o crasheó al arrancar.

```bash
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 "
docker ps -a --filter name=roll-manager-green
docker logs roll-manager-green --tail 30
"
```

Causas comunes:
- Variables de entorno incorrectas (`DATABASE_URL` mal formada, `NEXTAUTH_SECRET` vacío)
- `HOSTNAME` no seteado → Next.js standalone escucha solo en 127.0.0.1 dentro del contenedor, nginx no puede alcanzarlo
- Binaries de Prisma faltantes → crash al conectar a la BD

Fix rápido si el contenedor está caído:
```bash
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 "
docker start roll-manager-green
sleep 5
docker logs roll-manager-green --tail 20
"
```

### ERR_CERT_AUTHORITY_INVALID en el navegador
Certbot emitió el certificado correctamente pero nginx puede estar sirviendo un certificado auto-firmado anterior o el config no fue actualizado por certbot.

Verificar que el bloque `listen 443 ssl` apunta a los certs de Let's Encrypt:
```bash
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 \
  "sudo grep -n 'ssl_certificate' /etc/nginx/sites-enabled/roll-manager.ezekl.com"
# Debe decir: /etc/letsencrypt/live/roll-manager.ezekl.com/fullchain.pem
# NO debe decir: /etc/nginx/ssl/... (esos son certificados de Cloudflare Origin)
```

Si apunta a un cert equivocado, volver a correr certbot:
```bash
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 \
  "sudo certbot --nginx -d roll-manager.ezekl.com --reinstall"
```

### Prisma / conexión a BD falla
```bash
# Ver logs del contenedor
docker logs roll-manager-green 2>&1 | grep -i 'prisma\|error\|fatal'

# Verificar que DATABASE_URL está bien seteada
docker exec roll-manager-green env | grep DATABASE_URL
```

---

## 12. Re-deploy (actualización)

Para subir una nueva versión:

```bash
# 1. Build nueva imagen (desde src/)
cd src/
docker build --platform linux/amd64 -t roll-manager-green-image .

# 2. Exportar y transferir
docker save roll-manager-green-image | gzip > /tmp/roll-manager.tar.gz
scp -i credentials/id_rsa.pem /tmp/roll-manager.tar.gz \
  azureuser@172.191.128.24:/home/azureuser/projects/roll-manager/

# 3. Cargar y reiniciar en la VM
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24 "
docker load < ~/projects/roll-manager/roll-manager.tar.gz
docker stop roll-manager-green && docker rm roll-manager-green
docker run -d \
  --name roll-manager-green \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file ~/projects/roll-manager/.env \
  roll-manager-green-image
sleep 8
docker ps --filter name=roll-manager-green --format 'STATUS: {{.Status}}'
"
```

El `.env` en la VM se reutiliza — no hace falta volver a crearlo salvo que cambien las variables.

---

## 13. SSL con Cloudflare Proxied — patrón definitivo (IMPORTANTE)

### Problema descubierto (sesión Jun 2026)

Con Cloudflare **proxied: true** (nube naranja) + cert Let's Encrypt, Cloudflare valida el cert contra su propia CA y puede devolver:

- **Error 526** — `Invalid SSL certificate`: ocurre si `notBefore` del cert está en el futuro para Cloudflare. **Causa raíz:** la VM tenía el reloj adelantado (NTP desincronizado) cuando certbot emitió el cert. El cert quedó con `notBefore = fecha futura`. Cloudflare lo rechaza aunque el cert sea técnicamente válido.
- **Error 522** — `Connection timed out`: Cloudflare no puede llegar al origin en puerto 443 (NSG cerrado).
- **ERR_TIMED_OUT en browser**: Cloudflare no puede conectar al origin.

### Solución definitiva: usar Cloudflare Origin Certificate (igual que math-sport y clickeat)

El patrón probado en la VM es usar **Cloudflare Origin Certificate** (no Let's Encrypt):
- Generado desde el **dashboard de Cloudflare** → SSL/TLS → Origin Server → Create Certificate
- Guardado en `/etc/nginx/ssl/<dominio>/origin-cert.pem` y `origin-key.pem`
- Válido 15 años, firmado por Cloudflare CA (confiada solo cuando Cloudflare hace de proxy)

```nginx
# Patrón nginx que funciona (math-sport, clickeat)
server {
    server_name roll-manager.ezekl.com;
    listen 443 ssl;
    ssl_certificate     /etc/nginx/ssl/roll-manager.ezekl.com/origin-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/roll-manager.ezekl.com/origin-key.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
server {
    listen 80;
    server_name roll-manager.ezekl.com;
    return 301 https://$host$request_uri;
}
```

### Cómo generar el Origin Certificate

El token DNS (`credentials/dns-token.txt`) NO tiene permisos para crear Origin Certs (error 1016).  
**Debe hacerse desde el dashboard de Cloudflare:**

1. `ezekl.com` → SSL/TLS → Origin Server → **Create Certificate**
2. Seleccionar hostnames: `roll-manager.ezekl.com`
3. Validez: 15 años (máximo)
4. Guardar el certificado y la clave privada
5. Copiarlos a la VM:

```bash
# En la VM
sudo mkdir -p /etc/nginx/ssl/roll-manager.ezekl.com
sudo chmod 700 /etc/nginx/ssl/roll-manager.ezekl.com

# Pegar el contenido del cert
sudo tee /etc/nginx/ssl/roll-manager.ezekl.com/origin-cert.pem > /dev/null << 'EOF'
<PEGAR AQUÍ EL CERTIFICADO>
EOF

# Pegar la clave privada
sudo tee /etc/nginx/ssl/roll-manager.ezekl.com/origin-key.pem > /dev/null << 'EOF'
<PEGAR AQUÍ LA CLAVE PRIVADA>
EOF

sudo chmod 600 /etc/nginx/ssl/roll-manager.ezekl.com/origin-key.pem
```

6. Actualizar nginx y recargar:

```bash
# Borrar config de certbot y reemplazar con Origin Cert
sudo certbot delete --cert-name roll-manager.ezekl.com --non-interactive 2>/dev/null || true
sudo tee /etc/nginx/sites-available/roll-manager.ezekl.com > /dev/null << 'NGINXEOF'
server {
    server_name roll-manager.ezekl.com;
    listen 443 ssl;
    ssl_certificate     /etc/nginx/ssl/roll-manager.ezekl.com/origin-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/roll-manager.ezekl.com/origin-key.pem;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
server {
    listen 80;
    server_name roll-manager.ezekl.com;
    return 301 https://$host$request_uri;
}
NGINXEOF
sudo nginx -t && sudo systemctl reload nginx
```

---

## 14. Diagnóstico rápido de errores Cloudflare

| Error | Causa probable | Fix |
|-------|---------------|-----|
| 526 Invalid SSL | `notBefore` futuro (reloj VM desincronizado) o cert firmado por CA no reconocida | Usar Cloudflare Origin Cert; verificar NTP en VM antes de emitir cert |
| 522 Connection Timeout | NSG Azure bloqueando 443, o nginx caído | Abrir puerto 443 en NSG; `sudo systemctl status nginx` |
| ERR_TIMED_OUT | VM sin respuesta (crasheó o NSG bloqueó todo) | Reiniciar VM desde Azure Portal o `az vm restart` |
| SSL: unable to get local issuer certificate | Cadena incompleta (solo cert, sin chain) | Usar `fullchain.pem` en nginx, no `cert.pem` |
| SSH: timed out during banner exchange | VM sobrecargada o sshd no responde | Reiniciar VM |

---

## 15. Reinicios de emergencia

### Reiniciar la VM (cuando SSH no responde)

```bash
# Requiere sesión activa de Azure CLI
az login  # si la sesión expiró

RG=$(az vm list --query "[?name=='demo-itqs'].resourceGroup" -o tsv)
az vm restart --resource-group "$RG" --name demo-itqs --no-wait
echo "Reinicio solicitado — esperar ~2 min para que la VM vuelva"
```

### Verificar que la VM volvió

```bash
# Esperar 2 minutos, luego:
ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no \
  -o ConnectTimeout=10 azureuser@172.191.128.24 "uptime && docker ps"
```

### Después del reinicio — verificar servicios

```bash
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 "
echo '=== nginx ===' && sudo systemctl status nginx --no-pager | head -3
echo '=== contenedor ===' && docker ps --filter name=roll-manager-green --format 'STATUS: {{.Status}}'
echo '=== cert symlinks ===' && ls -la /etc/letsencrypt/live/roll-manager.ezekl.com/ 2>/dev/null || echo 'No hay cert letsencrypt'
"
```

**Nota:** Con `--restart unless-stopped` el contenedor `roll-manager-green` arranca automáticamente después del reinicio de la VM. nginx también arranca automáticamente (está habilitado como servicio systemd).

### Symlinks de certbot rotos — fix

Si nginx falla con "cannot load certificate" después de un certbot:

```bash
ssh -i credentials/id_rsa.pem azureuser@172.191.128.24 "
ls -la /etc/letsencrypt/live/roll-manager.ezekl.com/
# Si los symlinks apuntan a un path incorrecto (ej: 'real-manager.ezekl.com'):
sudo ln -sf ../../archive/roll-manager.ezekl.com/fullchain1.pem \
  /etc/letsencrypt/live/roll-manager.ezekl.com/fullchain.pem
sudo ln -sf ../../archive/roll-manager.ezekl.com/privkey1.pem \
  /etc/letsencrypt/live/roll-manager.ezekl.com/privkey.pem
sudo nginx -t && sudo systemctl restart nginx
"
```
