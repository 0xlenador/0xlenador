# 🌻 GET — List Auctions

**`GET /community/data?type=auctions`**

Cada drop del Auctioneer — schedule, costo y supply.

---

## Descripción

Retorna **cada subasta** que el Auctioneer ha ejecutado o ejecutará — pasadas, en vivo y futuras — más `totalSupply`, el max supply de por vida de cada item subastable.

### Estructura de cada auction:
- `auctionId` — identificador único
- `startAt` / `endAt` — epoch en milisegundos
- `supply` — cuántas copias mintea este drop
- `sfl` + `ingredients` — costo del bid
- `chapterLimit` — capítulo máximo
- `type` — `collectible`, `wearable`, o `nft`
- Campo correspondiente al tipo (`collectible`, `wearable`, o `nft` con `startId`)

Las subastas están ordenadas por `startAt`, de más antigua a más reciente. Los drops de prueba internos se filtran.

---

## Parámetros

Ninguno.

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "auctions": [
      {
        "auctionId": "coin-aura-2024-08-07-drop-1",
        "type": "wearable",
        "wearable": "Coin Aura",
        "startAt": 1723017600000,
        "endAt": 1723021200000,
        "supply": 1,
        "sfl": 1,
        "ingredients": {},
        "chapterLimit": 1
      },
      {
        "auctionId": "pet-2025-10-08-drop-1",
        "type": "nft",
        "nft": "Pet",
        "startId": 2,
        "startAt": 1759895880000,
        "endAt": 1759899480000,
        "supply": 10,
        "sfl": 1,
        "ingredients": { "Gold": 5 },
        "chapterLimit": 7
      }
    ],
    "totalSupply": {
      "Coin Aura": 100,
      "Rocket Onesie": 250
    }
  }
}
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | Query string inválido — tipo desconocido o parámetros extra. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- Es una **lista gestionada**, no un feed en vivo — las entradas se agregan cuando se programan drops. No hay necesidad de hacer polling: cachea y refresca ocasionalmente.
- Un `supply` de **100000000000** significa que el drop es efectivamente ilimitado.
- Alimenta un `auctionId` en **Auction Results** para ver cómo fue ese drop.
