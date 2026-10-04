# 🌻 GET — Ticket Leaderboard

**`GET /community/data?type=ticketLeaderboard`**

Rankings de tickets del capítulo actual, más la posición de una granja.

---

## Descripción

Retorna el **leaderboard de tickets** del capítulo:

### Datos principales:
- **`topTen`** — las granjas mejor rankeadas (a pesar del nombre, soporta hasta 500 vía `limit`)
- **`total`** — número de tickets crafteados en todo el juego este capítulo
- **`lastUpdated`** — epoch unix en ms de cuando se reconstruyó el board

### Posición de la granja (`farmRankingDetails`):
| Caso | Comportamiento |
|------|---------------|
| Ya está en el top | Se omite |
| No ha crafteado tickets | `null` |
| Fuera del top | Slice de 3 filas: rank arriba, la granja, rank abajo |

### Cada fila lleva:
`rank`, `id` (username o id numérico), `count` (tickets), `accountId`, `farmId`, `nftId`, `experience`, `ascensionLevel`, partes equipadas del Bumpkin.

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `farmId` | query | integer | **Sí** | La granja para la cual reportar posición. El board es el mismo para todos. |
| `limit` | query | integer | No | Cuántas granjas rankeadas retornar en `topTen` (1–500, default 50). |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "topTen": [
      {
        "rank": 1,
        "id": "gordy",
        "count": 8420,
        "accountId": 121500,
        "farmId": 121500,
        "nftId": 29411,
        "experience": 1250340,
        "ascensionLevel": 2,
        "bumpkin": {
          "hair": "Basic Hair",
          "shirt": "Red Farmer Shirt"
        }
      }
    ],
    "farmRankingDetails": [
      { "rank": 61, "id": "#98210", "count": 1204, "accountId": 98210 },
      { "rank": 62, "id": "sunny", "count": 1198, "accountId": 62559 },
      { "rank": 63, "id": "pip", "count": 1180, "accountId": 98212 }
    ],
    "lastUpdated": 1756100400,
    "total": 41288390
  }
}
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `farmId` faltante/no positivo, o `limit` fuera de 1–500. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **404** | No leaderboard | Granja no existe, o no se ha generado board para el capítulo actual. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- `topTen` **respeta `limit`** a pesar de su nombre — pide hasta 500 filas.
- El board se reconstruye en **schedule**, no por request. Lee `lastUpdated` para ver qué tan fresco está.
- Los tickets se **resetean cada capítulo**, así que solo describe el capítulo en progreso. No hay endpoint para boards de capítulos pasados.
- Una granja fuera del board retorna **200** — chequea `farmRankingDetails` en vez del status code.
