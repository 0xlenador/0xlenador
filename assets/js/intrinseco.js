// assets/js/intrinseco.js

let currentMode = 'basic';

export function initIntrinsicPage() {
    // 1. Listener para el margen de seguridad (Slider)
    const marginSlider = document.getElementById('adv-margin');
    if (marginSlider) {
        marginSlider.addEventListener('input', (e) => {
            document.getElementById('margin-label').innerText = e.target.value + '%';
        });
    }

    // 2. Listeners para los botones de modo (Graham / Buffett)
    const btnBasic = document.getElementById('btn-basic');
    const btnAdv = document.getElementById('btn-advanced');

    if (btnBasic && btnAdv) {
        btnBasic.addEventListener('click', () => setMode('basic'));
        btnAdv.addEventListener('click', () => setMode('advanced'));
    }

    // 3. Listener para el botón de calcular
    const calcButton = document.getElementById('calc-button');
    if (calcButton) {
        calcButton.addEventListener('click', () => calculate());
    }

    // 4. NUEVO: Listener para calcular al presionar "Enter"
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Evita comportamientos extraños del navegador
                calculate();
            }
        });
    });
}

function setMode(mode) {
    currentMode = mode;
    const btnBasic = document.getElementById('btn-basic');
    const btnAdv = document.getElementById('btn-advanced');
    const formBasic = document.getElementById('form-basic');
    const formAdv = document.getElementById('form-advanced');
    const resultArea = document.getElementById('result-area');

    resultArea.classList.add('hidden');

    if (mode === 'basic') {
        btnBasic.classList.add('active-tab');
        btnAdv.classList.remove('active-tab');
        btnAdv.classList.add('text-slate-500');
        formBasic.classList.remove('hidden');
        formAdv.classList.add('hidden');
    } else {
        btnAdv.classList.add('active-tab');
        btnBasic.classList.remove('active-tab');
        btnBasic.classList.add('text-slate-500');
        formAdv.classList.remove('hidden');
        formBasic.classList.add('hidden');
    }
}

function highlightError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('ring-2', 'ring-rose-500', 'border-rose-500');
        // Quitamos el resaltado después de 2 segundos
        setTimeout(() => {
            el.classList.remove('ring-2', 'ring-rose-500', 'border-rose-500');
        }, 2000);
    }
}

function calculate() {
    const resultArea = document.getElementById('result-area');
    const finalPrice = document.getElementById('final-price');
    const finalDesc = document.getElementById('final-desc');
    const statusText = document.getElementById('status-text');
    const calcButton = document.getElementById('calc-button');

    // 1. Identificar qué campos validar según el modo activo
    let hasError = false;
    
    if (currentMode === 'basic') {
        const epsInput = document.getElementById('basic-eps');
        const growthInput = document.getElementById('basic-growth');
        
        if (!epsInput.value) { highlightError('basic-eps'); hasError = true; }
        if (!growthInput.value) { highlightError('basic-growth'); hasError = true; }
    } else {
        const advFields = ['adv-fcf', 'adv-growth', 'adv-discount', 'adv-shares'];
        advFields.forEach(id => {
            const input = document.getElementById(id);
            if (!input.value) {
                highlightError(id);
                hasError = true;
            }
        });
    }

    // 2. Si hay error, detenemos el proceso
    if (hasError) {
        calcButton.innerText = "Ejecutar Algoritmo";
        calcButton.disabled = false;
        return; 
    }

    calcButton.disabled = true;
    calcButton.innerText = "Procesando...";
    resultArea.classList.add('hidden');

    setTimeout(() => {
        let result = 0;

        if (currentMode === 'basic') {
            const eps = parseFloat(document.getElementById('basic-eps').value);
            const growth = parseFloat(document.getElementById('basic-growth').value);

            if (isNaN(eps) || isNaN(growth)) {
                calcButton.disabled = false;
                calcButton.innerText = "Ejecutar Algoritmo";
                return;
            }
            // Fórmula de Graham
            result = eps * (8.5 + (2 * growth));
            statusText.innerText = "Target Graham";
            finalDesc.innerText = "Estimación fundamental rápida basada en el beneficio neto actual.";
        } else {
            let fcf = parseFloat(document.getElementById('adv-fcf').value);
            const growth = parseFloat(document.getElementById('adv-growth').value) / 100;
            const discount = parseFloat(document.getElementById('adv-discount').value) / 100;
            let shares = parseFloat(document.getElementById('adv-shares').value);
            const margin = parseFloat(document.getElementById('adv-margin').value) / 100;

            if (isNaN(fcf) || isNaN(growth) || isNaN(discount) || isNaN(shares)) {
                calcButton.disabled = false;
                calcButton.innerText = "Ejecutar Algoritmo";
                return;
            }

            // Lógica de Unidades (Millones)
            if (document.getElementById('fcf-millions-toggle').checked) fcf *= 1000000;
            if (document.getElementById('shares-millions-toggle').checked) shares *= 1000000;

            let totalPV = 0;
            let currentFCF = fcf;
            for (let i = 1; i <= 5; i++) {
                currentFCF *= (1 + growth);
                totalPV += currentFCF / Math.pow((1 + discount), i);
            }
            const terminalVal = (currentFCF * 1.025) / (discount - 0.025);
            const terminalPV = terminalVal / Math.pow((1 + discount), 5);
            const intrinsicPerShare = (totalPV + terminalPV) / shares;
            result = intrinsicPerShare * (1 - margin);

            statusText.innerText = "Target Buffett";
            finalDesc.innerText = "Cálculo DCF avanzado con descuento de flujos y margen de seguridad.";
        }

        const formattedPrice = `$${result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        finalPrice.innerText = formattedPrice;
        finalPrice.title = formattedPrice;

        resultArea.classList.remove('hidden');
        calcButton.disabled = false;
        calcButton.innerText = "Ejecutar Algoritmo";

        resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);

}