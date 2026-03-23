// assets/js/main.js

// Lógica de FAQ: Funciona para todas las páginas
function toggleFaq(id) {
    const ans = document.getElementById(`ans-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    // Buscamos el botón que activó la función
    const btn = document.querySelector(`button[onclick*="toggleFaq(${id})"]`);
    
    if (!ans || !icon || !btn) return;

    const isOpening = ans.style.maxHeight === "0px" || !ans.style.maxHeight;

    if (isOpening) {
        ans.style.maxHeight = ans.scrollHeight + "px";
        icon.style.transform = "rotate(45deg)";
        icon.classList.add('text-emerald-400');
        // Accesibilidad
        btn.setAttribute('aria-expanded', 'true');
        ans.setAttribute('aria-hidden', 'false');
    } else {
        ans.style.maxHeight = "0px";
        icon.style.transform = "rotate(0deg)";
        icon.classList.remove('text-emerald-400');
        // Accesibilidad
        btn.setAttribute('aria-expanded', 'false');
        ans.setAttribute('aria-hidden', 'true');
    }
}



// MOTOR DE FILTRADO REUTILIZABLE (Para Faucets, Exchanges, etc.)
function applyFilterEngine(query, activeTab) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll('.item-card');

    cards.forEach(card => {
        const type = card.getAttribute('data-type');
        const tags = card.querySelectorAll('.tag');
        let hasQueryMatch = false;
        let tabMatch = (activeTab === 'all' || type === activeTab);

        tags.forEach(t => {
            const txt = t.innerText.toLowerCase();
            if (q !== "" && txt.includes(q)) {
                t.classList.add('highlight');
                t.classList.remove('dimmed');
                hasQueryMatch = true;
            } else if (q !== "") {
                t.classList.remove('highlight');
                t.classList.add('dimmed');
            } else {
                t.classList.remove('highlight', 'dimmed');
            }
        });

        if (tabMatch && (q === "" || hasQueryMatch)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}