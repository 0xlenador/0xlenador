# 🌻 GET — Discord Announcements

**`GET /community/data?type=discordAnnouncements`**

Los 20 posts más recientes del Discord oficial de Sunflower Land.

---

## Descripción

Retorna los **20 últimos anuncios** recolectados de los canales de anuncios del Discord oficial, más recientes primero. Es el mismo feed que el juego muestra in-app, la forma más simple de surfear noticias oficiales en un bot, dashboard o fan site.

### Cada mensaje incluye:
- `id` — ID de Discord
- `channelId` / `channelName` — canal de origen
- `url` — link directo al post original
- `content` — contenido del mensaje
- `sender` — `id`, `username`, `displayName`, `avatarUrl`
- `createdAt` — ISO timestamp
- `images` — imágenes adjuntas (`url`, `filename`, `contentType`, `width`, `height`)
- `likes` — total de reacciones emoji en el post

---

## Parámetros

Ninguno.

---

## Ejemplo de Respuesta — 200

```json
{
  "data": [
    {
      "id": "1409928315000123456",
      "channelId": "907864376689283085",
      "channelName": "announcements",
      "url": "https://discord.com/channels/880987707214544966/907864376689283085/1409928315000123456",
      "content": "**Chapter Update** is live! Head to the Plaza to pick up your first delivery.",
      "sender": {
        "id": "512300000000000000",
        "username": "sunflowerbot",
        "displayName": "Sunflower Land",
        "avatarUrl": "https://cdn.discordapp.com/avatars/…/….png"
      },
      "createdAt": "2026-08-26T04:12:09.000Z",
      "images": [
        {
          "url": "https://cdn.discordapp.com/attachments/…/chapter.png",
          "filename": "chapter.png",
          "contentType": "image/png",
          "width": 1200,
          "height": 630
        }
      ],
      "likes": 148
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

- `content` es el **mensaje raw de Discord**: espera markdown, emoji custom y menciones `<@…>`. Renderiza o limpia según tu superficie.
- El feed se recolecta por **schedule**, no streaming, así que un post nuevo toma unos minutos en aparecer. Haz polling cada pocos minutos como máximo.
- Las `images` son **URLs del CDN de Discord**. Pueden expirar — re-hostea lo que necesites mantener.
- **De-duplica por `id`**: un post editado mantiene su id, y `likes` cambia conforme llegan reacciones.
