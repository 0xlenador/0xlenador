# 🌻 GET — Stats Leaderboards

**`GET /community/data?type=statsLeaderboard`**

Top 100 granjas por coins, XP, crops, chores, deliveries y streaks.

---

## Descripción

Retorna los **leaderboards de stats** del juego: **9 boards de top 100** rankeados sobre cada granja que ha jugado en los últimos 30 días.

### Los 9 boards disponibles:

| Board | Qué mide |
|-------|----------|
| `coins` | Coins que la granja posee ahora |
| `experience` | XP actual |
| `sunflowers` | Sunflowers en inventario |
| `kale` | Kale en inventario |
| `chores` | Contador lifetime |
| `deliveries` | Contador lifetime |
| `dailyLoginStreak` | Racha viva (0 si lapsed) |
| `diggingStreak` | Racha viva (0 si lapsed) |
| `newPlayerExperience` | XP restringido a granjas de últimos 30 días |

### Cada fila de jugador:
`rank`, `farmId`, `username`, wearables del Bumpkin, `level`, `ascension`, `count` (score)

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `board` | query | string | No | Un board específico en vez de todos. |
| `date` | query | string | No | Día del reporte UTC como `YYYY-MM-DD`. Debe ser antes de hoy. Default: ayer. |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "reportDate": "2026-09-13",
    "lastUpdated": 1757808000,
    "activeSince": 1755129600,
    "scanned": 48210,
    "boards": {
      "coins": {
        "name": "coins",
        "title": "Most Coins",
        "description": "Coins currently held",
        "players": [
          {
            "rank": 1,
            "farmId": 121500,
            "username": "gordy",
            "bumpkin": {
              "hair": "Basic Hair",
              "shirt": "Red Farmer Shirt"
            },
            "level": 60,
            "ascension": 1,
            "count": 48210330
          }
        ]
      },
      "experience": { "...": "misma forma" },
      "sunflowers": { "...": "..." },
      "kale": { "...": "..." }
    }
  }
}
```

> [!NOTE]
> Con `board` configurado, el mapa `boards` se reemplaza por ese board individual con `name`, `title`, `description` y `players` al top level.

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `board` no es uno de los 9 nombres, o `date` no es un día calendario UTC antes de hoy. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **404** | No boards for that day | El walk nunca publicó boards para esa fecha — precede la feature o no completó. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- Solo existen los **top 100** de cada board. No hay forma de buscar el rank de una granja fuera de él.
- Los ranks son un **snapshot del día del reporte**. El perfil del jugador se une la primera vez que se solicita un día y se cachea.
- Un día solo se sirve **después de que su walk ha terminado**, y hoy se rechaza con 400. Consulta ayer (default) para los boards más frescos.
- `level` es el nivel dentro de la **banda de ascensión actual**.
- Los empates se desempatan por **farm id** (menor primero), así que el orden es estable.
