# 🌻 GET — Raffle Results

**`GET /community/data?type=raffleResults`**

Ganadores, conteo de entradas y participantes para un raffle.

---

## Descripción

Retorna el resultado de un solo raffle:

### Datos principales:
- `status` — `pending` o `complete`
- `raffleId` — ID del raffle
- `endAt` — epoch ms
- `participants` — granjas que participaron
- `entries` — entradas totales compradas
- `winners` — en orden de premio

### Estados:
- **`pending`** — El sorteo aún no se ha ejecutado (unos minutos después de `endAt`). Array `winners` vacío y conteos en cero.
- **`complete`** — Ganadores listados en orden de premio.

### Cada ganador incluye:
- `farmId` — ID de la granja
- `position` — (1 = top premio)
- `entries` — entradas que tenían
- `ticketsUsed` — duplica `entries` (legacy)
- `onChain` — si el premio se mintea
- Premio: bajo campo correspondiente (`items`, `wearables`, `nft`)
- `profile` — username, level, ascension, equipped bumpkin

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `id` | query | string | **Sí** | El id del raffle, exactamente como lo retorna List Raffles. |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "status": "complete",
    "raffleId": "crabs-raffle-2026-02-02",
    "endAt": 1770595200000,
    "participants": 3184,
    "entries": 91240,
    "winners": [
      {
        "farmId": 121500,
        "position": 1,
        "entries": 320,
        "ticketsUsed": 320,
        "onChain": true,
        "type": "wearable",
        "wearables": { "Crimstone Spikes Hair": 1 },
        "profile": {
          "username": "gordy",
          "level": 84,
          "ascension": 2,
          "equipped": {
            "hair": "Basic Hair",
            "shirt": "Red Farmer Shirt"
          }
        }
      }
    ]
  }
}
```

> [!NOTE]
> Antes del sorteo, la misma forma vuelve con `status: "pending"`, array `winners` vacío y `participants`/`entries` en cero.

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `id` faltante o query string inválido. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **404** | Raffle not found | No coincide con ningún id. Chequea contra List Raffles. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- Los sorteos son **determinísticos y ponderados por entradas** — una granja con 30 entradas es 30 veces más probable de ser sorteada que una con 1, y ninguna granja puede ganar dos veces en el mismo raffle.
- Se recomienda **cachear** en vez de hacer polling: una vez que un raffle está complete su snapshot se sirve as-is.
- El primer request después del cierre de un raffle **puede ejecutar el sorteo**, así que puede ser más lento.
- `ticketsUsed` duplica `entries` y se mantiene para clientes antiguos.
