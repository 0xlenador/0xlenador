# 🌻 GET — Marketplace Activity

**`GET /community/data?type=marketplaceActivity`**

Reporte diario de trading del marketplace: totales y estadísticas por item.

---

## Descripción

Retorna el reporte de trading del marketplace para un día: **volumen total** y **conteo de trades**, más estadísticas por item:

### Stats de trading por item:
- `low` / `high` / `latestSale` — precio unitario
- `volume` — volumen traded
- `trades` — número de trades
- `quantity` — cantidad movida

### Snapshot de mercado por item:
- `floor` — listing activo más barato
- `listingCount` — listings activos
- `offerCount` — ofertas activas
- `bestOffer` — oferta activa más alta

Todos los precios y volúmenes están denominados en **FLOWER**. `flowerPrice` da el precio actual en USD de FLOWER para conversión.

### Claves de items:
- Formato: `{colección}-{itemId}` (ej. `collectibles-601`)
- Economías comunitarias: `economies-{slug}-{itemId}`

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `date` | query | string | No | Día a consultar como `YYYY-MM-DD` (UTC). Omitir para el reporte más reciente (en actualización). |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "flowerPrice": 0.13458,
    "reports": {
      "2026-08-31": {
        "totals": {
          "volume": 756287614.9,
          "trades": 15314834
        },
        "items": {
          "collectibles-601": {
            "low": 0.0000017,
            "high": 150,
            "volume": 35419625.4,
            "trades": 1078763,
            "quantity": 172625521,
            "latestSale": 0.00985,
            "floor": 0.0098,
            "listingCount": 52,
            "offerCount": 34,
            "bestOffer": 0.0095
          },
          "collectibles-415": {
            "low": 1,
            "high": 600,
            "volume": 395716,
            "trades": 1105,
            "quantity": 1105,
            "latestSale": 264,
            "floor": 259,
            "listingCount": 3,
            "offerCount": 1,
            "bestOffer": 255
          },
          "pets-2513": {
            "volume": 0,
            "trades": 0,
            "quantity": 0,
            "floor": 45,
            "listingCount": 2,
            "offerCount": 0
          }
        }
      }
    }
  }
}
```

> [!NOTE]
> `pets-2513` muestra un item listado que nunca se ha vendido: stats de trading en cero, solo snapshot de mercado.

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `date` no es un string `YYYY-MM-DD` válido. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- **Precios unitarios**: son por item individual — un trade de stack de 500 Sunflowers por 5 FLOWER registra un precio de 0.01.
- El **snapshot se refresca** con el reporte, ~1 vez por minuto — bien para dashboards, pero al actuar sobre un precio, confírmalo con **Marketplace Item**.
- Los **días pasados nunca cambian** — cachéalos; solo el reporte más reciente sigue moviéndose.
- Los reportes escritos antes de septiembre 2026 solo llevan stats de trading, sin campos floor/listing/offer.
