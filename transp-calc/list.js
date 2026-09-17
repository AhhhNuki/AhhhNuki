const STORAGE_KEY = 'calc_history_v2';

function readHistory() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Saved calculation history is not valid JSON.', error);
        return [];
    }
}

function normalizeNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeExternalUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        const url = new URL(value.trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch (error) {
        return null;
    }
}

function createSummaryRow(label, value) {
    const row = document.createElement('div');
    row.className = 'flex justify-between gap-3';

    const labelElement = document.createElement('span');
    labelElement.textContent = label;

    const valueElement = document.createElement('span');
    valueElement.className = 'text-gray-200 text-right';
    valueElement.textContent = value;

    row.append(labelElement, valueElement);
    return row;
}

function convertSavedWeightToKg(value, unit) {
    const weight = normalizeNumber(value);
    if (unit === 'pounds') return weight * 0.45359237;
    if (unit === 'ounces') return weight * 0.028349523125;
    return weight;
}

function createSavedParcelWeight(item) {
    const physicalWeightKg = convertSavedWeightToKg(item?.weightInput, item?.weightUnit);
    const dimensions = item?.dimensions || {};
    const volumetricWeightKg = item?.useVolumetric
        ? normalizeNumber(dimensions.lengthCm) * normalizeNumber(dimensions.widthCm) * normalizeNumber(dimensions.heightCm) / 6000
        : 0;

    return {
        physicalWeightKg,
        volumetricWeightKg,
        chargeableWeightKg: Math.max(physicalWeightKg, volumetricWeightKg),
        usesVolumetricWeight: Boolean(item?.useVolumetric && volumetricWeightKg > physicalWeightKg)
    };
}

function buildSavedInvoiceModel(rawItem) {
    const snapshot = rawItem?.invoiceSnapshot && typeof rawItem.invoiceSnapshot === 'object'
        ? rawItem.invoiceSnapshot
        : null;
    const isCart = rawItem?.calculationType === 'cart' && Array.isArray(rawItem?.items);
    const exchangeRate = normalizeNumber(snapshot?.exchangeRate, normalizeNumber(rawItem?.rate));
    const shippingRatePerKG = normalizeNumber(snapshot?.shippingRatePerKG, normalizeNumber(rawItem?.shippingRatePerKG));
    const priceUSD = normalizeNumber(snapshot?.priceUSD, normalizeNumber(rawItem?.priceUSD));
    const itemCostGEL = normalizeNumber(snapshot?.itemCostGEL, priceUSD * exchangeRate);
    const shippingCostGEL = normalizeNumber(snapshot?.shippingCostGEL, normalizeNumber(rawItem?.deliveryGEL));
    const shippingCostUSD = normalizeNumber(
        snapshot?.shippingCostUSD,
        exchangeRate > 0 ? shippingCostGEL / exchangeRate : 0
    );
    const estimatedCustomsValueGEL = normalizeNumber(
        snapshot?.estimatedCustomsValueGEL,
        itemCostGEL + shippingCostGEL
    );
    const totalCostGEL = normalizeNumber(snapshot?.totalCostGEL, normalizeNumber(rawItem?.total));
    const taxTotalGEL = snapshot
        ? normalizeNumber(snapshot.vatGEL) + normalizeNumber(snapshot.serviceFeesGEL)
        : normalizeNumber(rawItem?.taxTotal);

    const sourceItems = Array.isArray(snapshot?.items) && snapshot.items.length > 0
        ? snapshot.items
        : isCart
            ? rawItem.items
            : [{
                name: rawItem?.title,
                quantity: 1,
                unitPriceUSD: priceUSD,
                lineTotalUSD: priceUSD,
                lineTotalGEL: itemCostGEL
            }];
    const items = sourceItems.map((item, index) => {
        const quantity = Math.max(1, Math.trunc(normalizeNumber(item?.quantity, 1)));
        const unitPriceUSD = normalizeNumber(item?.unitPriceUSD, normalizeNumber(item?.priceUSD));
        const lineTotalUSD = normalizeNumber(item?.lineTotalUSD, unitPriceUSD * quantity);
        return {
            name: typeof item?.name === 'string' && item.name.trim()
                ? item.name.trim()
                : `${isCart ? 'ამანათი' : 'ნივთი'} ${index + 1}`,
            quantity,
            unitPriceUSD,
            lineTotalUSD,
            lineTotalGEL: normalizeNumber(item?.lineTotalGEL, lineTotalUSD * exchangeRate)
        };
    });

    let shippingRows = [];
    if (Array.isArray(snapshot?.shippingRows) && snapshot.shippingRows.length > 0) {
        shippingRows = snapshot.shippingRows.map((row, index) => ({
            name: typeof row?.name === 'string' && row.name.trim()
                ? row.name.trim()
                : items[index]?.name || `ამანათი ${index + 1}`,
            physicalWeightKg: normalizeNumber(row?.physicalWeightKg),
            volumetricWeightKg: normalizeNumber(row?.volumetricWeightKg),
            chargeableWeightKg: normalizeNumber(row?.chargeableWeightKg),
            usesVolumetricWeight: Boolean(row?.usesVolumetricWeight),
            shippingCostUSD: normalizeNumber(row?.shippingCostUSD),
            shippingCostGEL: normalizeNumber(row?.shippingCostGEL),
            summaryOnly: false
        }));
    } else if (isCart && shippingRatePerKG > 0) {
        const derivedRows = rawItem.items.map((item, index) => {
            const weights = createSavedParcelWeight(item);
            return {
                name: items[index]?.name || `ამანათი ${index + 1}`,
                ...weights,
                shippingCostUSD: weights.chargeableWeightKg * shippingRatePerKG,
                shippingCostGEL: weights.chargeableWeightKg * shippingRatePerKG * exchangeRate,
                summaryOnly: false
            };
        });
        const derivedTotal = derivedRows.reduce((total, row) => total + row.shippingCostGEL, 0);
        if (derivedRows.every(row => row.chargeableWeightKg > 0) && Math.abs(derivedTotal - shippingCostGEL) < 0.05) {
            shippingRows = derivedRows;
        }
    }

    if (shippingRows.length === 0) {
        shippingRows = [{
            name: isCart ? 'გზავნილი' : items[0]?.name || 'ნივთი',
            physicalWeightKg: normalizeNumber(rawItem?.physicalWeight, normalizeNumber(rawItem?.weight)),
            volumetricWeightKg: normalizeNumber(rawItem?.volumetricWeight),
            chargeableWeightKg: normalizeNumber(rawItem?.weight),
            usesVolumetricWeight: normalizeNumber(rawItem?.volumetricWeight) > normalizeNumber(rawItem?.physicalWeight),
            shippingCostUSD,
            shippingCostGEL,
            summaryOnly: true
        }];
    }

    return {
        title: typeof rawItem?.title === 'string' && rawItem.title.trim() ? rawItem.title.trim() : 'უსახელო გამოთვლა',
        date: typeof rawItem?.date === 'string' ? rawItem.date : '',
        isCart,
        hasSnapshot: Boolean(snapshot),
        items,
        shippingRows,
        exchangeRate,
        exchangeRateSource: typeof snapshot?.exchangeRateSource === 'string' ? snapshot.exchangeRateSource : '',
        forwarderName: typeof snapshot?.forwarderName === 'string'
            ? snapshot.forwarderName
            : typeof rawItem?.forwarderName === 'string' ? rawItem.forwarderName : '',
        shippingRatePerKG,
        priceUSD,
        itemCostGEL,
        shippingCostUSD,
        shippingCostGEL,
        estimatedCustomsValueGEL,
        hasTax: snapshot ? Boolean(snapshot.hasTax) : taxTotalGEL > 0,
        vatGEL: normalizeNumber(snapshot?.vatGEL),
        treasuryFeeGEL: normalizeNumber(snapshot?.treasuryFeeGEL),
        declarationPreparationFeeGEL: normalizeNumber(snapshot?.declarationPreparationFeeGEL),
        taxTotalGEL,
        totalCostGEL
    };
}

function createInvoiceElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createInvoiceTotalRow(label, primaryValue, secondaryValue = '', valueClass = 'text-gray-200') {
    const row = createInvoiceElement('div', 'flex justify-between items-start gap-3 text-xs text-gray-400');
    row.appendChild(createInvoiceElement('span', '', label));
    const value = createInvoiceElement('span', 'text-right shrink-0');
    value.appendChild(createInvoiceElement('strong', `${valueClass} whitespace-nowrap`, primaryValue));
    if (secondaryValue) value.appendChild(createInvoiceElement('span', 'block text-[10px] text-gray-500', secondaryValue));
    row.appendChild(value);
    return row;
}

function renderSavedInvoice(rawItem) {
    const model = buildSavedInvoiceModel(rawItem);
    const fragment = document.createDocumentFragment();

    const invoice = createInvoiceElement('section', 'rounded-xl border border-brand-border overflow-hidden bg-brand-bg/30');
    const invoiceHeader = createInvoiceElement('div', 'px-3 py-3 bg-white/[0.03] border-b border-brand-border flex justify-between items-start gap-3');
    const headerText = createInvoiceElement('div');
    headerText.append(
        createInvoiceElement('p', 'text-sm font-semibold text-white', model.isCart ? 'კალათის ინვოისი' : 'ნივთის ინვოისი'),
        createInvoiceElement('p', 'text-[10px] text-gray-500 mt-0.5', `${model.items.length} ${model.isCart ? 'ამანათი' : 'ნივთი'} • კურსი ${model.exchangeRate.toFixed(4)}`)
    );
    invoiceHeader.append(headerText, createInvoiceElement('span', 'text-[10px] text-gray-500 whitespace-nowrap', 'USD → GEL'));
    invoice.appendChild(invoiceHeader);

    const itemsSection = createInvoiceElement('div', 'px-3');
    const columns = createInvoiceElement('div', 'grid grid-cols-[minmax(0,1fr)_34px_64px_76px] gap-2 py-2 border-b border-brand-border text-[10px] uppercase tracking-wide text-gray-600');
    ['აღწერა', 'რაოდ.', 'ერთ. ფასი', 'ჯამი'].forEach((text, index) => {
        columns.appendChild(createInvoiceElement('span', index === 1 ? 'text-center' : index > 1 ? 'text-right' : '', text));
    });
    itemsSection.appendChild(columns);
    model.items.forEach((item, index) => {
        const row = createInvoiceElement('div', 'grid grid-cols-[minmax(0,1fr)_34px_64px_76px] gap-2 items-start py-2.5 border-b border-brand-border/70 last:border-b-0 text-xs');
        const description = createInvoiceElement('div', 'min-w-0');
        description.append(
            createInvoiceElement('div', 'text-gray-200 font-medium break-words', item.name),
            createInvoiceElement('div', 'text-[10px] text-gray-600 mt-0.5', model.isCart ? `ამანათი ${index + 1}` : 'ნივთი')
        );
        const total = createInvoiceElement('div', 'text-right');
        total.append(
            createInvoiceElement('div', 'text-white font-medium', `$${item.lineTotalUSD.toFixed(2)}`),
            createInvoiceElement('div', 'text-[10px] text-gray-500', `${item.lineTotalGEL.toFixed(2)} ₾`)
        );
        row.append(
            description,
            createInvoiceElement('div', 'text-center text-gray-400', String(item.quantity)),
            createInvoiceElement('div', 'text-right text-gray-400', `$${item.unitPriceUSD.toFixed(2)}`),
            total
        );
        itemsSection.appendChild(row);
    });
    invoice.appendChild(itemsSection);

    const shippingTitle = createInvoiceElement('div', 'px-3 py-2 bg-white/[0.02] border-y border-brand-border');
    shippingTitle.appendChild(createInvoiceElement('p', 'text-[10px] uppercase tracking-wide text-gray-600', model.isCart ? 'ტრანსპორტირება თითო ამანათზე' : 'ტრანსპორტირება'));
    invoice.appendChild(shippingTitle);
    const shippingSection = createInvoiceElement('div', 'px-3');
    model.shippingRows.forEach(rowData => {
        const row = createInvoiceElement('div', 'py-2.5 border-b border-brand-border/70 last:border-b-0 text-xs');
        const top = createInvoiceElement('div', 'flex justify-between items-start gap-3');
        const description = createInvoiceElement('div', 'min-w-0');
        description.append(
            createInvoiceElement('div', 'text-gray-200 font-medium break-words', rowData.name),
            createInvoiceElement(
                'div',
                `text-[10px] mt-0.5 ${rowData.usesVolumetricWeight ? 'text-blue-300' : 'text-gray-600'}`,
                rowData.summaryOnly ? 'ტრანსპორტირების ჯამი' : rowData.usesVolumetricWeight ? 'მოცულობითი წონით' : 'ფიზიკური წონით'
            )
        );
        top.append(description, createInvoiceElement('strong', 'text-gray-200 whitespace-nowrap', `$${rowData.shippingCostUSD.toFixed(2)}`));
        const formula = rowData.summaryOnly || model.shippingRatePerKG <= 0
            ? `${rowData.chargeableWeightKg.toFixed(2)} კგ`
            : `${rowData.chargeableWeightKg.toFixed(2)} კგ × $${model.shippingRatePerKG.toFixed(2)}/კგ`;
        const detail = createInvoiceElement('div', 'flex justify-between gap-3 text-[10px] text-gray-500 mt-1');
        detail.append(createInvoiceElement('span', '', formula), createInvoiceElement('span', '', `${rowData.shippingCostGEL.toFixed(2)} ₾`));
        row.append(top, detail);
        shippingSection.appendChild(row);
    });
    invoice.appendChild(shippingSection);

    const totals = createInvoiceElement('div', 'px-3 py-3 space-y-2 bg-white/[0.02] border-t border-brand-border');
    totals.append(
        createInvoiceTotalRow('საქონლის ქვეჯამი', `$${model.priceUSD.toFixed(2)}`, `${model.itemCostGEL.toFixed(2)} ₾`),
        createInvoiceTotalRow('ტრანსპორტირების ქვეჯამი', `$${model.shippingCostUSD.toFixed(2)}`, `${model.shippingCostGEL.toFixed(2)} ₾`)
    );
    const customsRow = createInvoiceTotalRow('სავარაუდო საბაჟო ღირებულება', `${model.estimatedCustomsValueGEL.toFixed(2)} ₾`, '', 'text-white');
    customsRow.classList.add('pt-2', 'border-t', 'border-brand-border', 'text-gray-300');
    totals.appendChild(customsRow);
    if (model.hasTax) {
        if (model.hasSnapshot) {
            totals.append(
                createInvoiceTotalRow(`დღგ (${model.estimatedCustomsValueGEL.toFixed(2)} ₾ × 18%)`, `${model.vatGEL.toFixed(2)} ₾`, '', 'text-red-300'),
                createInvoiceTotalRow('საბაჟო მომსახურება', `${model.treasuryFeeGEL.toFixed(2)} ₾`, '', 'text-red-300'),
                createInvoiceTotalRow('დეკლარაციის მომზადება', `${model.declarationPreparationFeeGEL.toFixed(2)} ₾`, '', 'text-red-300')
            );
        } else {
            totals.appendChild(createInvoiceTotalRow('გადასახადები და მომსახურება', `${model.taxTotalGEL.toFixed(2)} ₾`, '', 'text-red-300'));
        }
    } else {
        totals.appendChild(createInvoiceTotalRow('სავარაუდო გადასახადები', '0.00 ₾', '', 'text-brand-lime'));
    }
    invoice.appendChild(totals);

    const grandTotal = createInvoiceElement('div', 'px-3 py-3.5 border-t border-brand-border bg-brand-lime/5 flex justify-between items-end gap-3');
    grandTotal.append(
        createInvoiceElement('span', 'text-sm font-bold text-white', 'საბოლოო ჯამი'),
        createInvoiceElement('strong', 'text-2xl font-bold text-brand-lime tracking-tight whitespace-nowrap', `${model.totalCostGEL.toFixed(2)} ₾`)
    );
    invoice.appendChild(grandTotal);
    fragment.appendChild(invoice);

    if (model.isCart) {
        const assumption = createInvoiceElement('div', 'mt-4 p-3 rounded-xl border border-amber-400/30 bg-amber-400/10 text-xs space-y-1.5');
        assumption.append(
            createInvoiceElement('p', 'font-semibold text-amber-300', 'კალათის დაშვება'),
            createInvoiceElement('p', 'text-gray-400', 'ეს ინვოისი დათვლილია იმ დაშვებით, რომ კალათის ამანათები ერთად ჩამოვიდა და ერთ გზავნილად გაფორმდა.'),
            createInvoiceElement('p', 'text-gray-500', 'თუ გადამზიდი ამანათებს ცალ-ცალკე გააფორმებს, თითოეული გზავნილი დამოუკიდებლად შეფასდება და შესაბამისი მომსახურების საფასურებიც შეიძლება ცალ-ცალკე დაერიცხოს.')
        );
        fragment.appendChild(assumption);
    }

    return { fragment, model };
}

let invoiceDrawerReturnFocus = null;
let invoiceDrawerCloseTimer = null;

function getInvoiceDrawerElements() {
    return {
        drawer: document.getElementById('historyInvoiceDrawer'),
        backdrop: document.getElementById('historyInvoiceBackdrop'),
        panel: document.getElementById('historyInvoicePanel'),
        title: document.getElementById('historyInvoiceTitle'),
        meta: document.getElementById('historyInvoiceMeta'),
        content: document.getElementById('historyInvoiceContent'),
        closeButton: document.getElementById('btnCloseHistoryInvoice')
    };
}

function openHistoryInvoice(rawItem, trigger) {
    const elements = getInvoiceDrawerElements();
    if (!elements.drawer || !elements.panel || !elements.content) return;
    if (invoiceDrawerCloseTimer) clearTimeout(invoiceDrawerCloseTimer);

    const rendered = renderSavedInvoice(rawItem);
    elements.content.replaceChildren(rendered.fragment);
    elements.title.textContent = rendered.model.title;
    elements.meta.textContent = [
        rendered.model.date,
        rendered.model.forwarderName,
        rendered.model.exchangeRateSource
    ].filter(Boolean).join(' • ');

    invoiceDrawerReturnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    elements.drawer.removeAttribute('inert');
    elements.drawer.setAttribute('aria-hidden', 'false');
    elements.drawer.classList.remove('pointer-events-none');
    elements.drawer.classList.add('pointer-events-auto');
    document.body.classList.add('overflow-hidden');
    requestAnimationFrame(() => {
        elements.backdrop?.classList.add('opacity-100');
        elements.panel.classList.remove('translate-x-full');
        elements.closeButton?.focus();
    });
}

function closeHistoryInvoice() {
    const elements = getInvoiceDrawerElements();
    if (!elements.drawer || elements.drawer.getAttribute('aria-hidden') === 'true') return;

    elements.backdrop?.classList.remove('opacity-100');
    elements.panel?.classList.add('translate-x-full');
    elements.drawer.classList.remove('pointer-events-auto');
    elements.drawer.classList.add('pointer-events-none');
    elements.drawer.setAttribute('aria-hidden', 'true');
    elements.drawer.setAttribute('inert', '');
    document.body.classList.remove('overflow-hidden');
    if (invoiceDrawerReturnFocus instanceof HTMLElement) invoiceDrawerReturnFocus.focus();
    invoiceDrawerReturnFocus = null;
    invoiceDrawerCloseTimer = setTimeout(() => {
        elements.content?.replaceChildren();
        invoiceDrawerCloseTimer = null;
    }, 200);
}

function initializeInvoiceDrawer() {
    const elements = getInvoiceDrawerElements();
    elements.closeButton?.addEventListener('click', closeHistoryInvoice);
    elements.backdrop?.addEventListener('click', closeHistoryInvoice);

    document.addEventListener('keydown', event => {
        if (!elements.drawer || elements.drawer.getAttribute('aria-hidden') === 'true') return;
        if (event.key === 'Escape') {
            event.preventDefault();
            closeHistoryInvoice();
            return;
        }
        if (event.key !== 'Tab' || !elements.panel) return;

        const focusable = Array.from(elements.panel.querySelectorAll(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        ));
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

function loadAndRenderHistory() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;

    const history = readHistory();
    historyContainer.replaceChildren();

    if (history.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'text-center text-gray-600 col-span-full py-8';
        emptyState.textContent = 'ისტორია ცარიელია';
        historyContainer.appendChild(emptyState);
        return;
    }

    history.slice().reverse().forEach(rawItem => {
        const isCart = rawItem?.calculationType === 'cart' && Array.isArray(rawItem?.items);
        const item = {
            id: rawItem?.id,
            title: typeof rawItem?.title === 'string' && rawItem.title.trim()
                ? rawItem.title.trim()
                : 'უსახელო ნივთი',
            url: normalizeExternalUrl(rawItem?.url),
            date: typeof rawItem?.date === 'string' ? rawItem.date : '',
            priceUSD: normalizeNumber(rawItem?.priceUSD),
            weight: normalizeNumber(rawItem?.weight),
            total: normalizeNumber(rawItem?.total),
            rate: normalizeNumber(rawItem?.rate),
            deliveryGEL: normalizeNumber(rawItem?.deliveryGEL),
            taxTotal: normalizeNumber(rawItem?.taxTotal),
            forwarderName: typeof rawItem?.forwarderName === 'string' ? rawItem.forwarderName : '',
            calculationType: isCart ? 'cart' : 'single',
            itemCount: isCart
                ? rawItem.items.reduce((sum, cartItem) => sum + Math.max(0, Math.trunc(normalizeNumber(cartItem?.quantity, 1))), 0)
                : 1
        };

        const card = document.createElement('div');
        card.className = 'bg-brand-card border border-brand-border rounded-xl p-5 relative group hover:border-brand-lime/30 transition-all flex flex-col h-full';

        const header = document.createElement('div');
        header.className = 'mb-3 border-b border-brand-border pb-2';

        const titleElement = document.createElement(item.url ? 'a' : 'h4');
        titleElement.className = `text-white font-bold text-lg hover:text-brand-lime hover:underline truncate block ${isCart ? 'mr-16' : 'mr-6'}`;
        titleElement.textContent = item.url ? `${item.title} 🔗` : item.title;
        if (item.url) {
            titleElement.href = item.url;
            titleElement.target = '_blank';
            titleElement.rel = 'noopener noreferrer';
        }

        const metadata = document.createElement('div');
        metadata.className = 'flex justify-between items-center gap-2 mt-1';

        const date = document.createElement('p');
        date.className = 'text-xs text-brand-text-muted';
        date.textContent = item.date;

        const rate = document.createElement('span');
        rate.className = 'text-[10px] text-gray-500 bg-gray-900/50 border border-brand-border px-2 py-1 rounded';
        rate.textContent = `კურსი: ${item.rate.toFixed(4)}`;
        metadata.append(date, rate);
        if (isCart) {
            const type = document.createElement('span');
            type.className = 'text-[10px] text-brand-lime bg-brand-lime/10 border border-brand-lime/20 px-2 py-1 rounded';
            type.textContent = `კალათა • ${item.itemCount} ცალი`;
            metadata.appendChild(type);
        }

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'text-gray-600 hover:text-red-500 transition-colors';
        deleteButton.setAttribute('aria-label', `${item.title} — წაშლა`);
        deleteButton.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
        deleteButton.addEventListener('click', () => deleteItem(item.id));

        const headerActions = document.createElement('div');
        headerActions.className = 'absolute top-5 right-4 flex items-center gap-2';

        if (isCart) {
            const renameButton = document.createElement('button');
            renameButton.type = 'button';
            renameButton.className = 'text-gray-600 hover:text-brand-lime transition-colors';
            renameButton.setAttribute('aria-label', `${item.title} — სახელის შეცვლა`);
            renameButton.title = 'სახელის შეცვლა';
            renameButton.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
            renameButton.addEventListener('click', () => {
                titleElement.classList.add('hidden');
                headerActions.classList.add('hidden');

                const renameForm = document.createElement('form');
                renameForm.className = 'mr-1 space-y-2';
                const renameLabel = document.createElement('label');
                renameLabel.className = 'sr-only';
                renameLabel.textContent = 'კალათის ახალი სახელი';
                const renameInput = document.createElement('input');
                renameInput.type = 'text';
                renameInput.value = item.title;
                renameInput.maxLength = 100;
                renameInput.className = 'w-full bg-brand-bg border border-brand-lime/40 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-lime';
                renameLabel.appendChild(renameInput);

                const renameActions = document.createElement('div');
                renameActions.className = 'flex gap-2';
                const saveRename = document.createElement('button');
                saveRename.type = 'submit';
                saveRename.className = 'px-3 py-1.5 rounded-md bg-brand-lime text-black text-xs font-semibold';
                saveRename.textContent = 'შენახვა';
                const cancelRename = document.createElement('button');
                cancelRename.type = 'button';
                cancelRename.className = 'px-3 py-1.5 rounded-md border border-brand-border text-gray-400 text-xs hover:text-white';
                cancelRename.textContent = 'გაუქმება';
                renameActions.append(saveRename, cancelRename);
                renameForm.append(renameLabel, renameActions);

                const cancel = () => {
                    renameForm.remove();
                    titleElement.classList.remove('hidden');
                    headerActions.classList.remove('hidden');
                    renameButton.focus();
                };
                cancelRename.addEventListener('click', cancel);
                renameInput.addEventListener('keydown', event => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        cancel();
                    }
                });
                renameForm.addEventListener('submit', event => {
                    event.preventDefault();
                    const newTitle = renameInput.value.trim();
                    if (!newTitle) {
                        renameInput.setAttribute('aria-invalid', 'true');
                        renameInput.focus();
                        return;
                    }
                    renameHistoryItem(item.id, newTitle);
                });

                header.insertBefore(renameForm, metadata);
                renameInput.focus();
                renameInput.select();
            });
            headerActions.appendChild(renameButton);
        }

        headerActions.appendChild(deleteButton);
        header.append(titleElement, metadata, headerActions);

        const details = document.createElement('div');
        details.className = 'space-y-2 text-sm text-gray-400 flex-grow';
        details.append(
            createSummaryRow(
                `${isCart ? 'ნივთების ჯამი' : 'ღირებულება'} ($${item.priceUSD.toFixed(2)}):`,
                `${(item.priceUSD * item.rate).toFixed(2)} ₾`
            ),
            createSummaryRow(
                `ტრანსპორტირება (${item.weight.toFixed(2)} kg):`,
                `${item.deliveryGEL.toFixed(2)} ₾`
            )
        );

        if (item.forwarderName) {
            details.append(createSummaryRow('გადამზიდი:', item.forwarderName));
        }

        if (item.taxTotal > 0) {
            const tax = createSummaryRow('განბაჟება + დღგ:', `${item.taxTotal.toFixed(2)} ₾`);
            tax.className = 'flex justify-between gap-3 text-red-400/90 bg-red-900/10 px-2 py-1 rounded border border-red-900/20';
            details.append(tax);
        } else {
            const exempt = document.createElement('div');
            exempt.className = 'text-xs text-right text-brand-lime/50 pt-1';
            exempt.textContent = '*განბაჟების გარეშე';
            details.append(exempt);
        }

        const recalculateButton = document.createElement('button');
        recalculateButton.type = 'button';
        recalculateButton.className = 'rounded-lg border border-brand-border bg-brand-input px-3 py-2 text-sm font-medium text-gray-300 hover:border-brand-lime/40 hover:text-brand-lime transition-colors';
        recalculateButton.textContent = 'მიმდინარე ფასებით გადათვლა';
        recalculateButton.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('calculator:recalculate', { detail: rawItem }));
        });

        const viewInvoiceButton = document.createElement('button');
        viewInvoiceButton.type = 'button';
        viewInvoiceButton.className = 'rounded-lg border border-brand-lime/30 bg-brand-lime/10 px-3 py-2 text-sm font-semibold text-brand-lime hover:bg-brand-lime hover:text-black transition-colors';
        viewInvoiceButton.textContent = 'ინვოისის ნახვა';
        viewInvoiceButton.setAttribute('aria-label', `${item.title} — შენახული ინვოისის ნახვა`);
        viewInvoiceButton.addEventListener('click', event => {
            openHistoryInvoice(rawItem, event.currentTarget);
        });

        const actions = document.createElement('div');
        actions.className = 'mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2';
        actions.append(viewInvoiceButton, recalculateButton);

        const footer = document.createElement('div');
        footer.className = 'mt-4 pt-3 border-t border-brand-border flex justify-between items-center';
        const totalLabel = document.createElement('span');
        totalLabel.className = 'text-xs text-gray-500 font-medium';
        totalLabel.textContent = 'სულ გადასახდელი';
        const totalValue = document.createElement('span');
        totalValue.className = 'text-brand-lime font-bold text-xl';
        totalValue.textContent = `${item.total.toFixed(2)} ₾`;
        footer.append(totalLabel, totalValue);

        card.append(header, details, actions, footer);
        historyContainer.appendChild(card);
    });
}

function saveItemToHistory(data) {
    const history = readHistory();
    history.push(data);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        loadAndRenderHistory();
        return true;
    } catch (error) {
        console.error('Could not save calculation history.', error);
        return false;
    }
}

function renameHistoryItem(id, newTitle) {
    const title = typeof newTitle === 'string' ? newTitle.trim() : '';
    if (!title) return false;

    const history = readHistory();
    const itemIndex = history.findIndex(item => String(item?.id) === String(id));
    if (itemIndex < 0 || history[itemIndex]?.calculationType !== 'cart') return false;

    history[itemIndex] = { ...history[itemIndex], title };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        loadAndRenderHistory();
        return true;
    } catch (error) {
        console.error('Could not rename saved cart.', error);
        return false;
    }
}

function deleteItem(id) {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return;
    const history = readHistory();
    const newHistory = history.filter(item => String(item.id) !== String(id));
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        loadAndRenderHistory();
    } catch (error) {
        console.error('Could not update calculation history.', error);
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeInvoiceDrawer();
        loadAndRenderHistory();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        buildSavedInvoiceModel,
        convertSavedWeightToKg,
        createSavedParcelWeight
    };
}
