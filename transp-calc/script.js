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

let forwardersList = [...DEFAULT_FORWARDERS];

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
                forwardersList = data;
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
const btnOpenPriceTracker = document.getElementById('btnOpenPriceTracker');
const priceTrackerModal = document.getElementById('priceTrackerModal');
const btnCloseTrackerModal = document.getElementById('btnCloseTrackerModal');
const btnCloseTrackerModalBtn = document.getElementById('btnCloseTrackerModalBtn');
const forwardersTrackerList = document.getElementById('forwardersTrackerList');
const rateAlertBanner = document.getElementById('rateAlertBanner');
const rateAlertText = document.getElementById('rateAlertText');
const btnAlertOpenTracker = document.getElementById('btnAlertOpenTracker');
const btnDismissAlert = document.getElementById('btnDismissAlert');
const exchangeRateStatus = document.getElementById('exchangeRateStatus');
const calculateButton = document.getElementById('calculate');

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
if (btnOpenPriceTracker) {
    btnOpenPriceTracker.addEventListener('click', () => openTrackerModal());
}
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

calculateButton.addEventListener('click', async () => {
    // 1. Inputs
    const priceUSD = parseFloat(document.getElementById('price').value);
    const weightInput = parseFloat(document.getElementById('weight').value);
    const customRateInput = document.getElementById('customRate');
    const customRateRaw = customRateInput.value.trim();
    const customRate = customRateRaw ? parseFloat(customRateRaw) : NaN;
    const weightUnit = document.getElementById('weightUnit').value;

    const resultContainer = document.getElementById('result');
    const declaration_preparation_fee = CalculatorCore.DECLARATION_PREPARATION_FEE_GEL;
    const treasury_fee = CalculatorCore.TREASURY_FEE_GEL;

    // Validation
    if (!Number.isFinite(priceUSD) || priceUSD < 0) {
        showCalculationError('ნივთის ფასი უნდა იყოს 0 ან მეტი.', 'price');
        return;
    }
    if (!Number.isFinite(weightInput) || weightInput <= 0) {
        showCalculationError('წონა უნდა იყოს 0-ზე მეტი.', 'weight');
        return;
    }
    if (customRateRaw && (!Number.isFinite(customRate) || customRate <= 0)) {
        showCalculationError('USD/GEL კურსი უნდა იყოს 0-ზე მეტი.', 'customRate');
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
    const calculationInput = {
        priceUSD,
        weightInput,
        weightUnit,
        shippingRatePerKG,
        exchangeRate,
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
            dimensions: 'dimL'
        };
        showCalculationError(firstError.message, fieldMap[firstError.field]);
        return;
    }

    const calculation = CalculatorCore.calculateCosts(calculationInput);
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
    const customsReasonText = calculation.taxReasons.map(reason => (
        reason === 'physical-weight'
            ? 'ფიზიკური წონა 30 კგ-ს აღემატება'
            : 'სავარაუდო საბაჟო ღირებულება 300 ₾-ს აღწევს'
    )).join(' • ');
    const rateSourceText = exchangeRateInfo?.source === 'manual'
        ? 'ხელით მითითებული'
        : exchangeRateInfo?.source === 'nbg'
            ? 'ეროვნული ბანკი'
            : exchangeRateInfo?.source === 'cache'
                ? 'შენახული ოფლაინ კურსი'
                : 'საორიენტაციო სარეზერვო კურსი';

    // 7. RENDER
    resultContainer.innerHTML = `
        <div class="space-y-3 fade-in h-full flex flex-col">
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

            ${toggleVolumetric.checked ? `
            <div class="text-xs text-gray-500 flex justify-between gap-3">
                <span>ფიზიკური: ${realWeightKG.toFixed(2)} კგ</span>
                <span>მოცულობითი: ${volWeightKG.toFixed(2)} კგ</span>
            </div>
            ` : ''}

            ${hasTax ? `
            <div class="p-3 bg-red-500/10 rounded-xl border border-red-500/20 space-y-2 mt-2 flex-grow">
                <p class="text-xs text-red-300 border-b border-red-500/20 pb-2">${customsReasonText}</p>
                <div class="flex justify-between items-center text-gray-300 text-xs border-b border-red-500/20 pb-2">
                    <span>დღგ (18%):</span>
                    <span class="text-red-400 font-medium">${vat.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-xs">
                    <span>საბაჟო მომსახურების შეფასება:</span>
                    <span class="text-red-400 font-medium">${treasury_fee.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-xs">
                    <span>დეკლარაციის მომზადების შეფასება:</span>
                    <span class="text-red-400 font-medium">${declaration_preparation_fee.toFixed(2)} ₾</span>
                </div>
            </div>
            ` : `
            <div class="text-xs text-brand-lime/70 text-right mt-1 mb-auto">
                *შეფასებით: ღირებულება 300 ₾-ზე ნაკლებია და ფიზიკური წონა 30 კგ-ს არ აღემატება
            </div>
            `}

            <div class="mt-auto">
                <div class="h-px bg-brand-border my-4"></div>

                <div class="flex justify-between items-center text-xs text-brand-text-muted mb-2">
                    <span>სავარაუდო საბაჟო ღირებულება:</span>
                    <span>${taxableAmount.toFixed(2)} ₾</span>
                </div>

                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-white">სულ:</span>
                    <span class="text-3xl font-bold text-brand-lime tracking-tight">
                        ${totalCostGEL.toFixed(2)} ₾
                    </span>
                </div>
                
                <div class="text-xs text-center text-brand-text-muted mt-2 mb-4">
                    კურსი: ${exchangeRate.toFixed(4)} (${rateSourceText}) • ${forwarderDisplayName}: $${shippingRatePerKG.toFixed(2)}/kg
                    <div class="mt-1">
                        გამოთვლა საორიენტაციოა. საბოლოო დარიცხვას განსაზღვრავს
                        <a href="https://www.rs.ge/Parcelinfo" target="_blank" rel="noopener noreferrer" class="text-brand-lime hover:underline">შემოსავლების სამსახური</a>.
                    </div>
                </div>

                <div class="bg-white/5 rounded-xl p-3 border border-white/10 mt-4 space-y-3">
                    <label for="saveTitle" class="sr-only">ნივთის დასახელება</label>
                    <input type="text" id="saveTitle" placeholder="ნივთის დასახელება..." 
                        class="bg-brand-bg border border-brand-border text-white text-xs rounded-lg block w-full p-2 outline-none focus:border-brand-lime mb-2">
                    
                    <label for="saveUrl" class="sr-only">ნივთის ბმული</label>
                    <input type="url" id="saveUrl" placeholder="ლინკი (არასავალდებულო)..."
                        class="bg-brand-bg border border-brand-border text-white text-xs rounded-lg block w-full p-2 outline-none focus:border-brand-lime mb-2">
                    
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

    // --- SAVE TO HISTORY BUTTON ---
    document.getElementById('btnSaveResult').addEventListener('click', () => {
        const titleInput = document.getElementById('saveTitle');
        const urlInput = document.getElementById('saveUrl');
        
        const title = titleInput.value.trim() || 'უსახელო ნივთი'; 

        const savedData = {
            id: Date.now(),
            date: new Date().toLocaleString('ka-GE').split(',')[0],
            title: title,
            url: urlInput.value.trim(),
            priceUSD: priceUSD.toFixed(2),
            weight: chargeableWeightKG.toFixed(2),
            physicalWeight: realWeightKG.toFixed(2),
            volumetricWeight: volWeightKG.toFixed(2),
            unit: 'kg', 
            total: totalCostGEL.toFixed(2),
            rate: exchangeRate.toFixed(4),
            deliveryGEL: deliveryCostGEL.toFixed(2),
            taxTotal: hasTax ? (vat + treasury_fee + declaration_preparation_fee).toFixed(2) : "0.00",
            forwarderId: selectedForwarderId,
            forwarderName: forwarderDisplayName
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
                urlInput.value = '';
            }
        }, 2000);
    });

    // --- SHARE BUTTON ---
    document.getElementById('btnShareResult').addEventListener('click', () => {
        const textToShare = `
📦 ტრანსპორტირების კალკულატორი
https://ahhhnuki.github.io/AhhhNuki/transp-calc
------------------
ნივთი: $${priceUSD}
წონა: ${chargeableWeightKG.toFixed(2)} kg (${forwarderDisplayName})
ტრანსპორტირება: ${deliveryCostGEL.toFixed(2)} ₾
${hasTax ? `სავარაუდო გადასახადები: ${(vat + treasury_fee + declaration_preparation_fee).toFixed(2)} ₾` : 'შეფასებით განბაჟების გარეშე'}
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


// --- INITIALIZATION & MEMORY LOGIC ---

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch fresh forwarder rates from data/forwarders.json
    await loadForwardersData();

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
