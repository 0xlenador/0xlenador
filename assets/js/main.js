// assets/js/main.js

// Lógica de FAQ: Funciona para todas las páginas
function toggleFaq(id, isHome = false) {
    const prefix = isHome ? 'h-' : '';
    const ans = document.getElementById(`${prefix}ans-${id}`);
    const icon = document.getElementById(`${prefix}icon-${id}`);
    
    if (!ans || !icon) return;

    if (ans.style.maxHeight === "0px" || !ans.style.maxHeight) {
        ans.style.maxHeight = ans.scrollHeight + "px";
        icon.style.transform = "rotate(45deg)";
        icon.classList.add('text-emerald-400');
    } else {
        ans.style.maxHeight = "0px";
        icon.style.transform = "rotate(0deg)";
        icon.classList.remove('text-emerald-400');
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