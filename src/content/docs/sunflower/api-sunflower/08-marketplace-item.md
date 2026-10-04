# 🌻 GET — Marketplace Item (Tradeable)

**`GET /community/data?type=tradeable`**

Precio floor, supply, trades abiertos e historial de ventas para un item.

---

## Descripción

Retorna la página del marketplace para un solo tradeable:

- **`floor`** — precio floor actual
- **`lastSalePrice`** — último precio de venta
- **`supply`** — supply en circulación
- **`isActive`** — si puede tradearse actualmente
- **`offers`** y **`listings`** — los 50 mejores trades abiertos en cada lado
- **`offerCount`** / **`listingCount`** — totales
- **`history`** — últimos 7 días de stats diarios, 10 ventas más recientes, totalSales y totalVolume

### Colecciones:
| Colección | Clave de ID |
|-----------|------------|
| `collectibles` | ID del item del juego |
| `wearables` | ID del item del juego |
| `buds` | NFT id |
| `pets` | NFT id |

### Tipos de trade:
- `instant` — trades off-chain
- `onchain` — trades resueltos en Polygon

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `collection` | query | string | **Sí** | Colección del marketplace: `collectibles`, `wearables`, `buds` o `pets`. |
| `id` | query | integer | **Sí** | El item id dentro de esa colección (para buds y pets, el NFT id). |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "id": 601,
    "collection": "collectibles",
    "floor": 0.0098,
    "lastSalePrice": 0.0102,
    "supply": 172625521,
    "isActive": true,
    "isVip": false,
    "offerCount": 34,
    "listingCount": 52,
    "offers": [
      {
        "tradeId": "66f2c1a4d4b2a10012a3f901",
        "sfl": 0.0095,
        "quantity": 1000,
        "offeredById": 121500,
        "offeredAt": 1756100000,
        "type": "instant"
      }
    ],
    "listings": [
      {
        "id": "66f2c1a4d4b2a10012a3f902",
        "sfl": 0.0098,
        "quantity": 500,
        "listedById": 98211,
        "listedAt": 1756101000,
        "type": "instant"
      }
    ],
    "history": {
      "sales": [
        {
          "id": "66f2c1a4d4b2a10012a3f903",
          "sfl": 0.0102,
          "quantity": 250,
          "itemId": 601,
          "collection": "collectibles",
          "fulfilledAt": 1756102000,
          "fulfilledBy": { "id": 98211, "username": "gordy" },
          "initiatedBy": { "id": 121500 },
          "source": "listing"
        }
      ],
      "history": {
        "totalSales": 1078763,
        "totalVolume": 35419625.4,
        "lastSale": { "sfl": 0.0102, "soldAt": 1756102000 },
        "dates": {
          "2026-08-26": {
            "date": "2026-08-26",
            "low": 0.0091,
            "high": 0.0121,
            "volume": 1842.31,
            "sales": 640
          }
        }
      }
    }
  }
}
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `collection` o `id` faltantes, colección no válida, o id no entero. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **404** | Item not tradeable | No existe ese id en esa colección, o nunca ha sido liberado para trading. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- Cada precio es en **FLOWER** y es el **precio de un solo item** — un listing de 500 Sunflowers por 5 FLOWER tiene `sfl: 5` y `quantity: 500`.
- Esta es la **vista pública** de un item: nunca reporta lo que posee una granja particular.
- `supply` es cuántos existen en el juego. Es 1 para buds y pets, y **ausente** para recursos tradeables (sin supply fijo).
- `isVip` marca items cuyos trades están restringidos a jugadores VIP.
- `isActive: false` para items que existen pero no pueden tradearse aún.
