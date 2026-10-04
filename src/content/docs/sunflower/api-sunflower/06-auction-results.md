# 🌻 GET — Auction Results

**`GET /community/data?type=auctionResults`**

Leaderboard y conteo de participantes para una subasta.

---

## Descripción

Retorna el resultado de una sola subasta: su `status`, cuántas granjas pujaron, el `supply` del drop, su `endAt`, y el **leaderboard de bids** rankeados de mejor a peor.

### Estados:
- **`pending`** — La subasta está abierta (o en buffer corto post-cierre). Leaderboard vacío, sin `participantCount`.
- **`complete`** — Ganadores seleccionados, leaderboard lleno.

### Estructura de cada fila del leaderboard:
- `rank` — Posición
- `farmId` — ID de la granja
- `username` — (omitido si no han configurado uno)
- `tickets` — Tickets apostados
- `experience` — XP (para desempates)
- `sfl` + `items` — Costo del bid

Los top `supply` ranks son los ganadores.

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `auctionId` | query | string | **Sí** | El id de la subasta, exactamente como lo retorna List Auctions. |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "status": "complete",
    "participantCount": 214,
    "supply": 5,
    "endAt": 1723021200000,
    "leaderboard": [
      {
        "rank": 1,
        "farmId": 121500,
        "username": "gordy",
        "tickets": 850,
        "experience": 1250340,
        "sfl": 1,
        "items": { "Gold": 5 }
      },
      {
        "rank": 2,
        "farmId": 98211,
        "tickets": 850,
        "experience": 940120,
        "sfl": 1,
        "items": { "Gold": 5 }
      }
    ]
  }
}
```

> [!NOTE]
> Mientras la subasta está abierta, la misma forma vuelve con `status: "pending"`, leaderboard vacío y sin `participantCount`.

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `auctionId` faltante o query string inválido. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **404** | Auction not found | No coincide con ningún `auctionId` — también para drops de prueba internos. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- Los resultados son **agnósticos del jugador**: nunca reporta si una granja en particular ganó, solo el leaderboard público.
- Se recomienda **cachear** en vez de hacer polling — los resultados se consolidan poco después del cierre.
- Los empates en tickets se desempatan por **experiencia**, así que una fila completa del leaderboard es necesaria para explicar un rank.
