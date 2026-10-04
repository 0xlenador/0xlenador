# 🌻 GET — List Raffles

**`GET /community/data?type=raffles`**

Cada raffle — su ventana, tabla de premios y costos de entrada.

---

## Descripción

Retorna **cada raffle** que el juego ha ejecutado o tiene programado, como un array.

### Cada entrada incluye:
- `id` — identificador único del raffle
- `startAt` / `endAt` — epoch unix en milisegundos
- `prizes` — tabla completa de premios (keyed por posición de finalización)
- `entryRequirements` — items que compran entradas y cuántas entradas vale cada uno

### Estructura de premios:
| Tipo | Campo | Descripción |
|------|-------|-------------|
| `collectible` | `items` | Items del juego |
| `wearable` | `wearables` | Wearables del juego |
| `Pet` / `Bud` | `nft` | NFT |

- `onChain: true` marca premios minteados al wallet del ganador (no in-game)

### Sistema de entradas:
Un item worth 10 entradas convierte 3 de ese item en **30 entradas**. Más entradas = proporcionalmente mejor chance.

---

## Parámetros

Ninguno.

---

## Ejemplo de Respuesta — 200

```json
{
  "data": [
    {
      "id": "crabs-raffle-2026-02-02",
      "startAt": 1769990400000,
      "endAt": 1770595200000,
      "prizes": {
        "1": {
          "type": "wearable",
          "wearables": { "Crimstone Spikes Hair": 1 },
          "onChain": true
        },
        "2": {
          "type": "Pet",
          "nft": "Pet #2501",
          "onChain": true
        },
        "3": {
          "type": "collectible",
          "items": { "Gem": 2000 }
        }
      },
      "entryRequirements": {
        "Floater": 10,
        "Crabs and Traps Raffle Ticket": 1
      }
    }
  ]
}
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- Lista **gestionada**, no feed en vivo — los raffles se agregan y ocasionalmente enmiendan. Cachea y refresca periódicamente.
- Las tablas de premios son **largas**: la mayoría de raffles paga 100 posiciones.
- Un raffle está **abierto entre `startAt` y `endAt`**. Los resultados se sortean unos minutos después de `endAt`.
- Alimenta un `id` en **Raffle Results** para ver quién ganó.
