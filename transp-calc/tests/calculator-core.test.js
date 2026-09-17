const test = require('node:test');
const assert = require('node:assert/strict');

const {
    convertWeightToKg,
    calculateVolumetricWeightKg,
    validateCalculationInputs,
    calculateCosts
} = require('../calculator-core.js');

function validInput(overrides = {}) {
    return {
        priceUSD: 50,
        weightInput: 2,
        weightUnit: 'kilograms',
        shippingRatePerKG: 9,
        exchangeRate: 2.6,
        useVolumetric: false,
        dimensions: { lengthCm: 0, widthCm: 0, heightCm: 0 },
        ...overrides
    };
}

test('converts pounds and ounces to kilograms', () => {
    assert.ok(Math.abs(convertWeightToKg(1, 'pounds') - 0.453592) < 1e-9);
    assert.ok(Math.abs(convertWeightToKg(1, 'ounces') - 0.0283495) < 1e-9);
    assert.equal(convertWeightToKg(2.5, 'kilograms'), 2.5);
});

test('calculates volumetric weight with a 6000 divisor', () => {
    assert.equal(calculateVolumetricWeightKg(60, 40, 30), 12);
});

test('uses the larger of physical and volumetric weight', () => {
    const result = calculateCosts(validInput({
        weightInput: 5,
        useVolumetric: true,
        dimensions: { lengthCm: 60, widthCm: 40, heightCm: 30 }
    }));

    assert.equal(result.physicalWeightKg, 5);
    assert.equal(result.volumetricWeightKg, 12);
    assert.equal(result.chargeableWeightKg, 12);
    assert.equal(result.usesVolumetricWeight, true);
});

test('rejects negative price and non-positive weight or rates', () => {
    const validation = validateCalculationInputs(validInput({
        priceUSD: -1,
        weightInput: 0,
        shippingRatePerKG: 0,
        exchangeRate: -2
    }));

    assert.equal(validation.valid, false);
    assert.deepEqual(
        validation.errors.map(error => error.field),
        ['price', 'weight', 'shippingRate', 'exchangeRate']
    );
});

test('requires all dimensions when volumetric calculation is enabled', () => {
    const validation = validateCalculationInputs(validInput({
        useVolumetric: true,
        dimensions: { lengthCm: 20, widthCm: 0, heightCm: 10 }
    }));

    assert.equal(validation.valid, false);
    assert.equal(validation.errors[0].field, 'dimensions');
});

test('applies estimated VAT at the 300 GEL customs-value threshold', () => {
    const input = validInput({
        priceUSD: 99,
        weightInput: 1,
        shippingRatePerKG: 1,
        exchangeRate: 3
    });
    const result = calculateCosts(input);

    assert.equal(result.estimatedCustomsValueGEL, 300);
    assert.equal(result.reachesValueThreshold, true);
    assert.equal(result.hasTax, true);
    assert.equal(result.vatGEL, 54);
});

test('keeps an estimated customs value below 300 GEL exempt', () => {
    const result = calculateCosts(validInput({
        priceUSD: 98.99,
        weightInput: 1,
        shippingRatePerKG: 1,
        exchangeRate: 3
    }));

    assert.ok(Math.abs(result.estimatedCustomsValueGEL - 299.97) < 1e-9);
    assert.equal(result.reachesValueThreshold, false);
    assert.equal(result.hasTax, false);
});

test('applies estimated tax when physical weight exceeds 30 kg', () => {
    const result = calculateCosts(validInput({
        priceUSD: 1,
        weightInput: 30.01,
        shippingRatePerKG: 0.01
    }));

    assert.equal(result.exceedsWeightLimit, true);
    assert.equal(result.hasTax, true);
    assert.deepEqual(result.taxReasons, ['physical-weight']);
});

test('keeps a low-value package at or below 30 kg exempt in the estimate', () => {
    const result = calculateCosts(validInput({
        priceUSD: 1,
        weightInput: 30,
        shippingRatePerKG: 0.01
    }));

    assert.equal(result.exceedsWeightLimit, false);
    assert.equal(result.reachesValueThreshold, false);
    assert.equal(result.hasTax, false);
    assert.equal(result.vatGEL, 0);
});
