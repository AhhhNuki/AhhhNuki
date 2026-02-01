document.getElementById('calculate').addEventListener('click', async () => {
    const priceUSD = parseFloat(document.getElementById('price').value);
    const weightInput = parseFloat(document.getElementById('weight').value);
    const customRate = parseFloat(document.getElementById('customRate').value);

    const resultContainer = document.getElementById('result');
    const declaration_preparation_fee = 10; 
    const treasury_fee = 20;

    if (isNaN(priceUSD) || isNaN(weightInput)) {
        resultContainer.innerHTML = '<div class="text-red-400 text-center bg-red-900/20 border border-red-900/50 p-4 rounded-xl">გთხოვთ შეიყვანოთ სწორი რიცხვები.</div>';
        return;
    }

    // Convert weight to kilograms
    const weightUnit = document.querySelector('input[name="weightUnit"]:checked').value;
    let weightKG;
    if (weightUnit === 'ounces') {
        weightKG = weightInput * 0.0283495;
    } else if (weightUnit === 'pounds') {
        weightKG = weightInput * 0.453592;
    } else {
        weightKG = weightInput; 
    }

    // Get exchange rate
    let exchangeRate = customRate;
    if (isNaN(customRate) || customRate <= 0) {
        try {
            const response = await fetch('https://v6.exchangerate-api.com/v6/e29b3b7ef3b8216203343e73/latest/USD');
            const data = await response.json();
            exchangeRate = data.conversion_rates?.GEL || 2.77;
        } catch (error) {
            exchangeRate = 2.77;
            console.error('Failed to fetch exchange rate:', error);
        }
    }

    const priceGEL = priceUSD * exchangeRate;
    const deliveryCostUSD = weightKG * 8.5; 
    const deliveryCostGEL = deliveryCostUSD * exchangeRate;

    // Base total
    let totalCostGEL = priceGEL + deliveryCostGEL;
    let vat = 0;
    const taxableAmount = totalCostGEL; 

    // Calculate Taxes
    let hasTax = false;
    if (taxableAmount >= 300) {
        hasTax = true;
        vat = taxableAmount * 0.18;
        totalCostGEL += vat + treasury_fee + declaration_preparation_fee;
    }

    // --- RENDER RESULT ---
    resultContainer.innerHTML = `
        <div class="space-y-4 fade-in h-full flex flex-col">
            <div class="flex justify-between items-center text-brand-text-muted">
                <span>ნივთის ღირებულება:</span>
                <span class="text-white font-medium">${priceGEL.toFixed(2)} ₾</span>
            </div>
            
            <div class="flex justify-between items-center text-brand-text-muted">
                <span>ტრანსპორტირება (${weightKG.toFixed(2)} კგ):</span>
                <span class="text-white font-medium">${deliveryCostGEL.toFixed(2)} ₾</span>
            </div>

            ${hasTax ? `
            <div class="p-4 bg-red-500/10 rounded-xl border border-red-500/20 space-y-3 mt-2 flex-grow">
                <div class="flex justify-between items-center text-gray-300 text-sm border-b border-red-500/20 pb-2">
                    <span>დღგ (18%):</span>
                    <span class="text-red-400 font-medium">${vat.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-sm">
                    <span>განბაჟების საფასური:</span>
                    <span class="text-red-400 font-medium">${treasury_fee.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-sm">
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
                    <span class="text-lg font-bold text-white">სულ გადასახდელი:</span>
                    <span class="text-3xl font-bold text-brand-lime tracking-tight">
                        ${totalCostGEL.toFixed(2)} ₾
                    </span>
                </div>
                
                <div class="text-xs text-center text-brand-text-muted mt-2 mb-4">
                    კურსი: ${exchangeRate.toFixed(4)} GEL/USD
                </div>

                <div class="bg-white/5 rounded-xl p-3 border border-white/10 mt-4">
                    <div class="flex gap-2">
                        <input type="text" id="saveTitle" placeholder="ჩაწერეთ ნივთის სახელი..." 
                            class="bg-brand-bg border border-brand-border text-white text-sm rounded-lg block w-full p-2.5 focus:ring-1 focus:ring-brand-lime outline-none placeholder-gray-600">
                        <button id="btnSaveResult" class="bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors shadow-lg">
                            შენახვა
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- ATTACH SAVE LISTENER ---
    document.getElementById('btnSaveResult').addEventListener('click', () => {
        const titleInput = document.getElementById('saveTitle');
        const title = titleInput.value.trim() || 'უსახელო ნივთი'; 

        const savedData = {
            id: Date.now(),
            date: new Date().toLocaleString('ka-GE'),
            title: title,
            priceUSD: priceUSD.toFixed(2),
            weight: weightInput,
            unit: weightUnit,
            rate: exchangeRate.toFixed(4),
            deliveryGEL: deliveryCostGEL.toFixed(2),
            // Updated tax calculation for history
            taxTotal: hasTax ? (vat + treasury_fee + declaration_preparation_fee).toFixed(2) : "0.00",
            total: totalCostGEL.toFixed(2)
        };

        saveItemToHistory(savedData);

        titleInput.value = '';
        const btn = document.getElementById('btnSaveResult');
        btn.textContent = 'შენახულია!';
        btn.classList.replace('bg-gray-700', 'bg-brand-lime');
        btn.classList.replace('text-white', 'text-black');
        
        setTimeout(() => {
            btn.textContent = 'შენახვა';
            btn.classList.replace('bg-brand-lime', 'bg-gray-700');
            btn.classList.replace('text-black', 'text-white');
        }, 2000);
    });
});