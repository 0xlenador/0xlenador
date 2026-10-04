# 🌻 GET — Nightly Farm Dump (Bulk Data)

**`GET /community/data?type=nightlyDump`**

Cada granja en un archivo. La forma correcta de obtener todo el dataset.

---

## Descripción

Una vez al día, **toda la base de datos de granjas** se exporta a JSONL (newline-delimited JSON) comprimido con gzip.

### ¿Por qué usar el dump?
- **Una descarga** reemplaza miles de requests throttleados
- Snapshot **consistente point-in-time** vs. un walk por granjas que siguen guardándose
- Sin throttle en la descarga de archivos

### Flujo de trabajo:
1. **Manifiesto** (`GET /community/data?type=nightlyDump`) — lista archivos publicados (requiere API key)
2. **Descarga** desde `https://community.sunflower-land.com/{filename}` — CDN plano, sin key, sin rate limit

### Archivos disponibles:
| Archivo | Contenido | Tamaño aprox. |
|---------|-----------|---------------|
| `{YYYY-MM-DD}/all.jsonl.gz` | Cada cuenta | ~2 GB gzip |
| `{YYYY-MM-DD}/active.jsonl.gz` | Granjas activas en últimos 90 días | ~780 MB gzip |

> [!IMPORTANT]
> Solo se mantienen los **últimos 7 días**. Lee el manifiesto en vez de hardcodear paths.

---

## Parámetros

Ninguno.

---

## Formato de cada línea del dump

```json
{
  "id": 206379,
  "nftId": 206379,
  "farm": { "...": "game state completo" },
  "isBlacklisted": false,
  "lastActivity": 1756072800000
}
```

> [!NOTE]
> Diferencias con la API: `nftId` (no `nft_id`) y `lastActivity` (epoch ms del último browser save). `isBlacklisted` puede estar ausente en vez de `false`. Los chapter tickets se stripean del farm object.

---

## Ejemplo de Respuesta del Manifiesto — 200

```json
{
  "data": [
    {
      "filename": "2026-08-25/active.jsonl.gz",
      "size": 782905552,
      "modifiedAt": "2026-08-25T22:00:59.000Z"
    },
    {
      "filename": "2026-08-25/all.jsonl.gz",
      "size": 2140507162,
      "modifiedAt": "2026-08-25T22:00:41.000Z"
    }
  ]
}
```

---

## Ejemplos de Streaming

### Node.js
```javascript
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";

// 1. Obtener manifiesto
const index = await fetch(
  "https://api.sunflower-land.com/community/data?type=nightlyDump",
  { headers: { "x-api-key": process.env.SFL_API_KEY } }
).then(r => r.json());

const latest = index.data
  .filter(f => f.filename.endsWith("active.jsonl.gz"))
  .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))[0];

// 2. Stream y descomprimir
const dump = await fetch(
  `https://community.sunflower-land.com/${latest.filename}`
);

const lines = createInterface({
  input: Readable.fromWeb(dump.body).pipe(createGunzip()),
  crlfDelay: Infinity,
});

for await (const line of lines) {
  if (!line) continue;
  const { id, nftId, farm, isBlacklisted, lastActivity } = JSON.parse(line);
  // …tu procesamiento…
}
```

### Python
```python
import gzip
import json
import os
import requests

API = "https://api.sunflower-land.com"
FILES = "https://community.sunflower-land.com"

# El manifiesto requiere tu community key; los archivos que lista no.
index = requests.get(
    f"{API}/community/data?type=nightlyDump",
    headers={"x-api-key": os.environ["SFL_API_KEY"]},
).json()["data"]

latest = max(
    (f for f in index if f["filename"].endswith("active.jsonl.gz")),
    key=lambda f: f["modifiedAt"],
)

# stream=True + GzipFile mantiene la memoria plana
with requests.get(f"{FILES}/{latest['filename']}", stream=True) as response:
    response.raise_for_status()
    with gzip.GzipFile(fileobj=response.raw) as lines:
        for line in lines:
            farm = json.loads(line)
            # …tu procesamiento…
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **401** | Missing or invalid API key | Clave ausente o inválida (solo el manifiesto). |
| **429** | Too many requests | Throttle en el manifiesto: ~1 req/5s. Las descargas de archivos NO están throttleadas. |
| **403** | File expired (CDN) | Descargar un archivo no listado en el manifiesto. Usualmente un dump de más de 7 días. |

---

## Notas

- Usa esto para **trabajo con todo el dataset**; usa **List farms** para datos en vivo, y **Get a Farm** para cuentas individuales. El dump puede estar **hasta 24h stale**.
- Los dumps son **grandes**: ~2 GB gzip para all y ~780 MB para active, varias veces eso descomprimidos. **Stream y descomprime línea por línea** — nunca bufferees un archivo completo.
- La exportación corre a las **~22:00 UTC**. Lee `modifiedAt` del manifiesto para ver cuándo aterrizó el archivo más nuevo.
- Los archivos se **borran 7 días** después de escritos. Archiva lo que necesites mantener.
- El manifiesto está throttleado como cualquier otra ruta community; las **descargas de archivos no**. Busca el manifiesto una vez por ejecución, no una vez por archivo.
