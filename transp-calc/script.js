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
        previousRate: 8.00,
        lastUpdated: "2024-02-01",
        currency: "USD",
        unit: "kg",
        website: "https://maleo.ge",
        history: [
            { date: "2024-02-01", rate: 8.50, change: 0.50, direction: "up", note: "ტარიფი გაიზარდა $0.50-ით ($8.00 ➔ $8.50)" },
            { date: "2023-06-01", rate: 8.00, change: 0.00, direction: "initial", note: "სტანდარტული ტარიფი" }
        ]
    },
    {
        id: "spacecargo",
        name: "Space Cargo",
        currentRate: 8.00,
        previousRate: 8.00,
        lastUpdated: "2024-01-01",
        currency: "USD",
        unit: "kg",
        website: "https://spacecargo.ge",
        history: [
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
        const response = await fetch('./data/forwarders.json');
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                forwardersList = data;
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

// Volumetric Toggle
toggleVolumetric.addEventListener('change', (e) => {
    volumetricInputs.classList.toggle('hidden', !e.target.checked);
});

// Fetch USD to GEL exchange rate
async function fetchExchangeRate(customRate) {
    if (!isNaN(customRate) && customRate > 0) {
        return customRate;
    }
    try {
        const response = await fetch('https://v6.exchangerate-api.com/v6/e29b3b7ef3b8216203343e73/latest/USD');
        const data = await response.json();
        return data.conversion_rates?.GEL || 2.77;
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return 2.77;
    }
}

// --- POPULATE FORWARDERS SELECT & STATUS PILL ---

function populateForwardersSelect(selectedId) {
    if (!forwarderSelect) return;

    forwarderSelect.innerHTML = '';

    forwardersList.forEach((f) => {
        const diff = +(f.currentRate - (f.previousRate != null ? f.previousRate : f.currentRate)).toFixed(2);
        let indicator = '';
        if (diff > 0) {
            indicator = ` 🔺 +$${diff.toFixed(2)}`;
        } else if (diff < 0) {
            indicator = ` 🔻 -$${Math.abs(diff).toFixed(2)}`;
        }

        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.name} ($${f.currentRate.toFixed(2)}/kg)${indicator}`;
        if (f.id === selectedId) opt.selected = true;
        forwarderSelect.appendChild(opt);
    });

    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = 'სხვა (მითითება...)';
    if (selectedId === 'custom') customOpt.selected = true;
    forwarderSelect.appendChild(customOpt);

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
                🔺 გაძვირდა +$${diff.toFixed(2)} (+${pct}%)
            </span>
            <span class="text-gray-400 text-[11px] hidden sm:inline">წინა: $${prev.toFixed(2)}</span>
            <span class="text-gray-500 text-[11px]">• ${forwarder.lastUpdated}</span>
        `;
    } else if (diff < 0) {
        badgeHtml = `
            <span class="inline-flex items-center gap-1 text-brand-lime bg-lime-950/70 border border-brand-lime/40 px-2 py-0.5 rounded font-semibold text-[11px]">
                🔻 გაიაფდა -$${Math.abs(diff).toFixed(2)} (-${pct}%)
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
            badgeText = `🔺 +$${diff.toFixed(2)} (+${pct}%)`;
            diffText = `გაძვირდა +$${diff.toFixed(2)}`;
        } else if (diff < 0) {
            badgeClass = 'text-brand-lime bg-lime-950/60 border-brand-lime/40';
            badgeText = `🔻 -$${Math.abs(diff).toFixed(2)} (-${pct}%)`;
            diffText = `დაკლდა -$${Math.abs(diff).toFixed(2)}`;
        }

        const historyItems = (f.history || []).map(h => {
            const hDiff = h.change || 0;
            let icon = '⚪';
            let color = 'text-gray-400';
            if (hDiff > 0) { icon = '🔺'; color = 'text-red-400'; }
            else if (hDiff < 0) { icon = '🔻'; color = 'text-brand-lime'; }

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

// Modal open/close helpers
function openTrackerModal(focusId = null) {
    if (!priceTrackerModal) return;
    renderTrackerModal('all');
    priceTrackerModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    // Reset active filter button style
    document.querySelectorAll('.tracker-filter-btn').forEach(btn => {
        if (btn.dataset.filter === 'all') {
            btn.className = 'tracker-filter-btn px-3 py-1.5 rounded-lg bg-brand-lime text-black font-semibold transition-colors';
        } else {
            btn.className = 'tracker-filter-btn px-3 py-1.5 rounded-lg bg-brand-input text-gray-400 hover:text-white border border-brand-border transition-colors';
        }
    });
}

function closeTrackerModal() {
    if (!priceTrackerModal) return;
    priceTrackerModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
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
    if (e.key === 'Escape' && priceTrackerModal && !priceTrackerModal.classList.contains('hidden')) {
        closeTrackerModal();
    }
});

// Modal filter tabs
document.querySelectorAll('.tracker-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tracker-filter-btn').forEach(b => {
            b.className = 'tracker-filter-btn px-3 py-1.5 rounded-lg bg-brand-input text-gray-400 hover:text-white border border-brand-border transition-colors';
        });
        btn.className = 'tracker-filter-btn px-3 py-1.5 rounded-lg bg-brand-lime text-black font-semibold transition-colors';
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

document.getElementById('calculate').addEventListener('click', async () => {
    // 1. Inputs
    const priceUSD = parseFloat(document.getElementById('price').value);
    const weightInput = parseFloat(document.getElementById('weight').value);
    const customRate = parseFloat(document.getElementById('customRate').value);
    const weightUnit = document.getElementById('weightUnit').value;

    const resultContainer = document.getElementById('result');
    const declaration_preparation_fee = 10; 
    const treasury_fee = 20;

    // Validation
    if (isNaN(priceUSD) || isNaN(weightInput)) {
        resultContainer.innerHTML = '<div class="text-red-400 text-center bg-red-900/20 border border-red-900/50 p-4 rounded-xl">გთხოვთ შეიყვანოთ სწორი რიცხვები.</div>';
        return;
    }

    // 2. Weight Calculation (Standardize to KG)
    let realWeightKG;
    if (weightUnit === 'ounces') realWeightKG = weightInput * 0.0283495;
    else if (weightUnit === 'pounds') realWeightKG = weightInput * 0.453592;
    else realWeightKG = weightInput;

    // 3. Volumetric Logic
    let chargeableWeightKG = realWeightKG;
    let isVolumetric = false;

    if (toggleVolumetric.checked) {
        const L = parseFloat(document.getElementById('dimL').value) || 0;
        const W = parseFloat(document.getElementById('dimW').value) || 0;
        const H = parseFloat(document.getElementById('dimH').value) || 0;
        
        const volWeightKG = (L * W * H) / 6000;
        
        if (volWeightKG > realWeightKG) {
            chargeableWeightKG = volWeightKG;
            isVolumetric = true;
        }
    }

    // 4. Shipping Rate Logic
    const selectedForwarderId = forwarderSelect.value;
    const forwarderObj = forwardersList.find(f => f.id === selectedForwarderId);
    let shippingRatePerKG = 0;
    let forwarderDisplayName = 'გადამზიდი';

    if (selectedForwarderId === 'custom') {
        shippingRatePerKG = parseFloat(document.getElementById('customShippingRate').value) || 0;
        forwarderDisplayName = 'სხვა (ინდივიდუალური)';
    } else if (forwarderObj) {
        shippingRatePerKG = forwarderObj.currentRate;
        forwarderDisplayName = forwarderObj.name;
    } else {
        // Fallback for legacy numeric string values
        shippingRatePerKG = parseFloat(selectedForwarderId) || 0;
    }

    // 5. Exchange Rate
    let exchangeRate = customRate;
    if (isNaN(customRate) || customRate <= 0) {
        try {
            const response = await fetch('https://v6.exchangerate-api.com/v6/e29b3b7ef3b8216203343e73/latest/USD');
            const data = await response.json();
            exchangeRate = data.conversion_rates?.GEL || 2.77;
        } catch (error) {
            exchangeRate = 2.77;
        }
    }

    // 6. Final Calculations
    const priceGEL = priceUSD * exchangeRate;
    const deliveryCostUSD = chargeableWeightKG * shippingRatePerKG; 
    const deliveryCostGEL = deliveryCostUSD * exchangeRate;

    let totalCostGEL = priceGEL + deliveryCostGEL;
    let vat = 0;
    const taxableAmount = totalCostGEL; 

    let hasTax = false;
    if (taxableAmount >= 300) {
        hasTax = true;
        vat = taxableAmount * 0.18;
        totalCostGEL += vat + treasury_fee + declaration_preparation_fee;
    }

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

            ${hasTax ? `
            <div class="p-3 bg-red-500/10 rounded-xl border border-red-500/20 space-y-2 mt-2 flex-grow">
                <div class="flex justify-between items-center text-gray-300 text-xs border-b border-red-500/20 pb-2">
                    <span>დღგ (18%):</span>
                    <span class="text-red-400 font-medium">${vat.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-xs">
                    <span>განბაჟების საფასური:</span>
                    <span class="text-red-400 font-medium">${treasury_fee.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-xs">
                    <span>დეკლარაციის მომზადება:</span>
                    <span class="text-red-400 font-medium">${declaration_preparation_fee.toFixed(2)} ₾</span>
                </div>
            </div>
            ` : `
            <div class="text-xs text-brand-lime/70 text-right mt-1 mb-auto">
                *განბაჟება არ გიწევთ
            </div>
            `}

            <div class="mt-auto">
                <div class="h-px bg-brand-border my-4"></div>

                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-white">სულ:</span>
                    <span class="text-3xl font-bold text-brand-lime tracking-tight">
                        ${totalCostGEL.toFixed(2)} ₾
                    </span>
                </div>
                
                <div class="text-xs text-center text-brand-text-muted mt-2 mb-4">
                    კურსი: ${exchangeRate.toFixed(4)} • ${forwarderDisplayName}: $${shippingRatePerKG.toFixed(2)}/kg
                </div>

                <div class="bg-white/5 rounded-xl p-3 border border-white/10 mt-4 space-y-3">
                    <input type="text" id="saveTitle" placeholder="ნივთის დასახელება..." 
                        class="bg-brand-bg border border-brand-border text-white text-xs rounded-lg block w-full p-2 outline-none focus:border-brand-lime mb-2">
                    
                    <input type="text" id="saveUrl" placeholder="ლინკი (არასავალდებულო)..." 
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
            unit: 'kg', 
            total: totalCostGEL.toFixed(2),
            rate: exchangeRate.toFixed(4),
            deliveryGEL: deliveryCostGEL.toFixed(2),
            taxTotal: hasTax ? (vat + treasury_fee + declaration_preparation_fee).toFixed(2) : "0.00"
        };

        saveItemToHistory(savedData);

        const btn = document.getElementById('btnSaveResult');
        const originalText = btn.textContent;
        btn.textContent = 'შენახულია!';
        btn.classList.add('text-brand-lime');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('text-brand-lime');
            titleInput.value = '';
            urlInput.value = '';
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
${hasTax ? `გადასახადები: ${(vat + treasury_fee + declaration_preparation_fee).toFixed(2)} ₾` : 'განბაჟების გარეშე'}
------------------
სულ: ${totalCostGEL.toFixed(2)} ₾
        `.trim();

        navigator.clipboard.writeText(textToShare).then(() => {
            alert('შედეგი დაკოპირდა!');
        });
    });

}); // <--- END OF CALCULATE FUNCTION


// --- INITIALIZATION & MEMORY LOGIC ---

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch fresh forwarder rates from data/forwarders.json
    await loadForwardersData();

    // 2. Load saved forwarder
    const savedForwarder = localStorage.getItem('calc_forwarder');
    const savedCustomRate = localStorage.getItem('calc_custom_rate');

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
        if (savedCustomRate) {
            document.getElementById('customShippingRate').value = savedCustomRate;
        }
    }

    // 3. Load Exchange Rate Placeholder
    const customRateInput = document.getElementById('customRate');
    const defaultRate = await fetchExchangeRate(parseFloat(savedCustomRate));
    if (customRateInput && (isNaN(parseFloat(savedCustomRate)) || parseFloat(savedCustomRate) <= 0)) {
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

    updateForwarderRateStatusPill(value);
});

// Save custom rate on input
document.getElementById('customShippingRate').addEventListener('input', (e) => {
    localStorage.setItem('calc_custom_rate', e.target.value);
});