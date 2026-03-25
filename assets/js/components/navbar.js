// assets/js/components/navbar.js

export function loadNavbar() {
    const navbarHTML = `
    <div class="max-w-6xl mx-auto px-6">
        <nav class="py-6 flex justify-between items-center relative" aria-label="Navegación principal">
            <div class="text-2xl font-bold tracking-tighter text-white z-50">
                <a href="./index.html" class="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded-md">
                    <img src="./assets/img/56x.webp" alt="Logo 0xLeñador" class="w-8 h-8 object-contain" />
                    <span class="leading-none">0x<span class="text-emerald-500 italic">Leñador</span></span>
                </a>
            </div>

            <button id="mobile-menu-button" 
                    aria-expanded="false" 
                    aria-controls="mobile-menu" 
                    class="md:hidden text-slate-400 hover:text-white focus:outline-none z-50 focus-visible:ring-2 focus-visible:ring-emerald-400">
                <svg id="menu-icon" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path id="menu-path" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
            </button>

            <div class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
                <a href="./faucets.html" class="hover:text-emerald-400 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded-md">Faucets</a>
                <a href="./intrinseco.html" class="hover:text-emerald-400 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded-md">Intrínseco</a>
                <a href="https://0xlenador.blogspot.com" target="_blank" rel="noopener" class="hover:text-emerald-400 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded-md">Blog</a>
                <a href="https://www.youtube.com/@0xlenadorgamefi" target="_blank" rel="noopener" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition ml-4 focus-visible:ring-2 focus-visible:ring-emerald-400">YouTube</a>
            </div>

            <div id="mobile-menu" class="hidden absolute top-full left-0 right-0 bg-slate-950 border-b border-slate-900 p-6 flex flex-col space-y-4 md:hidden z-40 shadow-2xl">
                <a href="./faucets.html" class="text-slate-400 hover:text-emerald-400 text-lg">Faucets</a>
                <a href="./intrinseco.html" class="text-slate-400 hover:text-emerald-400 text-lg">Intrínseco</a>
                <a href="https://0xlenador.blogspot.com" target="_blank" rel="noopener" class="text-slate-400 hover:text-emerald-400 text-lg">Blog</a>
                <a href="https://www.youtube.com/@0xlenadorgamefi" target="_blank" rel="noopener" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-center font-bold">YouTube</a>
            </div>
        </nav>
    </div>`;

    const container = document.getElementById('navbar-container');
    if (container) {
        container.innerHTML = navbarHTML;

        const btn = document.getElementById('mobile-menu-button');
        const menu = document.getElementById('mobile-menu');
        const path = document.getElementById('menu-path');

        if (!btn || !menu || !path) return;

        const toggleMenu = (forceClose = false) => {
            const isClosing = forceClose || !menu.classList.contains('hidden');
            if (isClosing) {
                menu.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
                path.setAttribute('d', 'M4 6h16M4 12h16m-7 6h7');
            } else {
                menu.classList.remove('hidden');
                btn.setAttribute('aria-expanded', 'true');
                path.setAttribute('d', 'M6 18L18 6M6 6l12 12');
            }
        };

        // 1. Clic en el botón hamburguesa
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic se propague al documento inmediatamente
            toggleMenu();
        });

        // 2. Cerrar al presionar la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
                toggleMenu(true);
                btn.focus();
            }
        });

        // 3. NUEVO: Cerrar al hacer clic fuera del menú o del botón
        document.addEventListener('click', (e) => {
            const isMenuOpen = !menu.classList.contains('hidden');
            if (isMenuOpen && !menu.contains(e.target) && !btn.contains(e.target)) {
                toggleMenu(true);
            }
        });

        // 4. Cerrar automáticamente al hacer clic en un enlace del menú
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => toggleMenu(true));
        });
    }
}