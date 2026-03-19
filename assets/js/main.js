// faqs - preguntas frecuentes
function toggleHomeFaq(id) {
    const ans = document.getElementById(`h-ans-${id}`);
    const icon = document.getElementById(`h-icon-${id}`);

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
