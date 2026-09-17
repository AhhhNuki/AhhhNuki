(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    root.CalculatorCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const CUSTOMS_VALUE_THRESHOLD_GEL = 300;
    const CUSTOMS_WEIGHT_LIMIT_KG = 30;
    const VAT_RATE = 0.18;
    const TREASURY_FEE_GEL = 20;
    const DECLARATION_PREPARATION_FEE_GEL = 10;

    function isPositiveFinite(value) {
        return Number.isFinite(value) && value > 0;
    }

    function convertWeightToKg(weight, unit) {
        if (unit === 'ounces') return weight * 0.0283495;
        if (unit === 'pounds') return weight * 0.453592;
        return weight;
    }

    function calculateVolumetricWeightKg(lengthCm, widthCm, heightCm) {
        return (lengthCm * widthCm * heightCm) / 6000;
    }

    function validateCartItems(items) {
        const errors = [];
        if (!Array.isArray(items) || items.length === 0) {
            return {
                valid: false,
                errors: [{ field: 'cart', index: -1, message: 'კალათაში დაამატეთ მინიმუმ ერთი ნივთი.' }]
            };
        }

        items.forEach((item, index) => {
            if (!Number.isFinite(item.priceUSD) || item.priceUSD < 0) {
                errors.push({
                    field: 'cartPrice',
                    index,
                    message: `${index + 1}-ე ნივთის ფასი უნდა იყოს 0 ან მეტი.`
                });
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                errors.push({
                    field: 'cartQuantity',
                    index,
                    message: `${index + 1}-ე ნივთის რაოდენობა უნდა იყოს დადებითი მთელი რიცხვი.`
                });
            }
        });

        return { valid: errors.length === 0, errors };
    }

    function calculateCartSubtotalUSD(items) {
        const validation = validateCartItems(items);
        if (!validation.valid) {
            const error = new Error(validation.errors[0].message);
            error.validationErrors = validation.errors;
            throw error;
        }

        return items.reduce((total, item) => total + (item.priceUSD * item.quantity), 0);
    }

    function validateCartParcels(items) {
        const itemValidation = validateCartItems(items);
        const errors = [...itemValidation.errors];

        if (!Array.isArray(items)) {
            return { valid: false, errors };
        }

        items.forEach((item, index) => {
            if (!isPositiveFinite(item.weightInput)) {
                errors.push({
                    field: 'cartWeight',
                    index,
                    message: `${index + 1}-ე ამანათის ფიზიკური წონა უნდა იყოს 0-ზე მეტი.`
                });
            }

            if (item.useVolumetric) {
                const dimensions = item.dimensions || {};
                if (
                    !isPositiveFinite(dimensions.lengthCm) ||
                    !isPositiveFinite(dimensions.widthCm) ||
                    !isPositiveFinite(dimensions.heightCm)
                ) {
                    errors.push({
                        field: 'cartDimensions',
                        index,
                        message: `${index + 1}-ე ამანათის მოცულობითი წონისთვის სამივე ზომა უნდა იყოს 0-ზე მეტი.`
                    });
                }
            }
        });

        return { valid: errors.length === 0, errors };
    }

    function calculateCartParcelWeights(items) {
        const validation = validateCartParcels(items);
        if (!validation.valid) {
            const error = new Error(validation.errors[0].message);
            error.validationErrors = validation.errors;
            throw error;
        }

        const parcels = items.map(item => {
            const physicalWeightKg = convertWeightToKg(item.weightInput, item.weightUnit);
            const dimensions = item.dimensions || {};
            const volumetricWeightKg = item.useVolumetric
                ? calculateVolumetricWeightKg(
                    dimensions.lengthCm,
                    dimensions.widthCm,
                    dimensions.heightCm
                )
                : 0;
            const chargeableWeightKg = Math.max(physicalWeightKg, volumetricWeightKg);

            return {
                physicalWeightKg,
                volumetricWeightKg,
                chargeableWeightKg,
                usesVolumetricWeight: item.useVolumetric && volumetricWeightKg > physicalWeightKg
            };
        });

        return {
            parcels,
            physicalWeightKg: parcels.reduce((total, parcel) => total + parcel.physicalWeightKg, 0),
            volumetricWeightKg: parcels.reduce((total, parcel) => total + parcel.volumetricWeightKg, 0),
            chargeableWeightKg: parcels.reduce((total, parcel) => total + parcel.chargeableWeightKg, 0),
            usesVolumetricWeight: parcels.some(parcel => parcel.usesVolumetricWeight)
        };
    }

    function calculateCartThresholdStatus(items, exchangeRate, safetyBufferGEL = 10) {
        if (!isPositiveFinite(exchangeRate)) {
            throw new Error('USD/GEL კურსი უნდა იყოს 0-ზე მეტი.');
        }
        if (!Number.isFinite(safetyBufferGEL) || safetyBufferGEL < 0) {
            throw new Error('უსაფრთხოების ბუფერი უნდა იყოს 0 ან მეტი.');
        }

        const subtotalUSD = calculateCartSubtotalUSD(items);
        const goodsSubtotalGEL = subtotalUSD * exchangeRate;
        const remainingGEL = CUSTOMS_VALUE_THRESHOLD_GEL - goodsSubtotalGEL;
        const safeLimitGEL = Math.max(0, CUSTOMS_VALUE_THRESHOLD_GEL - safetyBufferGEL);
        const safeRemainingGEL = safeLimitGEL - goodsSubtotalGEL;

        return {
            subtotalUSD,
            goodsSubtotalGEL,
            remainingGEL,
            remainingUSD: remainingGEL / exchangeRate,
            overageGEL: Math.max(0, -remainingGEL),
            overageUSD: Math.max(0, -remainingGEL / exchangeRate),
            safetyBufferGEL,
            safeLimitGEL,
            safeRemainingGEL,
            safeRemainingUSD: safeRemainingGEL / exchangeRate,
            usedPercent: Math.max(0, (goodsSubtotalGEL / CUSTOMS_VALUE_THRESHOLD_GEL) * 100),
            reachesGoodsThreshold: goodsSubtotalGEL >= CUSTOMS_VALUE_THRESHOLD_GEL,
            exceedsSafeLimit: goodsSubtotalGEL >= safeLimitGEL
        };
    }

    function validateCalculationInputs(input) {
        const errors = [];

        if (!Number.isFinite(input.priceUSD) || input.priceUSD < 0) {
            errors.push({ field: 'price', message: 'ნივთის ფასი უნდა იყოს 0 ან მეტი.' });
        }

        if (!isPositiveFinite(input.weightInput)) {
            errors.push({ field: 'weight', message: 'წონა უნდა იყოს 0-ზე მეტი.' });
        }

        if (!isPositiveFinite(input.shippingRatePerKG)) {
            errors.push({ field: 'shippingRate', message: 'ტრანსპორტირების ტარიფი უნდა იყოს 0-ზე მეტი.' });
        }

        if (!isPositiveFinite(input.exchangeRate)) {
            errors.push({ field: 'exchangeRate', message: 'USD/GEL კურსი უნდა იყოს 0-ზე მეტი.' });
        }

        if (input.useVolumetric) {
            const dimensions = input.dimensions || {};
            if (
                !isPositiveFinite(dimensions.lengthCm) ||
                !isPositiveFinite(dimensions.widthCm) ||
                !isPositiveFinite(dimensions.heightCm)
            ) {
                errors.push({
                    field: 'dimensions',
                    message: 'მოცულობითი წონისთვის სამივე ზომა უნდა იყოს 0-ზე მეტი.'
                });
            }
        }

        return { valid: errors.length === 0, errors };
    }

    function calculateCosts(input) {
        const validation = validateCalculationInputs(input);
        if (!validation.valid) {
            const error = new Error(validation.errors[0].message);
            error.validationErrors = validation.errors;
            throw error;
        }

        const physicalWeightKg = convertWeightToKg(input.weightInput, input.weightUnit);
        const dimensions = input.dimensions || {};
        const volumetricWeightKg = input.useVolumetric
            ? calculateVolumetricWeightKg(
                dimensions.lengthCm,
                dimensions.widthCm,
                dimensions.heightCm
            )
            : 0;
        const chargeableWeightKg = Math.max(physicalWeightKg, volumetricWeightKg);
        const usesVolumetricWeight = input.useVolumetric && volumetricWeightKg > physicalWeightKg;

        const itemCostGEL = input.priceUSD * input.exchangeRate;
        const shippingCostUSD = chargeableWeightKg * input.shippingRatePerKG;
        const shippingCostGEL = shippingCostUSD * input.exchangeRate;
        const estimatedCustomsValueGEL = itemCostGEL + shippingCostGEL;

        // The postal exemption is treated conservatively: the estimated customs
        // value must be below 300 GEL and the physical weight must not exceed 30 kg.
        const reachesValueThreshold = estimatedCustomsValueGEL >= CUSTOMS_VALUE_THRESHOLD_GEL;
        const exceedsWeightLimit = physicalWeightKg > CUSTOMS_WEIGHT_LIMIT_KG;
        const hasTax = reachesValueThreshold || exceedsWeightLimit;
        const vatGEL = hasTax ? estimatedCustomsValueGEL * VAT_RATE : 0;
        const serviceFeesGEL = hasTax
            ? TREASURY_FEE_GEL + DECLARATION_PREPARATION_FEE_GEL
            : 0;
        const totalCostGEL = estimatedCustomsValueGEL + vatGEL + serviceFeesGEL;

        const taxReasons = [];
        if (reachesValueThreshold) taxReasons.push('estimated-value');
        if (exceedsWeightLimit) taxReasons.push('physical-weight');

        return {
            physicalWeightKg,
            volumetricWeightKg,
            chargeableWeightKg,
            usesVolumetricWeight,
            itemCostGEL,
            shippingCostUSD,
            shippingCostGEL,
            estimatedCustomsValueGEL,
            reachesValueThreshold,
            exceedsWeightLimit,
            hasTax,
            taxReasons,
            vatGEL,
            treasuryFeeGEL: hasTax ? TREASURY_FEE_GEL : 0,
            declarationPreparationFeeGEL: hasTax ? DECLARATION_PREPARATION_FEE_GEL : 0,
            serviceFeesGEL,
            totalCostGEL
        };
    }

    function calculateCartCosts(input) {
        if (!isPositiveFinite(input.shippingRatePerKG)) {
            throw new Error('ტრანსპორტირების ტარიფი უნდა იყოს 0-ზე მეტი.');
        }
        if (!isPositiveFinite(input.exchangeRate)) {
            throw new Error('USD/GEL კურსი უნდა იყოს 0-ზე მეტი.');
        }

        const priceUSD = calculateCartSubtotalUSD(input.items);
        const weights = calculateCartParcelWeights(input.items);
        const itemCostGEL = priceUSD * input.exchangeRate;
        const shippingCostUSD = weights.chargeableWeightKg * input.shippingRatePerKG;
        const shippingCostGEL = shippingCostUSD * input.exchangeRate;
        const estimatedCustomsValueGEL = itemCostGEL + shippingCostGEL;
        const reachesValueThreshold = estimatedCustomsValueGEL >= CUSTOMS_VALUE_THRESHOLD_GEL;
        const exceedsWeightLimit = weights.physicalWeightKg > CUSTOMS_WEIGHT_LIMIT_KG;
        const hasTax = reachesValueThreshold || exceedsWeightLimit;
        const vatGEL = hasTax ? estimatedCustomsValueGEL * VAT_RATE : 0;
        const treasuryFeeGEL = hasTax ? TREASURY_FEE_GEL : 0;
        const declarationPreparationFeeGEL = hasTax ? DECLARATION_PREPARATION_FEE_GEL : 0;
        const serviceFeesGEL = treasuryFeeGEL + declarationPreparationFeeGEL;
        const totalCostGEL = estimatedCustomsValueGEL + vatGEL + serviceFeesGEL;
        const taxReasons = [];
        if (reachesValueThreshold) taxReasons.push('estimated-value');
        if (exceedsWeightLimit) taxReasons.push('physical-weight');

        return {
            ...weights,
            priceUSD,
            itemCostGEL,
            shippingCostUSD,
            shippingCostGEL,
            estimatedCustomsValueGEL,
            reachesValueThreshold,
            exceedsWeightLimit,
            hasTax,
            taxReasons,
            vatGEL,
            treasuryFeeGEL,
            declarationPreparationFeeGEL,
            serviceFeesGEL,
            totalCostGEL
        };
    }

    return {
        CUSTOMS_VALUE_THRESHOLD_GEL,
        CUSTOMS_WEIGHT_LIMIT_KG,
        VAT_RATE,
        TREASURY_FEE_GEL,
        DECLARATION_PREPARATION_FEE_GEL,
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
    };
});
