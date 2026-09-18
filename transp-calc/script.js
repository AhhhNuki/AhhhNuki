// ==========================================
// Freight Forwarding Rates & Tracking Data
// ==========================================

const DEFAULT_FORWARDERS = [
    {
        id: "usa2georgia",
        name: "USA2GEORGIA",
        currentRate: 9.95,
        previousRate: 9.00,
        lastUpdated: "2026-09-16",
        currency: "USD",
        unit: "kg",
        website: "https://www.usa2georgia.com",
        history: [
            { date: "2026-09-16", rate: 9.95, change: 0.95, direction: "up", note: "ტარიფის გაძვირება ($9.00 ➔ $9.95)" },
            { date: "2024-03-01", rate: 9.00, change: 0.50, direction: "up", note: "ტარიფი გაიზარდა $0.50-ით ($8.50 ➔ $9.00)" },
            { date: "2023-02-01", rate: 8.50, change: 0.50, direction: "up", note: "ტარიფი გაიზარდა $0.50-ით ($8.00 ➔ $8.50)" },
            { date: "2022-01-01", rate: 8.00, change: 0.00, direction: "initial", note: "ბაზისური საჰაერო ტარიფი" }
        ]
    },
    {
        id: "camex",
        name: "Camex",
        currentRate: 8.35,
        previousRate: 8.50,
        lastUpdated: "2024-02-15",
        currency: "USD",
        unit: "kg",
        website: "https://camex.ge",
        history: [
            { date: "2024-02-15", rate: 8.35, change: -0.15, direction: "down", note: "სპეციალური აქცია: ტარიფი შემცირდა $0.15-ით ($8.50 ➔ $8.35)" },
            { date: "2023-05-10", rate: 8.50, change: 0.00, direction: "initial", note: "სტანდარტული ტარიფი" }
        ]
    },
    {
        id: "inex",
        name: "Inex Group",
        currentRate: 9.70,
        previousRate: 8.50,
        lastUpdated: "2026-09-16",
        currency: "USD",
        unit: "kg",
        website: "https://inex.ge",
        history: [
            { date: "2026-09-16", rate: 9.70, change: 1.20, direction: "up", note: "ტარიფის გაძვირება ($8.50 ➔ $9.70)" },
            { date: "2024-01-10", rate: 8.50, change: 0.00, direction: "initial", note: "სტაბილური ტარიფი ($8.50)" }
        ]
    },
    {
        id: "maleo",
        name: "Maleo",
        currentRate: 8.50,
        previousRate: 8.50,
        lastUpdated: "2026-09-16",
        currency: "USD",
        unit: "kg",
        website: "https://maleo.ge",
        history: [
            { date: "2026-09-16", rate: 8.50, change: 0.00, direction: "unchanged", note: "ტარიფის დადასტურება" },
            { date: "2024-02-01", rate: 8.50, change: 0.50, direction: "up", note: "ტარიფი გაიზარდა $0.50-ით ($8.00 ➔ $8.50)" },
            { date: "2023-06-01", rate: 8.00, change: 0.00, direction: "initial", note: "სტანდარტული ტარიფი" }
        ]
    },
    {
        id: "spacecargo",
        name: "Space Cargo",
        currentRate: 9.88,
        previousRate: 8.00,
        lastUpdated: "2026-09-16",
        currency: "USD",
        unit: "kg",
        website: "https://spacecargo.ge",
        history: [
            { date: "2026-09-16", rate: 9.88, change: 1.88, direction: "up", note: "ტარიფის გაძვირება ($8.00 ➔ $9.88)" },
            { date: "2024-01-01", rate: 8.00, change: 0.00, direction: "initial", note: "სტანდარტული ტარიფი ($8.00)" }
        ]
    },
    {
        id: "kiwipost",
        name: "KiwiPost",
        currentRate: 8.00,
        previousRate: 8.00,
        lastUpdated: "2024-01-01",
        currency: "USD",
        unit: "kg",
        website: "https://kiwipost.ge",
        history: [
            { date: "2024-01-01", rate: 8.00, change: 0.00, direction: "initial", note: "სტანდარტული ტარიფი ($8.00)" }
        ]
    }
];

// Resilience copy for first-load offline/file:// use and for clients that still
// receive an older cached forwarders.json. data/forwarders.json remains the
// canonical, source-linked policy when it is available.
const FALLBACK_FORWARDER_FEE_POLICIES = {
    usa2georgia: {
        verifiedAt: '2026-09-18',
        sourceUrl: 'https://www.usa2georgia.com/agreements/ka.html',
        declarationPreparation: { status: 'verified', appliesWhen: 'customs-clearance', amountGEL: 16 },
        operationalHandling: {
            status: 'verified',
            appliesWhen: 'always',
            basis: 'declaredGoodsValueGEL',
            tiers: [
                { upToGEL: 100, flatGEL: 1 },
                { upToGEL: 200, flatGEL: 2 },
                { upToGEL: 300, flatGEL: 3 },
                { upToGEL: 3000, rate: 0.02 },
                { upToGEL: 10000, rate: 0.04 },
                { upToGEL: 20000, rate: 0.08 },
                { upToGEL: null, rate: 0.12 }
            ]
        }
    },
    camex: {
        verifiedAt: '2026-09-18',
        sourceUrl: 'https://camex.ge/files/camex_agreement_ge.pdf',
        declarationPreparation: { status: 'verified', appliesWhen: 'customs-clearance', amountGEL: 10 },
        operationalHandling: { status: 'none' }
    },
    inex: {
        verifiedAt: '2026-09-18',
        sourceUrl: 'https://old.legacy.inex.ge/ka/custom-procedures',
        declarationPreparation: {
            status: 'verified',
            appliesWhen: 'customs-clearance',
            amountGEL: 10,
            note: 'ონლაინ ამანათი; პერსონალური ამანათის საფასურია 15 ლარი'
        },
        operationalHandling: { status: 'none' }
    },
    maleo: {
        verifiedAt: '2026-09-18',
        sourceUrl: 'https://maleo.ge/?attr=distdecl&language=ge&module=html',
        declarationPreparation: { status: 'verified', appliesWhen: 'customs-clearance', amountGEL: 10 },
        operationalHandling: { status: 'none' }
    },
    spacecargo: {
        verifiedAt: '2026-09-18',
        sourceUrl: 'https://www.spacecargo.ge/AboutUs',
        declarationPreparation: { status: 'unverified' },
        operationalHandling: { status: 'unverified' }
    },
    kiwipost: {
        verifiedAt: '2026-09-18',
        sourceUrl: 'https://kiwipost.ge/docs/terms_GE.pdf',
        declarationPreparation: { status: 'verified', appliesWhen: 'customs-clearance', amountGEL: 10 },
        operationalHandling: { status: 'none' }
    }
};

function withFeePolicy(forwarder) {
    return {
        ...forwarder,
        fees: forwarder.fees || FALLBACK_FORWARDER_FEE_POLICIES[forwarder.id] || null
    };
}

DEFAULT_FORWARDERS.forEach(forwarder => {
    forwarder.fees = FALLBACK_FORWARDER_FEE_POLICIES[forwarder.id] || null;
});

let forwardersList = [...DEFAULT_FORWARDERS];
let customsRules = CalculatorCore.DEFAULT_CUSTOMS_RULES;

async function loadCustomsRules() {
    try {
        const response = await fetch('./data/customs-rules.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        customsRules = CalculatorCore.normalizeCustomsRules(data);
    } catch (error) {
        console.warn('Could not load data/customs-rules.json; using bundled customs rules.', error);
        customsRules = CalculatorCore.DEFAULT_CUSTOMS_RULES;
    }
}

// Load fresh data from JSON file (with fallback)
async function loadForwardersData() {
    try {
        const response = await fetch('./data/forwarders.json', { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            const isValid = Array.isArray(data) && data.length > 0 && data.every(forwarder => (
                forwarder &&
                typeof forwarder.id === 'string' &&
                typeof forwarder.name === 'string' &&
                Number.isFinite(forwarder.currentRate) &&
                forwarder.currentRate > 0
            ));
            if (isValid) {
                // Preserve verified fees if an older service-worker cache returns
                // rate data that predates the fee-policy fields.
                forwardersList = data.map(withFeePolicy);
            } else {
                console.warn('data/forwarders.json has an unexpected structure; using bundled rates.');
            }
        }
    } catch (e) {
        console.warn('Could not load data/forwarders.json via fetch, using bundled rates.', e);
    }
}

// UI Elements
const toggleVolumetric = document.getElementById('toggleVolumetric');
const volumetricInputs = document.getElementById('volumetricInputs');
const forwarderSelect = document.getElementById('forwarderSelect');
const customDropdownWrapper = document.getElementById('customDropdownWrapper');
const customSelectTrigger = document.getElementById('customSelectTrigger');
const customSelectTriggerContent = document.getElementById('customSelectTriggerContent');
const customSelectMenu = document.getElementById('customSelectMenu');
const customSelectArrow = document.getElementById('customSelectArrow');
const customShippingInputWrapper = document.getElementById('customShippingInputWrapper');
const forwarderRateInfo = document.getElementById('forwarderRateInfo');
const rateBadgeContainer = document.getElementById('rateBadgeContainer');
const btnViewSelectedHistory = document.getElementById('btnViewSelectedHistory');
const priceTrackerModal = document.getElementById('priceTrackerModal');
const btnCloseTrackerModal = document.getElementById('btnCloseTrackerModal');
const btnCloseTrackerModalBtn = document.getElementById('btnCloseTrackerModalBtn');
const forwardersTrackerList = document.getElementById('forwardersTrackerList');
const rateAlertBanner = document.getElementById('rateAlertBanner');
const rateAlertText = document.getElementById('rateAlertText');
const btnAlertOpenTracker = document.getElementById('btnAlertOpenTracker');
const btnDismissAlert = document.getElementById('btnDismissAlert');
const exchangeRateStatus = document.getElementById('exchangeRateStatus');
const forwarderFeePolicyInfo = document.getElementById('forwarderFeePolicyInfo');
const insuranceInput = document.getElementById('insuranceCost');
const importDutyRateInput = document.getElementById('importDutyRate');
const calculateButton = document.getElementById('calculate');
const btnResetCalculation = document.getElementById('btnResetCalculation');
const btnSingleMode = document.getElementById('btnSingleMode');
const btnCartMode = document.getElementById('btnCartMode');
const singleItemFields = document.getElementById('singleItemFields');
const cartFields = document.getElementById('cartFields');
const cartItemsList = document.getElementById('cartItemsList');
const btnAddCartItem = document.getElementById('btnAddCartItem');
const cartSafetyBufferInput = document.getElementById('cartSafetyBuffer');
const weightLabel = document.getElementById('weightLabel');
const sharedWeightFields = document.getElementById('sharedWeightFields');

let calculationMode = 'single';
let cartItems = [];
let nextCartItemId = 1;
let cartPreviewRequestId = 0;
let recalculationSource = null;

function createCartItem(initial = {}) {
    const hasPrice = initial.priceUSD !== '' && initial.priceUSD !== null && initial.priceUSD !== undefined;
    const hasWeight = initial.weightInput !== '' && initial.weightInput !== null && initial.weightInput !== undefined;
    const dimensions = initial.dimensions && typeof initial.dimensions === 'object' ? initial.dimensions : {};
    const numberString = value => Number.isFinite(Number(value)) && Number(value) > 0 ? String(value) : '';
    return {
        id: nextCartItemId++,
        name: typeof initial.name === 'string' ? initial.name : '',
        url: typeof initial.url === 'string' ? initial.url : '',
        priceUSD: hasPrice && Number.isFinite(Number(initial.priceUSD)) ? String(initial.priceUSD) : '',
        quantity: Number.isInteger(Number(initial.quantity)) && Number(initial.quantity) > 0
            ? Number(initial.quantity)
            : 1,
        weightInput: hasWeight && Number.isFinite(Number(initial.weightInput)) ? String(initial.weightInput) : '',
        weightUnit: ['kilograms', 'pounds', 'ounces'].includes(initial.weightUnit)
            ? initial.weightUnit
            : 'kilograms',
        useVolumetric: Boolean(initial.useVolumetric),
        dimensions: {
            lengthCm: numberString(dimensions.lengthCm),
            widthCm: numberString(dimensions.widthCm),
            heightCm: numberString(dimensions.heightCm)
        }
    };
}

function resetCartThresholdPreview(message = 'შეიყვანეთ ნივთების ფასები') {
    const subtotalUSD = document.getElementById('cartSubtotalUSD');
    const subtotalGEL = document.getElementById('cartSubtotalGEL');
    const bar = document.getElementById('cartThresholdBar');
    const statusMessage = document.getElementById('cartThresholdMessage');
    const remainingLabel = document.getElementById('cartRemainingLabel');
    const remaining = document.getElementById('cartRemaining');
    const safeRemaining = document.getElementById('cartSafeRemaining');
    if (!subtotalUSD || !subtotalGEL || !bar || !statusMessage || !remainingLabel || !remaining || !safeRemaining) return;

    subtotalUSD.textContent = '$0.00';
    subtotalGEL.textContent = '0.00 ₾';
    bar.style.width = '0%';
    bar.classList.remove('bg-amber-400', 'bg-red-500');
    bar.classList.add('bg-brand-lime');
    statusMessage.classList.remove('text-amber-400', 'text-red-400');
    statusMessage.classList.add('text-brand-lime');
    statusMessage.textContent = message;
    remainingLabel.textContent = 'დარჩენილი:';
    remaining.textContent = '—';
    safeRemaining.textContent = '—';
}

function getCartCalculationItems() {
    return cartItems.map(item => ({
        id: item.id,
        name: item.name.trim(),
        url: item.url.trim(),
        priceUSD: parseFloat(item.priceUSD),
        quantity: Number(item.quantity),
        weightInput: parseFloat(item.weightInput),
        weightUnit: item.weightUnit,
        useVolumetric: item.useVolumetric,
        dimensions: {
            lengthCm: parseFloat(item.dimensions.lengthCm),
            widthCm: parseFloat(item.dimensions.widthCm),
            heightCm: parseFloat(item.dimensions.heightCm)
        }
    }));
}

function makeCartInput(labelText, type, value, className) {
    const wrapper = document.createElement('label');
    wrapper.className = className;
    const label = document.createElement('span');
    label.className = 'text-[11px] text-gray-500 mb-1 block';
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.className = 'w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:border-brand-lime outline-none';
    wrapper.append(label, input);
    return { wrapper, input };
}

function renderCartItems(focusItemId = null) {
    if (!cartItemsList) return;
    cartItemsList.replaceChildren();

    cartItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'p-3 rounded-xl bg-brand-input/70 border border-brand-border space-y-2';
        card.dataset.cartItemId = String(item.id);

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between gap-2';
        const number = document.createElement('span');
        number.className = 'text-xs font-semibold text-brand-lime';
        number.textContent = `ამანათი ${index + 1}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-xs text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed';
        remove.textContent = 'წაშლა';
        remove.disabled = cartItems.length === 1;
        remove.setAttribute('aria-label', `${index + 1}-ე ამანათის წაშლა`);
        remove.addEventListener('click', () => {
            cartItems = cartItems.filter(candidate => candidate.id !== item.id);
            renderCartItems();
            updateCartThresholdPreview();
        });
        header.append(number, remove);

        const nameField = makeCartInput('შიგთავსი / დასახელება', 'text', item.name, 'block');
        nameField.input.placeholder = 'მაგ: SSD';
        nameField.input.addEventListener('input', event => {
            item.name = event.target.value;
        });

        const priceField = makeCartInput('ფასი (USD)', 'number', item.priceUSD, 'block');
        priceField.input.min = '0';
        priceField.input.step = '0.01';
        priceField.input.inputMode = 'decimal';
        priceField.input.placeholder = '0.00';
        priceField.input.dataset.cartPrice = String(item.id);
        priceField.input.addEventListener('input', event => {
            item.priceUSD = event.target.value;
            updateCartThresholdPreview();
        });

        const quantityField = makeCartInput('რაოდენობა', 'number', String(item.quantity), 'block');
        quantityField.input.min = '1';
        quantityField.input.step = '1';
        quantityField.input.inputMode = 'numeric';
        quantityField.input.addEventListener('input', event => {
            item.quantity = Number(event.target.value);
            updateCartThresholdPreview();
        });

        const row = document.createElement('div');
        row.className = 'grid grid-cols-[minmax(0,1fr)_90px] gap-2';
        row.append(priceField.wrapper, quantityField.wrapper);

        const weightField = makeCartInput('ამანათის ფიზიკური წონა', 'number', item.weightInput, 'block');
        weightField.input.min = '0.01';
        weightField.input.step = '0.01';
        weightField.input.inputMode = 'decimal';
        weightField.input.placeholder = 'მაგ: 2.5';
        weightField.input.dataset.cartWeight = String(item.id);
        weightField.input.addEventListener('input', event => {
            item.weightInput = event.target.value;
        });

        const unitWrapper = document.createElement('label');
        unitWrapper.className = 'block';
        const unitLabel = document.createElement('span');
        unitLabel.className = 'text-[11px] text-gray-500 mb-1 block';
        unitLabel.textContent = 'ერთეული';
        const unitSelect = document.createElement('select');
        unitSelect.className = 'w-full bg-brand-bg border border-brand-border rounded-lg px-2 py-2 text-sm text-white focus:border-brand-lime outline-none';
        [
            ['kilograms', 'Kg'],
            ['pounds', 'Lbs'],
            ['ounces', 'Oz']
        ].forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            option.selected = item.weightUnit === value;
            unitSelect.appendChild(option);
        });
        unitSelect.addEventListener('change', event => {
            item.weightUnit = event.target.value;
        });
        unitWrapper.append(unitLabel, unitSelect);

        const weightRow = document.createElement('div');
        weightRow.className = 'grid grid-cols-[minmax(0,1fr)_90px] gap-2';
        weightRow.append(weightField.wrapper, unitWrapper);

        const volumetricSection = document.createElement('div');
        volumetricSection.className = 'pt-1';
        const volumetricLabel = document.createElement('label');
        volumetricLabel.className = 'flex items-center gap-2 cursor-pointer w-fit';
        const volumetricToggle = document.createElement('input');
        volumetricToggle.type = 'checkbox';
        volumetricToggle.checked = item.useVolumetric;
        volumetricToggle.className = 'accent-brand-lime w-4 h-4';
        const volumetricText = document.createElement('span');
        volumetricText.className = 'text-xs text-gray-400';
        volumetricText.textContent = 'მოცულობითი წონის დათვლა ამ ამანათისთვის';
        volumetricLabel.append(volumetricToggle, volumetricText);

        const dimensionsRow = document.createElement('div');
        dimensionsRow.className = `${item.useVolumetric ? '' : 'hidden '}grid grid-cols-3 gap-2 mt-2 p-2.5 rounded-lg bg-brand-bg/60 border border-brand-border border-dashed`;
        const dimensionDefinitions = [
            ['lengthCm', 'სიგრძე (cm)'],
            ['widthCm', 'სიგანე (cm)'],
            ['heightCm', 'სიმაღლე (cm)']
        ];
        dimensionDefinitions.forEach(([key, label]) => {
            const field = makeCartInput(label, 'number', item.dimensions[key], 'block');
            field.input.min = '0.01';
            field.input.step = '0.1';
            field.input.inputMode = 'decimal';
            field.input.placeholder = '0';
            field.input.dataset.cartDimension = String(item.id);
            field.input.addEventListener('input', event => {
                item.dimensions[key] = event.target.value;
            });
            dimensionsRow.appendChild(field.wrapper);
        });
        volumetricToggle.addEventListener('change', event => {
            item.useVolumetric = event.target.checked;
            dimensionsRow.classList.toggle('hidden', !item.useVolumetric);
        });
        volumetricSection.append(volumetricLabel, dimensionsRow);

        const urlField = makeCartInput('პროდუქტის ბმული (არასავალდებულო)', 'url', item.url, 'block');
        urlField.input.placeholder = 'https://...';
        urlField.input.addEventListener('input', event => {
            item.url = event.target.value;
        });

        card.append(header, nameField.wrapper, row, weightRow, volumetricSection, urlField.wrapper);
        cartItemsList.appendChild(card);

        if (focusItemId === item.id) priceField.input.focus();
    });
}

function applyThresholdPresentation(status) {
    const subtotalUSD = document.getElementById('cartSubtotalUSD');
    const subtotalGEL = document.getElementById('cartSubtotalGEL');
    const bar = document.getElementById('cartThresholdBar');
    const message = document.getElementById('cartThresholdMessage');
    const remainingLabel = document.getElementById('cartRemainingLabel');
    const remaining = document.getElementById('cartRemaining');
    const safeRemaining = document.getElementById('cartSafeRemaining');
    if (!subtotalUSD || !subtotalGEL || !bar || !message || !remainingLabel || !remaining || !safeRemaining) return;

    subtotalUSD.textContent = `$${status.subtotalUSD.toFixed(2)}`;
    subtotalGEL.textContent = `${status.goodsSubtotalGEL.toFixed(2)} ₾`;
    bar.style.width = `${Math.min(status.usedPercent, 100)}%`;
    bar.classList.remove('bg-brand-lime', 'bg-amber-400', 'bg-red-500');
    message.classList.remove('text-brand-lime', 'text-amber-400', 'text-red-400');

    if (status.exceedsGoodsThreshold) {
        bar.classList.add('bg-red-500');
        message.classList.add('text-red-400');
        message.textContent = `300 ₾-ის ზღვარი გადაცილებულია ${status.overageGEL.toFixed(2)} ₾-ით`;
        remainingLabel.textContent = 'ზღვარს გადაცილებული:';
        remaining.textContent = `${status.overageGEL.toFixed(2)} ₾ • $${status.overageUSD.toFixed(2)}`;
    } else if (status.atGoodsThreshold) {
        bar.classList.add('bg-amber-400');
        message.classList.add('text-amber-400');
        message.textContent = 'საქონლის ჯამი ზუსტად 300 ₾-ია — ზღვარი არ არის გადაცილებული';
        remainingLabel.textContent = 'დარჩენილი:';
        remaining.textContent = '0.00 ₾';
    } else if (status.exceedsSafeLimit) {
        bar.classList.add('bg-amber-400');
        message.classList.add('text-amber-400');
        message.textContent = 'საქონლის ჯამი უსაფრთხოების ბუფერშია';
        remainingLabel.textContent = 'დარჩენილი:';
        remaining.textContent = `${status.remainingGEL.toFixed(2)} ₾ • $${status.remainingUSD.toFixed(2)}`;
    } else {
        bar.classList.add('bg-brand-lime');
        message.classList.add('text-brand-lime');
        message.textContent = `გამოყენებულია 300 ₾-ის ზღვრის ${status.usedPercent.toFixed(1)}%`;
        remainingLabel.textContent = 'დარჩენილი:';
        remaining.textContent = `${status.remainingGEL.toFixed(2)} ₾ • $${status.remainingUSD.toFixed(2)}`;
    }

    safeRemaining.textContent = status.safeRemainingGEL > 0
        ? `${status.safeRemainingGEL.toFixed(2)} ₾ • $${status.safeRemainingUSD.toFixed(2)}`
        : '0.00 ₾';
}

async function updateCartThresholdPreview() {
    if (calculationMode !== 'cart') return;
    const requestId = ++cartPreviewRequestId;
    const customRateValue = parseFloat(document.getElementById('customRate').value);
    const exchangeRate = await fetchExchangeRate(customRateValue);
    if (requestId !== cartPreviewRequestId) return;

    const items = getCartCalculationItems();
    const validation = CalculatorCore.validateCartItems(items);
    if (!validation.valid) {
        resetCartThresholdPreview('შეავსეთ კალათის ნივთების ფასები და რაოდენობა');
        return;
    }

    const safetyBuffer = parseFloat(cartSafetyBufferInput.value);
    try {
        const status = CalculatorCore.calculateCartThresholdStatus(
            items,
            exchangeRate,
            Number.isFinite(safetyBuffer) && safetyBuffer >= 0 ? safetyBuffer : 0
        );
        applyThresholdPresentation(status);
    } catch (error) {
        console.error('Could not update the cart threshold preview.', error);
    }
}

function setCalculationMode(mode, options = {}) {
    calculationMode = mode === 'cart' ? 'cart' : 'single';
    const isCart = calculationMode === 'cart';
    singleItemFields.classList.toggle('hidden', isCart);
    cartFields.classList.toggle('hidden', !isCart);
    btnSingleMode.setAttribute('aria-pressed', String(!isCart));
    btnCartMode.setAttribute('aria-pressed', String(isCart));
    btnSingleMode.className = `px-3 py-2.5 rounded-lg text-sm transition-colors ${!isCart ? 'font-semibold bg-brand-lime text-black' : 'font-medium text-gray-300 hover:text-white'}`;
    btnCartMode.className = `px-3 py-2.5 rounded-lg text-sm transition-colors ${isCart ? 'font-semibold bg-brand-lime text-black' : 'font-medium text-gray-300 hover:text-white'}`;
    weightLabel.textContent = isCart ? 'გზავნილის საერთო წონა' : 'წონა';
    sharedWeightFields.classList.toggle('hidden', isCart);

    if (isCart && cartItems.length === 0) {
        cartItems = [createCartItem()];
        renderCartItems();
    }
    if (isCart) updateCartThresholdPreview();

    if (!options.preserveRecalculation) {
        recalculationSource = null;
        btnResetCalculation?.classList.add('hidden');
    }
    if (!options.preserveResult) {
        const result = document.getElementById('result');
        result.innerHTML = '<div class="text-center text-brand-text-muted py-10">შეიყვანეთ მონაცემები</div>';
    }
}

btnSingleMode.addEventListener('click', () => setCalculationMode('single'));
btnCartMode.addEventListener('click', () => setCalculationMode('cart'));

function resetCalculationForm() {
    recalculationSource = null;
    cartItems = [createCartItem()];
    renderCartItems();

    document.getElementById('price').value = '';
    document.getElementById('weight').value = '';
    document.getElementById('weightUnit').value = 'kilograms';
    toggleVolumetric.checked = false;
    volumetricInputs.classList.add('hidden');
    document.getElementById('dimL').value = '';
    document.getElementById('dimW').value = '';
    document.getElementById('dimH').value = '';
    document.getElementById('customRate').value = '';
    insuranceInput.value = '0';
    importDutyRateInput.value = '0';

    const savedSafetyBuffer = parseFloat(localStorage.getItem('calc_cart_safety_buffer'));
    cartSafetyBufferInput.value = String(Number.isFinite(savedSafetyBuffer) && savedSafetyBuffer >= 0 ? savedSafetyBuffer : 10);
    resetCartThresholdPreview();
    setCalculationMode('single');
    fetchExchangeRate(NaN);
    document.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('price').focus();
}

btnResetCalculation?.addEventListener('click', resetCalculationForm);
btnAddCartItem.addEventListener('click', () => {
    const newItem = createCartItem();
    cartItems.push(newItem);
    renderCartItems(newItem.id);
    resetCartThresholdPreview('შეავსეთ ახალი ნივთის ფასი და რაოდენობა');
});
cartSafetyBufferInput.addEventListener('input', () => {
    const buffer = parseFloat(cartSafetyBufferInput.value);
    if (Number.isFinite(buffer) && buffer >= 0) {
        localStorage.setItem('calc_cart_safety_buffer', String(buffer));
    }
    updateCartThresholdPreview();
});
document.getElementById('customRate').addEventListener('input', updateCartThresholdPreview);

// Volumetric Toggle
toggleVolumetric.addEventListener('change', (e) => {
    volumetricInputs.classList.toggle('hidden', !e.target.checked);
});

const NBG_USD_RATE_URL = 'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD';
const EXCHANGE_RATE_CACHE_KEY = 'calc_exchange_rate_snapshot_v1';
const FALLBACK_EXCHANGE_RATE = 2.77;
let exchangeRateRequest = null;
let exchangeRateInfo = null;

function storeExchangeRateSnapshot(snapshot) {
    try {
        localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(snapshot));
    } catch (error) {
        console.warn('Could not cache the exchange rate.', error);
    }
}

function readExchangeRateSnapshot() {
    try {
        const snapshot = JSON.parse(localStorage.getItem(EXCHANGE_RATE_CACHE_KEY) || 'null');
        if (snapshot && Number.isFinite(snapshot.rate) && snapshot.rate > 0) return snapshot;
    } catch (error) {
        console.warn('Cached exchange rate is invalid.', error);
    }
    return null;
}

function renderExchangeRateStatus(info) {
    if (!exchangeRateStatus || !info) return;

    if (info.source === 'manual') {
        exchangeRateStatus.textContent = 'გამოიყენება თქვენ მიერ მითითებული კურსი.';
        return;
    }

    if (info.source === 'nbg') {
        const date = info.validFrom ? new Date(info.validFrom).toLocaleDateString('ka-GE') : '';
        exchangeRateStatus.textContent = `საქართველოს ეროვნული ბანკის ოფიციალური კურსი${date ? ` • ${date}` : ''}`;
        return;
    }

    if (info.source === 'cache') {
        const date = info.validFrom ? new Date(info.validFrom).toLocaleDateString('ka-GE') : '';
        exchangeRateStatus.textContent = `ოფლაინ რეჟიმი — შენახული კურსი${date ? ` • ${date}` : ''}`;
        return;
    }

    exchangeRateStatus.textContent = 'კურსის მიღება ვერ მოხერხდა — გამოიყენება საორიენტაციო მნიშვნელობა.';
}

// Fetch the official USD/GEL rate from the National Bank of Georgia.
async function fetchExchangeRate(customRate) {
    if (Number.isFinite(customRate) && customRate > 0) {
        exchangeRateInfo = { rate: customRate, source: 'manual', validFrom: null };
        renderExchangeRateStatus(exchangeRateInfo);
        return customRate;
    }

    if (!exchangeRateRequest) {
        exchangeRateRequest = (async () => {
            try {
                const response = await fetch(NBG_USD_RATE_URL, { cache: 'no-store' });
                if (!response.ok) throw new Error(`NBG returned HTTP ${response.status}`);

                const payload = await response.json();
                const usd = payload?.[0]?.currencies?.find(currency => currency.code === 'USD');
                const quantity = Number(usd?.quantity) || 1;
                const rate = Number(usd?.rate) / quantity;
                if (!Number.isFinite(rate) || rate <= 0) throw new Error('NBG rate is invalid');

                const snapshot = {
                    rate,
                    source: 'nbg',
                    validFrom: usd.validFromDate || payload?.[0]?.date || null,
                    fetchedAt: new Date().toISOString()
                };
                storeExchangeRateSnapshot(snapshot);
                return snapshot;
            } catch (error) {
                console.error('Error fetching the NBG exchange rate:', error);
                const cached = readExchangeRateSnapshot();
                if (cached) return { ...cached, source: 'cache' };
                return { rate: FALLBACK_EXCHANGE_RATE, source: 'fallback', validFrom: null };
            }
        })();
    }

    exchangeRateInfo = await exchangeRateRequest;
    renderExchangeRateStatus(exchangeRateInfo);
    return exchangeRateInfo.rate;
}

// --- CUSTOM DROPDOWN & SELECT LOGIC ---

function updateCustomSelectDisplay(selectedId) {
    if (!customSelectTriggerContent) return;

    if (selectedId === 'custom') {
        customSelectTriggerContent.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-medium text-white">სხვა</span>
                <span class="text-xs text-gray-400">(ინდივიდუალური ტარიფი)</span>
            </div>
        `;
        return;
    }

    const f = forwardersList.find(item => item.id === selectedId);
    if (!f) {
        customSelectTriggerContent.innerHTML = `<span class="text-gray-400">აირჩიეთ გადამზიდი</span>`;
        return;
    }

    const diff = +(f.currentRate - (f.previousRate != null ? f.previousRate : f.currentRate)).toFixed(2);

    let badge = '';
    if (diff > 0) {
        badge = `<span class="text-xs font-bold text-red-400 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded ml-auto flex items-center gap-1 shadow-sm">▲ +$${diff.toFixed(2)}</span>`;
    } else if (diff < 0) {
        badge = `<span class="text-xs font-bold text-brand-lime bg-lime-950/80 border border-brand-lime/60 px-2 py-0.5 rounded ml-auto flex items-center gap-1 shadow-sm">▼ -$${Math.abs(diff).toFixed(2)}</span>`;
    }

    customSelectTriggerContent.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="font-medium text-white">${f.name}</span>
            <span class="text-xs text-gray-400">($${f.currentRate.toFixed(2)}/kg)</span>
        </div>
        ${badge}
    `;
}

function renderCustomDropdown(selectedId) {
    if (!customSelectMenu) return;

    customSelectMenu.innerHTML = '';

    forwardersList.forEach(f => {
        const isSelected = f.id === selectedId;
        const diff = +(f.currentRate - (f.previousRate != null ? f.previousRate : f.currentRate)).toFixed(2);

        let badge = '';
        if (diff > 0) {
            badge = `<span class="text-xs font-bold text-red-400 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded flex items-center gap-1">▲ +$${diff.toFixed(2)}</span>`;
        } else if (diff < 0) {
            badge = `<span class="text-xs font-bold text-brand-lime bg-lime-950/80 border border-brand-lime/60 px-2 py-0.5 rounded flex items-center gap-1">▼ -$${Math.abs(diff).toFixed(2)}</span>`;
        }

        const item = document.createElement('button');
        item.type = 'button';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(isSelected));
        item.tabIndex = -1;
        item.className = `px-3.5 py-2.5 rounded-lg text-sm flex items-center justify-between cursor-pointer hover:bg-brand-input transition-colors ${isSelected ? 'bg-brand-input/90 border border-brand-lime/40 text-brand-lime' : 'text-gray-200'}`;
        item.dataset.value = f.id;
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-medium ${isSelected ? 'text-brand-lime' : 'text-white'}">${f.name}</span>
                <span class="text-xs text-gray-400">($${f.currentRate.toFixed(2)}/kg)</span>
            </div>
            ${badge}
        `;

        item.addEventListener('click', () => {
            forwarderSelect.value = f.id;
            forwarderSelect.dispatchEvent(new Event('change'));
            closeCustomDropdown(true);
        });
        item.addEventListener('keydown', handleDropdownOptionKeydown);

        customSelectMenu.appendChild(item);
    });

    // Custom option
    const isCustom = selectedId === 'custom';
    const customItem = document.createElement('button');
    customItem.type = 'button';
    customItem.setAttribute('role', 'option');
    customItem.setAttribute('aria-selected', String(isCustom));
    customItem.tabIndex = -1;
    customItem.className = `px-3.5 py-2.5 rounded-lg text-sm flex items-center justify-between cursor-pointer hover:bg-brand-input transition-colors ${isCustom ? 'bg-brand-input/90 border border-brand-lime/40 text-brand-lime' : 'text-gray-300'}`;
    customItem.dataset.value = 'custom';
    customItem.innerHTML = `
        <span class="font-medium">სხვა (მითითება...)</span>
        <span class="text-xs text-gray-500">ინდივიდუალური</span>
    `;
    customItem.addEventListener('click', () => {
        forwarderSelect.value = 'custom';
        forwarderSelect.dispatchEvent(new Event('change'));
        closeCustomDropdown(true);
    });
    customItem.addEventListener('keydown', handleDropdownOptionKeydown);
    customSelectMenu.appendChild(customItem);

    updateCustomSelectDisplay(selectedId);
}

function getDropdownOptions() {
    return Array.from(customSelectMenu?.querySelectorAll('[role="option"]') || []);
}

function closeCustomDropdown(returnFocus = false) {
    if (!customSelectMenu || !customSelectTrigger) return;
    customSelectMenu.classList.add('hidden');
    customSelectTrigger.setAttribute('aria-expanded', 'false');
    if (customSelectArrow) customSelectArrow.classList.remove('rotate-180');
    if (returnFocus) customSelectTrigger.focus();
}

function openCustomDropdown(preferredIndex = null) {
    if (!customSelectMenu || !customSelectTrigger) return;
    customSelectMenu.classList.remove('hidden');
    customSelectTrigger.setAttribute('aria-expanded', 'true');
    if (customSelectArrow) customSelectArrow.classList.add('rotate-180');

    const options = getDropdownOptions();
    const selectedIndex = options.findIndex(option => option.getAttribute('aria-selected') === 'true');
    const targetIndex = preferredIndex == null
        ? Math.max(selectedIndex, 0)
        : Math.min(Math.max(preferredIndex, 0), options.length - 1);
    options[targetIndex]?.focus();
}

function handleDropdownOptionKeydown(event) {
    const options = getDropdownOptions();
    const currentIndex = options.indexOf(event.currentTarget);
    let nextIndex = null;

    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;

    if (nextIndex != null) {
        event.preventDefault();
        options[nextIndex]?.focus();
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closeCustomDropdown(true);
    } else if (event.key === 'Tab') {
        closeCustomDropdown(false);
    }
}

// Setup custom dropdown toggle & outside click listener
if (customSelectTrigger && customSelectMenu) {
    customSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = customSelectMenu.classList.contains('hidden');
        if (isHidden) openCustomDropdown();
        else closeCustomDropdown(false);
    });

    customSelectTrigger.addEventListener('keydown', event => {
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const options = getDropdownOptions();
            const targetIndex = event.key === 'End' || event.key === 'ArrowUp'
                ? options.length - 1
                : 0;
            openCustomDropdown(targetIndex);
        } else if (event.key === 'Escape') {
            closeCustomDropdown(false);
        }
    });

    document.addEventListener('click', (e) => {
        if (customDropdownWrapper && !customDropdownWrapper.contains(e.target)) {
            closeCustomDropdown(false);
        }
    });
}

function populateForwardersSelect(selectedId) {
    if (!forwarderSelect) return;

    forwarderSelect.innerHTML = '';

    const knownSelection = selectedId === 'custom' || forwardersList.some(f => f.id === selectedId);
    const resolvedSelectedId = knownSelection
        ? selectedId
        : (forwardersList.some(f => f.id === 'inex') ? 'inex' : forwardersList[0]?.id);

    forwardersList.forEach((f) => {
        const diff = +(f.currentRate - (f.previousRate != null ? f.previousRate : f.currentRate)).toFixed(2);
        let indicator = '';
        if (diff > 0) {
            indicator = ` ▲ +$${diff.toFixed(2)}`;
        } else if (diff < 0) {
            indicator = ` ▼ -$${Math.abs(diff).toFixed(2)}`;
        }

        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.name} ($${f.currentRate.toFixed(2)}/kg)${indicator}`;
        if (f.id === resolvedSelectedId) opt.selected = true;
        forwarderSelect.appendChild(opt);
    });

    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = 'სხვა (მითითება...)';
    if (resolvedSelectedId === 'custom') customOpt.selected = true;
    forwarderSelect.appendChild(customOpt);

    renderCustomDropdown(resolvedSelectedId);
    updateForwarderRateStatusPill(forwarderSelect.value);
    renderForwarderFeePolicy(forwarderSelect.value);
}

function renderForwarderFeePolicy(forwarderId) {
    if (!forwarderFeePolicyInfo) return;
    forwarderFeePolicyInfo.replaceChildren();

    if (forwarderId === 'custom') {
        forwarderFeePolicyInfo.textContent = 'ინდივიდუალური გადამზიდის დამატებითი საფასურები ჯამში არ შედის.';
        forwarderFeePolicyInfo.className = 'mt-2 text-[11px] leading-relaxed text-amber-400/80';
        return;
    }

    const forwarder = forwardersList.find(item => item.id === forwarderId);
    const fees = forwarder?.fees;
    if (!fees) {
        forwarderFeePolicyInfo.textContent = 'გადამზიდის დამატებითი საფასურები ვერ დადასტურდა და ჯამში არ შედის.';
        forwarderFeePolicyInfo.className = 'mt-2 text-[11px] leading-relaxed text-amber-400/80';
        return;
    }

    const parts = [];
    if (fees.declarationPreparation?.status === 'verified') {
        parts.push(`საბაჟო დოკუმენტი: ${Number(fees.declarationPreparation.amountGEL).toFixed(0)} ₾`);
    } else {
        parts.push('საბაჟო დოკუმენტი: დაუდასტურებელი');
    }
    if (fees.operationalHandling?.status === 'verified') {
        parts.push('ოპერაციული დამუშავება: ღირებულების მიხედვით');
    } else if (fees.operationalHandling?.status === 'none') {
        parts.push('ცალკე ოპერაციული საფასური: 0 ₾');
    } else {
        parts.push('სხვა ოპერაციული საფასური საჯარო წყაროში არ არის მითითებული');
    }

    const text = document.createElement('span');
    text.textContent = parts.join(' • ');
    forwarderFeePolicyInfo.appendChild(text);
    if (fees.sourceUrl) {
        const link = document.createElement('a');
        link.href = fees.sourceUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'ml-1 text-brand-lime hover:underline';
        link.textContent = 'წყარო';
        forwarderFeePolicyInfo.appendChild(link);
    }
    forwarderFeePolicyInfo.className = 'mt-2 text-[11px] leading-relaxed text-gray-500';
}

function updateForwarderRateStatusPill(forwarderId) {
    if (!rateBadgeContainer) return;

    if (forwarderId === 'custom') {
        rateBadgeContainer.innerHTML = `
            <span class="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 font-medium">ხელით მითითებული</span>
            <span class="text-gray-500">ინდივიდუალური ტარიფი</span>
        `;
        if (btnViewSelectedHistory) btnViewSelectedHistory.classList.add('hidden');
        return;
    }

    if (btnViewSelectedHistory) btnViewSelectedHistory.classList.remove('hidden');

    const forwarder = forwardersList.find(f => f.id === forwarderId);
    if (!forwarder) {
        rateBadgeContainer.innerHTML = `<span class="text-gray-400">ინფორმაცია არ არის</span>`;
        return;
    }

    const prev = forwarder.previousRate != null ? forwarder.previousRate : forwarder.currentRate;
    const diff = +(forwarder.currentRate - prev).toFixed(2);
    const pct = prev > 0 ? Math.abs((diff / prev) * 100).toFixed(1) : '0.0';

    let badgeHtml = '';
    if (diff > 0) {
        badgeHtml = `
            <span class="inline-flex items-center gap-1 text-red-400 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded font-semibold text-[11px]">
                ▲ გაძვირდა +$${diff.toFixed(2)} (+${pct}%)
            </span>
            <span class="text-gray-400 text-[11px] hidden sm:inline">წინა: $${prev.toFixed(2)}</span>
            <span class="text-gray-500 text-[11px]">• ${forwarder.lastUpdated}</span>
        `;
    } else if (diff < 0) {
        badgeHtml = `
            <span class="inline-flex items-center gap-1 text-brand-lime bg-lime-950/70 border border-brand-lime/40 px-2 py-0.5 rounded font-semibold text-[11px]">
                ▼ გაიაფდა -$${Math.abs(diff).toFixed(2)} (-${pct}%)
            </span>
            <span class="text-gray-400 text-[11px] hidden sm:inline">წინა: $${prev.toFixed(2)}</span>
            <span class="text-gray-500 text-[11px]">• ${forwarder.lastUpdated}</span>
        `;
    } else {
        badgeHtml = `
            <span class="inline-flex items-center gap-1 text-gray-300 bg-gray-800/80 border border-gray-700 px-2 py-0.5 rounded text-[11px]">
                ⚪ სტაბილური ტარიფი ($${forwarder.currentRate.toFixed(2)})
            </span>
            <span class="text-gray-500 text-[11px]">• ${forwarder.lastUpdated}</span>
        `;
    }

    rateBadgeContainer.innerHTML = badgeHtml;
}

// --- PRICE TRACKER MODAL RENDERING ---

function renderTrackerModal(filter = 'all') {
    if (!forwardersTrackerList) return;

    let filtered = forwardersList;
    if (filter === 'up') {
        filtered = forwardersList.filter(f => (f.currentRate - (f.previousRate || f.currentRate)) > 0);
    } else if (filter === 'down') {
        filtered = forwardersList.filter(f => (f.currentRate - (f.previousRate || f.currentRate)) < 0);
    }

    if (filtered.length === 0) {
        forwardersTrackerList.innerHTML = `
            <div class="col-span-full py-10 text-center text-gray-500 text-sm">
                ამ კატეგორიაში მონაცემები არ არის
            </div>
        `;
        return;
    }

    forwardersTrackerList.innerHTML = filtered.map(f => {
        const prev = f.previousRate != null ? f.previousRate : f.currentRate;
        const diff = +(f.currentRate - prev).toFixed(2);
        const pct = prev > 0 ? Math.abs((diff / prev) * 100).toFixed(1) : '0.0';

        let badgeClass = 'text-gray-300 bg-gray-800/80 border-gray-700';
        let badgeText = '⚪ უცვლელი';
        let diffText = `$${f.currentRate.toFixed(2)}`;

        if (diff > 0) {
            badgeClass = 'text-red-400 bg-red-950/60 border-red-800/50';
            badgeText = `▲ +$${diff.toFixed(2)} (+${pct}%)`;
            diffText = `გაძვირდა +$${diff.toFixed(2)}`;
        } else if (diff < 0) {
            badgeClass = 'text-brand-lime bg-lime-950/60 border-brand-lime/40';
            badgeText = `▼ -$${Math.abs(diff).toFixed(2)} (-${pct}%)`;
            diffText = `დაკლდა -$${Math.abs(diff).toFixed(2)}`;
        }

        const historyItems = (f.history || []).map(h => {
            const hDiff = h.change || 0;
            let icon = '⚪';
            let color = 'text-gray-400';
            if (hDiff > 0) { icon = '▲'; color = 'text-red-400'; }
            else if (hDiff < 0) { icon = '▼'; color = 'text-brand-lime'; }

            return `
                <div class="flex items-start justify-between gap-2 py-2 border-b border-brand-border/40 last:border-b-0 text-xs">
                    <div>
                        <div class="flex items-center gap-1.5 font-medium text-white">
                            <span>${icon}</span>
                            <span>$${h.rate.toFixed(2)} / კგ</span>
                            <span class="${color}">(${hDiff >= 0 ? '+' : ''}${hDiff.toFixed(2)})</span>
                        </div>
                        <p class="text-[11px] text-brand-text-muted mt-0.5">${h.note || 'ტარიფის ცვლილება'}</p>
                    </div>
                    <span class="text-[10px] text-gray-500 shrink-0 font-mono">${h.date}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-brand-bg border border-brand-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-lime/40 transition-all">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="text-white font-bold text-base flex items-center gap-2">
                                ${f.name}
                                ${f.website ? `<a href="${f.website}" target="_blank" rel="noopener" class="text-xs text-gray-500 hover:text-brand-lime transition-colors" title="ოფიციალური საიტი">🔗</a>` : ''}
                            </h4>
                            <span class="text-[11px] text-gray-500">საჰაერო გადაზიდვა</span>
                        </div>
                        <span class="px-2 py-1 rounded text-xs border font-medium ${badgeClass}">
                            ${badgeText}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 my-3 p-3 rounded-lg bg-brand-card border border-brand-border/60">
                        <div>
                            <span class="text-[10px] text-gray-500 block">მიმდინარე ტარიფი</span>
                            <span class="text-lg font-bold text-brand-lime">$${f.currentRate.toFixed(2)}</span>
                            <span class="text-[10px] text-gray-400">/ კგ</span>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] text-gray-500 block">წინა ტარიფი</span>
                            <span class="text-sm font-semibold text-gray-300">$${prev.toFixed(2)}</span>
                            <span class="text-[10px] text-gray-500 block">ბოლო განახლება: ${f.lastUpdated}</span>
                        </div>
                    </div>
                </div>

                <details class="group mt-2">
                    <summary class="text-xs text-brand-lime hover:underline cursor-pointer flex items-center justify-between list-none py-1">
                        <span>📜 ცვლილებების ისტორია (${(f.history || []).length})</span>
                        <span class="transition-transform duration-200 group-open:rotate-180">▾</span>
                    </summary>
                    <div class="mt-2 pt-2 border-t border-brand-border/60 divide-y divide-brand-border/20">
                        ${historyItems || '<p class="text-xs text-gray-500 py-2">ისტორია არ არის</p>'}
                    </div>
                </details>
            </div>
        `;
    }).join('');
}


function setActiveTrackerFilter(activeFilter) {
    document.querySelectorAll('.tracker-filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === activeFilter;
        const arrow = btn.querySelector('.tab-arrow');

        if (isActive) {
            btn.classList.add('bg-brand-lime', 'text-black', 'font-semibold', 'border-brand-lime');
            btn.classList.remove('bg-brand-input', 'text-gray-300', 'border-brand-border');
            if (arrow) {
                arrow.classList.remove('text-red-400', 'text-brand-lime');
                arrow.classList.add('text-black');
            }
        } else {
            btn.classList.add('bg-brand-input', 'text-gray-300', 'border-brand-border');
            btn.classList.remove('bg-brand-lime', 'text-black', 'font-semibold', 'border-brand-lime');
            if (arrow) {
                arrow.classList.remove('text-black');
                if (btn.dataset.filter === 'up') arrow.classList.add('text-red-400');
                if (btn.dataset.filter === 'down') arrow.classList.add('text-brand-lime');
            }
        }
    });
}

// Modal open/close helpers
let trackerModalReturnFocus = null;

function getTrackerModalFocusableElements() {
    if (!priceTrackerModal) return [];
    return Array.from(priceTrackerModal.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => !element.closest('.hidden'));
}

function openTrackerModal(focusId = null) {
    if (!priceTrackerModal) return;
    trackerModalReturnFocus = document.activeElement;
    renderTrackerModal('all');
    priceTrackerModal.classList.remove('hidden');
    priceTrackerModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');

    // Reset active filter button style
    setActiveTrackerFilter('all');
    btnCloseTrackerModal?.focus();
}

function closeTrackerModal() {
    if (!priceTrackerModal) return;
    priceTrackerModal.classList.add('hidden');
    priceTrackerModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    if (trackerModalReturnFocus instanceof HTMLElement) trackerModalReturnFocus.focus();
    trackerModalReturnFocus = null;
}

// Modal event listeners
if (btnViewSelectedHistory) {
    btnViewSelectedHistory.addEventListener('click', () => openTrackerModal(forwarderSelect.value));
}
if (btnCloseTrackerModal) {
    btnCloseTrackerModal.addEventListener('click', closeTrackerModal);
}
if (btnCloseTrackerModalBtn) {
    btnCloseTrackerModalBtn.addEventListener('click', closeTrackerModal);
}
if (priceTrackerModal) {
    priceTrackerModal.addEventListener('click', (e) => {
        if (e.target === priceTrackerModal) closeTrackerModal();
    });
}
document.addEventListener('keydown', (e) => {
    const modalIsOpen = priceTrackerModal && !priceTrackerModal.classList.contains('hidden');
    if (e.key === 'Escape' && modalIsOpen) {
        closeTrackerModal();
        return;
    }

    if (e.key === 'Tab' && modalIsOpen) {
        const focusable = getTrackerModalFocusableElements();
        if (focusable.length === 0) {
            e.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
});

// Modal filter tabs
document.querySelectorAll('.tracker-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setActiveTrackerFilter(btn.dataset.filter);
        renderTrackerModal(btn.dataset.filter);
    });
});

// Check and show recent rate changes notification banner for users
function checkRecentRateChanges() {
    if (!rateAlertBanner || !rateAlertText) return;

    // Find companies with non-zero diff
    const changed = forwardersList.filter(f => (f.currentRate - (f.previousRate || f.currentRate)) !== 0);
    if (changed.length === 0) return;

    // Build unique signature of current rates
    const currentSig = changed.map(f => `${f.id}:${f.currentRate}:${f.lastUpdated}`).join('|');
    const seenSig = localStorage.getItem('calc_seen_rates_sig');

    if (seenSig !== currentSig) {
        const summaries = changed.slice(0, 2).map(f => {
            const diff = +(f.currentRate - f.previousRate).toFixed(2);
            return `${f.name} (${diff > 0 ? '+' : ''}$${diff.toFixed(2)})`;
        }).join(', ');

        rateAlertText.textContent = `${summaries}${changed.length > 2 ? ' და სხვა' : ''}`;
        rateAlertBanner.classList.remove('hidden');

        if (btnAlertOpenTracker) {
            btnAlertOpenTracker.onclick = () => {
                openTrackerModal();
            };
        }

        if (btnDismissAlert) {
            btnDismissAlert.onclick = () => {
                localStorage.setItem('calc_seen_rates_sig', currentSig);
                rateAlertBanner.classList.add('hidden');
            };
        }
    }
}

// --- MAIN CALCULATOR LOGIC ---

function showCalculationError(message, fieldId = null) {
    const resultContainer = document.getElementById('result');
    const error = document.createElement('div');
    error.className = 'text-red-400 text-center bg-red-900/20 border border-red-900/50 p-4 rounded-xl';
    error.setAttribute('role', 'alert');
    error.textContent = message;
    resultContainer.replaceChildren(error);
    if (fieldId) document.getElementById(fieldId)?.focus();
}

function finiteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatSignedMoney(value, currency = '₾') {
    const safeValue = finiteNumber(value);
    const sign = safeValue > 0 ? '+' : safeValue < 0 ? '−' : '';
    const amount = Math.abs(safeValue).toFixed(2);
    return currency === '$' ? `${sign}$${amount}` : `${sign}${amount} ${currency}`;
}

function renderRecalculationComparison(current) {
    if (!recalculationSource) return '';

    const previousPrice = finiteNumber(recalculationSource.priceUSD);
    const previousRate = finiteNumber(recalculationSource.rate);
    const previousTotal = finiteNumber(recalculationSource.total);
    const previousShippingRate = finiteNumber(
        recalculationSource.shippingRatePerKG,
        previousRate > 0 && finiteNumber(recalculationSource.weight) > 0
            ? finiteNumber(recalculationSource.deliveryGEL) / previousRate / finiteNumber(recalculationSource.weight)
            : 0
    );
    const rows = [
        ['ნივთების ფასი', `$${previousPrice.toFixed(2)}`, `$${current.priceUSD.toFixed(2)}`, formatSignedMoney(current.priceUSD - previousPrice, '$')],
        ['USD/GEL კურსი', previousRate.toFixed(4), current.exchangeRate.toFixed(4), `${current.exchangeRate - previousRate >= 0 ? '+' : '−'}${Math.abs(current.exchangeRate - previousRate).toFixed(4)}`],
        ['გადაზიდვა / კგ', `$${previousShippingRate.toFixed(2)}`, `$${current.shippingRatePerKG.toFixed(2)}`, formatSignedMoney(current.shippingRatePerKG - previousShippingRate, '$')],
        ['საბოლოო ჯამი', `${previousTotal.toFixed(2)} ₾`, `${current.totalCostGEL.toFixed(2)} ₾`, formatSignedMoney(current.totalCostGEL - previousTotal)]
    ];

    return `
        <div class="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 space-y-2">
            <strong class="text-sm text-blue-200">ცვლილებების შედარება</strong>
            <div class="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-3 gap-y-2 text-[11px] items-center overflow-x-auto">
                <span class="text-gray-500">მაჩვენებელი</span><span class="text-gray-500 text-right">მანამდე</span><span class="text-gray-500 text-right">ახლა</span><span class="text-gray-500 text-right">სხვაობა</span>
                ${rows.map(row => `<span class="text-gray-300">${row[0]}</span><span class="text-gray-400 text-right whitespace-nowrap">${row[1]}</span><span class="text-white text-right whitespace-nowrap">${row[2]}</span><span class="${row[3].startsWith('+') ? 'text-red-300' : row[3].startsWith('−') ? 'text-brand-lime' : 'text-gray-400'} text-right whitespace-nowrap">${row[3]}</span>`).join('')}
            </div>
        </div>
    `;
}

calculateButton.addEventListener('click', async () => {
    // 1. Inputs
    let priceUSD;
    let currentCartItems = [];
    if (calculationMode === 'cart') {
        currentCartItems = getCartCalculationItems();
        const cartValidation = CalculatorCore.validateCartParcels(currentCartItems);
        if (!cartValidation.valid) {
            const firstError = cartValidation.errors[0];
            showCalculationError(firstError.message);
            if (firstError.index >= 0) {
                const itemId = cartItems[firstError.index]?.id;
                const selector = firstError.field === 'cartWeight'
                    ? `[data-cart-weight="${itemId}"]`
                    : firstError.field === 'cartDimensions'
                        ? `[data-cart-dimension="${itemId}"]`
                        : `[data-cart-price="${itemId}"]`;
                cartItemsList.querySelector(selector)?.focus();
            }
            return;
        }
        priceUSD = CalculatorCore.calculateCartSubtotalUSD(currentCartItems);
    } else {
        priceUSD = parseFloat(document.getElementById('price').value);
    }
    const weightInput = parseFloat(document.getElementById('weight').value);
    const customRateInput = document.getElementById('customRate');
    const customRateRaw = customRateInput.value.trim();
    const customRate = customRateRaw ? parseFloat(customRateRaw) : NaN;
    const weightUnit = document.getElementById('weightUnit').value;
    const insuranceUSD = parseFloat(insuranceInput.value || '0');
    const importDutyPercent = parseFloat(importDutyRateInput.value || '0');
    const importDutyRate = importDutyPercent / 100;

    const resultContainer = document.getElementById('result');

    // Validation
    if (calculationMode === 'single' && (!Number.isFinite(priceUSD) || priceUSD < 0)) {
        showCalculationError('ნივთის ფასი უნდა იყოს 0 ან მეტი.', 'price');
        return;
    }
    if (calculationMode === 'single' && (!Number.isFinite(weightInput) || weightInput <= 0)) {
        showCalculationError('წონა უნდა იყოს 0-ზე მეტი.', 'weight');
        return;
    }
    if (customRateRaw && (!Number.isFinite(customRate) || customRate <= 0)) {
        showCalculationError('USD/GEL კურსი უნდა იყოს 0-ზე მეტი.', 'customRate');
        return;
    }
    if (!Number.isFinite(insuranceUSD) || insuranceUSD < 0) {
        showCalculationError('დაზღვევის ღირებულება უნდა იყოს 0 ან მეტი.', 'insuranceCost');
        return;
    }
    if (!Number.isFinite(importDutyPercent) || importDutyPercent < 0 || importDutyPercent > 100) {
        showCalculationError('იმპორტის ტარიფი უნდა იყოს 0%-დან 100%-მდე.', 'importDutyRate');
        return;
    }

    const dimensions = {
        lengthCm: parseFloat(document.getElementById('dimL').value),
        widthCm: parseFloat(document.getElementById('dimW').value),
        heightCm: parseFloat(document.getElementById('dimH').value)
    };

    // 4. Shipping Rate Logic
    const selectedForwarderId = forwarderSelect.value;
    const forwarderObj = forwardersList.find(f => f.id === selectedForwarderId);
    const forwarderFeePolicy = forwarderObj?.fees || null;
    let shippingRatePerKG = 0;
    let forwarderDisplayName = 'გადამზიდი';

    if (selectedForwarderId === 'custom') {
        shippingRatePerKG = parseFloat(document.getElementById('customShippingRate').value);
        forwarderDisplayName = 'სხვა (ინდივიდუალური)';
    } else if (forwarderObj) {
        shippingRatePerKG = forwarderObj.currentRate;
        forwarderDisplayName = forwarderObj.name;
    } else {
        // Fallback for legacy numeric string values
        shippingRatePerKG = parseFloat(selectedForwarderId) || 0;
    }

    if (!Number.isFinite(shippingRatePerKG) || shippingRatePerKG <= 0) {
        showCalculationError(
            'ტრანსპორტირების ტარიფი უნდა იყოს 0-ზე მეტი.',
            selectedForwarderId === 'custom' ? 'customShippingRate' : null
        );
        return;
    }

    // 5. Exchange Rate
    calculateButton.disabled = true;
    calculateButton.setAttribute('aria-busy', 'true');
    const originalButtonText = calculateButton.textContent;
    calculateButton.textContent = 'ითვლება...';
    const exchangeRate = await fetchExchangeRate(customRate);
    calculateButton.disabled = false;
    calculateButton.removeAttribute('aria-busy');
    calculateButton.textContent = originalButtonText;

    // 6. Final calculations are kept in a pure, testable module.
    let calculation;
    if (calculationMode === 'cart') {
        calculation = CalculatorCore.calculateCartCosts({
            items: currentCartItems,
            shippingRatePerKG,
            exchangeRate,
            insuranceUSD,
            importDutyRate,
            customsRules,
            forwarderFeePolicy
        });
    } else {
        const calculationInput = {
            priceUSD,
            weightInput,
            weightUnit,
            shippingRatePerKG,
            exchangeRate,
            insuranceUSD,
            importDutyRate,
            customsRules,
            forwarderFeePolicy,
            useVolumetric: toggleVolumetric.checked,
            dimensions
        };
        const validation = CalculatorCore.validateCalculationInputs(calculationInput);
        if (!validation.valid) {
            const firstError = validation.errors[0];
            const fieldMap = {
                price: 'price',
                weight: 'weight',
                shippingRate: selectedForwarderId === 'custom' ? 'customShippingRate' : null,
                exchangeRate: 'customRate',
                insurance: 'insuranceCost',
                importDutyRate: 'importDutyRate',
                dimensions: 'dimL'
            };
            showCalculationError(firstError.message, fieldMap[firstError.field]);
            return;
        }
        calculation = CalculatorCore.calculateCosts(calculationInput);
    }
    const realWeightKG = calculation.physicalWeightKg;
    const volWeightKG = calculation.volumetricWeightKg;
    const chargeableWeightKG = calculation.chargeableWeightKg;
    const isVolumetric = calculation.usesVolumetricWeight;
    const priceGEL = calculation.itemCostGEL;
    const deliveryCostGEL = calculation.shippingCostGEL;
    const totalCostGEL = calculation.totalCostGEL;
    const taxableAmount = calculation.estimatedCustomsValueGEL;
    const vat = calculation.vatGEL;
    const hasTax = calculation.hasTax;
    const treasury_fee = calculation.treasuryFeeGEL;
    const declaration_preparation_fee = calculation.declarationPreparationFeeGEL;
    const operational_handling_fee = calculation.operationalHandlingFeeGEL;
    const import_duty = calculation.importDutyGEL;
    const insuranceCostGEL = calculation.insuranceCostGEL;
    const customsReasonText = calculation.taxReasons.map(reason => (
        reason === 'physical-weight'
            ? 'ფიზიკური წონა 30 კგ-ს აღემატება'
            : 'სავარაუდო საბაჟო ღირებულება 300 ₾-ს აღემატება'
    )).join(' • ');
    const rateSourceText = exchangeRateInfo?.source === 'manual'
        ? 'ხელით მითითებული'
        : exchangeRateInfo?.source === 'nbg'
            ? 'ეროვნული ბანკი'
            : exchangeRateInfo?.source === 'cache'
                ? 'შენახული ოფლაინ კურსი'
                : 'საორიენტაციო სარეზერვო კურსი';
    const safetyBuffer = Math.max(0, finiteNumber(cartSafetyBufferInput?.value, 10));
    const comparisonPanel = renderRecalculationComparison({
        priceUSD,
        exchangeRate,
        shippingRatePerKG,
        totalCostGEL
    });
    const cartInvoiceItemRows = calculationMode === 'cart'
        ? currentCartItems.map((item, index) => {
            const lineTotalUSD = item.priceUSD * item.quantity;
            const lineTotalGEL = lineTotalUSD * exchangeRate;
            const name = escapeHtml(item.name || `ამანათი ${index + 1}`);
            return `
                <div class="grid grid-cols-[minmax(0,1fr)_36px_66px_78px] gap-2 items-start py-2.5 border-b border-brand-border/70 text-xs last:border-b-0">
                    <div class="min-w-0">
                        <div class="text-gray-200 font-medium break-words">${name}</div>
                        <div class="text-[10px] text-gray-600 mt-0.5">ამანათი ${index + 1}</div>
                    </div>
                    <div class="text-center text-gray-400">${item.quantity}</div>
                    <div class="text-right text-gray-400">$${item.priceUSD.toFixed(2)}</div>
                    <div class="text-right">
                        <div class="text-white font-medium">$${lineTotalUSD.toFixed(2)}</div>
                        <div class="text-[10px] text-gray-500">${lineTotalGEL.toFixed(2)} ₾</div>
                    </div>
                </div>
            `;
        }).join('')
        : '';
    const cartInvoiceShippingRows = calculationMode === 'cart'
        ? calculation.parcels.map((parcel, index) => {
            const shippingUSD = parcel.chargeableWeightKg * shippingRatePerKG;
            const shippingGEL = shippingUSD * exchangeRate;
            const name = escapeHtml(currentCartItems[index].name || `ამანათი ${index + 1}`);
            return `
                <div class="py-2.5 border-b border-brand-border/70 last:border-b-0 text-xs">
                    <div class="flex justify-between items-start gap-3">
                        <div class="min-w-0">
                            <div class="text-gray-200 font-medium break-words">${name}</div>
                            <div class="text-[10px] mt-0.5 ${parcel.usesVolumetricWeight ? 'text-blue-300' : 'text-gray-600'}">${parcel.usesVolumetricWeight ? 'მოცულობითი წონით' : 'ფიზიკური წონით'}</div>
                        </div>
                        <strong class="text-gray-200 whitespace-nowrap">$${shippingUSD.toFixed(2)}</strong>
                    </div>
                    <div class="flex justify-between gap-3 text-[10px] text-gray-500 mt-1">
                        <span>${parcel.chargeableWeightKg.toFixed(2)} კგ × $${shippingRatePerKG.toFixed(2)}/კგ</span>
                        <span>${shippingGEL.toFixed(2)} ₾</span>
                    </div>
                </div>
            `;
        }).join('')
        : '';

    const customsComponentsText = insuranceCostGEL > 0
        ? 'საქონელი + ტრანსპორტირება + დაზღვევა'
        : 'საქონელი + ტრანსპორტირება';
    const insuranceRowHtml = insuranceCostGEL > 0 ? `
        <div class="flex justify-between gap-3 text-gray-400">
            <span>დაზღვევა</span>
            <span class="text-right"><strong class="text-gray-200">$${insuranceUSD.toFixed(2)}</strong><span class="block text-[10px]">${insuranceCostGEL.toFixed(2)} ₾</span></span>
        </div>
    ` : '';
    const importDutyRowHtml = import_duty > 0 ? `
        <div class="flex justify-between gap-3 text-gray-400"><span>იმპორტის გადასახადი (${importDutyPercent.toFixed(2)}%)</span><strong class="text-red-300 whitespace-nowrap">${import_duty.toFixed(2)} ₾</strong></div>
    ` : '';
    const treasuryRowHtml = treasury_fee > 0 ? `
        <div class="flex justify-between gap-3 text-gray-400"><span>RS საბაჟო მომსახურება</span><strong class="text-red-300 whitespace-nowrap">${treasury_fee.toFixed(2)} ₾</strong></div>
    ` : '';
    const declarationRowHtml = declaration_preparation_fee > 0 ? `
        <div class="flex justify-between gap-3 text-gray-400"><span>${escapeHtml(forwarderDisplayName)} — დეკლარაციის მომზადება</span><strong class="text-amber-300 whitespace-nowrap">${declaration_preparation_fee.toFixed(2)} ₾</strong></div>
    ` : '';
    const operationalRowHtml = operational_handling_fee > 0 ? `
        <div class="flex justify-between gap-3 text-gray-400"><span>${escapeHtml(forwarderDisplayName)} — ოპერაციული დამუშავება</span><strong class="text-amber-300 whitespace-nowrap">${operational_handling_fee.toFixed(2)} ₾</strong></div>
    ` : '';
    const forwarderFeeWarningHtml = calculation.warnings.length > 0 ? `
        <div class="p-2.5 rounded-lg border border-amber-400/25 bg-amber-400/10 text-[11px] leading-relaxed text-amber-200/80">
            ${calculation.warnings.includes('declaration-preparation-unverified') ? 'დეკლარაციის მომზადების საფასური დაუდასტურებელია და ჯამში არ შედის. ' : ''}
            ${calculation.warnings.includes('operational-handling-unverified') ? 'სხვა ოპერაციული საფასური საჯარო წყაროში ვერ დადასტურდა და ჯამში არ შედის.' : ''}
        </div>
    ` : '';

    const cartInvoiceHtml = calculationMode === 'cart' ? `
        <div class="rounded-xl border border-brand-border overflow-hidden bg-brand-bg/25">
            <div class="px-3 py-2.5 bg-white/[0.03] border-b border-brand-border flex items-center justify-between gap-3">
                <div>
                    <div class="text-sm font-semibold text-white">კალათის ინვოისი</div>
                    <div class="text-[10px] text-gray-500">${currentCartItems.length} ამანათი • კურსი ${exchangeRate.toFixed(4)}</div>
                </div>
                <span class="text-[10px] text-gray-500">USD → GEL</span>
            </div>

            <div class="px-3">
                <div class="grid grid-cols-[minmax(0,1fr)_36px_66px_78px] gap-2 py-2 border-b border-brand-border text-[10px] uppercase tracking-wide text-gray-600">
                    <span>აღწერა</span>
                    <span class="text-center">რაოდ.</span>
                    <span class="text-right">ერთ. ფასი</span>
                    <span class="text-right">ჯამი</span>
                </div>
                ${cartInvoiceItemRows}
            </div>

            <div class="px-3 py-2 bg-white/[0.02] border-y border-brand-border">
                <div class="text-[10px] uppercase tracking-wide text-gray-600">ტრანსპორტირება თითო ამანათზე</div>
            </div>
            <div class="px-3">${cartInvoiceShippingRows}</div>

            <div class="px-3 py-3 space-y-2 bg-white/[0.02] border-t border-brand-border text-xs">
                <div class="flex justify-between gap-3 text-gray-400">
                    <span>საქონლის ქვეჯამი</span>
                    <span class="text-right"><strong class="text-gray-200">$${priceUSD.toFixed(2)}</strong><span class="block text-[10px]">${priceGEL.toFixed(2)} ₾</span></span>
                </div>
                <div class="flex justify-between gap-3 text-gray-400">
                    <span>ტრანსპორტირების ქვეჯამი</span>
                    <span class="text-right"><strong class="text-gray-200">$${calculation.shippingCostUSD.toFixed(2)}</strong><span class="block text-[10px]">${deliveryCostGEL.toFixed(2)} ₾</span></span>
                </div>
                ${insuranceRowHtml}
                <div class="flex justify-between gap-3 pt-2 border-t border-brand-border text-gray-300">
                    <span>სავარაუდო საბაჟო ღირებულება<br><span class="text-[10px] text-gray-600">${customsComponentsText}</span></span>
                    <strong class="text-white whitespace-nowrap">${taxableAmount.toFixed(2)} ₾</strong>
                </div>
                ${hasTax ? `
                    ${importDutyRowHtml}
                    <div class="flex justify-between gap-3 text-gray-400">
                        <span>დღგ (${calculation.vatTaxableBaseGEL.toFixed(2)} ₾ × ${(calculation.vatRate * 100).toFixed(0)}%)</span>
                        <strong class="text-red-300 whitespace-nowrap">${vat.toFixed(2)} ₾</strong>
                    </div>
                    ${treasuryRowHtml}
                    ${declarationRowHtml}
                ` : `
                    <div class="flex justify-between gap-3 text-brand-lime/80"><span>სავარაუდო სახელმწიფო გადასახადები</span><strong>0.00 ₾</strong></div>
                `}
                ${operationalRowHtml}
            </div>

            <div class="px-3 py-3.5 border-t border-brand-border bg-brand-lime/5 flex justify-between items-end gap-3">
                <span class="text-sm font-bold text-white">საბოლოო ჯამი</span>
                <strong class="text-2xl font-bold text-brand-lime tracking-tight whitespace-nowrap">${totalCostGEL.toFixed(2)} ₾</strong>
            </div>
        </div>

        <div class="p-3 rounded-xl border border-amber-400/30 bg-amber-400/10 text-xs space-y-1.5">
            <p class="font-semibold text-amber-300">როგორ არის დათვლილი საბოლოო ჯამი</p>
            <p class="text-gray-300">ფასი დათვლილია იმ დაშვებით, რომ კალათაში დამატებული ამანათები ერთად ჩამოვა და ერთ გზავნილად გაფორმდება.</p>
            <p class="text-gray-500">თუ გადამზიდი მათ ცალ-ცალკე გააფორმებს, თითოეული გზავნილი დამოუკიდებლად შეფასდება. 300 ₾-ის ზღვარს გადაცილებულ თითოეულ გზავნილს შეიძლება ცალ-ცალკე დაერიცხოს საბაჟო მომსახურება და დეკლარაციის მომზადება. რეალური დაჯგუფების გარკვევის შემდეგ თითო გზავნილი ცალკე გამოთვალეთ.</p>
        </div>
        ${hasTax ? `<p class="text-xs text-red-300">${customsReasonText}</p>` : '<p class="text-xs text-brand-lime/70">*შეფასებით განბაჟების გარეშე</p>'}
        ${forwarderFeeWarningHtml}
    ` : '';

    const singleItemHtml = calculationMode === 'single' ? `
        <div class="flex justify-between items-center text-brand-text-muted text-sm">
            <span>ნივთის ღირებულება:</span>
            <span class="text-white font-medium">${priceGEL.toFixed(2)} ₾</span>
        </div>
        <div class="flex justify-between items-center text-brand-text-muted text-sm">
            <span class="flex items-center gap-2">
                ტრანსპორტირება
                ${isVolumetric ? '<span class="text-[10px] bg-blue-900 text-blue-200 px-1 rounded">მოცულობითი</span>' : ''}
                (${chargeableWeightKG.toFixed(2)} კგ):
            </span>
            <span class="text-white font-medium">${deliveryCostGEL.toFixed(2)} ₾</span>
        </div>
        ${insuranceCostGEL > 0 ? `<div class="flex justify-between items-center text-brand-text-muted text-sm"><span>დაზღვევა:</span><span class="text-white font-medium">${insuranceCostGEL.toFixed(2)} ₾</span></div>` : ''}
        ${toggleVolumetric.checked ? `
            <div class="text-xs text-gray-500 flex justify-between gap-3">
                <span>ფიზიკური: ${realWeightKG.toFixed(2)} კგ</span>
                <span>მოცულობითი: ${volWeightKG.toFixed(2)} კგ</span>
            </div>
        ` : ''}
        ${hasTax ? `
            <div class="p-3 bg-red-500/10 rounded-xl border border-red-500/20 space-y-2 mt-2">
                <p class="text-xs text-red-300 border-b border-red-500/20 pb-2">${customsReasonText}</p>
                ${import_duty > 0 ? `<div class="flex justify-between items-center text-gray-300 text-xs"><span>იმპორტის გადასახადი (${importDutyPercent.toFixed(2)}%):</span><span class="text-red-400 font-medium">${import_duty.toFixed(2)} ₾</span></div>` : ''}
                <div class="flex justify-between items-center text-gray-300 text-xs border-b border-red-500/20 pb-2"><span>დღგ (${calculation.vatTaxableBaseGEL.toFixed(2)} ₾ × ${(calculation.vatRate * 100).toFixed(0)}%):</span><span class="text-red-400 font-medium">${vat.toFixed(2)} ₾</span></div>
                ${treasury_fee > 0 ? `<div class="flex justify-between items-center text-gray-300 text-xs"><span>RS საბაჟო მომსახურება:</span><span class="text-red-400 font-medium">${treasury_fee.toFixed(2)} ₾</span></div>` : ''}
                ${declaration_preparation_fee > 0 ? `<div class="flex justify-between items-center text-gray-300 text-xs"><span>${escapeHtml(forwarderDisplayName)} — დეკლარაცია:</span><span class="text-amber-300 font-medium">${declaration_preparation_fee.toFixed(2)} ₾</span></div>` : ''}
            </div>
        ` : '<div class="text-xs text-brand-lime/70 text-right">*შეფასებით: ღირებულება 300 ₾-ს არ აღემატება და ფიზიკური წონა 30 კგ-ს არ აღემატება</div>'}
        ${operational_handling_fee > 0 ? `<div class="flex justify-between items-center text-xs text-gray-300"><span>${escapeHtml(forwarderDisplayName)} — ოპერაციული დამუშავება:</span><span class="text-amber-300 font-medium">${operational_handling_fee.toFixed(2)} ₾</span></div>` : ''}
        ${forwarderFeeWarningHtml}
        <div class="h-px bg-brand-border my-4"></div>
        <div class="flex justify-between items-center gap-3 text-xs text-brand-text-muted mb-2"><span class="min-w-0">სავარაუდო საბაჟო ღირებულება (${customsComponentsText}):</span><span class="flex-shrink-0 whitespace-nowrap text-right">${taxableAmount.toFixed(2)}&nbsp;₾</span></div>
        <div class="flex justify-between items-center"><span class="text-lg font-bold text-white">სულ:</span><span class="text-3xl font-bold text-brand-lime tracking-tight">${totalCostGEL.toFixed(2)} ₾</span></div>
    ` : '';

    // 7. RENDER
    resultContainer.innerHTML = `
        <div class="space-y-3 fade-in">
            ${cartInvoiceHtml}
            ${singleItemHtml}
            <div>
                ${comparisonPanel}
                ${comparisonPanel ? '<div class="h-px bg-brand-border my-4"></div>' : ''}
                <div class="text-xs text-center text-brand-text-muted mt-2 mb-4">
                    კურსი: ${exchangeRate.toFixed(4)} (${rateSourceText}) • ${forwarderDisplayName}: $${shippingRatePerKG.toFixed(2)}/kg
                    <div class="mt-1">
                        გამოთვლა საორიენტაციოა. საბოლოო დარიცხვას განსაზღვრავს
                        <a href="https://www.rs.ge/Parcelinfo" target="_blank" rel="noopener noreferrer" class="text-brand-lime hover:underline">შემოსავლების სამსახური</a>.
                    </div>
                </div>

                <div class="bg-white/5 rounded-xl p-3 border border-white/10 mt-4 space-y-3">
                    <label for="saveTitle" class="sr-only">${calculationMode === 'cart' ? 'კალათის დასახელება' : 'ნივთის დასახელება'}</label>
                    <input type="text" id="saveTitle" placeholder="${calculationMode === 'cart' ? 'კალათის დასახელება...' : 'ნივთის დასახელება...'}"
                        class="bg-brand-bg border border-brand-border text-white text-xs rounded-lg block w-full p-2 outline-none focus:border-brand-lime mb-2">
                    ${calculationMode === 'single' ? `
                    <label for="saveUrl" class="sr-only">ნივთის ბმული</label>
                    <input type="url" id="saveUrl" placeholder="ლინკი (არასავალდებულო)..."
                        class="bg-brand-bg border border-brand-border text-white text-xs rounded-lg block w-full p-2 outline-none focus:border-brand-lime mb-2">
                    ` : ''}
                    
                    <div class="flex gap-2">
                        <button id="btnSaveResult" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg text-sm py-2 transition-colors">
                            შენახვა
                        </button>
                        <button id="btnShareResult" class="px-4 bg-brand-border hover:bg-white/20 text-white rounded-lg transition-colors" title="კოპირება">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const saveTitleInput = document.getElementById('saveTitle');
    const saveUrlInput = document.getElementById('saveUrl');
    if (recalculationSource && typeof recalculationSource.title === 'string') {
        saveTitleInput.value = recalculationSource.title;
    }
    if (saveUrlInput && recalculationSource && typeof recalculationSource.url === 'string') {
        saveUrlInput.value = recalculationSource.url;
    }

    // --- SAVE TO HISTORY BUTTON ---
    document.getElementById('btnSaveResult').addEventListener('click', () => {
        const titleInput = document.getElementById('saveTitle');
        const urlInput = document.getElementById('saveUrl');
        
        const title = titleInput.value.trim() || (calculationMode === 'cart' ? 'უსახელო კალათა' : 'უსახელო ნივთი');

        const savedData = {
            schemaVersion: 6,
            id: Date.now(),
            date: new Date().toLocaleString('ka-GE').split(',')[0],
            title: title,
            url: urlInput?.value.trim() || '',
            calculationType: calculationMode,
            items: calculationMode === 'cart'
                ? currentCartItems.map(item => ({
                    name: item.name,
                    url: item.url,
                    priceUSD: item.priceUSD,
                    quantity: item.quantity,
                    weightInput: item.weightInput,
                    weightUnit: item.weightUnit,
                    useVolumetric: item.useVolumetric,
                    dimensions: item.dimensions
                }))
                : [],
            priceUSD: priceUSD.toFixed(2),
            weight: chargeableWeightKG.toFixed(2),
            physicalWeight: realWeightKG.toFixed(2),
            volumetricWeight: volWeightKG.toFixed(2),
            unit: 'kg', 
            total: totalCostGEL.toFixed(2),
            rate: exchangeRate.toFixed(4),
            deliveryGEL: deliveryCostGEL.toFixed(2),
            taxTotal: calculation.totalAdditionalChargesGEL.toFixed(2),
            forwarderId: selectedForwarderId,
            forwarderName: forwarderDisplayName,
            shippingRatePerKG: shippingRatePerKG.toFixed(2),
            sourceCalculationId: recalculationSource?.id || null,
            cartSafetyBuffer: calculationMode === 'cart' ? safetyBuffer : null,
            invoiceSnapshot: {
                version: 2,
                calculationType: calculationMode,
                items: calculationMode === 'cart'
                    ? currentCartItems.map((item, index) => ({
                        name: item.name || `ამანათი ${index + 1}`,
                        quantity: item.quantity,
                        unitPriceUSD: item.priceUSD,
                        lineTotalUSD: item.priceUSD * item.quantity,
                        lineTotalGEL: item.priceUSD * item.quantity * exchangeRate
                    }))
                    : [{
                        name: title,
                        quantity: 1,
                        unitPriceUSD: priceUSD,
                        lineTotalUSD: priceUSD,
                        lineTotalGEL: priceGEL
                    }],
                shippingRows: calculationMode === 'cart'
                    ? calculation.parcels.map((parcel, index) => ({
                        name: currentCartItems[index].name || `ამანათი ${index + 1}`,
                        physicalWeightKg: parcel.physicalWeightKg,
                        volumetricWeightKg: parcel.volumetricWeightKg,
                        chargeableWeightKg: parcel.chargeableWeightKg,
                        usesVolumetricWeight: parcel.usesVolumetricWeight,
                        shippingCostUSD: parcel.chargeableWeightKg * shippingRatePerKG,
                        shippingCostGEL: parcel.chargeableWeightKg * shippingRatePerKG * exchangeRate
                    }))
                    : [{
                        name: title,
                        physicalWeightKg: realWeightKG,
                        volumetricWeightKg: volWeightKG,
                        chargeableWeightKg: chargeableWeightKG,
                        usesVolumetricWeight: isVolumetric,
                        shippingCostUSD: calculation.shippingCostUSD,
                        shippingCostGEL: deliveryCostGEL
                    }],
                exchangeRate,
                exchangeRateSource: rateSourceText,
                forwarderName: forwarderDisplayName,
                shippingRatePerKG,
                priceUSD,
                itemCostGEL: priceGEL,
                shippingCostUSD: calculation.shippingCostUSD,
                shippingCostGEL: deliveryCostGEL,
                insuranceUSD,
                insuranceCostGEL,
                estimatedCustomsValueGEL: taxableAmount,
                hasTax,
                importDutyRate,
                importDutyGEL: import_duty,
                vatTaxableBaseGEL: calculation.vatTaxableBaseGEL,
                vatGEL: vat,
                treasuryFeeGEL: treasury_fee,
                declarationPreparationFeeGEL: declaration_preparation_fee,
                operationalHandlingFeeGEL: operational_handling_fee,
                forwarderFeesGEL: calculation.forwarderFeesGEL,
                stateChargesGEL: calculation.stateChargesGEL,
                totalAdditionalChargesGEL: calculation.totalAdditionalChargesGEL,
                forwarderFeeWarnings: calculation.warnings,
                serviceFeesGEL: calculation.serviceFeesGEL,
                totalCostGEL
            },
            inputSnapshot: {
                priceUSD,
                insuranceUSD,
                importDutyRate,
                ...(calculationMode === 'single' ? {
                    weightInput,
                    weightUnit,
                    useVolumetric: toggleVolumetric.checked,
                    dimensions
                } : {}),
                forwarderId: selectedForwarderId,
                shippingRatePerKG,
                customShippingRate: selectedForwarderId === 'custom' ? shippingRatePerKG : null
            }
        };

        const saved = saveItemToHistory(savedData);

        const btn = document.getElementById('btnSaveResult');
        const originalText = btn.textContent;
        btn.textContent = saved ? 'შენახულია!' : 'შენახვა ვერ მოხერხდა';
        btn.classList.toggle('text-brand-lime', saved);
        btn.classList.toggle('text-red-400', !saved);
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('text-brand-lime', 'text-red-400');
            if (saved) {
                titleInput.value = '';
                if (urlInput) urlInput.value = '';
            }
        }, 2000);
    });

    // --- SHARE BUTTON ---
    document.getElementById('btnShareResult').addEventListener('click', () => {
        const textToShare = `
📦 ტრანსპორტირების კალკულატორი
https://ahhhnuki.github.io/AhhhNuki/transp-calc
------------------
${calculationMode === 'cart' ? `კალათა: ${currentCartItems.length} ამანათი, $${priceUSD.toFixed(2)}` : `ნივთი: $${priceUSD.toFixed(2)}`}
წონა: ${chargeableWeightKG.toFixed(2)} kg (${forwarderDisplayName})
ტრანსპორტირება: ${deliveryCostGEL.toFixed(2)} ₾
დამატებითი ხარჯები: ${calculation.totalAdditionalChargesGEL.toFixed(2)} ₾${hasTax ? '' : ' (სახელმწიფო განბაჟების გარეშე)'}
------------------
სულ: ${totalCostGEL.toFixed(2)} ₾
        `.trim();

        const shareButton = document.getElementById('btnShareResult');
        navigator.clipboard.writeText(textToShare)
            .then(() => {
                shareButton.setAttribute('aria-label', 'შედეგი დაკოპირდა');
                shareButton.title = 'დაკოპირდა';
            })
            .catch(error => {
                console.error('Could not copy the result.', error);
                shareButton.setAttribute('aria-label', 'კოპირება ვერ მოხერხდა');
                shareButton.title = 'კოპირება ვერ მოხერხდა';
            });
    });

}); // <--- END OF CALCULATE FUNCTION


function restoreSavedCalculation(rawItem) {
    if (!rawItem || typeof rawItem !== 'object') return;

    recalculationSource = rawItem;
    const isCart = rawItem.calculationType === 'cart' && Array.isArray(rawItem.items) && rawItem.items.length > 0;
    const snapshot = rawItem.inputSnapshot && typeof rawItem.inputSnapshot === 'object'
        ? rawItem.inputSnapshot
        : {};

    insuranceInput.value = String(Math.max(0, finiteNumber(snapshot.insuranceUSD)));
    importDutyRateInput.value = String(Math.max(0, finiteNumber(snapshot.importDutyRate) * 100));

    setCalculationMode(isCart ? 'cart' : 'single', {
        preserveRecalculation: true,
        preserveResult: true
    });

    if (isCart) {
        cartItems = rawItem.items.map((item, index) => createCartItem({
            name: typeof item?.name === 'string' ? item.name : '',
            url: typeof item?.url === 'string' ? item.url : '',
            priceUSD: finiteNumber(item?.priceUSD),
            quantity: Math.max(1, Math.trunc(finiteNumber(item?.quantity, 1))),
            // Schema v3 carts had one shared weight. Put it on the first parcel so
            // old saved calculations remain recoverable without multiplying it.
            weightInput: finiteNumber(
                item?.weightInput,
                index === 0 ? finiteNumber(snapshot.weightInput, finiteNumber(rawItem.physicalWeight)) : 0
            ) || '',
            weightUnit: item?.weightUnit || (index === 0 ? snapshot.weightUnit : 'kilograms'),
            useVolumetric: item?.useVolumetric === true || (
                index === 0 && item?.useVolumetric === undefined && Boolean(snapshot.useVolumetric)
            ),
            dimensions: item?.dimensions || (index === 0 ? snapshot.dimensions : {})
        }));
        cartSafetyBufferInput.value = String(Math.max(0, finiteNumber(rawItem.cartSafetyBuffer, 10)));
        renderCartItems();
    } else {
        document.getElementById('price').value = String(finiteNumber(snapshot.priceUSD, finiteNumber(rawItem.priceUSD)));
        const weightValue = finiteNumber(snapshot.weightInput, finiteNumber(rawItem.physicalWeight, finiteNumber(rawItem.weight)));
        document.getElementById('weight').value = weightValue > 0 ? String(weightValue) : '';
        document.getElementById('weightUnit').value = ['kilograms', 'pounds', 'ounces'].includes(snapshot.weightUnit)
            ? snapshot.weightUnit
            : 'kilograms';

        const dimensions = snapshot.dimensions || {};
        toggleVolumetric.checked = Boolean(snapshot.useVolumetric);
        volumetricInputs.classList.toggle('hidden', !toggleVolumetric.checked);
        document.getElementById('dimL').value = finiteNumber(dimensions.lengthCm) || '';
        document.getElementById('dimW').value = finiteNumber(dimensions.widthCm) || '';
        document.getElementById('dimH').value = finiteNumber(dimensions.heightCm) || '';
    }

    let forwarderId = typeof snapshot.forwarderId === 'string'
        ? snapshot.forwarderId
        : typeof rawItem.forwarderId === 'string'
            ? rawItem.forwarderId
            : forwarderSelect.value;
    if (forwarderId !== 'custom' && !forwardersList.some(forwarder => forwarder.id === forwarderId)) {
        const matchingForwarder = forwardersList.find(forwarder => forwarder.name === rawItem.forwarderName);
        forwarderId = matchingForwarder?.id || forwarderSelect.value;
    }
    populateForwardersSelect(forwarderId);
    customShippingInputWrapper.classList.toggle('hidden', forwarderId !== 'custom');
    if (forwarderId === 'custom') {
        const restoredCustomRate = finiteNumber(snapshot.customShippingRate, finiteNumber(rawItem.shippingRatePerKG));
        document.getElementById('customShippingRate').value = restoredCustomRate > 0 ? String(restoredCustomRate) : '';
    }

    // Recalculation intentionally uses today's official rate unless the user enters another one.
    document.getElementById('customRate').value = '';
    const resultContainer = document.getElementById('result');
    resultContainer.innerHTML = `
        <div class="text-center py-8">
            <p class="text-sm text-brand-text-muted">${isCart ? 'შეამოწმეთ კალათის ფასები' : 'შეამოწმეთ ნივთის ფასი'}, შემდეგ დააჭირეთ „გამოთვლას“.</p>
        </div>
    `;
    btnResetCalculation?.classList.remove('hidden');
    document.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
        if (isCart) cartItemsList.querySelector('[data-cart-price]')?.focus();
        else document.getElementById('price').focus();
    }, 250);
    if (isCart) updateCartThresholdPreview();
}

window.addEventListener('calculator:recalculate', event => {
    restoreSavedCalculation(event.detail);
});


// --- INITIALIZATION & MEMORY LOGIC ---

document.addEventListener('DOMContentLoaded', async () => {
    const savedSafetyBuffer = parseFloat(localStorage.getItem('calc_cart_safety_buffer'));
    if (Number.isFinite(savedSafetyBuffer) && savedSafetyBuffer >= 0) {
        cartSafetyBufferInput.value = String(savedSafetyBuffer);
    }
    cartItems = [createCartItem()];
    renderCartItems();

    // 1. Fetch fresh forwarder rates, fee policies and customs rules.
    await Promise.all([loadForwardersData(), loadCustomsRules()]);

    // 2. Load saved forwarder
    const savedForwarder = localStorage.getItem('calc_forwarder');
    const legacyCustomShippingRate = localStorage.getItem('calc_custom_rate');
    const savedCustomShippingRate = localStorage.getItem('calc_custom_shipping_rate') || legacyCustomShippingRate;

    let initialForwarderId = 'inex';

    if (savedForwarder) {
        // Map legacy values if user had older version saved
        if (savedForwarder === '9.00') initialForwarderId = 'usa2georgia';
        else if (savedForwarder === '8.35') initialForwarderId = 'camex';
        else if (savedForwarder === '8.50') initialForwarderId = 'inex';
        else initialForwarderId = savedForwarder;
    }

    populateForwardersSelect(initialForwarderId);

    if (initialForwarderId === 'custom') {
        customShippingInputWrapper.classList.remove('hidden');
        if (savedCustomShippingRate) {
            document.getElementById('customShippingRate').value = savedCustomShippingRate;
        }
    }

    // 3. Load Exchange Rate Placeholder
    const customRateInput = document.getElementById('customRate');
    const defaultRate = await fetchExchangeRate(NaN);
    if (customRateInput) {
        customRateInput.placeholder = `ავტომატური (${defaultRate.toFixed(4)})`;
    }

    // 4. Check for recent rate changes alert banner
    checkRecentRateChanges();
});

// Forwarder select change handler
forwarderSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    localStorage.setItem('calc_forwarder', value);
    
    if (value === 'custom') {
        customShippingInputWrapper.classList.remove('hidden');
    } else {
        customShippingInputWrapper.classList.add('hidden');
    }

    renderCustomDropdown(value);
    updateForwarderRateStatusPill(value);
    renderForwarderFeePolicy(value);
});

// Save custom rate on input
document.getElementById('customShippingRate').addEventListener('input', (e) => {
    localStorage.setItem('calc_custom_shipping_rate', e.target.value);
});

document.getElementById('customRate').addEventListener('input', event => {
    const value = parseFloat(event.target.value);
    if (event.target.value.trim() && Number.isFinite(value) && value > 0) {
        renderExchangeRateStatus({ rate: value, source: 'manual', validFrom: null });
    } else {
        fetchExchangeRate(NaN);
    }
});
