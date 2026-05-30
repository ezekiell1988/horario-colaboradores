# Auditoría de disco — VM demo-itqs

## Última actualización: 2026-05-30

## Estado general

| Fecha | Total | Usado | Libre | % |
|-------|-------|-------|-------|---|
| 2026-05-30 (antes de limpieza) | 29 GB | 24 GB | 4.9 GB | 83% |
| 2026-05-30 (después de truncar log) | 29 GB | 19 GB | **10 GB** | **65%** |

---

## Mapa de consumo por directorio (`du -h --max-depth=3 /`)

| Directorio | Tamaño | Responsable |
|------------|--------|-------------|
| `/var/opt/mssql` | **12 GB** | SQL Server — datos y logs de BD |
| `/var/lib/docker` | **6.1 GB** | Docker (imágenes + logs de contenedores) |
| `/var/lib/containerd` | 1.4 GB | Snapshots de capas de imágenes |
| `/opt/mssql` | 1.3 GB | Binarios del motor SQL Server |
| `/usr` | 2.5 GB | Sistema operativo + herramientas |
| `/home/azureuser/projects` | 394 MB | Código de los proyectos |
| `/var/log` | 146 MB | Logs del sistema (journal: 97 MB) |
| `/usr/src` | 329 MB | Headers del kernel Linux Azure |

---

## Desglose SQL Server (`/var/opt/mssql/data/`)

| Archivo | Tamaño | Base de datos | Tipo |
|---------|--------|---------------|------|
| `budgetdb.mdf` | **11 GB** | `budgetdb` | Datos (MDF) |
| `budgetdb_log.ldf` | 780 MB | `budgetdb` | Transaction log |
| `elasticsearchdb_log.ldf` | 324 MB | `elasticsearchdb` | Transaction log |
| `dbvoicebot_log.ldf` | 200 MB | `dbvoicebot` | Transaction log |
| `elasticsearchdb.mdf` | 72 MB | `elasticsearchdb` | Datos |
| `dbvoicebot.mdf` | 72 MB | `dbvoicebot` | Datos |
| `dbfa.mdf` | 72 MB | `dbfa` | Datos |

> **`budgetdb.mdf` de 11 GB** es el mayor consumidor de la VM. Contiene los datos del proyecto `ezekl-budget`. No es seguro truncar sin analizar su contenido primero.

---

## Desglose Docker (`docker system df`)

| Tipo | Total | Activos | Tamaño | Recuperable |
|------|-------|---------|--------|-------------|
| Images | 3 | 3 | 1.455 GB | 0 B (todas activas) |
| Containers | 3 | 3 | 1.442 MB | 0 B |
| Volumes | 1 | 1 | 264 B | 0 B |
| Build Cache | 0 | — | 0 B | 0 B |

### Log del contenedor `ezekl-budget-green` — **5.1 GB** ⚠️

El contenedor `ezekl-budget-green` (Python/FastAPI, `network: host`) acumuló **5.1 GB** de logs JSON en:

```
/var/lib/docker/containers/8f26d5e7e5fe18b49699f366bb4d202a5c5748899d429254e85df81809336ed6/
  └── 8f26d5e...336ed6-json.log   # 5.1 GB — DEBUG level sin rotación configurada
```

El log mezcla:
- `INFO` de envíos de email
- `WARNING` de requests HTTP inválidos
- `DEBUG` de health checks (cada 2s → enorme volumen)
- `ERROR` de autenticación Microsoft

---

## Acciones de limpieza realizadas (2026-05-30)

### Acción 1 — Truncar log del contenedor `ezekl-budget-green`

**Espacio liberado: 5.1 GB** | Riesgo: ninguno (el contenedor sigue corriendo)

```bash
SSH="ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24"

$SSH "
  LOG_PATH=\$(docker inspect --format='{{.LogPath}}' ezekl-budget-green)
  sudo truncate -s 0 \$LOG_PATH
  df -h /
"
```

> `truncate -s 0` vacía el archivo sin eliminarlo. Docker continúa escribiendo al mismo file descriptor — no es necesario reiniciar el contenedor.

---

## Limpieza pendiente / recomendada

### Configurar log rotation para todos los contenedores

Evita que el problema se repita. Agregar al `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}
```

```bash
$SSH "
  sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  \"log-driver\": \"json-file\",
  \"log-opts\": {
    \"max-size\": \"50m\",
    \"max-file\": \"3\"
  }
}
EOF
  sudo systemctl reload docker
"
```

> **Nota**: la rotación solo aplica a contenedores iniciados _después_ del reload. Los contenedores existentes deben recrearse para heredar la config.

### Shrink de transaction logs SQL Server

Los `.ldf` están sobredimensionados (budgetdb_log: 780 MB, elasticsearchdb_log: 324 MB). Se pueden reducir con DBCC dentro de SQL Server:

```bash
# Conectar con sqlcmd
$SSH "sudo /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P '<PASSWORD>' -Q \"
USE budgetdb;
CHECKPOINT;
DBCC SHRINKFILE (budgetdb_log, 50);
GO
\""
```

> Solo es seguro hacer shrink si el modo de recuperación es `SIMPLE` o si ya se hizo un backup de log. Verificar primero:
> ```sql
> SELECT name, recovery_model_desc FROM sys.databases;
> ```

### Shrink de `budgetdb.mdf` (11 GB)

El MDF puede tener espacio no utilizado dentro del archivo. Para reducirlo:

```sql
USE budgetdb;
DBCC SHRINKDATABASE (budgetdb, 10);  -- deja 10% de espacio libre
```

⚠️ Hacer esto solo después de confirmar que no hay datos activos importantes y con un **backup previo**.

---

## Monitoreo rápido de disco

```bash
SSH="ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24"

# Estado general
$SSH "df -h / && docker system df"

# Top 10 dirs más grandes
$SSH "sudo du -h --max-depth=3 / 2>/dev/null | sort -rh | head -10"

# Tamaño de logs por contenedor
$SSH "docker ps -a --format '{{.Names}}' | while read name; do
  log_path=\$(docker inspect --format='{{.LogPath}}' \$name 2>/dev/null)
  [ -f \"\$log_path\" ] && echo \"\$(sudo du -sh \$log_path | cut -f1)  \$name\"
done"
```
