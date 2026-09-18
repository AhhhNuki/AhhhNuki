const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSavedInvoiceModel } = require('../list.js');

test('uses an immutable invoice snapshot without replacing saved rates or totals', () => {
    const model = buildSavedInvoiceModel({
        title: 'Saved cart',
        date: '9/17/2026',
        calculationType: 'cart',
        items: [{ name: 'SSD', priceUSD: 100, quantity: 1 }],
        rate: '2.6000',
        total: '999.00',
        invoiceSnapshot: {
            version: 1,
            calculationType: 'cart',
            items: [{ name: 'SSD', quantity: 1, unitPriceUSD: 100, lineTotalUSD: 100, lineTotalGEL: 300 }],
            shippingRows: [{
                name: 'SSD',
                physicalWeightKg: 1,
                volumetricWeightKg: 0,
                chargeableWeightKg: 1,
                usesVolumetricWeight: false,
                shippingCostUSD: 8.5,
                shippingCostGEL: 25.5
            }],
            exchangeRate: 3,
            forwarderName: 'Maleo',
            shippingRatePerKG: 8.5,
            priceUSD: 100,
            itemCostGEL: 300,
            shippingCostUSD: 8.5,
            shippingCostGEL: 25.5,
            estimatedCustomsValueGEL: 325.5,
            hasTax: true,
            vatGEL: 58.59,
            treasuryFeeGEL: 20,
            declarationPreparationFeeGEL: 10,
            serviceFeesGEL: 30,
            totalCostGEL: 414.09
        }
    });

    assert.equal(model.exchangeRate, 3);
    assert.equal(model.totalCostGEL, 414.09);
    assert.equal(model.shippingRows[0].shippingCostGEL, 25.5);
    assert.equal(model.vatGEL, 58.59);
    assert.equal(model.hasSnapshot, true);
});

test('opens legacy saved carts from their stored totals without current-price recalculation', () => {
    const model = buildSavedInvoiceModel({
        title: 'Legacy cart',
        date: '9/16/2026',
        calculationType: 'cart',
        items: [
            { name: 'SSD', priceUSD: 70, quantity: 1 },
            { name: 'RAM', priceUSD: 30, quantity: 2 }
        ],
        priceUSD: '130.00',
        weight: '2.00',
        total: '425.60',
        rate: '2.6000',
        deliveryGEL: '44.20',
        taxTotal: '43.40',
        forwarderName: 'Saved Forwarder',
        shippingRatePerKG: '8.50'
    });

    assert.equal(model.priceUSD, 130);
    assert.equal(model.itemCostGEL, 338);
    assert.equal(model.shippingCostGEL, 44.2);
    assert.equal(model.taxTotalGEL, 43.4);
    assert.equal(model.totalCostGEL, 425.6);
    assert.equal(model.shippingRows.length, 1);
    assert.equal(model.shippingRows[0].summaryOnly, true);
    assert.equal(model.hasSnapshot, false);
});

test('preserves insurance, import duty and forwarder fees in version 2 invoice snapshots', () => {
    const model = buildSavedInvoiceModel({
        title: 'USA parcel',
        total: '560.25',
        invoiceSnapshot: {
            version: 2,
            exchangeRate: 2.7,
            forwarderName: 'USA2GEORGIA',
            shippingRatePerKG: 9.95,
            priceUSD: 130,
            itemCostGEL: 351,
            shippingCostUSD: 9.95,
            shippingCostGEL: 26.865,
            insuranceUSD: 5,
            insuranceCostGEL: 13.5,
            estimatedCustomsValueGEL: 391.365,
            hasTax: true,
            importDutyRate: 0.12,
            importDutyGEL: 46.9638,
            vatTaxableBaseGEL: 438.3288,
            vatGEL: 78.899184,
            treasuryFeeGEL: 20,
            declarationPreparationFeeGEL: 16,
            operationalHandlingFeeGEL: 7.02,
            forwarderFeesGEL: 23.02,
            serviceFeesGEL: 43.02,
            totalAdditionalChargesGEL: 168.882984,
            totalCostGEL: 560.247984
        }
    });

    assert.equal(model.insuranceUSD, 5);
    assert.equal(model.insuranceCostGEL, 13.5);
    assert.equal(model.importDutyRate, 0.12);
    assert.equal(model.importDutyGEL, 46.9638);
    assert.equal(model.operationalHandlingFeeGEL, 7.02);
    assert.equal(model.taxTotalGEL, 168.882984);
    assert.equal(model.totalCostGEL, 560.247984);
});
