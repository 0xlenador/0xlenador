# 🌻 GET — Marketplace Profile

**`GET /community/data?type=marketplaceProfile`**

Historial de trading, trades abiertos y socios de trading de una granja.

---

## Descripción

Retorna el **perfil de marketplace** de una sola granja:

### Datos del perfil:
- `id`, `username`, `level`, `ascension`, `tokenUri`
- `totalTrades` — trades lifetime
- `profit` — FLOWER total lifetime
- `weeklyFlowerSpent` / `weeklyFlowerEarned` — rolling 7 días

### Trades recientes (`trades`):
- Últimos **50 trades** fulfilled, más recientes primero
- Ambos lados del book
- Cada uno con: item, quantity, FLOWER pagado, timestamp, y ambas contrapartes
- `source`: `listing` (compra de listing) o `offer` (oferta aceptada)

### Trades abiertos:
- `listings` — listings abiertos actuales (keyed por trade id)
- `offers` — ofertas abiertas actuales (keyed por trade id)
- `tradeType`: `instant` (off-chain) o `onchain` (Polygon)

### Amigos (`friends`):
- Top 5 granjas con las que más ha tradeado (lifetime trade count)

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `farmId` | query | integer | **Sí** | La granja a perfilar. Cualquier granja — no restringido a la de tu API key. |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "id": 24601,
    "username": "gordy",
    "level": 74,
    "ascension": 1,
    "tokenUri": "v2_1_4_20_209_208_16_18",
    "totalTrades": 1842,
    "profit": 15204.6,
    "weeklyFlowerSpent": 412.85,
    "weeklyFlowerEarned": 638.2,
    "listings": {
      "66f2c1a4d4b2a10012a3f902": {
        "items": { "Sunflower": 500 },
        "sfl": 5,
        "tax": 0.5,
        "teamTax": 0.25,
        "collection": "collectibles",
        "createdAt": 1756101000,
        "tradeType": "instant"
      }
    },
    "offers": {
      "66f2c1a4d4b2a10012a3f901": {
        "items": { "Immortal Pear": 1 },
        "sfl": 264,
        "collection": "collectibles",
        "createdAt": 1756100000,
        "tradeType": "instant"
      }
    },
    "friends": [
      {
        "id": 98211,
        "username": "farmer_pete",
        "tokenUri": "v2_3_7_15_204_207_16",
        "trades": 61
      }
    ],
    "trades": [
      {
        "id": "66f2c1a4d4b2a10012a3f903",
        "sfl": 264,
        "quantity": 1,
        "itemId": 415,
        "collection": "collectibles",
        "source": "listing",
        "fulfilledAt": 1756102000,
        "initiatedBy": {
          "id": 24601,
          "username": "gordy",
          "bumpkinUri": "v2_1_4_20_209_208_16_18"
        },
        "fulfilledBy": {
          "id": 98211,
          "username": "farmer_pete",
          "bumpkinUri": "v2_3_7_15_204_207_16"
        }
      }
    ]
  }
}
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `farmId` faltante, no entero, o no mayor a zero. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **404** | No such farm | No existe granja con ese id. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- `sfl` en un trade es el **FLOWER pagado por todo el trade**, no por item — divide por `quantity` para precio unitario.
- `trades` está capeado a los **50 más recientes** y no es paginable. Para seguir una granja en el tiempo, haz polling y de-duplica por trade id.
- `level` es el nivel dentro de la **banda de ascensión actual** — solo tiene sentido leído junto con `ascension`.
- `tokenUri` codifica el Bumpkin equipado como wearable ids separados por underscore.
- `username` hace fallback a `#farmId` para granjas sin nombre configurado.
