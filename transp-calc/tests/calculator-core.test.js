const test = require('node:test');
const assert = require('node:assert/strict');

const {
    convertWeightToKg,
    calculateVolumetricWeightKg,
    validateCartItems,
    calculateCartSubtotalUSD,
    validateCartParcels,
    calculateCartParcelWeights,
    calculateCartThresholdStatus,
    validateCalculationInputs,
    calculateCosts,
    calculateCartCosts
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

test('calculates a cart subtotal using item quantities', () => {
    const items = [
        { priceUSD: 50, quantity: 2 },
        { priceUSD: 19.99, quantity: 1 }
    ];

    assert.equal(calculateCartSubtotalUSD(items), 119.99);
});

test('rejects invalid cart prices and quantities', () => {
    const validation = validateCartItems([
        { priceUSD: -1, quantity: 1 },
        { priceUSD: 10, quantity: 0 }
    ]);

    assert.equal(validation.valid, false);
    assert.deepEqual(
        validation.errors.map(error => error.field),
        ['cartPrice', 'cartQuantity']
    );
});

test('calculates billable weight separately for every parcel', () => {
    const items = [
        {
            priceUSD: 10,
            quantity: 1,
            weightInput: 10,
            weightUnit: 'kilograms',
            useVolumetric: true,
            dimensions: { lengthCm: 20, widthCm: 20, heightCm: 30 }
        },
        {
            priceUSD: 20,
            quantity: 1,
            weightInput: 1,
            weightUnit: 'kilograms',
            useVolumetric: true,
            dimensions: { lengthCm: 40, widthCm: 40, heightCm: 30 }
        }
    ];

    const weights = calculateCartParcelWeights(items);

    assert.equal(weights.parcels[0].volumetricWeightKg, 2);
    assert.equal(weights.parcels[0].chargeableWeightKg, 10);
    assert.equal(weights.parcels[1].volumetricWeightKg, 8);
    assert.equal(weights.parcels[1].chargeableWeightKg, 8);
    assert.equal(weights.physicalWeightKg, 11);
    assert.equal(weights.volumetricWeightKg, 10);
    assert.equal(weights.chargeableWeightKg, 18);
});

test('requires weight and enabled dimensions on each cart parcel', () => {
    const validation = validateCartParcels([
        {
            priceUSD: 10,
            quantity: 1,
            weightInput: 0,
            weightUnit: 'kilograms',
            useVolumetric: false
        },
        {
            priceUSD: 20,
            quantity: 1,
            weightInput: 1,
            weightUnit: 'kilograms',
            useVolumetric: true,
            dimensions: { lengthCm: 20, widthCm: 0, heightCm: 10 }
        }
    ]);

    assert.equal(validation.valid, false);
    assert.deepEqual(
        validation.errors.map(error => error.field),
        ['cartWeight', 'cartDimensions']
    );
});

test('uses the sum of per-parcel billable weights for cart shipping', () => {
    const result = calculateCartCosts({
        items: [
            {
                priceUSD: 10,
                quantity: 1,
                weightInput: 10,
                weightUnit: 'kilograms',
                useVolumetric: true,
                dimensions: { lengthCm: 20, widthCm: 20, heightCm: 30 }
            },
            {
                priceUSD: 20,
                quantity: 1,
                weightInput: 1,
                weightUnit: 'kilograms',
                useVolumetric: true,
                dimensions: { lengthCm: 40, widthCm: 40, heightCm: 30 }
            }
        ],
        shippingRatePerKG: 5,
        exchangeRate: 2
    });

    assert.equal(result.priceUSD, 30);
    assert.equal(result.chargeableWeightKg, 18);
    assert.equal(result.shippingCostUSD, 90);
    assert.equal(result.shippingCostGEL, 180);
    assert.equal(result.estimatedCustomsValueGEL, 240);
    assert.equal(result.hasTax, false);
});

test('calculates customs charges once for the combined cart estimate', () => {
    const parcel = priceUSD => ({
        priceUSD,
        quantity: 1,
        weightInput: 1,
        weightUnit: 'kilograms',
        useVolumetric: false
    });
    const result = calculateCartCosts({
        items: [parcel(70), parcel(70)],
        shippingRatePerKG: 5,
        exchangeRate: 2
    });

    assert.equal(result.estimatedCustomsValueGEL, 300);
    assert.equal(result.vatGEL, 54);
    assert.equal(result.treasuryFeeGEL, 20);
    assert.equal(result.declarationPreparationFeeGEL, 10);
    assert.equal(result.serviceFeesGEL, 30);
    assert.equal(result.totalCostGEL, 384);
});

test('applies the 30 kg limit to the combined cart estimate', () => {
    const result = calculateCartCosts({
        items: [1, 2].map(() => ({
            priceUSD: 1,
            quantity: 1,
            weightInput: 20,
            weightUnit: 'kilograms',
            useVolumetric: false
        })),
        shippingRatePerKG: 0.01,
        exchangeRate: 2
    });

    assert.equal(result.physicalWeightKg, 40);
    assert.equal(result.exceedsWeightLimit, true);
    assert.equal(result.hasTax, true);
    assert.equal(result.serviceFeesGEL, 30);
});

test('reports remaining cart allowance and the configured safety buffer', () => {
    const status = calculateCartThresholdStatus(
        [{ priceUSD: 100, quantity: 1 }],
        2.6,
        10
    );

    assert.equal(status.goodsSubtotalGEL, 260);
    assert.equal(status.remainingGEL, 40);
    assert.equal(status.safeRemainingGEL, 30);
    assert.equal(status.reachesGoodsThreshold, false);
    assert.equal(status.exceedsSafeLimit, false);
});

test('reports cart overage when goods reach the 300 GEL threshold', () => {
    const status = calculateCartThresholdStatus(
        [{ priceUSD: 120, quantity: 1 }],
        2.6,
        10
    );

    assert.equal(status.goodsSubtotalGEL, 312);
    assert.equal(status.remainingGEL, -12);
    assert.equal(status.overageGEL, 12);
    assert.equal(status.reachesGoodsThreshold, true);
});

test('treats exactly 300 GEL as reaching the goods threshold', () => {
    const status = calculateCartThresholdStatus(
        [{ priceUSD: 100, quantity: 1 }],
        3,
        10
    );

    assert.equal(status.goodsSubtotalGEL, 300);
    assert.equal(status.remainingGEL, 0);
    assert.equal(status.overageGEL, 0);
    assert.equal(status.reachesGoodsThreshold, true);
});

test('enters the warning zone at the configured safe limit', () => {
    const status = calculateCartThresholdStatus(
        [{ priceUSD: 100, quantity: 1 }],
        2.9,
        10
    );

    assert.equal(status.goodsSubtotalGEL, 290);
    assert.equal(status.safeRemainingGEL, 0);
    assert.equal(status.reachesGoodsThreshold, false);
    assert.equal(status.exceedsSafeLimit, true);
});

test('previews the 300 GEL goods threshold for the combined cart', () => {
    const status = calculateCartThresholdStatus(
        [
            { priceUSD: 60, quantity: 1 },
            { priceUSD: 60, quantity: 1 }
        ],
        3,
        10
    );

    assert.equal(status.goodsSubtotalGEL, 360);
    assert.equal(status.overageGEL, 60);
    assert.equal(status.reachesGoodsThreshold, true);
});
