export function loadNavbar() {
    const navbarHTML = `
    <nav class="p-6 flex justify-between items-center max-w-6xl mx-auto" aria-label="Navegación principal">
        <div class="text-2xl font-bold tracking-tighter text-white">
            <a href="./index.html" class="flex items-center gap-3 group" title="Ir al inicio de 0xLeñador">
                <img src="./assets/img/44.png" alt="Logo 0xLeñador" class="w-8 h-8 object-contain" />
                <span class="leading-none">0x<span class="text-emerald-500 italic">Leñador</span></span>
            </a>
        </div>
        <div class="space-x-6 text-sm font-medium text-slate-400">
            <a href="./faucets.html" class="hover:text-emerald-400 transition">Faucets</a>
            <a href="./intrinseco.html" class="hover:text-emerald-400 transition">Intrínseco</a>
            <a href="https://0xlenador.blogspot.com" target="_blank" rel="noopener" class="hover:text-emerald-400 transition">Blog</a>
            <a href="https://www.youtube.com/@0xlenadorgamefi" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition">YouTube</a>
        </div>
    </nav>`;
    document.getElementById('navbar-container').innerHTML = navbarHTML;
}