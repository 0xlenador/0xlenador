# 🌻 Sunflower Land Community API — Getting Started

La **Community API** es la API pública de solo lectura para datos de granjas de Sunflower Land. Los desarrolladores de la comunidad la usan para construir leaderboards, trackers, herramientas de mercado y apps complementarias.

---

## 1 · Obtener una API Key

> [!IMPORTANT]
> **Las claves requieren acceso VIP y un Bumpkin de nivel 50 o superior.**

- El sandbox de la documentación oficial emite tu clave — no necesitas el juego para obtenerla.
- Inicia sesión en Sunflower Land en tu navegador y el sandbox detecta esa sesión, pide la clave a la API y la muestra en el sidebar.
- La verificación se ejecuta al emitir la clave **y** en cada request, así que una clave deja de funcionar si el VIP de la granja expira — renueva y funciona de nuevo, misma clave.
- Las claves lucen así: `sfl.eyJhY2NvdW50…` y están vinculadas a tu cuenta. **Trátalas como contraseñas** y nunca las incluyas en código del lado del cliente.

### ¿Se filtró tu clave?

Haz clic en **Rotate** en el sidebar. Obtienes una nueva clave y la anterior deja de funcionar inmediatamente.

### Autenticación

Cada request a `/community` envía la clave en el header `x-api-key`:

```
x-api-key: sfl.YOUR.KEY
```

Requests sin clave válida responden **401**.

---

## 2 · URLs Base

| Entorno | URL | Descripción |
|---------|-----|-------------|
| **Mainnet** | `https://api.sunflower-land.com` | Datos reales de jugadores |
| **Testnet** | `https://api-dev.sunflower-land.com` | Amoy, datos de prueba — seguro para desarrollo |

> [!NOTE]
> Las claves son por entorno: una clave de mainnet viene del juego en mainnet, una de testnet del juego en testnet.

---

## 3 · Rate Limits

- Cada endpoint está throttleado por IP: aproximadamente **1 request cada 5 segundos** en las rutas `/community`.
- Se duplica a **10 segundos** si sigues empujando.
- Un request throttleado devuelve **429** con body vacío — espera y reintenta, no hagas loops cerrados.

> [!TIP]
> Leer muchas granjas a la vez debería usar **List farms** con un `limit` alto en vez de muchas llamadas individuales: una página de 500 granjas cuesta un request.

---

## 4 · Obtener Todas las Granjas

> [!IMPORTANT]
> **Si quieres todo el dataset, descarga el [Nightly Farm Dump](#nightly-dump) en vez de paginar la API.**

- Cada granja se exporta una vez al día a JSONL comprimido con gzip.
- **Una descarga** en vez de miles de requests throttleados.
- Snapshot consistente vs. un recorrido por granjas que siguen guardándose.

### Endpoint del manifiesto:
```
GET /community/data?type=nightlyDump
```

### Archivos disponibles:
- `active.jsonl.gz` — granjas que han jugado en los últimos 90 días
- `all.jsonl.gz` — todas las granjas

Se descargan desde `https://community.sunflower-land.com/{filename}` sin necesidad de clave. Los archivos se mantienen **7 días**.

---

## 5 · Recorrer Granjas via API

Cuando necesitas algo más fresco que la noche anterior, pagina la API. La paginación es basada en cursor:

```javascript
let cursor;
do {
  const url = new URL("https://api.sunflower-land.com/community/farms");
  url.searchParams.set("limit", "500");
  if (cursor) url.searchParams.set("cursor", cursor);

  const response = await fetch(url, {
    headers: { "x-api-key": "sfl.YOUR.KEY" },
  });
  if (response.status === 429) {
    await new Promise((r) => setTimeout(r, 10_000)); // throttled — back off
    continue;
  }

  const { farms, next_cursor } = await response.json();
  for (const { id, nft_id, farm } of farms) {
    // …tu procesamiento…
  }
  cursor = next_cursor;
} while (cursor);
```

---

## 6 · Detectar Cambios de Forma Barata

Las respuestas de una sola granja incluyen `updatedAt` — el timestamp del último guardado que realmente cambió la granja.

> [!TIP]
> Almacena `updatedAt` y salta el procesamiento cuando no ha cambiado — nunca necesitas hacer diff o hash del objeto de la granja tú mismo.
