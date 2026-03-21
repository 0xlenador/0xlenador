// assets/js/main.js

/**
 * Lógica universal para acordeones (FAQ)
 * Funciona para IDs con prefijo (Home) o sin él (Otras páginas)
 */
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

// Mantenemos esta función para no romper index.html
function toggleHomeFaq(id) {
    toggleFaq(id, true);
}