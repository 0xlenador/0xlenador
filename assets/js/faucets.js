// assets/js/faucets.js

// --- 1. LISTA DE DATOS ---
const faucets = [
    { name: "Superchain", url: "https://console.optimism.io/faucet", img: "./assets/img/cripto/optimism.jpg", type: "testnet", tags: ["Optimism sepolia", "Unichain Sepolia", "Minato Sepolia", "Zora Sepolia", "Lisk Sepolia", "Metal Sepolia", "Shape Sepolia", "Interop Devnet 0", "Base Sepolia", "Ink Sepolia", "Worldchain Sepolia", "Mode Sepolia", "Cyber Sepolia", "BOB Sepolia", "Sepolia", "Interop Devnet 1"] },
    { name: "Circle (USDC – EURC)", url: "https://faucet.circle.com/", img: "./assets/img/cripto/circle.png", type: "testnet", tags: ["Ethereum Sepolia", "Algorand Testnet", "Aptos Testnet", "Arbitrum Sepolia", "Avalanche Fuji", "Base Sepolia", "Celo Alfajores", "Hedera Testnet", "Near Testnet", "Noble Testnet", "Optimism Sepolia", "Polkadot Westend", "Polygon PoS Amoy", "Solana Devnet", "Sui Testnet", "Unichain Sepolia", "Stellar Testnet", "ZKsync Sepolia"] },
    { name: "Alchemy", url: "https://www.alchemy.com/faucets/ethereum-sepolia", img: "./assets/img/cripto/alchemy.jpg", type: "testnet", tags: ["Ethereum Sepolia", "Ethereum Holesky", "Base Sepolia", "Optimism Sepolia", "Arbitrum Sepolia", "Polygon PoS Amoy", "Starknet Sepolia", "ZKSync Sepolia", "World Chain Sepolia", "Soneium Minato", "CrossFi Testnet", "Lens Sepolia", "Lumia Testnet", "Syndicate Exo", "Gensyn Testnet", "Shape Sepolia", "Monad Testnet", "Humanity Testnet"] },
    { name: "Freebitcoin", url: "https://freebitco.in/?r=55277595", img: "./assets/img/cripto/bitcoin.jpg", type: "mainnet", tags: ["Bitcoin (BTC)"] },
    { name: "Google Cloud Web3", url: "https://cloud.google.com/application/web3/faucet", img: "./assets/img/cripto/google.jpg", type: "testnet", tags: ["ZetaChain Testnet", "Injective Testnet", "MANTRA Dukong", "PYUSD Ethereum Sepolia", "PYUSD Solana Devnet", "Ethereum Sepolia", "Ethereum Holešky", "Story Aeneid Testnet"] },
    { name: "Quicknode", url: "https://faucet.quicknode.com/drip", img: "./assets/img/cripto/quicknode.jpg", type: "testnet", tags: ["Ethereum Goerli", "Ethereum Holesky", "Ethereum Sepolia", "Polygon Mumbai", "Polygon zkEVM Goerli", "Polygon amoy", "Binance Smart Chain Testnet", "Optimism Sepolia", "Optimism Goerli", "Arbitrum Sepolia", "Arbitrum Goerli", "Avalanche Fuji", "Solana Devnet", "Solana Testnet", "Base Sepolia", "Base Goerli"] },
    { name: "Binance Faucet", url: "http://bnbchain.org/en/testnet-faucet", img: "./assets/img/cripto/binance.jpg", type: "testnet", tags: ["Binance Smart Chain Testnet"] },
    { name: "Chainlink", url: "https://faucets.chain.link/", img: "./assets/img/cripto/chainlink.jpg", type: "testnet", tags: ["Binance Smart Chain Testnet", "Avalanche Fuji", "Fantom Testnet", "Ethereum Sepolia", "Base Sepolia", "Celo Alfajores Testnet", "Scroll Sepolia Testnet", "Polygon Amoy", "Arbitrum Sepolia", "Optimism Sepolia"] },
    { name: "PoWFaucet pk910", url: "https://faucets.pk910.de/", img: "./assets/img/cripto/fauceth420.jpg", type: "testnet", tags: ["Ethereum Hoodi", "Ethereum Holesky", "Ethereum Sepolia", "Ethereum Ephemery"] },
    { name: "Faucet Trade", url: "https://faucet.trade/", img: "./assets/img/cripto/faucettrade.jpg", type: "testnet", tags: ["0G Galileo Testnet", "MegaETH Testnet", "Monad Testnet", "SaharaAI Testnet", "Somnia Shannon", "Berachain Bepolia", "Soneium Minato Sepolia", "Ethereum Holesky", "Morph Holesky", "Ethereum Sepolia", "Blast Sepolia", "Polygon Amoy", "Binance Smart Chain Testnet", "Avalanche Fuji"] },
    { name: "Metamask", url: "https://docs.metamask.io/developer-tools/faucet/", img: "./assets/img/cripto/metamask.jpg", type: "testnet", tags: ["Ethereum Sepolia", "Linea Sepolia"] },
    { name: "Tronpick", url: "https://tronpick.io/?ref=0xdegenerados", img: "./assets/img/cripto/tronpick.png", type: "mainnet", tags: ["TRON (TRX)"] },
    { name: "Ethereum-Ecosystem", url: "https://www.ethereum-ecosystem.com/faucets/", img: "./assets/img/cripto/ethereum.jpg", type: "testnet", tags: ["Ethereum Sepolia", "Optimism Sepolia", "Base Sepolia", "Mode Sepolia", "Ethereum Holesky"] },
    { name: "Core", url: "https://core.app/tools/testnet-faucet/", img: "./assets/img/cripto/core.jpg", type: "testnet", tags: ["Avalanche Fuji", "DeFi Kingdoms Testnet", "Numbers Testnet", "Dispatch AWM Testnet", "Echo AWM Testnet", "Beam Testnet", "MXS Games", "Eclipse", "Orange", "PLYR TAU", "ONIGIRI", "KiteAI Testnet", "Myth Games", "Bitcoin L1 Testnet", "Soshi L1", "GOOD CARE"] },
    { name: "Nerzo", url: "https://faucet.nerzo.xyz/", img: "./assets/img/cripto/nerzo.jpg", type: "testnet", tags: ["Monad Testnet"] },
    { name: "Cryptopump", url: "https://cryptopump.info/send.php", img: "./assets/img/cripto/cryptopump.jpg", type: "testnet", tags: ["Bitcoin Testnet 3"] },
    { name: "OKX", url: "https://web3.okx.com/es-la/faucet", img: "./assets/img/cripto/okx.jpg", type: "testnet", tags: ["Sahara AI", "Monad Testnet", "Pharos Tesnet", "Nubit", "Fiamma Chain", "BEVM"] },
    { name: "Morkie", url: "https://faucet.morkie.xyz/", img: "./assets/img/cripto/morkie.jpg", type: "testnet", tags: ["Monad Testnet", "Ethereum Sepolia", "Base Sepolia"] },
    { name: "Solana Faucet", url: "https://faucet.solana.com/", img: "./assets/img/cripto/solana.jpg", type: "testnet", tags: ["Solana Devnet", "Solana Testnet"] },
    { name: "BNB Discord", url: "https://discord.com/channels/789402563035660308/1099937267021250560", img: "./assets/img/cripto/binance.jpg", type: "testnet", tags: ["Binance Smart Chain Testnet"] },
    { name: "Bitcoin Testnet Faucet", url: "https://bitcoinfaucet.uo1.net/send.php", img: "./assets/img/cripto/bitcointestnet.png", type: "testnet", tags: ["Bitcoin Testnet 3"] },
    { name: "Coinfaucet", url: "https://coinfaucet.eu/en/btc-testnet/", img: "./assets/img/cripto/bitcoin2.png", type: "testnet", tags: ["Bitcoin Testnet 3"] },
    { name: "Claim FreeSol", url: "https://claimfreesol.com/eYbdKPYn", img: "./assets/img/cripto/claiimfreesol.jpg", type: "mainnet", tags: ["Solana (SOL)"] },
    { name: "Betterclaimsol", url: "https://betterclaimsol.xyz?referral_code=i2dFMCy5", img: "./assets/img/cripto/betterclaimsol.jpg", type: "mainnet", tags: ["Solana (SOL)"] },
    { name: "HoodRun", url: "https://faucet.hoodscan.io/", img: "./assets/img/cripto/hoodrun.jpg", type: "testnet", tags: ["Ethereum Sepolia", "Ethereum Holesky", "Stride Testnet", "Stargaze Testnet"] },
    { name: "Solfaucet", url: "https://solfaucet.com/", img: "./assets/img/cripto/solfaucet.png", type: "testnet", tags: ["Solana Devnet", "Solana Testnet"] },
    { name: "MegaETH", url: "https://testnet.megaeth.com/", img: "./assets/img/cripto/megaeth.jpg", type: "testnet", tags: ["MegaETH Testnet"] },
    { name: "0G Faucet", url: "https://faucet.0g.ai/", img: "./assets/img/cripto/0glabs.png", type: "testnet", tags: ["0G Galileo Testnet"] },
    { name: "Rollercoin", url: "https://rollercoin.com/?r=mbh9s06l", img: "./assets/img/cripto/rollercoin.png", type: "mainnet", tags: ["Rollertoken (RLT)", "Bitcoin (BTC)", "Solana (SOL)", "Dogecoin (DOGE)", "Tron (TRX)", "Ripple (XRP)", "Ethereum (ETH)", "Binance coin (BNB)"] },
    { name: "Gas zip", url: "https://www.gas.zip/", img: "./assets/img/cripto/gaszip.jpg", type: "testnet", tags: ["Monad Faucet", "MegaETH Faucet", "Somnia Faucet", "Sepolia Faucet", "Pharos Faucet", "CAMP Faucet", "Incentiv Faucet", "RISE Faucet"] },
    { name: "Solpick", url: "https://solpick.io/?ref=Felipe_Vargas", img: "./assets/img/cripto/solpick.png", type: "mainnet", tags: ["Solana (SOL)"] },
    { name: "Tonpick", url: "https://tonpick.game/?ref=0xlenador", img: "./assets/img/cripto/tonpick.png", type: "mainnet", tags: ["Toncoin (TON)"] },
    { name: "FreeShib", url: "https://freeshib.in?ref=4K5JN2uxSE", img: "./assets/img/cripto/freeshib.jpg", type: "mainnet", tags: ["Shiba Inu (SHIBA)"] },
    { name: "Campnetwork", url: "https://faucet.campnetwork.xyz/", img: "./assets/img/cripto/campnetwork.jpg", type: "testnet", tags: ["CAMP Testnet"] }
];

// --- 2. LÓGICA DE FUNCIONAMIENTO ---
let activeTab = 'all';

// Función para inicializar la página
export function initFaucetsPage() {
    renderFaucets();

    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => applyFilters());
    }

    // Configurar clics en pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setTab(e.target.dataset.filter, e.target);
        });
    });
}

function renderFaucets() {
    const listContainer = document.getElementById('list');
    if (!listContainer) return;

    listContainer.innerHTML = faucets.map(faucet => `
        <div class="item-card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl hover:border-${faucet.type === 'mainnet' ? 'amber' : 'emerald'}-500/30 transition group" data-type="${faucet.type}">
            <div class="flex items-center gap-4 mb-4">
                <img src="${faucet.img}" class="w-10 h-10 rounded-full border border-slate-700 shadow-lg">
                <div class="flex flex-col">
                    <a href="${faucet.url}" target="_blank" class="text-white font-bold hover:text-${faucet.type === 'mainnet' ? 'amber' : 'emerald'}-400 transition flex items-center gap-1 text-lg">
                        ${faucet.name} <span class="text-xs opacity-50">↗</span>
                    </a>
                    <span class="text-[10px] uppercase tracking-widest ${faucet.type === 'mainnet' ? 'text-amber-500' : 'text-emerald-500'} font-semibold">
                        ${faucet.type.toUpperCase()}
                    </span>
                </div>
            </div>
            <div class="flex flex-wrap gap-2">
                ${faucet.tags.map(tag => `<span class="tag bg-slate-950 text-slate-400 text-[11px] px-2 py-1 rounded-md border border-slate-800 transition">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function setTab(type, btn) {
    activeTab = type;
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active-tab');
        b.classList.add('text-slate-500');
    });
    btn.classList.add('active-tab');
    btn.classList.remove('text-slate-500');
    applyFilters();
}

function applyFilters() {
    const q = document.getElementById('search').value.toLowerCase().trim();
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