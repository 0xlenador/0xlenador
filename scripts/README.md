# Scripts de Automatización

Este directorio contiene scripts de Node.js diseñados para facilitar tareas repetitivas y de mantenimiento en el proyecto. 

Para ejecutar los scripts, te recomendamos usar siempre los comandos definidos en el `package.json` mediante `npm run`.

---

## Comandos Disponibles

### 1. Actualizar Directorio de Enlaces
**Comando:**
```bash
pnpm run update-links
```

**¿Qué hace este script?**
- Busca **estrictamente** los archivos `0xL-links-ref.tsv` y `0xL-links-noref.tsv` dentro de la carpeta `src/content/data/`.
- Ignora cualquier otro archivo, e ignora cualquier columna extraña en los TSV que no sean `nombre`, `categoria`, `tags`, `enlace`.
- Automáticamente etiqueta como referidos/patrocinados (`sponsored: true`) a **todos** los enlaces provenientes de `0xL-links-ref.tsv` y como normales (`sponsored: false`) a los de `0xL-links-noref.tsv`.
- Genera el `id` y deduce la ruta del logo para cada registro.
- Une toda la información y actualiza el archivo central `src/content/data/directory.json`.

### 2. Recolector de Datos Financieros (`fetch_stocks.py`)
**Comando:**
```bash
python scripts/fetch_stocks.py
```

**¿Qué hace este script?**
- Se conecta a la API de Yahoo Finance para extraer datos en vivo.
- Lee los símbolos de activos desde `src/content/data/tickers.txt` y `src/content/data/cryptos.json`.
- Descarga datos financieros clave como Precio, Market Cap, Acciones en circulación y Free Cash Flow (FCF).
- Genera y actualiza el archivo maestro `src/content/data/stocks_data.json`.
*(Nota: Normalmente este script es ejecutado de forma automatizada por un bot en Github Actions).*

### 3. Motor Analítico de Mercado SFL (`update_sfl.js`)
**Comando:**
```bash
node scripts/update_sfl.js
```

**¿Qué hace este script?**
- Actúa como una "Máquina del Tiempo": descarga hasta 7 meses de historial de precios del mercado de Sunflower Land, usando un sistema de caché semestral (`public/api/history/`) para ser súper eficiente.
- Cruza la información del juego con datos de **CoinGecko** para calcular exactamente cuántos Dólares (USD) movió cada ítem.
- Genera cálculos matemáticos listos para graficar (volumen 24h/7d, líneas de tendencia sparkline, etc.).
- Exporta toda esta inteligencia de mercado al archivo maestro `public/api/sfl_data.json`.
*(Nota: Bot de Github Actions).*

### 4. Tendencias Rápidas de SFL (`update_dashboard.js`)
**Comando:**
```bash
node scripts/update_dashboard.js
```

**¿Qué hace este script?**
- Se conecta de forma privada a la API de SFL utilizando un Token de autenticación JWT.
- Descarga una "fotografía" rápida del ecosistema: Volumen total del mercado en las últimas horas y los intercambios más grandes (Whale Traders).
- Lo guarda en `public/api/sfl_dashboard.json` para mostrar un resumen económico rápido en la web.
*(Nota: Bot de Github Actions).*
