# 🌻 Referencia: Farm Object y Constantes Clave

Datos de referencia complementarios extraídos de la documentación de la Community API.

---

## Constantes de la API

| Constante | Valor |
|-----------|-------|
| **API Base URL (Mainnet)** | `https://api.sunflower-land.com` |
| **API Base URL (Testnet)** | `https://api-dev.sunflower-land.com` |
| **CDN de Dumps (sin key)** | `https://community.sunflower-land.com` |
| **Imágenes de Pets** | `https://pets.sunflower-land.com/opensea/{id}.webp` |
| **Entorno mostrado** | `mainnet` |

---

## Formato de API Key

Las claves tienen el formato:

```
sfl.{base64url_payload}.{base64url_signature}
```

Regex de validación: `/^sfl\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/`

El payload es un JWT que contiene el `farmId` del propietario.

---

## Estructura del Farm Object

Este es el ejemplo de farm object que la documentación usa en todas las respuestas. Un farm real contiene **muchos más campos**, pero esta es la estructura conocida:

```json
{
  "balance": "1250.421",
  "coins": 128350,
  "inventory": {
    "Basic Land": "9",
    "Sunflower Seed": "204",
    "Sunflower": "120",
    "Wood": "56.5",
    "Stone": "23",
    "Axe": "3",
    "Water Well": "1"
  },
  "wardrobe": {
    "Basic Hair": 1,
    "Red Farmer Shirt": 1,
    "Farmer Overalls": 1
  },
  "bumpkin": {
    "id": 5321,
    "experience": 105300,
    "equipped": {
      "hair": "Basic Hair",
      "shirt": "Red Farmer Shirt",
      "pants": "Farmer Overalls",
      "background": "Farm Background",
      "body": "Beige Farmer Potion",
      "shoes": "Black Farmer Boots",
      "tool": "Farmer Pitchfork"
    }
  },
  "crops": {
    "1": {
      "createdAt": 1755990000,
      "x": -2,
      "y": 0,
      "crop": {
        "name": "Sunflower",
        "plantedAt": 1756100000
      }
    }
  },
  "trees": {
    "1": {
      "wood": {
        "amount": 1,
        "choppedAt": 1756090000
      },
      "x": -3,
      "y": 3
    }
  },
  "buildings": {
    "Fire Pit": [
      {
        "id": "123",
        "coordinates": { "x": 4, "y": 8 },
        "readyAt": 0,
        "createdAt": 0
      }
    ]
  }
}
```

> [!NOTE]
> - `balance` es un string (SFL/FLOWER del wallet del jugador)
> - `coins` es un entero (monedas in-game)
> - Los valores de `inventory` son strings que representan cantidades decimales
> - `wardrobe` tiene cantidades enteras
> - El farm object real contiene campos adicionales como: `island`, `conversations`, `fishing`, `collectibles`, `delivery`, `expansions`, etc.

---

## One-liner curl para el Nightly Dump

```bash
# Obtener el dump más reciente, streamearlo y filtrarlo con jq
curl -s -H "x-api-key: $SFL_API_KEY" \
  "https://api.sunflower-land.com/community/data?type=nightlyDump" |
  jq -r '.data | [.[] | select(.filename | endswith("active.jsonl.gz"))] | sort_by(.modifiedAt) | last | .filename' |
  xargs -I{} curl -s https://community.sunflower-land.com/{} |
  gzip -dc |
  jq -c 'select(.farm.island.type == "spring") | {id, level: .farm.bumpkin.experience}'
```

> [!TIP]
> Este ejemplo filtra granjas tipo isla "spring" y extrae solo `id` y `experience`. `jq -c` también hace streaming, así que funciona con el archivo completo.

---

## Flujo de Obtención de API Key (Detalle técnico)

1. El sandbox detecta la sesión del juego en el navegador (localStorage de Sunflower Land)
2. Extrae el `access_token` del JWT de sesión
3. Llama a `GET /data?type=communityApiKey` con `Authorization: Bearer {token}`
4. La API valida VIP + nivel 50 y retorna `{ data: { apiKey, farmId } }`
5. La clave se almacena solo en `sessionStorage` del tab actual

### Rotación de clave:
- Se llama a `POST /event/{farmId}` con `{ event: { type: "apiToken.rotated" } }`
- La API retorna una nueva clave y la anterior se invalida inmediatamente

### Errores posibles de la key:
| Código | Significado |
|--------|-------------|
| `NOT_ELIGIBLE` | No tiene VIP o nivel 50+ |
| `EF-002` | Reloj del dispositivo demasiado desfasado |
| `401`/`403` | Sesión expirada |
