# 🌻 GET — Get a Farm

**`GET /community/farms/{id}`**

Fetch de una granja individual por farm/NFT id o dirección de wallet vinculada.

---

## Descripción

Retorna una sola granja: su **account id**, **NFT id** (cuando vinculado), el **objeto farm completo**, si la cuenta está **blacklisted**, y `updatedAt` — el timestamp del último guardado real.

### Flexibilidad del parámetro `id`:
| Formato | Resolución |
|---------|-----------|
| Número ≤ 1,000,000,000 | NFT id |
| Número mayor | Account id |
| `0x…` | Dirección de wallet vinculada |

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `id` | path | string | **Sí** | Farm NFT id, account id, o dirección de wallet (0x…). |

---

## Ejemplo de Request

### curl
```bash
curl 'https://api.sunflower-land.com/community/farms/29411' \
  -H 'x-api-key: sfl.YOUR.KEY'
```

### JavaScript
```javascript
const response = await fetch(
  "https://api.sunflower-land.com/community/farms/29411",
  {
    headers: { "x-api-key": "sfl.YOUR.KEY" },
  },
);

if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

---

## Ejemplo de Respuesta — 200

```json
{
  "farm": { "...": "objeto farm completo" },
  "id": 121500,
  "nft_id": 29411,
  "nftId": 29411,
  "isBlacklisted": false,
  "updatedAt": "2026-08-25T03:12:44.000Z"
}
```

> [!NOTE]
> `nftId` duplica `nft_id` para clientes legacy.

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **401** | Missing or invalid API key | Clave ausente, inválida, o granja sin VIP/nivel 50. |
| **404** | Farm not found | Ninguna granja coincide con el id — también para ids que no son numéricos ni wallet válida. Body vacío. |
| **429** | Too many requests | Throttle por IP: ~1 req/5s, duplica a 10s. |

---

## Notas

- **Polling barato con `updatedAt`**: almacénalo y salta el procesamiento cuando no ha cambiado — solo cambia en un guardado real.
- Una dirección de wallet resuelve a la **primera granja vinculada** a ella.
