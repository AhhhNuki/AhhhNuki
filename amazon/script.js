document.getElementById('calculate').addEventListener('click', async () => {
    const priceUSD = parseFloat(document.getElementById('price').value);
    const weightInput = parseFloat(document.getElementById('weight').value);
    const customRate = parseFloat(document.getElementById('customRate').value);

    const resultContainer = document.getElementById('result');

    // NEW VARIABLE HERE
    const declaration_preparation_fee = 10; 

    if (isNaN(priceUSD) || isNaN(weightInput)) {
        resultContainer.innerHTML = '<div class="text-red-400 text-center bg-red-400/10 p-4 rounded-lg">გთხოვთ შეიყვანოთ სწორი რიცხვები.</div>';
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

    // Base total (before taxes)
    let totalCostGEL = priceGEL + deliveryCostGEL;

    // VAT and Treasury logic
    let vat = 0;
    const treasury = 20; 

    const taxableAmount = totalCostGEL; 

    if (taxableAmount >= 300) {
        vat = taxableAmount * 0.18;
        // Add VAT, Treasury, AND Declaration Fee to the total
        totalCostGEL += vat + treasury + declaration_preparation_fee;
    }

    // HTML Template for Results
    resultContainer.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center text-gray-400">
                <span>ნივთის ღირებულება:</span>
                <span class="text-emerald-400 font-medium">${priceGEL.toFixed(2)} ₾</span>
            </div>
            
            <div class="flex justify-between items-center text-gray-400">
                <span>ტრანსპორტირება (${weightKG.toFixed(2)} კგ):</span>
                <span class="text-amber-400 font-medium">${deliveryCostGEL.toFixed(2)} ₾</span>
            </div>

            ${vat > 0 ? `
            <div class="p-3 bg-red-500/10 rounded-lg border border-red-500/20 space-y-2 mt-2">
                <div class="flex justify-between items-center text-gray-300 text-sm">
                    <span>დღგ (18%):</span>
                    <span class="text-red-300">${vat.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-sm">
                    <span>განბაჟების საფასური:</span>
                    <span class="text-red-300">${treasury.toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between items-center text-gray-300 text-sm">
                    <span>დეკლარაციის მომზადება:</span>
                    <span class="text-red-300">${declaration_preparation_fee.toFixed(2)} ₾</span>
                </div>
            </div>
            ` : `
            <div class="text-xs text-emerald-500/80 text-right mt-1">
                *განბაჟება არ გიწევთ
            </div>
            `}

            <div class="h-px bg-gray-700 my-4"></div>

            <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-white">სულ გადასახდელი:</span>
                <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-300">
                    ${totalCostGEL.toFixed(2)} ₾
                </span>
            </div>
            
            <div class="text-xs text-center text-gray-600 mt-4">
                კურსი: ${exchangeRate.toFixed(4)} GEL/USD
            </div>
        </div>
    `;
});