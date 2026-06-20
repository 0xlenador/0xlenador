// ============================================================
// src/i18n/ui.ts
// Diccionario central de UI para i18n (ES / EN)
// Organizado por namespace: layout, nav, footer, páginas, componentes
// ============================================================

export const languages = {
  es: "Español",
  en: "English",
} as const

export const defaultLang = "es" as const
export type Lang = keyof typeof languages

// ---------------------------------------------------------------------------
// Diccionario de Rutas (Segmentos de URL)
// ---------------------------------------------------------------------------
export const routes = {
  en: {
    operaciones: "operations",
    herramientas: "tools",
    activos: "watchlist",
    directorio: "directory",
    privacidad: "privacy",
    terminos: "terms",
    intrinseco: "intrinsic",
    "sfl-mercado": "sfl-market",
    "sfl-mascotas": "sfl-pets",
    "sfl-cocinando": "sfl-cooking",
  },
  es: {
    operations: "operaciones",
    tools: "herramientas",
    watchlist: "activos",
    directory: "directorio",
    privacy: "privacidad",
    terms: "terminos",
    intrinsic: "intrinseco",
    "sfl-market": "sfl-mercado",
    "sfl-pets": "sfl-mascotas",
    "sfl-cooking": "sfl-cocinando",
  },
}

// ---------------------------------------------------------------------------
// Tipos auxiliares
// ---------------------------------------------------------------------------
type NestedStringRecord = { [key: string]: string | NestedStringRecord }

// ---------------------------------------------------------------------------
// Diccionario principal
// ---------------------------------------------------------------------------
export const ui = {
  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT GLOBAL
  // ─────────────────────────────────────────────────────────────────────────
  es: {
    // Layout meta defaults
    "layout.title.default":
      "0xLeñador | Hub Operativo · Herramientas y Terminal Web3",
    "layout.description.default":
      "Repositorio funcional de utilidades, directorio de recursos y seguimiento de operaciones en mercados Web3 y tradicionales.",
    "layout.lang": "es",

    // ─── NAVEGACIÓN ──────────────────────────────────────────────────────
    "nav.aria.label": "Navegación principal",
    "nav.herramientas": "Herramientas",
    "nav.directorio": "Directorio",
    "nav.activos": "Activos",
    "nav.operaciones": "Operaciones",
    "nav.blog": "Blog",
    // Submenú: Herramientas
    "nav.sub.riskfolio": "Riskfolio",
    "nav.sub.intrinseco": "Intrínseco",
    "nav.sub.sfl": "SFL P2P",
    // Submenú: Directorio
    "nav.sub.faucets": "Faucets",
    // Submenú: Activos
    "nav.sub.bitcoin": "Bitcoin",
    "nav.sub.ethereum": "Ethereum",
    "nav.sub.sunflowerland": "Sunflower Land",
    "nav.sub.pets": "SFL Mascotas",
    "nav.sub.cooking": "SFL Cocinando",
    // Submenú: Operaciones
    "nav.sub.soneium": "Soneium",
    "nav.sub.polymarket": "Polymarket",
    // Mobile
    "nav.mobile.goTo": "Ir a {label} principal",
    "nav.mobile.aria.button": "Abrir menú",

    // ─── FOOTER ──────────────────────────────────────────────────────────
    "footer.disclaimer":
      "Todo el contenido compartido en 0xLeñador tiene fines estrictamente educativos e informativos. No constituye asesoría financiera, recomendación de inversión ni consejo legal. Invierte con criterio propio y responsabilidad.",
    "footer.brand.description":
      "Hub Operativo de herramientas, directorio de recursos y seguimiento de operaciones en mercados Web3 y tradicionales.",
    "footer.col.navegacion": "Navegación",
    "footer.col.comunidad": "Comunidad",
    "footer.col.legal": "Legal",
    "footer.link.inicio": "Inicio",
    "footer.link.herramientas": "Herramientas",
    "footer.link.directorio": "Directorio",
    "footer.link.activos": "Activos",
    "footer.link.operaciones": "Operaciones",
    "footer.link.blog": "Blog",
    "footer.link.privacidad": "Privacidad & Cookies",
    "footer.link.terminos": "Términos & Aviso Legal",
    "footer.copyright": "© 2026 0x Leñador • Derechos Reservados • Build in public",
    "footer.status": "Status: System Operational",
    "footer.live": "Live Data",

    // ─── PÁGINA: INICIO (index) ────────────────────────────────────────
    "home.seo.title":
      "0xLeñador | Hub Operativo — Herramientas, Activos y Operaciones Web3",
    "home.seo.description":
      "Centro de comando técnico de 0xLeñador: herramientas de análisis, watchlist de activos, bitácora de operaciones y directorio de recursos Web3 y mercados tradicionales.",
    "home.schema.jobTitle": "Operador Web3 e Investigador de Mercados",
    "home.schema.description":
      "Hub Operativo de herramientas, directorio de recursos y seguimiento de operaciones en mercados Web3 y tradicionales.",
    // Hero
    "home.hero.phrase1": "Hub Operativo 0xLeñador",
    "home.hero.phrase2": "Herramientas de análisis",
    "home.hero.phrase3": "Directorio de recursos Web3",
    "home.hero.phrase4": "Watchlist de activos",
    "home.hero.phrase5": "Bitácora de operaciones",
    "home.hero.cta.primary": "Ver directorio",
    "home.hero.cta.secondary": "Bitácora de Ops",
    // Secciones
    "home.section.command": "Centro de Comando",
    "home.section.guides": "Status: Guías Operativas",
    "home.section.guides.viewAll": "Ver todas →",
    "home.section.blog": "Últimas del Blog",
    "home.section.blog.viewAll": "Ver todos →",
    "home.blog.read": "Leer artículo →",
    "home.footer.tagline": "Hub Operativo · Build in Public",
    // Módulos
    "home.module.herramientas.title": "Herramientas",
    "home.module.herramientas.desc": "Riskfolio, Valor Intrínseco y Directorios.",
    "home.module.herramientas.count": "3 utilidades",
    "home.module.directorio.title": "Directorio",
    "home.module.directorio.desc": "Exchanges, wallets, exploradores y faucets curados.",
    "home.module.directorio.count": "50+ recursos",
    "home.module.activos.title": "Activos",
    "home.module.activos.desc": "Watchlist de mercados tradicionales y Web3 en seguimiento.",
    "home.module.activos.count": "6 activos",
    "home.module.operaciones.title": "Operaciones",
    "home.module.operaciones.desc": "Hub de guías operativas: airdrops, DeFi y gaming.",
    "home.module.operaciones.count.singular": "guía activa",
    "home.module.operaciones.count.plural": "guías activas",
    // FAQ Home
    "home.faq.title": "Preguntas Frecuentes",
    "home.faq.subtitle": "Sobre el Hub y la metodología",
    "home.faq.q1": "¿Qué es 0xLeñador?",
    "home.faq.a1":
      "0xLeñador es un Hub Operativo personal: un centro de comando técnico para el seguimiento de activos, bitácora de operaciones y repositorio de herramientas de análisis en mercados Web3 y tradicionales. No es un servicio de asesoría ni una academia.",
    "home.faq.q2": "¿Este sitio ofrece señales o consejos de compra?",
    "home.faq.a2":
      "No. Todo el contenido publicado tiene fines estrictamente educativos, informativos y de documentación personal. Las posiciones y guías mostradas en la bitácora son operaciones propias documentadas para transparencia, en ningún caso representan señales de compra o venta.",
    "home.faq.q3": "¿Qué encontrarás en nuestro sitio?",
    "home.faq.a3":
      "Encontrarás una colección completa de utilidades Web3: herramientas para el cálculo y gestión de riesgo, un directorio curado de dApps, guías operativas paso a paso (airdrops, DeFi, gaming), faucets, calculadoras intrínsecas y la tesis de inversión que fundamenta el portafolio.",
    "home.faq.q4": "¿Con qué frecuencia se actualizan las guías operativas?",
    "home.faq.a4":
      "El Hub se mantiene en constante evolución. Las guías de Airdrops, DeFi y Gaming se actualizan de forma regular o tan pronto como los protocolos anuncian nuevas misiones, fases de desarrollo o se acercan fechas límite (deadlines) importantes.",
    "home.faq.q5": "¿Son seguros los enlaces y dApps listados?",
    "home.faq.a5":
      "Todo el directorio y los enlaces provistos en las guías son curados manualmente apuntando exclusivamente a las fuentes oficiales de los protocolos. Sin embargo, el ecosistema Web3 conlleva riesgos; se recomienda aplicar siempre buenas prácticas, como revocar permisos regularmente y usar 'burner wallets' para tareas de farming.",

    // ─── PÁGINA: 404 ─────────────────────────────────────────────────────
    "404.seo.title": "404 — Ruta No Encontrada | 0xLeñador",
    "404.seo.description":
      "La página que buscas no existe o fue movida. Regresa al inicio para seguir navegando el ecosistema 0xLeñador.",
    "404.badge": "Error de Protocolo",
    "404.heading": "Ruta no encontrada en el protocolo",
    "404.body":
      "El recurso que buscas no existe, fue movido o nunca fue indexado en nuestro ecosistema. Verifica la URL o regresa a una ruta segura.",
    "404.terminal.label": "0xLeñador Terminal",
    "404.terminal.sys": "Iniciando búsqueda de ruta…",
    "404.terminal.err": "HTTP 404 · Recurso no indexado",
    "404.terminal.fix": "Redirigir a ruta raíz:",
    "404.btn.home": "Volver al Inicio",
    "404.btn.back": "← Ruta Anterior",
    "404.shortcuts.title": "Rutas Disponibles",

    // ─── PÁGINA: HERRAMIENTAS ─────────────────────────────────────────────
    "tools.seo.title":
      "Herramientas | 0xLeñador — Utilidades para Web3 y Análisis de Capital",
    "tools.seo.description":
      "Modelos de cálculo y software de análisis para Web3: Simulador de portafolio 60/40 y Calculadora de Valor Intrínseco (DCF). Herramientas 100% locales, sin registro.",
    "tools.breadcrumb": "Hub / Herramientas",
    "tools.heading": "Centro de Herramientas",
    "tools.subheading": "Herramientas",
    "tools.intro":
      "Modelos de cálculo y software de análisis estructurado para evaluar activos y distribuir tu portafolio. Herramientas diseñadas para aportar objetividad matemática a tus decisiones de inversión, operando de forma local y privada en tu navegador.",
    // Herramienta: Riskfolio
    "tools.riskfolio.title": "Riskfolio",
    "tools.riskfolio.desc":
      "Calcula la distribución matemática de tu portafolio de inversión dependiendo de tu perfil de riesgo: Conservador, Moderado o Agresivo.",
    "tools.riskfolio.badge": "Modelo Paramétrico",
    // Herramienta: Valor Intrínseco
    "tools.intrinseco.title": "Valor Intrínseco",
    "tools.intrinseco.desc":
      "Terminal de cálculo de valor intrínseco basada en flujo de caja descontado (DCF). Evalúa si un activo cotiza por encima o por debajo de su valor real.",
    "tools.intrinseco.badge": "Calculadora",
    // Herramienta: Mercado SFL
    "tools.sfl.title": "Mercado SFL",
    "tools.sfl.desc":
      "Consulta los precios P2P en tiempo real del ecosistema de Sunflower Land. Monitorea items, wearables y recursos mediante su API oficial.",
    "tools.sfl.badge": "Dashboard en Vivo",
    // Herramienta: Mascotas SFL
    "tools.sfl-mascotas.title": "Calculadora de Mascotas SFL",
    "tools.sfl-mascotas.desc": "Calculadora interactiva P2P y guía completa de las mascotas de Sunflower Land. Evalúa la rentabilidad en vivo de las comidas, altares y recursos.",
    "tools.sfl-mascotas.badge": "Calculadora P2P",
    // Herramienta: Cocinando SFL
    "tools.sfl-cocinando.title": "Cocina y Recetas SFL",
    "tools.sfl-cocinando.desc": "Terminal interactiva de recetas para optimizar el farmeo de experiencia (XP) en Sunflower Land. Consulta ingredientes, buffos y tiempos de forma estructurada.",
    "tools.sfl-cocinando.badge": "Dashboard de XP",
    // FAQ Herramientas
    "tools.faq.title": "Sobre las Herramientas",
    "tools.faq.subtitle": "Uso y disponibilidad",
    "tools.faq.q1": "¿Cuál es la utilidad de nuestro centro de herramientas?",
    "tools.faq.a1":
      "El objetivo de este centro es proporcionar modelos matemáticos y calculadoras estructuradas que eliminen la subjetividad y el ruido emocional al momento de evaluar activos. Estas herramientas están diseñadas para ayudarte a estructurar un portafolio equilibrado y determinar el valor real de tus inversiones mediante datos duros.",
    "tools.faq.q2": "¿Por qué seleccionamos estas herramientas?",
    "tools.faq.a2":
      "Porque representan los dos pilares fundamentales de la gestión de capital profesional: la asignación de riesgo (Simulador 60/40) y la valoración fundamental (Valor Intrínseco). En lugar de abrumarte con cientos de indicadores inútiles, nos enfocamos estrictamente en lo que funciona en la práctica institucional diaria.",
    "tools.faq.q3": "¿Los cálculos que realizo son privados?",
    "tools.faq.a3":
      "Sí, absolutamente. Todas las herramientas de 0xLeñador están construidas para operar de manera 100% local en tu dispositivo (Client-Side). No utilizamos bases de datos, no requerimos registro y no guardamos tu información. Una vez que cierras la pestaña, tus cálculos desaparecen.",
    "tools.faq.q4": "¿Son estas herramientas recomendaciones financieras?",
    "tools.faq.a4":
      "No. Son utilidades matemáticas y analíticas. El Simulador y la Calculadora te darán resultados basados en los números que tú mismo ingreses. Es tu responsabilidad realizar tu propia investigación (DYOR) e interpretar los datos según tu perfil de riesgo.",
    "tools.faq.q5": "¿Puedo sugerir nuevas herramientas?",
    "tools.faq.a5":
      "Sí, esta herramienta está diseñada analíticamente para ayudarte a tomar mejores decisiones comerciales (trading) dentro de la economía de SFL. Sin embargo, el mercado de criptojuegos es altamente volátil. Usa esta información visualizada como apoyo estratégico antes de comerciar grandes volúmenes de SFL tokens.",
    // Calculator Intrinsec
    "calculator.eps.label": "EPS (Beneficio Acción)",
    "calculator.growth.label": "Crecimiento (g %)",
    "calculator.fcf.label": "Free Cash Flow",
    "calculator.millions.label": "Millones",
    "calculator.growth.adv.label": "Crecimiento %",
    "calculator.discount.label": "Tasa Descuento %",
    "calculator.shares.label": "Acciones Totales",
    "calculator.margin.label": "Margen de Seguridad",
    "calculator.button.label": "Ejecutar Algoritmo",
    "calculator.target.label": "Precio Objetivo",
    "calculator.target.sublabel": "Target Price Multi-Asset",
    "calculator.status.label": "Estatus Terminal",
    "calculator.status.completed": "Análisis Completado",
    "calculator.script.processing": "Procesando...",
    "calculator.script.graham.title": "Target Graham",
    "calculator.script.graham.desc": "Estimación fundamental rápida basada en el beneficio neto actual.",
    "calculator.script.buffett.title": "Target Buffett",
    "calculator.script.buffett.desc": "Cálculo DCF avanzado con descuento de flujos y margen de seguridad.",

    // ─── PÁGINA: ACTIVOS ───────────────────────────────────────────────
    "assets.seo.title": "Activos | 0xLeñador — Watchlist de Mercados Tradicionales y Web3",
    "assets.seo.description": "Watchlist de activos bajo seguimiento activo: Bitcoin, Ethereum, ETFs S&P 500, Berkshire Hathaway e Hyperliquid. Seguimiento de la tesis de inversión 60/40 de 0xLeñador.",
    "assets.breadcrumb": "Hub / Activos",
    "assets.heading": "Watchlist de",
    "assets.heading.accent": "Activos",
    "assets.intro": "Los activos bajo seguimiento activo en la tesis de 0xLeñador. No son señales de compra, son posiciones documentadas con fundamento técnico y matemático.",
    "assets.section.title": "En seguimiento",
    "assets.count": "activos",
    "assets.table.asset": "Activo",
    "assets.table.ticker": "Ticker",
    "assets.table.category": "Categoría",
    "assets.table.thesis": "Tesis",
    "assets.table.detail": "Detalle",
    "assets.link.view": "Ver →",
    "assets.link.soon": "Pronto",
    "assets.link.analysis": "Ver análisis →",
    "assets.link.full": "Análisis completo →",
    "assets.faq.title": "Sobre la Watchlist",
    "assets.faq.subtitle": "Seguimiento de activos",
    // Data de activos
    "assets.cat.cryptoL1": "Cripto L1",
    "assets.cat.dex": "DEX / Perps",
    "assets.cat.renta": "Renta Variable",
    "assets.cat.ordinals": "Bitcoin Ordinals",
    "assets.cat.game": "Web3 Game",
    "assets.btc.desc": "Reserva de valor digital. Núcleo de la descorrelación financiera.",
    "assets.eth.desc": "Infraestructura de contratos inteligentes y economía DeFi.",
    "assets.hype.desc": "L1 optimizado para derivados on-chain. Asimetría de ecosistema emergente.",
    "assets.spy.desc": "Benchmark del mercado tradicional. 60% del portafolio estructural.",
    "assets.brk.desc": "Valor intrínseco y gestión patrimonial de largo plazo.",
    "assets.rune.desc": "Activo de la economía de Ordinals y Runes. Riesgo total y alta asimetría.",
    "assets.sfl.desc": "Economía experimental on-chain. Fase de garaje — riesgo total.",
    "assets.faq.q1": "¿Estos activos son una recomendación de compra?",
    "assets.faq.a1": "No. La Watchlist refleja los activos que 0xLeñador sigue activamente en su propia tesis de inversión. No es una señal de compra ni una recomendación financiera personalizada. Cada inversor debe hacer su propia investigación.",
    "assets.faq.q2": "¿Qué significa 'Fase de Garaje' en la watchlist?",
    "assets.faq.a2": "Son activos de alta especulación y asimetría total: o se van a cero o generan retornos masivos. El capital asignado a estos activos se considera completamente arriesgado y no debe ser más del que el inversor puede perder por completo.",
    "assets.faq.q3": "¿Por qué Bitcoin y Ethereum tienen páginas dedicadas?",
    "assets.faq.a3": "Son los dos activos de mayor peso y convicción en la tesis. Tienen análisis técnico, recursos y contexto suficientes para justificar una página completa. Los demás activos se documenten a medida que el análisis madura.",
    "assets.faq.q4": "¿Con qué frecuencia se actualiza la watchlist?",
    "assets.faq.a4": "La watchlist refleja posiciones activas, no precios en tiempo real. Se actualiza cuando hay cambios estructurales en la tesis (entrada, salida o reconfiguración de posición), no con la volatilidad diaria del mercado.",

    // ─── PÁGINA: OPERACIONES ───────────────────────────────────────────────
    "ops.seo.title": "Operaciones | 0xLeñador — Guías Operativas DeFi, Airdrops y Web3",
    "ops.seo.description": "Guías paso a paso de las operaciones del día a día en Web3: farming de airdrops, gestión de posiciones DeFi, juegos on-chain y más. Documentadas con recursos y herramientas reales.",
    "ops.state.active": "Activa",
    "ops.state.completed": "Completada",
    "ops.state.expired": "Expirada",
    "ops.faq.q1": "¿Estas guías son recomendaciones de inversión?",
    "ops.faq.a1": "No. Las guías documentan las operaciones y actividades que 0xLeñador realiza en su propio portafolio. Son registros de actividad, no asesoría financiera. Cada usuario es responsable de su capital y decisiones.",
    "ops.faq.q2": "¿Qué diferencia hay entre una operación 'Airdrop' y 'DeFi'?",
    "ops.faq.a2": "Las guías de 'Airdrop' documentan actividades cuyo objetivo principal es acumular puntos o tokens futuros de un protocolo (farming). Las de 'DeFi' se enfocan en la gestión activa de posiciones de liquidez, staking o yields. Una categoría 'Mixta' combina ambas —es común en protocolos que requieren LP + interacción social.",
    "ops.faq.q3": "¿Con qué frecuencia se actualizan las guías?",
    "ops.faq.a3": "Las guías se actualizan cuando cambian las condiciones del protocolo (nuevas temporadas, cambios en quests, nuevas plataformas). El estado 'activa' indica que la guía corresponde a una oportunidad vigente. 'Completada' significa que la temporada o campaña ya cerró.",
    "ops.faq.q4": "¿Por qué algunas guías incluyen botones de wallets o exchanges?",
    "ops.faq.a4": "Para cada guía se indican las herramientas necesarias directamente desde el Directorio de 0xLeñador. Si el enlace tiene un referido, se indica claramente con la etiqueta 'ref'. Nunca se fuerza el uso de ninguna plataforma específica.",
    "ops.breadcrumb": "Hub / Operaciones",
    "ops.heading": "Guías",
    "ops.heading.accent": "Operativas",
    "ops.intro": "Documentación paso a paso de las actividades del día a día en Web3: farming de airdrops, gestión de posiciones DeFi, juegos on-chain y más. Con recursos y herramientas reales.",
    "blog.ui.eyebrow": "BITÁCORA DE INVESTIGACIÓN",
    "blog.ui.title": "Análisis",
    "blog.ui.subtitle": "y Tesis de Capital",
    "blog.ui.desc": "Perspectivas independientes sobre gestión patrimonial, análisis fundamental de activos Web3 y modelado económico de L1s.",
    "blog.ui.mainCard": "ANÁLISIS PRINCIPAL",
    "blog.ui.read": "DE LECTURA",
    "blog.ui.cta": "Comenzar lectura ->",
    "blog.ui.past": "INVESTIGACIONES ANTERIORES",
    "blog.banner.text": "Nota: Los artículos de investigación detallados están disponibles actualmente solo en español. Estamos trabajando en las traducciones al inglés.",
    "blog.card.overlay": "Artículo disponible solo en español. Trabajando en la versión en inglés.",
    "blog.pipeline.item1.title": "Auditoría de Contratos Inteligentes: Filtros de Seguridad para Burner Wallets",
    "blog.pipeline.item1.cat": "Seguridad",
    "blog.pipeline.item1.desc": "Cómo leer trazas básicas en Etherscan y detectar funciones maliciosas de drenado antes de interactuar con un nuevo protocolo.",
    "blog.pipeline.item2.title": "Flujo de Caja Descontado (DCF) Aplicado a Plataformas de Liquidación L1",
    "blog.pipeline.item2.cat": "Modelado",
    "blog.pipeline.item2.desc": "Adaptación de las métricas tradicionales de Benjamin Graham para valuar la captura de valor real por tarifas de gas on-chain.",
    "blog.assets.btc.cat": "Hard Money / Reserva",
    "blog.assets.btc.thesis": "El activo base de escasez absoluta. Cobertura definitiva contra la degradación de monedas fiat tradicionales.",
    "blog.assets.eth.cat": "L1 de Liquidación",
    "blog.assets.eth.thesis": "La computadora descentralizada global. Captura valor real de comisiones mediante la quema de su propio suministro.",
    "blog.article.share": "Compartir artículo",
    "ops.stat.active": "Guías activas",
    "ops.stat.total": "Total guías",
    "ops.stat.categories": "Categorías",
    "ops.guide.priority": "Guía prioritaria",
    "ops.ui.priority": "GUÍA PRIORITARIA",
    "ops.ui.tracking": "EN SEGUIMIENTO",
    "ops.ui.tag.mixed": "MIXTA",
    "ops.ui.status.active": "Activa",
    "ops.ui.diff.medium": "Dificultad media",
    "ops.ui.time.week": "semana",
    "ops.ui.time.day": "día",
    "ops.ui.cta.open": "Abrir guía",
    "ops.ui.cta.view": "Ver",
    "ops.ui.guides": "guías",
    "ops.banner.text": "Nota: El contenido detallado de estas guías está disponible actualmente solo en español. Estamos trabajando en las versiones en inglés.",
    "ops.detail.reading": "{time} de lectura",
    "ops.detail.deadline": "⏳ Deadline:",
    "ops.detail.difficulty": "● Dificultad {level}",
    "ops.detail.breadcrumb.home": "Inicio",
    "ops.detail.breadcrumb.ops": "Operaciones",
    "ops.updated": "Actualizado: {date}",
    "ops.reading": "{time} de lectura",
    "ops.card.overlay": "Contenido disponible solo en español. Estamos trabajando en la versión en inglés.",
    "ops.guide.open": "Abrir guía →",
    "ops.guide.view": "Ver →",
    "ops.guide.count": "guías",
    "ops.empty.text": "// Ninguna guía activa por el momento.",
    "ops.empty.subtext": "Próximamente se agregarán guías de Soneium, Sunflower Land y otros protocolos.",
    "ops.faq.title": "Sobre las Guías",
    "ops.faq.subtitle": "Operaciones y actividades",

    // ─── PÁGINA: BLOG ───────────────────────────────────────────────
    "blog.seo.title": "Artículos e Investigación de Capital | 0xLeñador",
    "blog.seo.description": "Espacio de divulgación educativa, tokenomía, análisis macroeconómico y tesis fundamentales de inversión en Web3.",
    "blog.breadcrumb": "Bitácora de Investigación",
    "blog.heading": "Análisis",
    "blog.heading.accent": "y Tesis de Capital",
    "blog.intro": "Perspectivas independientes sobre gestión patrimonial, análisis fundamental de activos Web3 y modelado económico de L1s.",
    "blog.post.main": "Análisis Principal",
    "blog.post.read": "de lectura",
    "blog.post.start": "Comenzar lectura →",
    "blog.history.title": "Investigaciones Anteriores",
    "blog.history.access": "Acceder →",
    "blog.pipeline.tag": "En Desarrollo",
    "blog.pipeline.title": "Pipeline de Investigación",
    "blog.pipeline.desc": "Temas actualmente en fase de modelado financiero, auditoría de código o análisis fundamental macroeconómico.",
    "blog.pipeline.planned": "Planificado",
    "blog.monitor.tag": "Monitor Dinámico",
    "blog.monitor.title": "Activos Bajo Seguimiento",
    "blog.monitor.desc": "Una muestra aleatoria de activos dentro del radar de investigación de 0xLeñador para esta sesión.",
    "blog.monitor.access": "ACCEDER ↗",
    "blog.faq.title": "Preguntas Frecuentes",
    "blog.faq.subtitle": "Sobre la Bitácora de Investigación",
    "blog.faq.q1": "¿Con qué frecuencia se publican artículos?",
    "blog.faq.a1": "No hay una frecuencia fija. Los artículos se publican cuando el análisis está lo suficientemente maduro para ser compartido. La calidad y el rigor técnico tienen prioridad sobre la frecuencia de publicación.",
    "blog.faq.q2": "¿Los artículos son recomendaciones de inversión?",
    "blog.faq.a2": "No. Todo el contenido del blog tiene fines educativos e informativos. No constituye asesoría financiera, legal ni fiscal. Cada lector es responsable de sus propias decisiones de inversión.",
    "blog.faq.q3": "¿Puedo sugerir un tema para investigar?",
    "blog.faq.a3": "Sí. Puedes enviar sugerencias de análisis a través de Telegram (@zero0xlenador) o X (@0xlenador). Los temas con mayor demanda e interés técnico se priorizan en el pipeline de investigación.",
    "blog.faq.q4": "¿Qué formatos de contenido se publican?",
    "blog.faq.a4": "Principalmente análisis técnicos en profundidad, guías de herramientas y tesis de inversión documentadas. No se publican señales de compra/venta, resúmenes de noticias ni contenido de opinión superficial.",

    // ─── PÁGINA: FAUCETS ───────────────────────────────────────────────
    "faucets.seo.title": "Faucets Cripto Mainnet & Testnet | 0xLeñador — Tokens Gratis",
    "faucets.seo.description": "Directorio completo de faucets de criptomonedas. Obtén tokens de prueba para Ethereum Sepolia, Monad, Base, Solana y más de 30 redes. Esencial para desarrollo Web3 y farming de airdrops.",
    "faucets.breadcrumb": "Directorio / Faucets",
    "faucets.heading": "Listado de Faucets",
    "faucets.heading.accent": "Mainnet & Testnet",
    "faucets.intro": "Explora todos los sitios web de faucets de criptomonedas disponibles en el ecosistema blockchain, acumula criptomonedas gratis para farmear tus airdrops y/o desarrollar tus proyectos.",
    "faucets.search.placeholder": "Buscar red... (Sepolia, Monad, Solana...)",
    "faucets.filter.all": "Todos",
    "faucets.faq.title": "Sobre los Faucets",
    "faucets.faq.subtitle": "Guía de uso y buenas prácticas de seguridad.",
    "faucets.faq.acc.title": "Preguntas sobre Faucets",
    "faucets.faq.acc.subtitle": "Uso, seguridad y actualización",
    "faucets.faq.q1": "¿Qué es un faucet de criptomonedas?",
    "faucets.faq.a1": "Es un servicio que distribuye pequeñas cantidades de tokens de forma gratuita. Los faucets de testnet son esenciales para desarrollo Web3: permiten pagar gas y probar contratos inteligentes sin arriesgar capital real. Los de mainnet distribuyen criptomonedas reales en cantidades muy pequeñas, generalmente a través de referidos o publicidad.",
    "faucets.faq.q2": "¿Cuál es la diferencia entre faucets mainnet y testnet?",
    "faucets.faq.a2": "Los faucets testnet distribuyen tokens sin valor económico, esenciales para probar contratos inteligentes y dApps sin arriesgar capital real. Los faucets mainnet distribuyen criptomonedas reales (Satoshis, SOL, TRX) en cantidades pequeñas, generalmente como incentivo a través de links de referido.",
    "faucets.faq.q3": "¿Por qué algunos faucets de testnet me piden autenticar con mi wallet o cuenta?",
    "faucets.faq.a3": "Es una medida anti-bot. Muchos faucets ahora requieren que la wallet principal tenga un saldo mínimo en mainnet o que te autentiques vía GitHub, redes sociales o Gitcoin Passport. Esto no implica riesgo siempre y cuando el sitio solo lea tu dirección pública (read-only). Nunca firmes transacciones ni apruebes permisos en faucets.",
    "faucets.faq.q4": "¿Es seguro usar estos faucets?",
    "faucets.faq.a4": "Los faucets de testnet listados aquí son de fuentes reconocidas (Alchemy, Google Cloud, Chainlink, etc.). Para interactuar con cualquier faucet, la mejor práctica es usar una 'burner wallet': una billetera secundaria vacía creada exclusivamente para ese propósito. Nunca uses tu wallet principal con fondos reales.",
    "faucets.faq.q5": "¿Con qué frecuencia se actualiza este directorio?",
    "faucets.faq.a5": "El directorio se revisa mensualmente. Los ecosistemas de testnet cambian con frecuencia: algunas redes deprecan sus testnets (como Ethereum Goerli) y lanzan nuevas (Holesky, Hoodi). Si detectas un faucet caído o tienes una sugerencia, puedes reportarlo vía Telegram o X (@0xlenador).",



    // ─── PÁGINA: DIRECTORIO ───────────────────────────────────────────────
    "directory.seo.title":
      "Directorio Web3 | 0xLeñador — Exchanges, Wallets y Exploradores",
    "directory.seo.description":
      "Directorio curado de plataformas y recursos Web3 en uso activo: exchanges, wallets, exploradores de bloques, herramientas de análisis y faucets.",
    "directory.breadcrumb": "Hub / Directorio",
    "directory.heading": "Directorio",
    "directory.subheading": "Web3",
    "directory.intro":
      "Plataformas y recursos curados en uso operativo activo. Exchanges, wallets de custodia propia, exploradores de bloques, herramientas de análisis y acceso al directorio de faucets.",
    "directory.section.resources": "Recursos y Plataformas",
    "directory.section.subresources": "recursos",
    "directory.filter.all": "Todos",
    "directory.section.faucets": "Faucets Directory",
    "directory.faucets.total": "Faucets indexados",
    "directory.faucets.testnet": "Testnet (tokens de prueba)",
    "directory.faucets.mainnet": "Mainnet (con referido)",
    "directory.faucets.networks": "Redes más cubiertas",
    "directory.faucets.cta": "Ver directorio completo de Faucets",
    "directory.faq.heading": "Sobre el Directorio",
    "directory.faq.subheading": "Criterios de curación y uso operativo.",
    "directory.faq.title": "Preguntas del Directorio",
    "directory.faq.subtitle": "Criterios y recursos",
    "directory.faq.q1":
      "¿Qué criterios usa 0xLeñador para incluir un recurso en el directorio?",
    "directory.faq.a1":
      "Cada recurso debe estar en uso activo por 0xLeñador o haber sido evaluado directamente. Se priorizan plataformas con reputación comprobada, historial de seguridad limpio y relevancia operativa para el ecosistema Web3. No se incluyen proyectos sin track record o con señales de riesgo.",
    "directory.faq.q2": "¿Qué significa el badge 'patrocinado'?",
    "directory.faq.a2":
      "Indica que el enlace contiene un código de referido de 0xLeñador. Si te registras o compras a través de ese enlace, 0xLeñador puede recibir una comisión. Esto no afecta el precio que pagas ni implica un respaldo incondicional del servicio: la inclusión siempre está sujeta a los mismos criterios de calidad.",
    "directory.faq.q3": "¿Cómo puedo sugerir un recurso para el directorio?",
    "directory.faq.a3":
      "Puedes contactar a 0xLeñador a través de Telegram o X (@0xlenador). Los recursos sugeridos pasan por evaluación de seguridad y utilidad antes de ser añadidos. Las solicitudes con mayor demanda de la comunidad se priorizan.",


    // ─── PÁGINA: INTRÍNSECO ───────────────────────────────────────────────
    "intrinsic.seo.title":
      "Calculadora de Valor Intrínseco | Análisis Fundamental Graham y Buffett",
    "intrinsic.seo.description":
      "Calcula el valor real de tus acciones con precisión. Herramienta avanzada basada en la fórmula de Graham y el modelo de flujos descontados de Warren Buffett.",
    "intrinsic.schema.name": "Calculadora de Valor Intrínseco 0xLeñador",
    "intrinsic.schema.desc":
      "Calculadora avanzada para determinar el valor real de acciones mediante el modelo de Graham y Buffett.",
    // Nuevas llaves estructuradas (Intrínseco)
    "intrinsic.hero.title": "Calculadora de",
    "intrinsic.hero.accent": "Valor Intrínseco",
    "intrinsic.hero.breadcrumb": "Terminal de Análisis Fundamental",
    "intrinsic.desc": "Calcula el valor real de tus activos con precisión algorítmica.",
    "intrinsic.cards.title": "Entiende la Valoración",
    "intrinsic.cards.1.title": "¿Qué es el Valor Intrínseco?",
    "intrinsic.cards.1.desc":
      "Es el valor real de un activo basado en sus fundamentos económicos, ignorando el ruido actual del precio de mercado.",
    "intrinsic.cards.2.title": "¿Por qué usar Margen de Seguridad?",
    "intrinsic.cards.2.desc":
      "Para protegernos de errores de cálculo o imprevistos del mercado. Comprar por debajo del valor intrínseco es la base del Value Investing.",
    "intrinsic.footer.tag": "Financial Intelligence Engine",
    "intrinsic.faq.title": "Preguntas Frecuentes",
    "intrinsic.faq.subtitle": "Todo lo que necesitas saber sobre el análisis",
    "intrinsic.faq.q1": "¿Cuándo debo comprar una acción?",
    "intrinsic.faq.a1":
      "Idealmente cuando el precio de mercado esté un 20-30% por debajo del valor calculado (Margen de Seguridad). Esto reduce el riesgo de pérdida y aumenta el potencial de beneficio.",
    "intrinsic.faq.q2": "¿Qué EPS debo utilizar?",
    "intrinsic.faq.a2":
      "El EPS TTM (Trailing Twelve Months) es el estándar, aunque el EPS normalizado evita distorsiones por eventos únicos. Asegúrate de verificar si hay dilución de acciones reciente.",
    "intrinsic.faq.q3": "¿Qué tasa de descuento es recomendable?",
    "intrinsic.faq.a3":
      "Generalmente entre el 8% y el 12%, dependiendo del riesgo del sector y los tipos de interés actuales. Una tasa más alta refleja una mayor incertidumbre sobre los flujos futuros.",

    // ─── PÁGINA: RISKFOLIO ────────────────────────────────────────────────
    "riskfolio.seo.title":
      "Riskfolio | 0xLeñador — Distribución de Capital por Perfil de Riesgo",
    "riskfolio.seo.description":
      "Herramienta de asignación de capital basada en tu perfil de riesgo. Define cómo distribuir tu portafolio entre renta fija, cripto large-cap, altcoins y reserva de liquidez.",
    // Nuevas llaves estructuradas (Riskfolio)
    "riskfolio.hero.breadcrumb": "Herramientas / Riskfolio",
    "riskfolio.hero.title": "folio",
    "riskfolio.desc":
      "Modelo de distribución de capital basado en tu perfil de riesgo. Selecciona tu perfil, ingresa tu capital disponible y obtén la asignación sugerida para cada categoría de activos.",
    "riskfolio.cards.title": "Metodología del Modelo",
    "riskfolio.cards.desc": "Fundamentos conceptuales de Riskfolio y sus perfiles de distribución.",
    "riskfolio.faq.heading": "Metodología del Modelo",
    "riskfolio.faq.subheading":
      "Fundamentos conceptuales de Riskfolio y sus perfiles de distribución.",
    "riskfolio.faq.title": "Preguntas sobre Riskfolio",
    "riskfolio.faq.subtitle": "Dudas frecuentes del modelo",
    "riskfolio.faq.q1": "¿Por qué estructurar el capital según un perfil de riesgo?",
    "riskfolio.faq.a1":
      "Porque la diversificación no es simplemente comprar activos distintos, sino asignar capital de forma proporcional a tu tolerancia a la pérdida temporal y tu horizonte de inversión. Un perfil conservador prioriza la preservación del capital; uno agresivo acepta mayor volatilidad buscando retornos exponenciales a largo plazo.",
    "riskfolio.faq.q2": "¿Qué activos incluye cada categoría?",
    "riskfolio.faq.a2":
      "Renta Fija / ETFs incluye bonos del gobierno (US Treasuries, TES), ETFs indexados (SPY, QQQ) y depósitos a término. Cripto Large-Cap son Bitcoin (BTC) y Ethereum (ETH) por su mayor liquidez y madurez. Altcoins / DeFi comprende tokens de protocolos con alta volatilidad y asimetría (ej. SOL, LINK, tokens de gobernanza). Reserva es liquidez inmediata en stablecoins (USDC/USDT) o efectivo.",
    "riskfolio.faq.q3": "¿Riskfolio me recomienda qué comprar?",
    "riskfolio.faq.a3":
      "No. Es un modelo paramétrico de distribución macro. Te muestra los porcentajes de asignación por categoría de activo, no instrumentos específicos. Qué acciones, qué criptomonedas o qué bonos comprar dentro de cada categoría es tu responsabilidad tras hacer tu propia investigación (DYOR).",
    "riskfolio.faq.q4": "¿Con qué frecuencia debería rebalancear mi portafolio?",
    "riskfolio.faq.a4":
      "Depende del perfil. Como referencia general: el perfil conservador puede rebalancear anualmente. El moderado, cada 6 meses o cuando alguna categoría se desvíe más de un 5% de la asignación objetivo. El agresivo puede necesitar ajustes trimestrales dada la alta volatilidad de sus posiciones.",

    // Componente: Calculadora Riskfolio
    "riskfolio.calc.step1": "Paso 1 — Selecciona tu perfil de riesgo",
    "riskfolio.calc.step2": "Paso 2 — Capital total a distribuir (USD)",
    "riskfolio.calc.cons": "Conservador",
    "riskfolio.calc.cons.title": "Preservación de Capital",
    "riskfolio.calc.cons.desc": "Prioriza la estabilidad con exposición mínima a la volatilidad del mercado.",
    "riskfolio.calc.mod": "Moderado",
    "riskfolio.calc.mod.title": "Equilibrio Óptimo",
    "riskfolio.calc.mod.desc": "Balance entre preservación de riqueza y exposición a asimetrías de alto potencial.",
    "riskfolio.calc.agr": "Agresivo",
    "riskfolio.calc.agr.title": "Máxima Asimetría",
    "riskfolio.calc.agr.desc": "Alta exposición a criptoactivos de convexidad positiva. Mayor riesgo, mayor potencial.",
    "riskfolio.calc.allocation": "Asignación —",
    "riskfolio.calc.total": "Total",
    "riskfolio.calc.disclaimer": "Modelo paramétrico ilustrativo. No constituye asesoría financiera. DYOR.",
    "riskfolio.calc.asset.fixed": "Renta Fija / ETFs Tradicionales",
    "riskfolio.calc.asset.crypto": "Cripto Large-Cap (BTC, ETH)",
    "riskfolio.calc.asset.reserve": "Reserva (Stablecoins / Efectivo)",
    "riskfolio.calc.asset.alt": "Altcoins / DeFi / Asimetría",

    // ─── PÁGINA: PRIVACIDAD ───────────────────────────────────────────────
    "privacy.seo.title": "Privacidad y Cookies | 0xLeñador",
    "privacy.seo.description":
      "Protocolo de transparencia y privacidad de datos de 0xLeñador. Conoce cómo protegemos tu información.",
    "privacy.heading": "Privacidad",
    "privacy.heading.accent": "&",
    "privacy.heading.end": "Cookies",
    "privacy.subtitle": "Protocolo de Transparencia de Datos",
    "privacy.updated": "Última actualización: Marzo 2026",

    // ─── PÁGINA: TÉRMINOS ─────────────────────────────────────────────────
    "terms.seo.title": "Términos y Aviso Legal | 0xLeñador",
    "terms.seo.description":
      "Términos de uso, aviso legal y exención de responsabilidad financiera de 0xLeñador.",
    "terms.heading": "Términos",
    "terms.heading.accent": "&",
    "terms.heading.end": "Aviso Legal",
    "terms.subtitle": "Marco Operativo y Responsabilidad",
    "terms.updated": "Estado Operativo: V-1.0 | Marzo 2026",

    // ─── PÁGINA: SFL MERCADO ──────────────────────────────────────────────
    "sfl.seo.title":
      "Mercado SFL | 0xLeñador — Precios P2P de Sunflower Land",
    "sfl.seo.description":
      "Consulta en tiempo real los precios del mercado P2P de Sunflower Land. Monitorea volumen, ventas recientes y floor prices de items y wearables.",
    "sfl.breadcrumb": "Herramientas / Mercado",
    "sfl.heading": "Mercado On-Chain P2P de",
    "sfl.heading.accent": "Sunflower Land",
    "sfl.intro":
      "Descubre las mejores oportunidades de comercio con nuestro monitor avanzado en tiempo real. Analiza el historial de precios, volúmenes de transacciones y detecta instantáneamente cuáles recursos están en sobrecompra (ATH) o en su mejor precio histórico (ATL) dentro del ecosistema descentralizado de SFL.",
    "sfl.dashboard.title": "Dashboard Económico del Mercado SFL",
    "sfl.dashboard.topGainers": "MAYOR GANADOR 7D",
    "sfl.dashboard.nearAth": "CERCA DEL ATH (180D)",
    "sfl.slider.vol": " vol",
    "sfl.slider.topGainer.24h": "Mayor Ganador 24H",
    "sfl.slider.topGainer.30d": "Mayor Ganador 30D",
    "sfl.slider.topGainer.180d": "Mayor Ganador 180D",
    "sfl.slider.nearAtl": "Cerca de Mínimos (180D)",
    "sfl.slider.tooltip.ath": "del ATH",
    "sfl.slider.tooltip.atl": "del ATL",
    "sfl.faq.title": "Preguntas Frecuentes sobre el Mercado P2P",
    "sfl.faq.subtitle": "Todo lo que necesitas saber sobre el comercio descentralizado de recursos en SFL.",
    "sfl.faq.q1": "¿Qué es el Mercado P2P On-Chain de Sunflower Land?",
    "sfl.faq.a1": "El mercado P2P (Peer-to-Peer) de Sunflower Land es un sistema de comercio descentralizado donde los jugadores compran y venden recursos directamente entre ellos. Al ser \"On-Chain\", todas las transacciones quedan registradas de forma transparente en la blockchain de Polygon, lo que garantiza una economía libre dictada por la oferta y la demanda real de la comunidad.",
    "sfl.faq.q2": "¿Cómo se calculan los precios y el volumen mostrados en 0xLeñador?",
    "sfl.faq.a2": "Utilizamos la API pública oficial de Sunflower Land para extraer los precios suelo (Floor Price) en tiempo real. Nuestro algoritmo procesa el historial matemático de las últimas transacciones para generar gráficos de velas y calcular variaciones porcentuales exactas a 24 horas, 7 días, 30 días y hasta 180 días de antigüedad.",
    "sfl.faq.q3": "¿Qué significan las métricas ATH y ATL en los recursos agrícolas?",
    "sfl.faq.a3": "<strong>ATH (All-Time High):</strong> Representa el precio más alto que ha alcanzado un recurso. Si un ítem está \"Cerca del ATH\", significa que está en sobrecompra y podría ser un buen momento para vender. <br/><br/><strong>ATL (All-Time Low):</strong> Es el precio histórico más bajo. Los recursos \"Cerca de Mínimos\" están en el fondo de su curva de precio, representando excelentes oportunidades estratégicas de compra (fase de acumulación).",
    "sfl.faq.q4": "¿Con qué frecuencia se actualiza la tabla de precios?",
    "sfl.faq.a4": "La tabla y los gráficos del dashboard obtienen los datos directamente desde tu navegador al momento de cargar la página. Puedes presionar el botón de \"Refrescar\" en cualquier momento para volver a solicitar la información más reciente de la blockchain sin necesidad de recargar la web.",
    "sfl.faq.q5": "¿Es seguro usar este monitor como referencia de inversión?",
    "sfl.faq.a5": "Sí, esta herramienta está diseñada analíticamente para ayudarte a tomar mejores decisiones comerciales (trading) dentro de la economía de SFL. Sin embargo, el mercado de criptojuegos es altamente volátil. Usa esta información visualizada como apoyo estratégico antes de comerciar grandes volúmenes de SFL tokens.",
    "sfl.price.label": "$FLOWER Price",
    "sfl.loading": "Consultando API de SFL...",
    "sfl.error": "Error al cargar los datos.",
    "sfl.activity": "Actividad del Mercado",
    "sfl.refresh": "Refrescar",
    "sfl.search.label": "Buscar Item",
    "sfl.search.placeholder": "Ej. Sunflower, Axe...",
    "sfl.loading.price": "Cargando...",

    // ─── PÁGINA: ACTIVOS DETALLE [id] ─────────────────────────────────────
    "asset.section.definition": "Definición",
    "asset.section.genesis": "Génesis e Identidad",
    "asset.section.math": "Matemática del Activo",
    "asset.genesis.start": "Fecha de Inicio",
    "asset.genesis.creator": "Creador(es)",
    "asset.genesis.whitepaper": "Whitepaper",
    "asset.genesis.whitepaper.link": "VER PDF ->",
    "asset.math.supply": "Suministro Total",
    "asset.math.cycle": "Ciclo",
    "asset.hidden.title": "Dato Oculto",
    "asset.hidden.more": "Ver más",
    "asset.char.title": "Análisis de Carácter",
    "asset.arch.title": "Arquitectura Base del Protocolo",
    "asset.coming.soon": "Próximamente",

    // ─── COMPONENTES COMUNES ──────────────────────────────────────────────
    "component.faq.defaultTitle": "Preguntas Frecuentes",
    "component.premisa.badge": "Nuestra Premisa",
    "component.premisa.heading": "Involucrarse es la única",
    "component.premisa.heading.accent": "forma de mantener el carácter",
    "component.premisa.body":
      "La volatilidad del mercado expulsa a quienes operan basándose en emociones o en el ruido externo. Este Hub centraliza las herramientas, los directorios, el análisis de activos y las guías operativas del día a día. Validar la información en tu propio ecosistema te otorga la convicción necesaria para operar con frialdad matemática cuando otros dudan.",
    "component.premisa.quote":
      '"Vale más lo que comprendemos del proyecto que el capital que depositamos en él."',
    "component.premisa.terminal.label": "SISTEMA",
    "component.premisa.terminal.status": "ONLINE",
    "component.premisa.terminal.protocol": "Protocolo de ejecución:",
    "component.premisa.terminal.step1": "> Utilizar herramientas y calculadoras de precisión.",
    "component.premisa.terminal.step2": "> Filtrar directorios para interactuar con seguridad.",
    "component.premisa.terminal.step3": "> Analizar activos y registrar las operaciones.",
    "component.premisa.terminal.step4": "> Ejecutar cada movimiento con convicción.",
    // Language switcher
    "component.langSwitch.aria": "Cambiar idioma",

    // TickerSection
    "ticker.title": "Watchlist de activos en observación",
    "ticker.desc":
      "Seguimiento algorítmico y en tiempo real. Entender la volatilidad del mercado es el primer paso para ejecutar operaciones con frialdad matemática.",
    "ticker.cta": "> VER MÁS... →",

    // ─── PÁGINA: SFL COCINANDO ────────────────────────────────────────────
    "sfl.cooking.seo.title":
      "Cocina SFL | 0xLeñador — Calculadora de Recetas de Sunflower Land",
    "sfl.cooking.seo.description":
      "Consulta las recetas de cocina, la experiencia (XP) otorgada y el costo dinámico en SFL de los ingredientes basándose en el mercado P2P.",
    "sfl.cooking.breadcrumb": "Herramientas / Cocina",
    "sfl.cooking.heading": "Calculadora de",
    "sfl.cooking.heading.accent": "Recetas y Comida",
    "sfl.cooking.intro":
      "Calcula dinámicamente el costo en SFL de preparar alimentos dentro del juego basándote en el precio actual en vivo del mercado P2P. Descubre las recetas más rentables (XP/SFL) para subir de nivel a tus mascotas.",
    "sfl.cooking.filter.all": "Todas",
    "sfl.cooking.search.placeholder": "Buscar receta o ingrediente...",
    "sfl.cooking.loading": "Consultando P2P para calcular costos...",
    "sfl.cooking.empty": "No se encontraron recetas.",
    "sfl.cooking.error": "Error cargando precios.",
    "sfl.cooking.col.time": "Time:",
    "sfl.cooking.col.instant": "Instant:",

    // ─── PÁGINA: SFL MASCOTAS ─────────────────────────────────────────────
    "sfl.pets.seo.title":
      "Mascotas SFL | 0xLeñador — Guía de Mascotas de Sunflower Land",
    "sfl.pets.seo.description":
      "Descubre la lista completa de mascotas, sus requerimientos, recursos de energía y altares (Shrines) en Sunflower Land.",
    "sfl.pets.breadcrumb": "Herramientas / Mascotas",
    "sfl.pets.heading":
      "Calcula la rentabilidad de la comida de tus mascotas",
    "sfl.pets.subheading": "Conoce las comidas y premios de tus mascotas",
    "sfl.pets.calc.title": "Calculadora de Rentabilidad - Comida / P2P",
    "sfl.pets.calc.multipliers": "Multiplicadores",
    "sfl.pets.calc.walrus.bonus": "+5⚡ por Comida",
    "sfl.pets.calc.easy": "Petición Easy",
    "sfl.pets.calc.medium": "Petición Medium",
    "sfl.pets.calc.hard": "Petición Hard",
    "sfl.pets.calc.select.placeholder": "-- Seleccionar Comida --",
    "sfl.pets.calc.col.resource": "Recurso",
    "sfl.pets.calc.col.energy": "Energía / Precio P2P",
    "sfl.pets.calc.col.easy": "Easy Costo / Ganancia",
    "sfl.pets.calc.col.medium": "Medium Costo / Ganancia",
    "sfl.pets.calc.col.hard": "Hard Costo / Ganancia",
    "sfl.pets.calc.no.p2p": "No P2P",
    "sfl.pets.calc.na.info": "Falta info (N/A)",
    "sfl.pets.calc.cost.label": "Costo:",
    "sfl.pets.calc.loss": "(Pérdida)",
    "sfl.pets.calc.acorn.tip": "Idea: Construye Altares",
    "sfl.pets.calc.fossil.tip": "Idea: ¡Caja de sorpresas! Prueba suerte",
    "sfl.pets.intro":
      "Consulta todos los detalles, habilidades y requisitos de alimentación para las mascotas del ecosistema. Revisa los altares, los recursos energéticos y la comida que demanda cada rareza.",
    "sfl.pets.common.title": "Mascotas Comunes",
    "sfl.pets.common.variants": "Variantes",
    "sfl.pets.common.fetches": "Búsquedas (Fetches)",
    "sfl.pets.nft.title": "Mascotas NFT",
    "sfl.pets.nft.fetches": "Búsquedas (Fetches)",
    "sfl.pets.shrines.title": "Altares (Shrines)",
    "sfl.pets.shrines.col.altar": "Altar (Shrine)",
    "sfl.pets.shrines.col.resources": "Recursos",
    "sfl.pets.shrines.col.cost": "Costo Total",
    "sfl.pets.shrines.no.acorn": "El costo no incluye",
  },

  // ===========================================================================
  // INGLÉS
  // ===========================================================================
  en: {
    // Layout meta defaults
    "layout.title.default":
      "0xLeñador | Operational Hub · Web3 Tools & Terminal",
    "layout.description.default":
      "Functional repository of utilities, resource directory, and operations tracking across Web3 and traditional markets.",
    "layout.lang": "en",

    // ─── NAVIGATION ──────────────────────────────────────────────────────
    "nav.aria.label": "Main navigation",
    "nav.herramientas": "Tools",
    "nav.directorio": "Directory",
    "nav.activos": "Watchlist",
    "nav.operaciones": "Operations",
    "nav.blog": "Blog",
    // Sub-menus
    "nav.sub.riskfolio": "Riskfolio",
    "nav.sub.intrinseco": "Intrinsic",
    "nav.sub.sfl": "SFL P2P",
    "nav.sub.faucets": "Faucets",
    "nav.sub.bitcoin": "Bitcoin",
    "nav.sub.ethereum": "Ethereum",
    "nav.sub.sunflowerland": "Sunflower Land",
    "nav.sub.pets": "SFL Pets",
    "nav.sub.cooking": "SFL Cooking",
    "nav.sub.soneium": "Soneium",
    "nav.sub.polymarket": "Polymarket",
    // Mobile
    "nav.mobile.goTo": "Go to {label}",
    "nav.mobile.aria.button": "Open menu",

    // ─── FOOTER ──────────────────────────────────────────────────────────
    "footer.disclaimer":
      "All content shared on 0xLeñador is strictly for educational and informational purposes. It does not constitute financial advice, investment recommendation, or legal counsel. Invest using your own judgment and responsibility.",
    "footer.brand.description":
      "Operational Hub of tools, resource directory, and operations tracking across Web3 and traditional markets.",
    "footer.col.navegacion": "Navigation",
    "footer.col.comunidad": "Community",
    "footer.col.legal": "Legal",
    "footer.link.inicio": "Home",
    "footer.link.herramientas": "Tools",
    "footer.link.directorio": "Directory",
    "footer.link.activos": "Watchlist",
    "footer.link.operaciones": "Operations",
    "footer.link.blog": "Blog",
    "footer.link.privacidad": "Privacy & Cookies",
    "footer.link.terminos": "Terms & Legal Notice",
    "footer.copyright": "© 2026 0x Leñador • All Rights Reserved • Build in public",
    "footer.status": "Status: System Operational",
    "footer.live": "Live Data",

    // ─── PAGE: HOME (index) ───────────────────────────────────────────────
    "home.seo.title":
      "0xLeñador | Operational Hub — Web3 Tools, Assets & Operations",
    "home.seo.description":
      "0xLeñador's technical command center: analysis tools, asset watchlist, operations logbook, and Web3 resource directory across traditional and digital markets.",
    "home.schema.jobTitle": "Web3 Operator & Markets Researcher",
    "home.schema.description":
      "Operational Hub of tools, resource directory, and operations tracking across Web3 and traditional markets.",
    // Hero
    "home.hero.phrase1": "0xLeñador Operational Hub",
    "home.hero.phrase2": "Analysis tools",
    "home.hero.phrase3": "Web3 resource directory",
    "home.hero.phrase4": "Assets watchlist",
    "home.hero.phrase5": "Operations logbook",
    "home.hero.cta.primary": "Browse directory",
    "home.hero.cta.secondary": "Ops Logbook",
    // Sections
    "home.section.command": "Command Center",
    "home.section.guides": "Status: Operational Guides",
    "home.section.guides.viewAll": "View all →",
    "home.section.blog": "Latest from Blog",
    "home.section.blog.viewAll": "View all →",
    "home.blog.read": "Read article →",
    "home.footer.tagline": "Operational Hub · Build in Public",
    // Modules
    "home.module.herramientas.title": "Tools",
    "home.module.herramientas.desc": "Riskfolio, Intrinsic Value & Directories.",
    "home.module.herramientas.count": "3 utilities",
    "home.module.directorio.title": "Directory",
    "home.module.directorio.desc": "Curated exchanges, wallets, explorers & faucets.",
    "home.module.directorio.count": "50+ resources",
    "home.module.activos.title": "Watchlist",
    "home.module.activos.desc": "Watchlist of traditional and Web3 markets under tracking.",
    "home.module.activos.count": "6 assets",
    "home.module.operaciones.title": "Operations",
    "home.module.operaciones.desc": "Operational guides hub: airdrops, DeFi & gaming.",
    "home.module.operaciones.count.singular": "active guide",
    "home.module.operaciones.count.plural": "active guides",
    // FAQ Home
    "home.faq.title": "Frequently Asked Questions",
    "home.faq.subtitle": "About the Hub and methodology",
    "home.faq.q1": "What is 0xLeñador?",
    "home.faq.a1":
      "0xLeñador is a personal Operational Hub: a technical command center for tracking assets, logging operations, and hosting analysis tools across Web3 and traditional markets. It is not an advisory service or academy.",
    "home.faq.q2": "Does this site offer signals or buy recommendations?",
    "home.faq.a2":
      "No. All published content is strictly for educational, informational, and personal documentation purposes. Positions and guides shown in the logbook are personal operations documented for transparency — they do not represent buy or sell signals under any circumstance.",
    "home.faq.q3": "What will you find on our site?",
    "home.faq.a3":
      "You'll find a complete collection of Web3 utilities: risk management and calculation tools, a curated dApp directory, step-by-step operational guides (airdrops, DeFi, gaming), faucets, intrinsic value calculators, and the investment thesis that underpins the portfolio.",
    "home.faq.q4": "How often are the operational guides updated?",
    "home.faq.a4":
      "The Hub is constantly evolving. Airdrop, DeFi, and Gaming guides are updated regularly or as soon as protocols announce new missions, development phases, or important deadlines approach.",
    "home.faq.q5": "Are the listed links and dApps safe?",
    "home.faq.a5":
      "All directory entries and links provided in guides are manually curated pointing exclusively to official protocol sources. However, the Web3 ecosystem carries inherent risks; always practice good habits like revoking permissions regularly and using burner wallets for farming activities.",

    // ─── PAGE: 404 ────────────────────────────────────────────────────────
    "404.seo.title": "404 — Route Not Found | 0xLeñador",
    "404.seo.description":
      "The page you're looking for doesn't exist or was moved. Return to the home page to keep exploring the 0xLeñador ecosystem.",
    "404.badge": "Protocol Error",
    "404.heading": "Route not found in the protocol",
    "404.body":
      "The resource you're looking for doesn't exist, was moved, or was never indexed in our ecosystem. Check the URL or return to a safe route.",
    "404.terminal.label": "0xLeñador Terminal",
    "404.terminal.sys": "Initiating route search…",
    "404.terminal.err": "HTTP 404 · Resource not indexed",
    "404.terminal.fix": "Redirect to root route:",
    "404.btn.home": "Back to Home",
    "404.btn.back": "← Previous Route",
    "404.shortcuts.title": "Available Routes",

    // ─── PAGE: TOOLS ──────────────────────────────────────────────────────
    "tools.seo.title":
      "Tools | 0xLeñador — Web3 Utilities & Capital Analysis",
    "tools.seo.description":
      "Calculation models and structured analysis software for Web3: 60/40 Portfolio Simulator and Intrinsic Value Calculator (DCF). 100% local tools, no registration required.",
    "tools.breadcrumb": "Hub / Tools",
    "tools.heading": "Tools",
    "tools.subheading": "Center",
    "tools.intro":
      "Calculation models and structured analysis software to evaluate assets and distribute your portfolio. Tools designed to bring mathematical objectivity to your investment decisions, running locally and privately in your browser.",
    // Tool: Riskfolio
    "tools.riskfolio.title": "Riskfolio",
    "tools.riskfolio.desc":
      "Calculate the mathematical distribution of your investment portfolio based on your risk profile: Conservative, Moderate, or Aggressive.",
    "tools.riskfolio.badge": "Parametric Model",
    // Tool: Intrinsic Value
    "tools.intrinseco.title": "Intrinsic Value",
    "tools.intrinseco.desc":
      "Intrinsic value calculation terminal based on discounted cash flow (DCF). Evaluate whether an asset trades above or below its real value.",
    "tools.intrinseco.badge": "Calculator",
    // Tool: SFL Market
    "tools.sfl.title": "SFL Market",
    "tools.sfl.desc":
      "Check real-time P2P prices from the Sunflower Land ecosystem. Monitor items, wearables, and resources via its official API.",
    "tools.sfl.badge": "Live Dashboard",
    // Tool: SFL Pets
    "tools.sfl-mascotas.title": "SFL Pets Calculator",
    "tools.sfl-mascotas.desc":
      "Interactive P2P calculator and comprehensive guide to Sunflower Land pets. Evaluate whether to hold or sell based on market demand.",
    "tools.sfl-mascotas.badge": "P2P Calculator",
    // Tool: SFL Cooking
    "tools.sfl-cocinando.title": "SFL Cooking & Recipes",
    "tools.sfl-cocinando.desc":
      "Interactive recipe terminal to optimize experience (XP) farming.",
    "tools.sfl-cocinando.badge": "XP Dashboard",
    // FAQ Tools
    "tools.faq.title": "About the Tools",
    "tools.faq.subtitle": "Usage and availability",
    "tools.faq.q1": "What is the purpose of our tools center?",
    "tools.faq.a1":
      "The goal of this center is to provide mathematical models and structured calculators that eliminate subjectivity and emotional noise when evaluating assets. These tools are designed to help you structure a balanced portfolio and determine the real value of your investments using hard data.",
    "tools.faq.q2": "Why did we select these tools?",
    "tools.faq.a2":
      "Because they represent the two fundamental pillars of professional capital management: risk allocation (60/40 Simulator) and fundamental valuation (Intrinsic Value). Instead of overwhelming you with hundreds of useless indicators, we focus strictly on what works in daily institutional practice.",
    "tools.faq.q3": "Are my calculations private?",
    "tools.faq.a3":
      "Yes, absolutely. All 0xLeñador tools are built to operate 100% locally on your device (Client-Side). We use no databases, require no registration, and store no information. Once you close the tab, your calculations are gone.",
    "tools.faq.q4": "Are these tools financial recommendations?",
    "tools.faq.a4":
      "No. They are mathematical and analytical utilities. The Simulator and Calculator will give you results based on the numbers you input. It is your responsibility to do your own research (DYOR) and interpret the data according to your risk profile.",
    "tools.faq.q5": "Can I suggest new tools?",
    "tools.faq.a5":
      "Yes. If you have a tool you think would be useful for the community, you can reach out via Telegram or X (@0xlenador). The most in-demand suggestions are prioritized on the roadmap.",

    // ─── PAGE: DIRECTORY ──────────────────────────────────────────────────
    "directory.seo.title":
      "Web3 Directory | 0xLeñador — Exchanges, Wallets & Explorers",
    "directory.seo.description":
      "Curated directory of actively used Web3 platforms and resources: exchanges, wallets, block explorers, analytics tools, and faucets.",
    "directory.breadcrumb": "Hub / Directory",
    "directory.heading": "Directory",
    "directory.subheading": "Web3",
    "directory.intro":
      "Curated platforms and resources in active operational use. Exchanges, self-custody wallets, block explorers, analytics tools, and access to the faucets directory.",
    "directory.section.resources": "Resources & Platforms",
    "directory.section.subresources": "resources",
    "directory.filter.all": "All",
    "directory.section.faucets": "Faucets Directory",
    "directory.faucets.total": "Indexed faucets",
    "directory.faucets.testnet": "Testnet (test tokens)",
    "directory.faucets.mainnet": "Mainnet (with referral)",
    "directory.faucets.networks": "Most covered networks",
    "directory.faucets.cta": "View full Faucets directory",
    "directory.faq.heading": "About the Directory",
    "directory.faq.subheading": "Curation criteria and operational use.",
    "directory.faq.title": "Directory Questions",
    "directory.faq.subtitle": "Criteria and resources",
    "directory.faq.q1": "What criteria does 0xLeñador use to include a resource in the directory?",
    "directory.faq.a1":
      "Each resource must be in active use by 0xLeñador or have been directly evaluated. Priority is given to platforms with proven reputation, clean security history, and operational relevance to the Web3 ecosystem. Projects without a track record or showing risk signals are not included.",
    "directory.faq.q2": "What does the 'sponsored' badge mean?",
    "directory.faq.a2":
      "It indicates the link contains a 0xLeñador referral code. If you register or purchase through that link, 0xLeñador may receive a commission. This does not affect the price you pay nor implies unconditional endorsement of the service — inclusion is always subject to the same quality criteria.",
    "directory.faq.q3": "How can I suggest a resource for the directory?",
    "directory.faq.a3":
      "You can contact 0xLeñador via Telegram or X (@0xlenador). Suggested resources go through security and utility evaluation before being added. Requests with the highest community demand are prioritized.",

    // ─── PAGE: ASSETS ─────────────────────────────────────────────────────
    "assets.seo.title":
      "Assets | 0xLeñador — Watchlist of Traditional & Web3 Markets",
    "assets.seo.description":
      "Actively tracked assets watchlist: Bitcoin, Ethereum, S&P 500 ETFs, Berkshire Hathaway, and Hyperliquid. Tracking the 0xLeñador 60/40 investment thesis.",
    "assets.breadcrumb": "Hub / Assets",
    "assets.heading": "Assets",
    "assets.heading.accent": "Watchlist",
    "assets.intro":
      "Assets actively tracked in 0xLeñador's investment thesis. These are not buy signals — they are documented positions with technical and mathematical foundation.",
    "assets.section.title": "Under tracking",
    "assets.count": "assets",
    "assets.table.asset": "Asset",
    "assets.table.ticker": "Ticker",
    "assets.table.category": "Category",
    "assets.table.thesis": "Thesis",
    "assets.table.detail": "Detail",
    "assets.link.view": "View →",
    "assets.link.soon": "Soon",
    "assets.link.analysis": "View analysis →",
    "assets.link.full": "Full analysis →",
    // Watchlist data
    "assets.cat.cryptoL1": "Crypto L1",
    "assets.cat.dex": "DEX / Perps",
    "assets.cat.renta": "Equities",
    "assets.cat.ordinals": "Bitcoin Ordinals",
    "assets.cat.game": "Web3 Game",
    "assets.btc.desc": "Digital store of value. Core of financial decorrelation.",
    "assets.eth.desc": "Smart contract infrastructure and DeFi economy.",
    "assets.hype.desc": "L1 optimized for on-chain derivatives. Emerging ecosystem asymmetry.",
    "assets.spy.desc": "Traditional market benchmark. 60% of the structural portfolio.",
    "assets.brk.desc": "Intrinsic value and long-term wealth management.",
    "assets.rune.desc": "Ordinals and Runes economy asset. Total risk and high asymmetry.",
    "assets.sfl.desc": "Experimental on-chain economy. Garage phase — total risk.",
    // FAQ Assets
    "assets.faq.title": "About the Watchlist",
    "assets.faq.subtitle": "Asset tracking",
    "assets.faq.q1": "Are these assets a buy recommendation?",
    "assets.faq.a1":
      "No. The Watchlist reflects the assets 0xLeñador actively tracks in its own investment thesis. It is not a buy signal or personalized financial recommendation. Every investor should do their own research.",
    "assets.faq.q2": "What does 'Garage Phase' mean in the watchlist?",
    "assets.faq.a2":
      "These are highly speculative, total-asymmetry assets: they either go to zero or generate massive returns. Capital allocated to these assets is considered fully at risk and should never exceed what the investor can afford to lose completely.",
    "assets.faq.q3": "Why do Bitcoin and Ethereum have dedicated pages?",
    "assets.faq.a3":
      "They are the two highest-conviction, highest-weight assets in the thesis. They have enough technical analysis, resources, and context to justify a full page. Other assets are documented as the analysis matures.",
    "assets.faq.q4": "How often is the watchlist updated?",
    "assets.faq.a4":
      "The watchlist reflects active positions, not real-time prices. It is updated when there are structural changes to the thesis (entering, exiting, or reconfiguring a position), not with daily market volatility.",

    // ─── PAGE: OPERATIONS ─────────────────────────────────────────────────
    "ops.seo.title":
      "Operations | 0xLeñador — DeFi, Airdrop & Web3 Operational Guides",
    "ops.seo.description":
      "Step-by-step guides for day-to-day Web3 activities: airdrop farming, DeFi position management, on-chain gaming, and more. Documented with real resources and tools.",
    "ops.breadcrumb": "Hub / Operations",
    "ops.heading": "Operational",
    "ops.heading.accent": "Guides",
    "ops.intro":
      "Step-by-step documentation of day-to-day Web3 activities: airdrop farming, DeFi position management, on-chain gaming, and more. With real resources and tools.",
    "ops.stat.active": "Active guides",
    "ops.stat.total": "Total guides",
    "ops.stat.categories": "Categories",
    "ops.ui.priority": "PRIORITY GUIDE",
    "ops.ui.tracking": "TRACKING",
    "ops.ui.tag.mixed": "MIXED",
    "ops.ui.status.active": "Active",
    "ops.ui.diff.medium": "Medium difficulty",
    "ops.ui.time.week": "week",
    "ops.ui.time.day": "day",
    "ops.ui.cta.open": "Open guide",
    "ops.ui.cta.view": "View",
    "ops.ui.guides": "guides",
    "ops.banner.text": "Note: The detailed content of these operational guides is currently available only in Spanish. We are actively working on English versions. Thank you for your patience.",
    "ops.card.overlay": "Content available only in Spanish. We are working on the English version.",
    "ops.section.featured": "Priority guide",
    "ops.section.watching": "Under tracking",
    "ops.section.history": "History",
    "ops.empty": "// No active guides at the moment.",
    "ops.empty.soon":
      "Guides for Soneium, Sunflower Land, and other protocols will be added soon.",
    "ops.difficulty": "Difficulty {level}",
    "ops.open": "Open guide →",
    "ops.view": "View →",
    "ops.back": "Back to Operations",
    "ops.updated": "Updated {date}",
    "ops.reading": "{time} read",
    // Detail page
    "ops.detail.reading": "{time} read",
    "ops.detail.deadline": "Deadline:",
    "ops.detail.difficulty": "● Difficulty {level}",
    "ops.detail.breadcrumb.home": "Home",
    "ops.detail.breadcrumb.ops": "Operations",
    // FAQ Operations
    "ops.faq.title": "About the Guides",
    "ops.faq.subtitle": "Operations and activities",
    "ops.faq.q1": "Are these guides investment recommendations?",
    "ops.faq.a1":
      "No. The guides document the operations and activities 0xLeñador carries out in its own portfolio. They are activity records, not financial advice. Each user is responsible for their own capital and decisions.",
    "ops.faq.q2": "What is the difference between an 'Airdrop' and 'DeFi' operation?",
    "ops.faq.a2":
      "'Airdrop' guides document activities whose main goal is to accumulate points or future tokens from a protocol (farming). 'DeFi' guides focus on active management of liquidity positions, staking, or yields. A 'Mixed' category combines both — common in protocols requiring LP + social interaction.",
    "ops.faq.q3": "How often are the guides updated?",
    "ops.faq.a3":
      "Guides are updated when protocol conditions change (new seasons, quest changes, new platforms). The 'active' status indicates the guide corresponds to a current opportunity. 'Completed' means the season or campaign has ended.",
    "ops.faq.q4": "Why do some guides include wallet or exchange buttons?",
    "ops.faq.a4":
      "Each guide lists the required tools directly from the 0xLeñador Directory. If a link contains a referral, it is clearly indicated with the 'ref' label. The use of any specific platform is never forced.",
    // Guide statuses
    "ops.status.activa": "Active",
    "ops.status.completada": "Completed",
    "ops.status.expirada": "Expired",
    // Difficulty levels
    "ops.dificultad.baja": "Low",
    "ops.dificultad.media": "Medium",
    "ops.dificultad.alta": "High",

    // ─── PAGE: BLOG ───────────────────────────────────────────────────────
    "blog.seo.title": "Articles & Capital Research | 0xLeñador",
    "blog.seo.description":
      "Educational content, tokenomics, macroeconomic analysis, and fundamental investment theses in Web3.",
    "blog.header.label": "Research Logbook",
    "blog.header.h1": "Analysis",
    "blog.header.h1.accent": "& Capital Theses",
    "blog.header.intro":
      "Independent perspectives on wealth management, fundamental analysis of Web3 assets, and L1 economic modeling.",
    "blog.ui.eyebrow": "RESEARCH LOG",
    "blog.ui.title": "Analysis",
    "blog.ui.subtitle": "and Capital Thesis",
    "blog.ui.desc": "Independent perspectives on wealth management, fundamental analysis of Web3 assets, and economic modeling of L1s.",
    "blog.ui.mainCard": "MAIN ANALYSIS",
    "blog.ui.read": "READ",
    "blog.ui.cta": "Start reading ->",
    "blog.ui.past": "PREVIOUS RESEARCH",
    "blog.banner.text": "Note: Detailed research articles are currently available only in Spanish. We are actively working on English translations. Thank you for your patience.",
    "blog.card.overlay": "Article available only in Spanish. Working on the English version.",
    "blog.pipeline.item1.title": "Smart Contract Auditing: Security Filters for Burner Wallets",
    "blog.pipeline.item1.cat": "Security",
    "blog.pipeline.item1.desc": "How to read basic traces on Etherscan and detect malicious drain functions before interacting with a new protocol.",
    "blog.pipeline.item2.title": "Discounted Cash Flow (DCF) Applied to Settlement L1s",
    "blog.pipeline.item2.cat": "Modeling",
    "blog.pipeline.item2.desc": "Adapting traditional Benjamin Graham metrics to value real value capture from on-chain gas fees.",
    "blog.assets.btc.cat": "Hard Money / Reserve",
    "blog.assets.btc.thesis": "The base asset of absolute scarcity. Ultimate hedge against the debasement of traditional fiat currencies.",
    "blog.assets.eth.cat": "Settlement L1",
    "blog.assets.eth.thesis": "The global decentralized computer. Captures real fee value by burning its own supply.",
    "blog.article.share": "Share this article",
    "blog.featured.badge": "Featured Analysis",
    "blog.featured.reading": "{time} read",
    "blog.featured.cta": "Start reading",
    "blog.section.previous": "Previous Research",
    "blog.card.access": "Access →",
    "blog.card.reading": "{time} read",
    "blog.pipeline.label": "In Development",
    "blog.pipeline.title": "Research Pipeline",
    "blog.pipeline.desc":
      "Topics currently in financial modeling, code auditing, or fundamental macroeconomic analysis phase.",
    "blog.pipeline.planned": "Planned",
    "blog.monitor.label": "Dynamic Monitor",
    "blog.monitor.title": "Assets Under Tracking",
    "blog.monitor.desc":
      "A random sample of assets within 0xLeñador's research radar for this session.",
    "blog.monitor.access": "ACCESS ↗",
    // Assets in blog (thesis)
    "blog.btc.category": "Hard Money / Reserve",
    "blog.btc.thesis":
      "The absolute scarcity base asset. The definitive hedge against the debasement of traditional fiat currencies.",
    "blog.eth.category": "Settlement L1",
    "blog.eth.thesis":
      "The global decentralized computer. Captures real fee value by burning its own supply.",
    // Upcoming articles
    "blog.next1.title":
      "Smart Contract Auditing: Security Filters for Burner Wallets",
    "blog.next1.category": "Security",
    "blog.next1.desc":
      "How to read basic traces on Etherscan and detect malicious drain functions before interacting with a new protocol.",
    "blog.next2.title":
      "Discounted Cash Flow (DCF) Applied to L1 Settlement Platforms",
    "blog.next2.category": "Modeling",
    "blog.next2.desc":
      "Adapting Benjamin Graham's traditional metrics to value real fee capture from on-chain gas fees.",
    // FAQ Blog
    "blog.faq.title": "Frequently Asked Questions",
    "blog.faq.subtitle": "About the Research Logbook",
    "blog.faq.q1": "How often are articles published?",
    "blog.faq.a1":
      "There is no fixed frequency. Articles are published when the analysis is mature enough to share. Quality and technical rigor take priority over publication frequency.",
    "blog.faq.q2": "Are articles investment recommendations?",
    "blog.faq.a2":
      "No. All blog content is for educational and informational purposes. It does not constitute financial, legal, or tax advice. Each reader is responsible for their own investment decisions.",
    "blog.faq.q3": "Can I suggest a topic to research?",
    "blog.faq.a3":
      "Yes. You can send research suggestions via Telegram (@zero0xlenador) or X (@0xlenador). Topics with the highest demand and technical interest are prioritized in the research pipeline.",
    "blog.faq.q4": "What types of content are published?",
    "blog.faq.a4":
      "Primarily in-depth technical analyses, tool guides, and documented investment theses. No buy/sell signals, news summaries, or superficial opinion content are published.",
    // Individual article
    "blog.article.writtenBy": "Written by 0xLeñador",
    "blog.article.role": "Capital Management Educator",
    "blog.article.progress.aria": "Reading progress",
    "blog.article.toc.title": "Table of Contents",
    "blog.article.share.title": "Share",
    "blog.article.only.es.banner": "Note: This research is currently available only in Spanish.",
    "blog.article.only.es.link": "Read in Spanish →",

    // ─── PAGE: FAUCETS ────────────────────────────────────────────────────
    "faucets.seo.title":
      "Crypto Faucets Mainnet & Testnet | 0xLeñador — Free Tokens",
    "faucets.seo.description":
      "Complete directory of cryptocurrency faucets. Get test tokens for Ethereum Sepolia, Monad, Base, Solana and 30+ networks. Essential for Web3 development and airdrop farming.",
    "faucets.breadcrumb": "Directory / Faucets",
    "faucets.heading": "Faucets Directory",
    "faucets.heading.accent": "Mainnet & Testnet",
    "faucets.intro":
      "Explore all available cryptocurrency faucet websites in the blockchain ecosystem, accumulate free crypto to farm your airdrops and/or develop your projects.",
    "faucets.search.placeholder": "Search network... (Sepolia, Monad, Solana...)",
    "faucets.filter.all": "All",
    "faucets.filter.testnet": "Testnet",
    "faucets.filter.mainnet": "Mainnet",
    "faucets.faq.heading": "About Faucets",
    "faucets.faq.subheading": "Usage guide and security best practices.",
    "faucets.faq.title": "Faucet Questions",
    "faucets.faq.subtitle": "Usage, security & updates",
    "faucets.faq.q1": "What is a cryptocurrency faucet?",
    "faucets.faq.a1":
      "It is a service that distributes small amounts of tokens for free. Testnet faucets are essential for Web3 development: they allow you to pay gas and test smart contracts without risking real capital. Mainnet faucets distribute real cryptocurrencies in very small amounts, usually through referrals or advertising.",
    "faucets.faq.q2": "What is the difference between mainnet and testnet faucets?",
    "faucets.faq.a2":
      "Testnet faucets distribute tokens with no economic value, essential for testing smart contracts and dApps without risking real capital. Mainnet faucets distribute real cryptocurrencies (Satoshis, SOL, TRX) in small amounts, usually as an incentive through referral links.",
    "faucets.faq.q3": "Why do some testnet faucets ask me to authenticate with my wallet or account?",
    "faucets.faq.a3":
      "It is an anti-bot measure. Many faucets now require that your main wallet has a minimum mainnet balance or that you authenticate via GitHub, social networks, or Gitcoin Passport. This does not imply risk as long as the site only reads your public address (read-only). Never sign transactions or approve permissions on faucets.",
    "faucets.faq.q4": "Is it safe to use these faucets?",
    "faucets.faq.a4":
      "The testnet faucets listed here are from recognized sources (Alchemy, Google Cloud, Chainlink, etc.). When interacting with any faucet, best practice is to use a 'burner wallet': an empty secondary wallet created exclusively for that purpose. Never use your main wallet with real funds.",
    "faucets.faq.q5": "How often is this directory updated?",
    "faucets.faq.a5":
      "The directory is reviewed monthly. Testnet ecosystems change frequently: some networks deprecate their testnets (like Ethereum Goerli) and launch new ones (Holesky, Hoodi). If you spot a down faucet or have a suggestion, you can report it via Telegram or X (@0xlenador).",

    // ─── PAGE: INTRINSIC VALUE ────────────────────────────────────────────
    "intrinsic.seo.title":
      "Intrinsic Value Calculator | Fundamental Analysis Graham & Buffett",
    "intrinsic.seo.description":
      "Calculate the real value of your stocks with precision. Advanced tool based on Graham's formula and Warren Buffett's discounted cash flow model.",
    "intrinsic.schema.name": "0xLeñador Intrinsic Value Calculator",
    "intrinsic.schema.desc":
      "Advanced calculator to determine the real value of stocks using the Graham & Buffett model.",
    // New structured keys (Intrinsic)
    "intrinsic.hero.title": "Intrinsic Value",
    "intrinsic.hero.accent": "Calculator",
    "intrinsic.hero.breadcrumb": "Fundamental Analysis Terminal",
    "intrinsic.desc": "Calculate the real value of your assets with algorithmic precision.",
    "intrinsic.cards.title": "Understand Valuation",
    "intrinsic.cards.1.title": "What is Intrinsic Value?",
    "intrinsic.cards.1.desc":
      "It is the real value of an asset based on its economic fundamentals, ignoring the current noise of market price.",
    "intrinsic.cards.2.title": "Why use a Margin of Safety?",
    "intrinsic.cards.2.desc":
      "To protect ourselves from calculation errors or market surprises. Buying below intrinsic value is the foundation of Value Investing.",
    // Calculator Translation Keys
    "calculator.eps.label": "EPS (Earnings Per Share)",
    "calculator.growth.label": "Growth (g %)",
    "calculator.fcf.label": "Free Cash Flow",
    "calculator.millions.label": "Millions",
    "calculator.growth.adv.label": "Growth %",
    "calculator.discount.label": "Discount Rate %",
    "calculator.shares.label": "Total Shares",
    "calculator.margin.label": "Margin of Safety",
    "calculator.button.label": "Execute Algorithm",
    "calculator.target.label": "Target Price",
    "calculator.target.sublabel": "Target Price Multi-Asset",
    "calculator.status.label": "Terminal Status",
    "calculator.status.completed": "Analysis Completed",
    "calculator.script.processing": "Processing...",
    "calculator.script.graham.title": "Graham Target",
    "calculator.script.graham.desc": "Quick fundamental estimation based on current net income.",
    "calculator.script.buffett.title": "Buffett Target",
    "calculator.script.buffett.desc": "Advanced DCF calculation with discounted cash flows and margin of safety.",
    "intrinsic.footer.tag": "Financial Intelligence Engine",
    "intrinsic.faq.title": "Frequently Asked Questions",
    "intrinsic.faq.subtitle": "Everything you need to know about the analysis",
    "intrinsic.faq.q1": "When should I buy a stock?",
    "intrinsic.faq.a1":
      "Ideally when the market price is 20-30% below the calculated value (Margin of Safety). This reduces the risk of loss and increases the potential for gain.",
    "intrinsic.faq.q2": "What EPS should I use?",
    "intrinsic.faq.a2":
      "The TTM (Trailing Twelve Months) EPS is the standard, although normalized EPS avoids distortions from one-time events. Make sure to verify if there has been recent share dilution.",
    "intrinsic.faq.q3": "What discount rate is recommended?",
    "intrinsic.faq.a3":
      "Generally between 8% and 12%, depending on the sector risk and current interest rates. A higher rate reflects greater uncertainty about future cash flows.",

    // ─── PAGE: RISKFOLIO ──────────────────────────────────────────────────
    "riskfolio.seo.title":
      "Riskfolio | 0xLeñador — Capital Distribution by Risk Profile",
    "riskfolio.seo.description":
      "Capital allocation tool based on your risk profile. Define how to distribute your portfolio across fixed income, large-cap crypto, altcoins, and liquidity reserve.",
    // New structured keys (Riskfolio)
    "riskfolio.hero.breadcrumb": "Tools / Riskfolio",
    "riskfolio.hero.title": "folio",
    "riskfolio.desc":
      "Capital distribution model based on your risk profile. Select your profile, enter your available capital, and get the suggested allocation for each asset category.",
    "riskfolio.cards.title": "Model Methodology",
    "riskfolio.cards.desc": "Conceptual foundations of Riskfolio and its distribution profiles.",
    "riskfolio.faq.heading": "Model Methodology",
    "riskfolio.faq.subheading":
      "Conceptual foundations of Riskfolio and its distribution profiles.",
    "riskfolio.faq.title": "Riskfolio Questions",
    "riskfolio.faq.subtitle": "Frequently asked questions about the model",
    "riskfolio.faq.q1": "Why structure capital according to a risk profile?",
    "riskfolio.faq.a1":
      "Because diversification is not simply buying different assets, but allocating capital proportionally to your tolerance for temporary loss and your investment horizon. A conservative profile prioritizes capital preservation; an aggressive one accepts greater volatility seeking exponential long-term returns.",
    "riskfolio.faq.q2": "What assets does each category include?",
    "riskfolio.faq.a2":
      "Fixed Income / ETFs includes government bonds (US Treasuries, TES), indexed ETFs (SPY, QQQ), and term deposits. Crypto Large-Cap covers Bitcoin (BTC) and Ethereum (ETH) for their greater liquidity and maturity. Altcoins / DeFi includes high-volatility, high-asymmetry protocol tokens (e.g., SOL, LINK, governance tokens). Reserve is immediate liquidity in stablecoins (USDC/USDT) or cash.",
    "riskfolio.faq.q3": "Does Riskfolio recommend what to buy?",
    "riskfolio.faq.a3":
      "No. It is a parametric macro distribution model. It shows you allocation percentages by asset category, not specific instruments. What stocks, cryptocurrencies, or bonds to buy within each category is your responsibility after doing your own research (DYOR).",
    "riskfolio.faq.q4": "How often should I rebalance my portfolio?",
    "riskfolio.faq.a4":
      "It depends on the profile. As a general reference: the conservative profile can rebalance annually. The moderate one every 6 months or when a category deviates more than 5% from the target allocation. The aggressive one may need quarterly adjustments given the high volatility of its positions.",

    // Component: Riskfolio Calculator
    "riskfolio.calc.step1": "Step 1 — Select your risk profile",
    "riskfolio.calc.step2": "Step 2 — Total capital to allocate (USD)",
    "riskfolio.calc.cons": "Conservative",
    "riskfolio.calc.cons.title": "Capital Preservation",
    "riskfolio.calc.cons.desc": "Prioritizes stability with minimal exposure to market volatility.",
    "riskfolio.calc.mod": "Moderate",
    "riskfolio.calc.mod.title": "Optimal Balance",
    "riskfolio.calc.mod.desc": "Balance between wealth preservation and exposure to high-potential asymmetries.",
    "riskfolio.calc.agr": "Aggressive",
    "riskfolio.calc.agr.title": "Maximum Asymmetry",
    "riskfolio.calc.agr.desc": "High exposure to positive convexity crypto assets. Higher risk, higher potential.",
    "riskfolio.calc.allocation": "Allocation —",
    "riskfolio.calc.total": "Total",
    "riskfolio.calc.disclaimer": "Illustrative parametric model. Does not constitute financial advice. DYOR.",
    "riskfolio.calc.asset.fixed": "Fixed Income / Traditional ETFs",
    "riskfolio.calc.asset.crypto": "Large-Cap Crypto (BTC, ETH)",
    "riskfolio.calc.asset.reserve": "Reserves (Stablecoins / Cash)",
    "riskfolio.calc.asset.alt": "Altcoins / DeFi / Asymmetric",

    // ─── PAGE: PRIVACY ────────────────────────────────────────────────────
    "privacy.seo.title": "Privacy & Cookies | 0xLeñador",
    "privacy.seo.description":
      "Data transparency and privacy protocol of 0xLeñador. Learn how we protect your information.",
    "privacy.heading": "Privacy",
    "privacy.heading.accent": "&",
    "privacy.heading.end": "Cookies",
    "privacy.subtitle": "Data Transparency Protocol",
    "privacy.updated": "Last updated: March 2026",

    // ─── PAGE: TERMS ──────────────────────────────────────────────────────
    "terms.seo.title": "Terms & Legal Notice | 0xLeñador",
    "terms.seo.description":
      "Terms of use, legal notice, and financial liability disclaimer of 0xLeñador.",
    "terms.heading": "Terms",
    "terms.heading.accent": "&",
    "terms.heading.end": "Legal Notice",
    "terms.subtitle": "Operational Framework & Liability",
    "terms.updated": "Operational Status: V-1.0 | March 2026",

    // ─── PAGE: SFL MARKET ─────────────────────────────────────────────────
    "sfl.seo.title": "SFL Market | 0xLeñador — Sunflower Land P2P Prices",
    "sfl.seo.description":
      "Check real-time prices from the Sunflower Land P2P market. Monitor volume, recent sales, and floor prices of items and wearables.",
    "sfl.breadcrumb": "Tools / Market",
    "sfl.heading": "On-Chain P2P Market of",
    "sfl.heading.accent": "Sunflower Land",
    "sfl.intro":
      "Discover the best trading opportunities with our advanced real-time monitor. Analyze price history, transaction volumes, and instantly detect which resources are near their all-time high (ATH) or historical best price (ATL) within the decentralized SFL ecosystem.",
    "sfl.dashboard.title": "SFL Market Economic Dashboard",
    "sfl.dashboard.topGainers": "TOP GAINER 7D",
    "sfl.dashboard.nearAth": "NEAR ATH (180D)",
    "sfl.slider.vol": " vol",
    "sfl.slider.topGainer.24h": "Top Gainer 24H",
    "sfl.slider.topGainer.30d": "Top Gainer 30D",
    "sfl.slider.topGainer.180d": "Top Gainer 180D",
    "sfl.slider.nearAtl": "Near Lows (180D)",
    "sfl.slider.tooltip.ath": "from ATH",
    "sfl.slider.tooltip.atl": "from ATL",
    "sfl.faq.title": "Frequently Asked Questions about the P2P Market",
    "sfl.faq.subtitle": "Everything you need to know about decentralized resource trading in SFL.",
    "sfl.faq.q1": "What is the On-Chain P2P Market in Sunflower Land?",
    "sfl.faq.a1": "The Sunflower Land P2P (Peer-to-Peer) market is a decentralized trading system where players buy and sell resources directly with each other. Being \"On-Chain\", all transactions are transparently recorded on the Polygon blockchain, ensuring a free economy dictated by the community's real supply and demand.",
    "sfl.faq.q2": "How are the prices and volume shown on 0xLeñador calculated?",
    "sfl.faq.a2": "We use the official public Sunflower Land API to extract real-time floor prices. Our algorithm processes the mathematical history of the latest transactions to generate candlestick charts and calculate exact percentage variations for 24 hours, 7 days, 30 days, and up to 180 days.",
    "sfl.faq.q3": "What do the ATH and ATL metrics mean in agricultural resources?",
    "sfl.faq.a3": "<strong>ATH (All-Time High):</strong> Represents the highest price a resource has reached. If an item is \"Near ATH\", it means it is overbought and it could be a good time to sell. <br/><br/><strong>ATL (All-Time Low):</strong> It is the lowest historical price. Resources \"Near Lows\" are at the bottom of their price curve, representing excellent strategic buying opportunities (accumulation phase).",
    "sfl.faq.q4": "How often is the price table updated?",
    "sfl.faq.a4": "The dashboard table and charts fetch data directly from your browser when the page loads. You can press the \"Refresh\" button at any time to request the latest blockchain information without reloading the website.",
    "sfl.faq.q5": "Is it safe to use this monitor as an investment reference?",
    "sfl.faq.a5": "Yes, this tool is analytically designed to help you make better trading decisions within the SFL economy. However, the crypto gaming market is highly volatile. Use this visualized information as strategic support before trading large volumes of SFL tokens.",
    "sfl.price.label": "$FLOWER Price",
    "sfl.loading": "Querying SFL API...",
    "sfl.error": "Error loading data.",
    "sfl.activity": "Market Activity",
    "sfl.refresh": "Refresh",
    "sfl.search.label": "Search Item",
    "sfl.search.placeholder": "e.g. Sunflower, Axe...",
    "sfl.loading.price": "Loading...",

    // ─── PAGE: ASSET DETAIL [id] ──────────────────────────────────────────
    "asset.section.definition": "Definition",
    "asset.section.genesis": "Genesis & Identity",
    "asset.section.math": "Asset Mathematics",
    "asset.genesis.start": "Launch Date",
    "asset.genesis.creator": "Creator(s)",
    "asset.genesis.whitepaper": "Whitepaper",
    "asset.genesis.whitepaper.link": "VIEW PDF ->",
    "asset.math.supply": "Total Supply",
    "asset.math.cycle": "Cycle",
    "asset.hidden.title": "Hidden Fact",
    "asset.hidden.more": "Read more",
    "asset.char.title": "Character Analysis",
    "asset.arch.title": "Protocol Base Architecture",
    "asset.coming.soon": "Coming Soon",

    // ─── COMMON COMPONENTS ────────────────────────────────────────────────
    "component.faq.defaultTitle": "Frequently Asked Questions",
    "component.premisa.badge": "Our Premise",
    "component.premisa.heading": "Getting involved is the only",
    "component.premisa.heading.accent": "way to maintain conviction",
    "component.premisa.body":
      "Market volatility weeds out those who operate based on emotions or external noise. This Hub centralizes the tools, directories, asset analysis, and day-to-day operational guides. Validating information within your own ecosystem gives you the conviction needed to act with mathematical composure when others hesitate.",
    "component.premisa.quote":
      '"What we understand about the project matters more than the capital we put into it."',
    "component.premisa.terminal.label": "SYSTEM",
    "component.premisa.terminal.status": "ONLINE",
    "component.premisa.terminal.protocol": "Execution protocol:",
    "component.premisa.terminal.step1": "> Use precision tools and calculators.",
    "component.premisa.terminal.step2": "> Filter directories to interact safely.",
    "component.premisa.terminal.step3": "> Analyze assets and log operations.",
    "component.premisa.terminal.step4": "> Execute every move with conviction.",
    // Language switcher
    "component.langSwitch.aria": "Switch language",

    // TickerSection
    "ticker.title": "Assets Watchlist",
    "ticker.desc":
      "Algorithmic and real-time tracking. Understanding market volatility is the first step to executing operations with mathematical composure.",
    "ticker.cta": "> VIEW MORE... →",

    // ─── PAGE: SFL COOKING ────────────────────────────────────────────────
    "sfl.cooking.seo.title":
      "SFL Cooking | 0xLeñador — Sunflower Land Recipe Calculator",
    "sfl.cooking.seo.description":
      "Look up cooking recipes, the XP granted, and the dynamic SFL cost of ingredients based on live P2P market prices.",
    "sfl.cooking.breadcrumb": "Tools / Cooking",
    "sfl.cooking.heading": "Recipe &",
    "sfl.cooking.heading.accent": "Food Calculator",
    "sfl.cooking.intro":
      "Dynamically calculate the SFL cost of preparing food in-game based on the current live P2P market price. Discover the most profitable recipes (XP/SFL) for leveling up your pets.",
    "sfl.cooking.filter.all": "All",
    "sfl.cooking.search.placeholder": "Search recipe or ingredient...",
    "sfl.cooking.loading": "Querying P2P to calculate costs...",
    "sfl.cooking.empty": "No recipes found.",
    "sfl.cooking.error": "Error loading prices.",
    "sfl.cooking.col.time": "Time:",
    "sfl.cooking.col.instant": "Instant:",

    // ─── PAGE: SFL PETS ───────────────────────────────────────────────────
    "sfl.pets.seo.title":
      "SFL Pets | 0xLeñador — Sunflower Land Pet Guide",
    "sfl.pets.seo.description":
      "Discover the full list of pets, their requirements, energy resources, and Shrines in Sunflower Land.",
    "sfl.pets.breadcrumb": "Tools / Pets",
    "sfl.pets.heading":
      "Calculate the profitability of food for your pets",
    "sfl.pets.subheading": "Learn your pets' food rewards and bonuses",
    "sfl.pets.calc.title": "Profitability Calculator - Food / P2P",
    "sfl.pets.calc.multipliers": "Multipliers",
    "sfl.pets.calc.walrus.bonus": "+5⚡ per Food",
    "sfl.pets.calc.easy": "Easy Request",
    "sfl.pets.calc.medium": "Medium Request",
    "sfl.pets.calc.hard": "Hard Request",
    "sfl.pets.calc.select.placeholder": "-- Select Food --",
    "sfl.pets.calc.col.resource": "Resource",
    "sfl.pets.calc.col.energy": "Energy / P2P Price",
    "sfl.pets.calc.col.easy": "Easy Cost / Profit",
    "sfl.pets.calc.col.medium": "Medium Cost / Profit",
    "sfl.pets.calc.col.hard": "Hard Cost / Profit",
    "sfl.pets.calc.no.p2p": "No P2P",
    "sfl.pets.calc.na.info": "Missing info (N/A)",
    "sfl.pets.calc.cost.label": "Cost:",
    "sfl.pets.calc.loss": "(Loss)",
    "sfl.pets.calc.acorn.tip": "Tip: Build Shrines",
    "sfl.pets.calc.fossil.tip": "Tip: Mystery Box! Try your luck",
    "sfl.pets.intro":
      "Explore all the details, abilities, and feeding requirements for the ecosystem's pets. Review shrines, energy resources, and the food each rarity demands.",
    "sfl.pets.common.title": "Common Pets",
    "sfl.pets.common.variants": "Variants",
    "sfl.pets.common.fetches": "Fetches",
    "sfl.pets.nft.title": "NFT Pets",
    "sfl.pets.nft.fetches": "Fetches",
    "sfl.pets.shrines.title": "Shrines",
    "sfl.pets.shrines.col.altar": "Shrine",
    "sfl.pets.shrines.col.resources": "Resources",
    "sfl.pets.shrines.col.cost": "Total Cost",
    "sfl.pets.shrines.no.acorn": "Cost excludes",
  },
} as const

export type UiKey = keyof typeof ui[typeof defaultLang]
