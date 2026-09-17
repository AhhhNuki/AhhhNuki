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
            forwarderName: typeof rawItem?.forwarderName === 'string' ? rawItem.forwarderName : ''
        };

        const card = document.createElement('div');
        card.className = 'bg-brand-card border border-brand-border rounded-xl p-5 relative group hover:border-brand-lime/30 transition-all flex flex-col h-full';

        const header = document.createElement('div');
        header.className = 'mb-3 border-b border-brand-border pb-2';

        const titleElement = document.createElement(item.url ? 'a' : 'h4');
        titleElement.className = 'text-white font-bold text-lg hover:text-brand-lime hover:underline truncate block mr-6';
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

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'absolute top-5 right-4 text-gray-600 hover:text-red-500 transition-colors';
        deleteButton.setAttribute('aria-label', `${item.title} — წაშლა`);
        deleteButton.innerHTML = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
        deleteButton.addEventListener('click', () => deleteItem(item.id));

        header.append(titleElement, metadata, deleteButton);

        const details = document.createElement('div');
        details.className = 'space-y-2 text-sm text-gray-400 flex-grow';
        details.append(
            createSummaryRow(
                `ღირებულება ($${item.priceUSD.toFixed(2)}):`,
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

        const footer = document.createElement('div');
        footer.className = 'mt-4 pt-3 border-t border-brand-border flex justify-between items-center';
        const totalLabel = document.createElement('span');
        totalLabel.className = 'text-xs text-gray-500 font-medium';
        totalLabel.textContent = 'სულ გადასახდელი';
        const totalValue = document.createElement('span');
        totalValue.className = 'text-brand-lime font-bold text-xl';
        totalValue.textContent = `${item.total.toFixed(2)} ₾`;
        footer.append(totalLabel, totalValue);

        card.append(header, details, footer);
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

document.addEventListener('DOMContentLoaded', loadAndRenderHistory);
