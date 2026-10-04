# 🌻 POST — Get Farms by ID (Legacy)

**`POST /community/getFarms`**

> [!WARNING]
> **Deprecated** — Mantenido para integraciones construidas antes de que existiera la paginación. El código nuevo debería usar **List farms** para slices y el **Nightly Farm Dump** para todo el dataset.

Búsqueda batch deprecada: hasta 100 farm ids en un solo POST.

---

## Descripción

Toma un array de farm ids en el body del request y retorna esas granjas en una sola respuesta. Es el **único endpoint** que busca un set arbitrario de ids en una sola llamada.

### Diferencias de forma respecto a List farms:
- `farms` es un **objeto keyed por farm id** (no un array)
- Cada valor es el **objeto farm directamente** (no un wrapper `{ id, farm }`)
- Cualquier id faltante se lista en `skipped`

> [!NOTE]
> Si envías sin ids, el endpoint se comporta exactamente como **List farms**, respetando los mismos parámetros `limit` y `cursor`.

---

## Body del Request

```json
{
  "ids": [121500, 121501]
}
```

Farm ids a buscar: 1–100. Omite el body para obtener el comportamiento paginado.

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `limit` | query | integer | No | Solo se usa cuando el body no tiene ids (1–1000, default 100). |
| `cursor` | query | string | No | Solo se usa cuando el body no tiene ids. Cursor opaco del `next_cursor` anterior. |

---

## Ejemplo de Respuesta — 200

```json
{
  "farms": {
    "121500": {
      "...": "objeto farm completo",
      "isBlacklisted": false,
      "updatedAt": "2026-08-27T21:14:03.221Z"
    },
    "121501": { "...": "otro objeto farm" }
  },
  "skipped": [999999999],
  "warning": "This endpoint is deprecated. Please use pagination"
}
```

---

## Ejemplo Avanzado: Fetch y Retry de Skipped

```javascript
async function fetchFarms(ids) {
  const response = await fetch("https://api.sunflower-land.com/community/getFarms", {
    method: "POST",
    headers: {
      "x-api-key": "sfl.YOUR.KEY",
      "content-type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { farms, skipped = [] } = await response.json();

  // Un id y todavía skipped = no existe — nada que reintentar.
  if (skipped.length && ids.length > 1) {
    const half = Math.ceil(skipped.length / 2);
    for (const batch of [skipped.slice(0, half), skipped.slice(half)]) {
      if (batch.length) Object.assign(farms, await fetchFarms(batch));
    }
  }

  return farms;
}
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **401** | Missing or invalid API key | Clave ausente, inválida, o granja sin VIP/nivel 50. |
| **429** | Too many requests | Throttle compartido con List farms: ~1 req/5s. |
| **500** | Malformed body | El body debe ser un JSON con `ids` como array de 1–100 números. |

---

## Notas

- `skipped` puede significar: la granja no existe **o** la respuesta alcanzó su **cap de 5.5MB** y esa granja fue descartada.
- El cap de 5.5MB puede alcanzarse mucho antes de 100 ids cuando las granjas son grandes.
- Cada respuesta exitosa con ids lleva un campo `warning` informando que el endpoint está deprecado.
