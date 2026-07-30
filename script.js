// ==========================================================================
// WISECONVERT PRO — ENGINE JAVASCRIPT FINTECH
// ==========================================================================

// BANCO DE DADOS DE MOEDAS COM SUPORTE EXTENDIDO
const CURRENCIES = {
    BRL: { name: 'Real Brasileiro', flag: '🇧🇷', symbol: 'R$', locale: 'pt-BR' },
    USD: { name: 'Dólar Americano', flag: '🇺🇸', symbol: '$', locale: 'en-US' },
    EUR: { name: 'Euro', flag: '🇪🇺', symbol: '€', locale: 'de-DE' },
    GBP: { name: 'Libra Esterlina', flag: '🇬🇧', symbol: '£', locale: 'en-GB' },
    CAD: { name: 'Dólar Canadense', flag: '🇨🇦', symbol: 'C$', locale: 'en-CA' },
    BTC: { name: 'Bitcoin', flag: '₿', symbol: '₿', locale: 'en-US' }
};

// ESTADO GLOBAL DA APLICAÇÃO
let currentFrom = 'BRL';
let currentTo = 'USD';
let activeModalTarget = null; // 'from' ou 'to'

let ratesInBRL = {
    BRL: 1.0,
    USD: 5.60,
    EUR: 6.10,
    GBP: 7.20,
    CAD: 4.10,
    BTC: 350000.0
};

// DOM ELEMENTS
const fromAmountInput = document.getElementById('from-amount');
const toAmountInput = document.getElementById('to-amount');

const fromCurrencyBtn = document.getElementById('from-currency-btn');
const toCurrencyBtn = document.getElementById('to-currency-btn');

const fromCodeEl = document.getElementById('from-code');
const toCodeEl = document.getElementById('to-code');
const fromFlagEl = document.getElementById('from-flag');
const toFlagEl = document.getElementById('to-flag');

const fromSymbolEl = document.getElementById('from-symbol');
const toSymbolEl = document.getElementById('to-symbol');

const rateText = document.getElementById('rate-text');
const rateSpinner = document.getElementById('rate-spinner');
const detailExchangeRate = document.getElementById('detail-exchange-rate');
const savingsText = document.getElementById('savings-text');

const swapBtn = document.getElementById('swap-btn');
const convertBtn = document.getElementById('convert-btn');
const copyBtn = document.getElementById('copy-btn');
const themeToggle = document.getElementById('theme-toggle');

const amountSkeleton = document.getElementById('amount-skeleton');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

const modal = document.getElementById('currency-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const currencyListContainer = document.getElementById('currency-list-container');
const currencySearchInput = document.getElementById('currency-search-input');
const presetBtns = document.querySelectorAll('.preset-btn');

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchLiveRates();
    renderCurrencyList();
});

// BUSCA DE COTAÇÕES EM TEMPO REAL VIA API REST
async function fetchLiveRates() {
    try {
        rateSpinner.style.display = 'inline-block';
        amountSkeleton.style.display = 'block';
        toAmountInput.style.opacity = '0';

        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL,CAD-BRL,BTC-BRL');
        
        if (!response.ok) throw new Error("Erro na rede");
        
        const data = await response.json();

        // Atualiza banco de dados local
        ratesInBRL.USD = parseFloat(data.USDBRL.high);
        ratesInBRL.EUR = parseFloat(data.EURBRL.high);
        ratesInBRL.GBP = parseFloat(data.GBPBRL.high);
        ratesInBRL.CAD = parseFloat(data.CADBRL.high);
        ratesInBRL.BTC = parseFloat(data.BTCBRL.high);

        showToast("Cotações comerciais atualizadas via B3 / API");
    } catch (error) {
        console.warn("Falha na API real, utilizando taxas estimadas offline:", error);
        showToast("Modo Offline: Utilizando taxas de câmbio estimadas");
    } finally {
        rateSpinner.style.display = 'none';
        amountSkeleton.style.display = 'none';
        toAmountInput.style.opacity = '1';
        calculateConversion();
    }
}

// LÓGICA DE CONVERSÃO MATEMÁTICA
function calculateConversion() {
    const inputVal = parseFloat(fromAmountInput.value) || 0;

    // Converte Moeda Origem -> BRL -> Moeda Destino
    const amountInBRL = inputVal * ratesInBRL[currentFrom];
    const finalConverted = amountInBRL / ratesInBRL[currentTo];

    // Formatação de saída
    if (currentTo === 'BTC') {
        toAmountInput.value = finalConverted.toFixed(6);
    } else {
        toAmountInput.value = new Intl.NumberFormat(CURRENCIES[currentTo].locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(finalConverted);
    }

    // Calcula taxa direta (1 MoedaA = X MoedaB)
    const directRate = ratesInBRL[currentFrom] / ratesInBRL[currentTo];
    
    rateText.innerText = `1 ${currentFrom} = ${directRate.toFixed(4)} ${currentTo}`;
    
    // Atualiza detalhes do Accordion
    detailExchangeRate.innerText = `1 ${currentFrom} = ${formatCurrency(directRate, currentTo)}`;
    
    // Economia simulada
    const estimatedSavings = (amountInBRL * 0.035).toFixed(2);
    savingsText.innerText = `~ R$ ${estimatedSavings} economizados vs. bancos`;

    // Atualiza par no gráfico
    document.getElementById('chart-pair').innerText = `${currentFrom}/${currentTo}`;
}

// FORMATAÇÃO MONETÁRIA NATIVA
function formatCurrency(amount, currencyCode) {
    return new Intl.NumberFormat(CURRENCIES[currencyCode].locale, {
        style: 'currency',
        currency: currencyCode
    }).format(amount);
}

// EVENT LISTENERS E INTERAÇÕES
function setupEventListeners() {
    fromAmountInput.addEventListener('input', calculateConversion);
    
    swapBtn.addEventListener('click', () => {
        const temp = currentFrom;
        currentFrom = currentTo;
        currentTo = temp;
        updateUI();
        calculateConversion();
    });

    convertBtn.addEventListener('click', fetchLiveRates);

    copyBtn.addEventListener('click', () => {
        const textToCopy = `WiseConvert Quote: ${fromAmountInput.value} ${currentFrom} = ${toAmountInput.value} ${currentTo} (Taxa: ${rateText.innerText})`;
        navigator.clipboard.writeText(textToCopy);
        showToast("Resumo da cotação copiado para a área de transferência!");
    });

    // Modal Triggers
    fromCurrencyBtn.addEventListener('click', () => openModal('from'));
    toCurrencyBtn.addEventListener('click', () => openModal('to'));
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Pesquisa no Modal
    currencySearchInput.addEventListener('input', (e) => {
        renderCurrencyList(e.target.value.toLowerCase());
    });

    // Presets rápidos
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fromAmountInput.value = btn.getAttribute('data-value');
            calculateConversion();
        });
    });

    // Dark Mode Toggle
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    });
}

// ATUALIZAÇÃO DA INTERFACE (UI)
function updateUI() {
    fromCodeEl.innerText = currentFrom;
    fromFlagEl.innerText = CURRENCIES[currentFrom].flag;
    fromSymbolEl.innerText = CURRENCIES[currentFrom].symbol;

    toCodeEl.innerText = currentTo;
    toFlagEl.innerText = CURRENCIES[currentTo].flag;
    toSymbolEl.innerText = CURRENCIES[currentTo].symbol;
}

// GERENCIAMENTO DO MODAL DE MOEDAS
function openModal(target) {
    activeModalTarget = target;
    modal.classList.add('active');
    currencySearchInput.value = '';
    renderCurrencyList();
}

function closeModal() {
    modal.classList.remove('active');
}

function renderCurrencyList(filter = '') {
    currencyListContainer.innerHTML = '';

    Object.keys(CURRENCIES).forEach(code => {
        const curr = CURRENCIES[code];
        if (code.toLowerCase().includes(filter) || curr.name.toLowerCase().includes(filter)) {
            const item = document.createElement('div');
            item.className = 'currency-option';
            item.innerHTML = `
                <div class="option-left">
                    <span class="flag-icon">${curr.flag}</span>
                    <div>
                        <div class="option-code">${code}</div>
                        <div class="option-name">${curr.name}</div>
                    </div>
                </div>
                ${(activeModalTarget === 'from' && code === currentFrom) || (activeModalTarget === 'to' && code === currentTo) ? '<span>✓</span>' : ''}
            `;

            item.addEventListener('click', () => {
                if (activeModalTarget === 'from') currentFrom = code;
                if (activeModalTarget === 'to') currentTo = code;
                updateUI();
                calculateConversion();
                closeModal();
            });

            currencyListContainer.appendChild(item);
        }
    });
}

// TOAST SYSTEM
function showToast(message) {
    toastMessage.innerText = message;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
}
