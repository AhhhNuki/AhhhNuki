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
    const DEFAULT_CUSTOMS_RULES = {
        valueThresholdGEL: CUSTOMS_VALUE_THRESHOLD_GEL,
        weightLimitKG: CUSTOMS_WEIGHT_LIMIT_KG,
        vatRate: VAT_RATE,
        treasuryFeeTiers: [
            { aboveGEL: 300, upToGEL: 3000, amountGEL: 20 },
            { aboveGEL: 3000, upToGEL: 10000, amountGEL: 100 },
            { aboveGEL: 10000, upToGEL: null, amountGEL: 300 }
        ]
    };

    function isPositiveFinite(value) {
        return Number.isFinite(value) && value > 0;
    }

    function isNonNegativeFinite(value) {
        return Number.isFinite(value) && value >= 0;
    }

    function roundMoney(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }

    function normalizeCustomsRules(rules) {
        const source = rules && typeof rules === 'object' ? rules : {};
        const valueThresholdGEL = isPositiveFinite(source.valueThresholdGEL)
            ? source.valueThresholdGEL
            : DEFAULT_CUSTOMS_RULES.valueThresholdGEL;
        const weightLimitKG = isPositiveFinite(source.weightLimitKG)
            ? source.weightLimitKG
            : DEFAULT_CUSTOMS_RULES.weightLimitKG;
        const vatRate = isNonNegativeFinite(source.vatRate) && source.vatRate <= 1
            ? source.vatRate
            : DEFAULT_CUSTOMS_RULES.vatRate;
        const treasuryFeeTiers = Array.isArray(source.treasuryFeeTiers)
            ? source.treasuryFeeTiers
            : DEFAULT_CUSTOMS_RULES.treasuryFeeTiers;

        return { valueThresholdGEL, weightLimitKG, vatRate, treasuryFeeTiers };
    }

    function calculateTreasuryFeeGEL(customsValueGEL, hasTax, rules = DEFAULT_CUSTOMS_RULES) {
        if (!hasTax) return 0;
        const normalizedRules = normalizeCustomsRules(rules);
        const tier = normalizedRules.treasuryFeeTiers.find(candidate => {
            const aboveGEL = Number(candidate?.aboveGEL);
            const upToGEL = candidate?.upToGEL == null ? Infinity : Number(candidate.upToGEL);
            return Number.isFinite(aboveGEL) && customsValueGEL > aboveGEL && customsValueGEL <= upToGEL;
        });
        return isNonNegativeFinite(Number(tier?.amountGEL)) ? Number(tier.amountGEL) : 0;
    }

    function calculateTieredFeeGEL(valueGEL, tiers) {
        if (!isNonNegativeFinite(valueGEL) || !Array.isArray(tiers)) return 0;
        const tier = tiers.find(candidate => {
            const upToGEL = candidate?.upToGEL == null ? Infinity : Number(candidate.upToGEL);
            return valueGEL <= upToGEL;
        });
        if (!tier) return 0;
        if (isNonNegativeFinite(Number(tier.flatGEL))) return Number(tier.flatGEL);
        if (isNonNegativeFinite(Number(tier.rate))) return valueGEL * Number(tier.rate);
        return 0;
    }

    function calculateForwarderFees(feePolicy, declaredGoodsValueGEL, hasTax) {
        const policy = feePolicy && typeof feePolicy === 'object' ? feePolicy : {};
        const warnings = [];
        const declarationRule = policy.declarationPreparation;
        const operationalRule = policy.operationalHandling;
        let declarationPreparationFeeGEL = 0;
        let operationalHandlingFeeGEL = 0;

        if (declarationRule?.status === 'verified') {
            const applies = declarationRule.appliesWhen === 'always' || hasTax;
            if (applies && isNonNegativeFinite(Number(declarationRule.amountGEL))) {
                declarationPreparationFeeGEL = Number(declarationRule.amountGEL);
            }
        } else if (hasTax) {
            warnings.push('declaration-preparation-unverified');
        }

        if (operationalRule?.status === 'verified') {
            const applies = operationalRule.appliesWhen !== 'customs-clearance' || hasTax;
            if (applies) {
                operationalHandlingFeeGEL = calculateTieredFeeGEL(
                    declaredGoodsValueGEL,
                    operationalRule.tiers
                );
            }
        } else if (operationalRule?.status !== 'none') {
            warnings.push('operational-handling-unverified');
        }

        const forwarderFeesGEL = declarationPreparationFeeGEL + operationalHandlingFeeGEL;
        return {
            declarationPreparationFeeGEL,
            operationalHandlingFeeGEL,
            forwarderFeesGEL,
            warnings
        };
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
        const comparisonValueGEL = roundMoney(goodsSubtotalGEL);
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
            atGoodsThreshold: comparisonValueGEL === CUSTOMS_VALUE_THRESHOLD_GEL,
            exceedsGoodsThreshold: comparisonValueGEL > CUSTOMS_VALUE_THRESHOLD_GEL,
            reachesGoodsThreshold: comparisonValueGEL > CUSTOMS_VALUE_THRESHOLD_GEL,
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

        if (!isNonNegativeFinite(input.insuranceUSD ?? 0)) {
            errors.push({ field: 'insurance', message: 'დაზღვევის ღირებულება უნდა იყოს 0 ან მეტი.' });
        }

        if (!isNonNegativeFinite(input.importDutyRate ?? 0) || (input.importDutyRate ?? 0) > 1) {
            errors.push({ field: 'importDutyRate', message: 'იმპორტის ტარიფი უნდა იყოს 0%-დან 100%-მდე.' });
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

    function calculateFinancialBreakdown(input) {
        const rules = normalizeCustomsRules(input.customsRules);
        const itemCostGEL = input.priceUSD * input.exchangeRate;
        const shippingCostGEL = input.shippingCostUSD * input.exchangeRate;
        const insuranceUSD = input.insuranceUSD ?? 0;
        const insuranceCostGEL = insuranceUSD * input.exchangeRate;
        const estimatedCustomsValueGEL = itemCostGEL + shippingCostGEL + insuranceCostGEL;
        const customsValueForThresholdGEL = roundMoney(estimatedCustomsValueGEL);
        const exceedsValueThreshold = customsValueForThresholdGEL > rules.valueThresholdGEL;
        const atValueThreshold = customsValueForThresholdGEL === rules.valueThresholdGEL;
        const exceedsWeightLimit = input.physicalWeightKg > rules.weightLimitKG;
        const hasTax = exceedsValueThreshold || exceedsWeightLimit;
        const importDutyRate = input.importDutyRate ?? 0;
        const importDutyGEL = hasTax ? estimatedCustomsValueGEL * importDutyRate : 0;
        const vatTaxableBaseGEL = hasTax ? estimatedCustomsValueGEL + importDutyGEL : 0;
        const vatGEL = hasTax ? vatTaxableBaseGEL * rules.vatRate : 0;
        const treasuryFeeGEL = calculateTreasuryFeeGEL(estimatedCustomsValueGEL, hasTax, rules);
        const forwarderFeeResult = calculateForwarderFees(
            input.forwarderFeePolicy,
            itemCostGEL,
            hasTax
        );
        const stateChargesGEL = importDutyGEL + vatGEL + treasuryFeeGEL;
        const serviceFeesGEL = treasuryFeeGEL + forwarderFeeResult.forwarderFeesGEL;
        const totalAdditionalChargesGEL = stateChargesGEL + forwarderFeeResult.forwarderFeesGEL;
        const totalCostGEL = estimatedCustomsValueGEL + totalAdditionalChargesGEL;
        const taxReasons = [];
        if (exceedsValueThreshold) taxReasons.push('estimated-value');
        if (exceedsWeightLimit) taxReasons.push('physical-weight');

        return {
            itemCostGEL,
            shippingCostGEL,
            insuranceUSD,
            insuranceCostGEL,
            estimatedCustomsValueGEL,
            customsValueForThresholdGEL,
            reachesValueThreshold: exceedsValueThreshold,
            exceedsValueThreshold,
            atValueThreshold,
            exceedsWeightLimit,
            hasTax,
            taxReasons,
            importDutyRate,
            importDutyGEL,
            vatRate: rules.vatRate,
            vatTaxableBaseGEL,
            vatGEL,
            treasuryFeeGEL,
            ...forwarderFeeResult,
            serviceFeesGEL,
            stateChargesGEL,
            totalAdditionalChargesGEL,
            totalCostGEL
        };
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
        const shippingCostUSD = chargeableWeightKg * input.shippingRatePerKG;
        const financials = calculateFinancialBreakdown({
            ...input,
            shippingCostUSD,
            physicalWeightKg
        });

        return {
            physicalWeightKg,
            volumetricWeightKg,
            chargeableWeightKg,
            usesVolumetricWeight,
            shippingCostUSD,
            ...financials
        };
    }

    function calculateCartCosts(input) {
        if (!isPositiveFinite(input.shippingRatePerKG)) {
            throw new Error('ტრანსპორტირების ტარიფი უნდა იყოს 0-ზე მეტი.');
        }
        if (!isPositiveFinite(input.exchangeRate)) {
            throw new Error('USD/GEL კურსი უნდა იყოს 0-ზე მეტი.');
        }
        if (!isNonNegativeFinite(input.insuranceUSD ?? 0)) {
            throw new Error('დაზღვევის ღირებულება უნდა იყოს 0 ან მეტი.');
        }
        if (!isNonNegativeFinite(input.importDutyRate ?? 0) || (input.importDutyRate ?? 0) > 1) {
            throw new Error('იმპორტის ტარიფი უნდა იყოს 0%-დან 100%-მდე.');
        }

        const priceUSD = calculateCartSubtotalUSD(input.items);
        const weights = calculateCartParcelWeights(input.items);
        const shippingCostUSD = weights.chargeableWeightKg * input.shippingRatePerKG;
        const financials = calculateFinancialBreakdown({
            ...input,
            priceUSD,
            shippingCostUSD,
            physicalWeightKg: weights.physicalWeightKg
        });

        return {
            ...weights,
            priceUSD,
            shippingCostUSD,
            ...financials
        };
    }

    return {
        CUSTOMS_VALUE_THRESHOLD_GEL,
        CUSTOMS_WEIGHT_LIMIT_KG,
        VAT_RATE,
        DEFAULT_CUSTOMS_RULES,
        roundMoney,
        normalizeCustomsRules,
        calculateTreasuryFeeGEL,
        calculateTieredFeeGEL,
        calculateForwarderFees,
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
