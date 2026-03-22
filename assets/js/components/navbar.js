export function loadNavbar() {
    const navbarHTML = `
    <div class="max-w-6xl mx-auto px-6">
        <nav class="py-6 flex justify-between items-center relative" aria-label="Navegación principal">
            <div class="text-2xl font-bold tracking-tighter text-white z-50">
                <a href="./index.html" class="flex items-center gap-3 group">
                    <img src="./assets/img/44.webp" alt="Logo 0xLeñador" class="w-8 h-8 object-contain" />
                    <span class="leading-none">0x<span class="text-emerald-500 italic">Leñador</span></span>
                </a>
            </div>

            <button id="mobile-menu-button" class="md:hidden text-slate-400 hover:text-white focus:outline-none z-50">
                <svg id="menu-icon" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
            </button>

            <div class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
                <a href="./faucets.html" class="hover:text-emerald-400 transition">Faucets</a>
                <a href="./intrinseco.html" class="hover:text-emerald-400 transition">Intrínseco</a>
                <a href="https://0xlenador.blogspot.com" target="_blank" rel="noopener" class="hover:text-emerald-400 transition">Blog</a>
                <a href="https://www.youtube.com/@0xlenadorgamefi" target="_blank" rel="noopener" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition ml-4">YouTube</a>
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
        const icon = document.getElementById('menu-icon');

        if (btn && menu && icon) {
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
                if (menu.classList.contains('hidden')) {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>';
                } else {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
                }
            });
        }
    }
}