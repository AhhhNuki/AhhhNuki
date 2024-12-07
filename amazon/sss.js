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
    }

    // Fetch live USD to GEL rate if custom rate is not provided
    let exchangeRate = customRate;
    if (isNaN(customRate) || customRate <= 0) {
        try {
            const response = await fetch('https://api.exchangerate.host/convert?from=USD&to=GEL');
            const data = await response.json();
            exchangeRate = data.result || 2.77; // Default to 2.77 if API fails
        } catch (error) {
            exchangeRate = 2.77; // Default to 2.77 if API fails
            console.error('Failed to fetch exchange rate:', error);
        }
    }

    const priceGEL = priceUSD * exchangeRate;

    // Calculate delivery cost
    const deliveryCost = weightKG * 8.5;

    // Calculate VAT and total cost
    let vat = 0;
    let totalCostGEL = priceGEL + deliveryCost;
    if (priceGEL >= 300) {
        vat = totalCostGEL * 0.18;
        totalCostGEL += vat;
    }

    // Update result
    document.getElementById('result').innerHTML = `
        <strong>Results:</strong>
        <ul>
            <li>Price in GEL: ${priceGEL.toFixed(2)} GEL</li>
            <li>Delivery Cost: ${deliveryCost.toFixed(2)} GEL</li>
            <li>VAT (18%): ${vat.toFixed(2)} GEL</li>
            <li>Total Amount: ${totalCostGEL.toFixed(2)} GEL</li>
        </ul>
        <p>Exchange Rate Used: ${exchangeRate.toFixed(2)}</p>
    `;
});
