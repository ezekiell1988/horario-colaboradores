# Docker Cleanup — Referencia Técnica

## Estado típico de este Mac (mayo 2026)

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          13        1         23.05GB   1.1GB (4%)
Containers      1         0         4.096kB   4.096kB (100%)
Local Volumes   2         1         9.403MB   9.403MB (99%)
Build Cache     314       0         24.2GB    20.61GB
```

Después de `docker builder prune -f`:

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          13        1         4.753GB   1.1GB (23%)
Containers      1         0         4.096kB   4.096kB (100%)
Local Volumes   2         1         9.403MB   9.403MB (99%)
Build Cache     89        0         3.628GB   39.02MB
```

**Liberado: ~20.6 GB** solo con limpiar el build cache.

---

## Comandos de diagnóstico

```bash
# Resumen general
docker system df

# Detalle por imagen
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.ID}}" | sort -k3 -h -r

# Contenedores activos
docker ps

# Contenedores detenidos
docker ps -a

# Volúmenes
docker volume ls
```

---

## Por qué crece tanto el build cache

Cada `docker build` guarda las capas intermedias en caché para acelerar builds futuros.
En proyectos Next.js con Dockerfile multi-stage (como roll-manager), cada cambio en el código
genera nuevas capas. Sin limpieza periódica, el cache crece hasta 20-25 GB en pocas semanas.

**Frecuencia recomendada de limpieza:** cada 2-3 semanas o cuando se necesite espacio.

---

## Proteger imágenes activas en producción

Antes de hacer `docker system prune -a`, verificar que `roll-manager-green-image` esté listada como activa:

```bash
docker ps --filter "ancestor=roll-manager-green-image"
```

Si no aparece contenedor activo localmente, la imagen está en la VM remota (`172.191.128.24`),
no en el Mac. Es seguro borrarla del Mac; se reconstruye con el Dockerfile de `src/`.

---

## Reconstruir roll-manager localmente (si se borró)

```bash
cd /Users/ezequielbaltodanocubillo/Documents/ezekl/horario-colaboradores/src
docker build -t roll-manager-green-image .
```

O usar el flujo de deploy a la VM documentado en el skill `vm-docker-deploy`.
