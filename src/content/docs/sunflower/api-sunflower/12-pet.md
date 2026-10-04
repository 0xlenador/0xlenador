# 🌻 GET — Pet

**`GET /community/data?type=pets`**

Traits, nivel, tabla de fetch y schedule de waves de un NFT pet.

---

## Descripción

Retorna un solo **NFT pet** por id: traits, nivel, fecha de reveal, y la configuración que un builder necesitaría:

### Datos principales:
- `id`, `name`, `image`
- `revealed` — si ya se ha revelado
- `revealAt`, `tradeableAt`, `withdrawableAt` — epoch ms
- `traits` — type, fur, accessory, bib, aura
- `categories` — primary, secondary, tertiary
- `fetches` — tabla completa de recursos que puede fetch y nivel de desbloqueo
- `energyMultiplier` — boost de aura sobre energía

### Sistema de niveles:
- `experience` — XP lifetime
- `level` — nivel actual, `currentProgress`, `nextLevelXP`, `experienceBetweenLevels`, `percentage`
- **Fórmula**: Level n empieza en `50 × (n−1) × n` XP
  - Level 2 = 100 XP, Level 5 = 1000 XP, Level 10 = 4500 XP

### Pets no revelados:
Cuando `revealed: false`, los campos `traits`, `categories`, `fetches` y `energyMultiplier` son **null** y solo `revealAt` es conocido.

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `id` | query | integer | **Sí** | El NFT id del pet, 1–3000 — el número en "Pet #123". |

---

## Ejemplo de Respuesta — 200

```json
{
  "data": {
    "id": 1,
    "name": "Pet #1",
    "image": "https://pets.sunflower-land.com/opensea/1.webp",
    "revealed": true,
    "revealAt": 1762905600000,
    "tradeableAt": 1762732800000,
    "withdrawableAt": 1762905600000,
    "traits": {
      "type": "Griffin",
      "fur": "Grey",
      "accessory": "Blue Bow",
      "bib": "Collar",
      "aura": "No Aura"
    },
    "categories": {
      "primary": "Voyager",
      "secondary": "Forager",
      "tertiary": "Beast"
    },
    "fetches": [
      { "name": "Acorn", "level": 1 },
      { "name": "Ruffroot", "level": 3 },
      { "name": "Dewberry", "level": 7 },
      { "name": "Moonfur", "level": 12 },
      { "name": "Fossil Shell", "level": 20 },
      { "name": "Wild Grass", "level": 25 }
    ],
    "energyMultiplier": 1,
    "experience": 2140,
    "level": {
      "level": 7,
      "currentProgress": 40,
      "nextLevelXP": 2800,
      "percentage": 5.714285714285714,
      "experienceBetweenLevels": 700
    }
  }
}
```

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **400** | Invalid request | `id` faltante o no entero de 1 a 3000. |
| **401** | Missing or invalid API key | Clave ausente o inválida. |
| **404** | No such pet | Ninguna wave ha asignado ese id aún (2001–2500 no asignados al momento de escribir). |
| **429** | Too many requests | Throttle por IP: ~1 req/5s. |

---

## Notas

- `experience` viene de un **snapshot refrescado ~cada 15 minutos**, así que un pet alimentado hace un momento puede mostrar su XP anterior.
- Este es el **pet como NFT**, no como está en una granja: energía, contadores de fetch, qué le han dado de comer y dónde está colocado **no se publican**.
- Para precios, trades abiertos e historial de ventas usa **Marketplace Item** con `collection=pets` y el mismo id.
- `fetches` es la **tabla completa de desbloqueo** para el tipo del pet, no lo que ha desbloqueado — compara cada `level` de la fila con `level.level`.
- IDs reservados (**2501–3000**) son pets apartados para giveaways y recompensas de capítulo. Se resuelven como cualquier otro pet.
