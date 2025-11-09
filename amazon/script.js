document.getElementById('calculate').addEventListener('click', async () => {
    const priceUSD = parseFloat(document.getElementById('price').value);
    const weightInput = parseFloat(document.getElementById('weight').value);
    const customRate = parseFloat(document.getElementById('customRate').value);

    if (isNaN(priceUSD) || isNaN(weightInput)) {
        document.getElementById('result').textContent = 'Please enter valid numbers.';
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
        weightKG = weightInput; // kilograms
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

    // VAT and Treasury (only if priceGEL >= 300)
    let vat = 0;
    const treasury = 20; // Fixed treasury fee

    if (priceGEL >= 300) {
        vat = totalCostGEL * 0.18;
        totalCostGEL += vat + treasury;
    }

    // Display result
    document.getElementById('result').innerHTML = `
        <h5>შედეგი:</h5>
        <ul>
            <li>ყიდვის ფასი: <span class="price_clean">${priceGEL.toFixed(2)} ₾</span></li>
            <li>ჩამოტანა: <span class="price_add">${deliveryCostGEL.toFixed(2)} ₾</span></li>
            <li>დღგ (18%): <span class="price_add">${vat.toFixed(2)} ₾</span></li>
            <li>სახაზინო გადასახადი: <span class="price_add">${priceGEL >= 300 ? '20.00' : '0.00'} ₾</span></li>
            <li id="price_whole"><strong>სულ: ${totalCostGEL.toFixed(2)} ₾</strong></li>
        </ul>
        <p>გამოყენებული კურსი: ${exchangeRate.toFixed(4)} GEL/USD</p>
    `;
});