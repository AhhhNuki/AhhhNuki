document.getElementById('calculate').addEventListener('click', async () => {
    const priceUSD = parseFloat(document.getElementById('price').value);
    const weightInput = parseFloat(document.getElementById('weight').value);
    const customRate = parseFloat(document.getElementById('customRate').value);

    if (isNaN(priceUSD) || isNaN(weightInput)) {
        document.getElementById('result').textContent = 'Please enter valid numbers.';
        return;
    }

    // Determine weight unit and convert to kilograms
    const weightUnit = document.querySelector('input[name="weightUnit"]:checked').value;
    let weightKG;
    if (weightUnit === 'ounces') {
        weightKG = weightInput * 0.0283495; // Ounces to KG
    } else if (weightUnit === 'pounds') {
        weightKG = weightInput * 0.453592; // Pounds to KG
    } else if (weightUnit === 'kilograms') {
        weightKG = weightInput
    }

    // Fetch live USD to GEL rate if custom rate is not provided
    let exchangeRate = customRate;
    if (isNaN(customRate) || customRate <= 0) {
        try {
            const response = await fetch('https://v6.exchangerate-api.com/v6/e29b3b7ef3b8216203343e73/latest/USD');
            const data = await response.json();
            exchangeRate = data.result || 2.77; // Default to 2.77 if API fails
        } catch (error) {
            exchangeRate = 2.77; // Default to 2.77 if API fails
            console.error('Failed to fetch exchange rate:', error);
        }
    }

    const priceGEL = priceUSD * exchangeRate;

    // Calculate delivery cost in USD and convert to GEL
    const deliveryCostUSD = weightKG * 8.5;
    const deliveryCostGEL = deliveryCostUSD * exchangeRate;

    // Calculate VAT and total cost
    let vat = 0;
    let totalCostGEL = priceGEL + deliveryCostGEL;
    if (priceGEL >= 300) {
        vat = totalCostGEL * 0.18;
        totalCostGEL += vat;
    }

    // Update result
    document.getElementById('result').innerHTML = `
        <strong>Results:</strong>
        <ul>
            <li>ფასი: ${priceGEL.toFixed(2)} ₾</li>
            <li>ჩამოტანა: ${deliveryCostGEL.toFixed(2)} ₾</li>
            <li>დღგ (18%): ${vat.toFixed(2)} ₾</li>
            <li>სულ: ${totalCostGEL.toFixed(2)} ₾</li>
        </ul>
        <p>Exchange Rate Used: ${exchangeRate.toFixed(2)}</p>
    `;
});
