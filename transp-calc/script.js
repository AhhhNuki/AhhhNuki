// Toggle UI elements
const toggleVolumetric = document.getElementById('toggleVolumetric');
const volumetricInputs = document.getElementById('volumetricInputs');
const forwarderSelect = document.getElementById('forwarderSelect');
const customShippingInputWrapper = document.getElementById('customShippingInputWrapper');

toggleVolumetric.addEventListener('change', (e) => {
    volumetricInputs.classList.toggle('hidden', !e.target.checked);
});

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
    let shippingRatePerKG = parseFloat(forwarderSelect.value);
    if (forwarderSelect.value === 'custom') {
        shippingRatePerKG = parseFloat(document.getElementById('customShippingRate').value) || 0;
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
                    კურსი: ${exchangeRate.toFixed(4)} • ტარიფი: $${shippingRatePerKG}/kg
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
📦 ჩამოტანის კალკულატორი
https://ahhhnuki.github.io/AhhhNuki/transp-calc
------------------
ნივთი: $${priceUSD}
წონა: ${chargeableWeightKG.toFixed(2)} kg
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


// --- MEMORY LOGIC ---

// 1. Load settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
    const savedForwarder = localStorage.getItem('calc_forwarder');
    const savedCustomRate = localStorage.getItem('calc_custom_rate');

    if (savedForwarder) {
        forwarderSelect.value = savedForwarder;
        
        if (savedForwarder === 'custom') {
            customShippingInputWrapper.classList.remove('hidden');
            if (savedCustomRate) {
                document.getElementById('customShippingRate').value = savedCustomRate;
            }
        }
    }
    const customRateInput = document.getElementById('customRate');
    const defaultRate = await fetchExchangeRate(parseFloat(savedCustomRate));
    if (customRateInput && (isNaN(parseFloat(savedCustomRate)) || parseFloat(savedCustomRate) <= 0)) {
        customRateInput.placeholder = `ავტომატური (${defaultRate.toFixed(4)})`;
    }
});

// 2. Save settings when changed
forwarderSelect.addEventListener('change', (e) => {
    localStorage.setItem('calc_forwarder', e.target.value);
    
    if (e.target.value === 'custom') {
        customShippingInputWrapper.classList.remove('hidden');
    } else {
        customShippingInputWrapper.classList.add('hidden');
    }
});

// 3. Save the custom rate specifically if they type in it
document.getElementById('customShippingRate').addEventListener('input', (e) => {
    localStorage.setItem('calc_custom_rate', e.target.value);
});