# Estado de la VM demo-itqs — Referencia de infraestructura

## Actualizado: 2026-05-30

## Proyectos desplegados

| Subdominio | Carpeta | Puerto | Contenedor | Tecnología |
|------------|---------|--------|------------|-----------|
| budget.ezekl.com | `/home/azureuser/projects/ezekl-budget` | 8000 | `ezekl-budget-green` (network host) | Python/FastAPI + Uvicorn |
| clickeat.ezekl.com | `/home/azureuser/projects/clickeat-voicebot` | — | `clickeat-voicebot-redis` | Redis + voicebot |
| math-sport.ezekl.com | `/home/azureuser/projects/math-sport` | 9000 | `math-sport-green` | Node.js |
| elastic-search.ezekl.com | `/home/azureuser/projects/elasticsearch` | — | — | Elasticsearch |
| **roll-manager.ezekl.com** | `/home/azureuser/projects/roll-manager` | **3000** | `roll-manager-green` | **Next.js 15** |

## Redes Docker

| Red | Driver | Proyectos |
|-----|--------|-----------|
| `voicebot-network` | bridge | clickeat-voicebot |
| `bridge` (default) | bridge | math-sport, roll-manager |
| `host` | host | ezekl-budget |

## Convención de nombres Docker

- Imagen: `<app>-green-image`
- Contenedor: `<app>-green`
- Restart policy: `unless-stopped`

## Rutas importantes en la VM

```
/home/azureuser/projects/       # código de todos los proyectos
/etc/nginx/sites-available/     # configs nginx (uno por dominio)
/etc/nginx/sites-enabled/       # symlinks a sites-available
/etc/letsencrypt/live/          # certificados SSL por dominio
/var/opt/mssql/                 # datos SQL Server (13GB!)
/var/log/                       # logs (517MB — limpiar con journalctl)
```

## Mapa de discos

```
sdb   30 GB   Azure Managed Disk Premium_LRS — OS Disk
               → Recurso: demo-itqs_OsDisk_1_4789648c136b496e8cd24d60b1cc1a74
  └─ sdb1 29G  /  (ext4, 83% al 2026-05-30 → 4.9GB libres)
sdc    7 GB   tmpfs del agente Azure
  └─ sdc1  7G  /mnt (casi vacío)
```

> El disco de datos de 64GB (`sda`) fue **eliminado el 2026-05-30**. Solo queda el OS Disk de 30GB.

**VM**: `Standard_DS1_v2` — 1 vCPU, 3.5 GB RAM, Premium_LRS disks.

## Advertencias de recursos

- **Disco**: 65% usado (19G/29G) — **10 GB libres** tras truncar log de `ezekl-budget-green` el 2026-05-30.
- **RAM**: ~334MB libre de 3.3GB. Next.js necesita ~200-300MB.
- **Sin swap**: `Swap: 0B` — si el proceso agota RAM, el kernel lo mata (OOM).
- **SQL Server en el mismo host**: consume ~1.3GB de disco y significativa RAM.

> Ver auditoría completa de disco en `references/disk-usage-audit.md`.
> El mayor riesgo de llenado es `budgetdb.mdf` (11 GB) y los logs Docker sin rotación configurada.

## Comandos de diagnóstico rápido

```bash
SSH="ssh -i credentials/id_rsa.pem -o StrictHostKeyChecking=no azureuser@172.191.128.24"

# Disco
$SSH "df -h /"

# RAM y procesos
$SSH "free -h && docker stats --no-stream"

# Logs recientes de roll-manager
$SSH "docker logs --tail 100 -f roll-manager-green"

# Espacio Docker
$SSH "docker system df"

# Liberar espacio (seguro)
$SSH "sudo journalctl --vacuum-size=100M && sudo apt-get clean && docker image prune -f"
```
