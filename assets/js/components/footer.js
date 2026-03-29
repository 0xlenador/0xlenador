export function loadFooter() {
    const footerHTML = `
    <footer class="mt-40 border-t border-slate-900 bg-slate-950 py-16 px-6">
        <div class="max-w-6xl mx-auto">
            <div class="mb-12 pb-8 border-b border-slate-900/50">
                <p class="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] text-center md:text-left leading-relaxed">
                    <b class="text-slate-500 font-bold">Disclaimer:</b> Todo el contenido compartido en 0xLeñador tiene fines estrictamente educativos y de entretenimiento. No constituye asesoría financiera.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div class="space-y-4">
                    <div class="text-2xl font-bold tracking-tighter text-white">
                        0x<span class="text-emerald-500 italic">Leñador</span>
                    </div>
                    <p class="text-slate-500 text-sm leading-relaxed max-w-xs">
                        Navegando entre inversiones tradicionales y disruptivas.
                        Análisis independiente y gestión de capital multiactivo.
                    </p>
                </div>

                <div class="flex flex-col gap-3">
                    <h4 class="text-white font-bold text-xs uppercase tracking-widest mb-2">Mapa del sitio</h4>
                    <a href="./index.html" class="text-slate-500 hover:text-emerald-400 text-sm transition w-fit">Inicio</a>
                    <a href="./faucets.html" class="text-slate-500 hover:text-emerald-400 text-sm transition w-fit">Faucets</a>
                    <a href="./intrinseco.html" class="text-slate-500 hover:text-emerald-400 text-sm transition w-fit">Valor Intrínseco</a>
                    <a href="https://0xlenador.blogspot.com" target="_blank" class="text-slate-500 hover:text-emerald-400 text-sm transition w-fit">Blog Estratégico</a>
                </div>

                <div class="flex flex-col gap-3">
                    <h4 class="text-white font-bold text-xs uppercase tracking-widest mb-2">Comunidad</h4>
                    <a href="https://www.youtube.com/@0xlenadorgamefi" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition group">
                        <span class="p-1 bg-slate-900 rounded group-hover:bg-emerald-500/20 transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span> YouTube
                    </a>
                    <a href="https://t.me/zero0xlenador" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition group">
                        <span class="p-1 bg-slate-900 rounded group-hover:bg-emerald-500/20 transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0C5.346 0 0 5.346 0 11.944s5.346 11.944 11.944 11.944 11.944-5.346 11.944-11.944S18.542 0 11.944 0zm5.206 8.19l-1.78 8.385c-.134.6-.49.746-.994.464l-2.712-2.002-1.308 1.258c-.144.144-.265.265-.544.265l.195-2.766 5.035-4.547c.218-.195-.048-.304-.338-.11l-6.224 3.92-2.68-.838c-.58-.182-.593-.58.122-.857l10.475-4.037c.484-.182.908.108.76.81z"/></svg></span> Telegram
                    </a>
                    <a href="https://x.com/0xlenador" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition group">
                        <span class="p-1 bg-slate-900 rounded group-hover:bg-emerald-500/20 transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z"/></svg></span> X (Twitter)
                    </a>
                    <a href="https://discord.gg/6QaVvzrn" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition group">
                        <span class="p-1 bg-slate-900 rounded group-hover:bg-emerald-500/20 transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.₀99 18.₀57a.₀8₂.₀8₂ ₀ ₀₈₂ .₀₃₁ .₀₅₇ ₁₉.₉₁₉ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵗ ᵜ
                    </a>
                    <a href="https://www.facebook.com/0xlenador/" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition group">
                        <span class="p-1 bg-slate-900 rounded group-hover:bg-emerald-500/20 transition"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></span> Facebook
                    </a>
                </div>

                <div class="flex flex-col gap-3">
                    <h4 class="text-white font-bold text-xs uppercase tracking-widest mb-2">Legal</h4>
                    <a href="./privacidad.html" class="text-slate-500 hover:text-emerald-400 text-sm transition w-fit">Privacidad & Cookies</a>
                    <a href="./terminos.html" class="text-slate-500 hover:text-emerald-400 text-sm transition w-fit">Términos & Aviso Legal</a>
                </div>
            </div>

            <div class="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-slate-600 text-[10px] uppercase tracking-widest font-mono">
                    &copy; 2026 0x Leñador • Derechos Reservados • Build in public
                </p>
                <div class="flex gap-6">
                    <span class="text-[10px] text-slate-700 font-mono uppercase tracking-tighter">Status: System Operational</span>
                    <span class="text-[10px] text-emerald-500/50 font-mono animate-pulse uppercase">● Live Data</span>
                </div>
            </div>
        </div>
    </footer>`;
    document.getElementById('footer-container').innerHTML = footerHTML;
}