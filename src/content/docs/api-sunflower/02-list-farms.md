# 🌻 GET — List Farms

**`GET /community/farms`**

Pagina a través de cada granja del juego, basado en cursor.

---

## Descripción

Retorna granjas en páginas, ordenadas por id interno. Cada elemento lleva el **account id** de la granja, su **NFT id** (cuando tiene uno vinculado) y el **objeto farm completo** — el mismo game state que un jugador ve al visitar.

Recorre todo el set pasando el `next_cursor` de la respuesta anterior como parámetro `cursor`. La última página no tiene `next_cursor`.

> [!IMPORTANT]
> Si buscas todo el dataset en vez de un slice, **no pagines este endpoint** — descarga el **Nightly Farm Dump**. Es un archivo gzip con cada granja y te da un snapshot consistente.

---

## Parámetros

| Nombre | En | Tipo | Requerido | Descripción |
|--------|-----|------|-----------|-------------|
| `limit` | query | integer | No | Máximo de granjas por página (1–1000, default 100). Los objetos de granja son grandes — si tienes errores de transferencia o 429s, redúcelo. ~500 es un techo práctico. |
| `cursor` | query | string | No | Cursor de paginación opaco del campo `next_cursor` de la respuesta anterior. Omitir para la primera página. |

---

## Ejemplo de Request

### curl
```bash
curl 'https://api.sunflower-land.com/community/farms?limit=10' \
  -H 'x-api-key: sfl.YOUR.KEY'
```

### JavaScript
```javascript
const response = await fetch(
  "https://api.sunflower-land.com/community/farms?limit=10",
  {
    headers: { "x-api-key": "sfl.YOUR.KEY" },
  },
);

if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

### Python
```python
import requests

response = requests.get(
    "https://api.sunflower-land.com/community/farms?limit=10",
    headers={"x-api-key": "sfl.YOUR.KEY"},
)
response.raise_for_status()
data = response.json()
```

---

## Ejemplo de Respuesta — 200

```json
{
  "farms": [
    {
      "id": 121500,
      "nft_id": 29411,
      "farm": { "...": "objeto farm completo" }
    },
    {
      "id": 121501,
      "farm": { "...": "otro objeto farm" }
    }
  ],
  "next_cursor": "eyJpZCI6MTIxNTAxfQ"
}
```

> [!NOTE]
> Los objetos farm están recortados aquí por legibilidad — usa el playground para ver una respuesta real completa.

---

## Errores

| Status | Título | Descripción |
|--------|--------|-------------|
| **401** | Missing or invalid API key | `x-api-key` ausente, falla verificación, o la granja ya no cumple requisitos (VIP + nivel 50). |
| **429** | Too many requests | Throttle por IP: ~1 request/5s, se duplica a 10s si sigues. Back off y reintenta. |

---

## Notas

- Las respuestas pueden ser de **varios megabytes** con limits altos — haz stream o aumenta los límites de body de tu cliente.
- El set **no es un snapshot estable**: las granjas guardan constantemente, así que dos recorridos completos diferirán.
- Un recorrido completo al throttle de 5 segundos son **miles de requests y horas de wall clock**. Si eso es lo que planeas, usa el **Nightly Farm Dump**.
