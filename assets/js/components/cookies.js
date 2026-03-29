// assets/js/components/cookies.js

export function loadCookies() {
    // Si ya aceptó, no hacer nada
    if (localStorage.getItem('cookies-aceptadas')) {
        return;
    }

    const bannerHTML = `
    <div id="cookie-banner" class="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl backdrop-blur-md shadow-2xl z-50 reveal">
        <div class="flex items-start gap-4">
            <div class="text-emerald-500 mt-1">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <div>
                <p class="text-xs text-slate-300 leading-relaxed">
                    Utilizamos cookies para analizar el tráfico y mejorar tu experiencia con nuestras herramientas financieras. 
                    <a href="privacidad.html" class="text-emerald-400 hover:underline">Leer más</a>.
                </p>
                <button id="accept-cookies-btn" class="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-colors">
                    Entendido
                </button>
            </div>
        </div>
    </div>
    `;

    // Inyectar el HTML al final del body
    document.body.insertAdjacentHTML('beforeend', bannerHTML);

    // Configurar el evento del botón
    const btn = document.getElementById('accept-cookies-btn');
    btn.addEventListener('click', () => {
        localStorage.setItem('cookies-aceptadas', 'true');
        document.getElementById('cookie-banner').remove();
    });
}