const STORAGE_KEY = 'calc_history_v2';

function loadAndRenderHistory() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    historyContainer.innerHTML = '';

    if (history.length === 0) {
        historyContainer.innerHTML = `<div class="text-center text-gray-600 col-span-full py-8">ისტორია ცარიელია</div>`;
        return;
    }

    history.slice().reverse().forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-brand-card border border-brand-border rounded-xl p-5 relative group hover:border-brand-lime/30 transition-all flex flex-col h-full';
        
        // Link logic
        const titleHtml = item.url 
            ? `<a href="${item.url}" target="_blank" class="text-white font-bold text-lg hover:text-brand-lime hover:underline truncate block mr-6">${item.title} 🔗</a>`
            : `<h4 class="text-white font-bold text-lg truncate mr-6">${item.title}</h4>`;

        // Check if there was tax
        const hasTax = parseFloat(item.taxTotal) > 0;

        card.innerHTML = `
            <div class="mb-3 border-b border-brand-border pb-2">
                ${titleHtml}
                <div class="flex justify-between items-center mt-1">
                    <p class="text-xs text-brand-text-muted">${item.date}</p>
                    
                    <span class="text-[10px] text-gray-500 bg-gray-900/50 border border-brand-border px-2 py-1 rounded">
                        კურსი: ${item.rate}
                    </span>
                </div>
                <button onclick="deleteItem(${item.id})" class="absolute top-5 right-4 text-gray-600 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>
            
            <div class="space-y-2 text-sm text-gray-400 flex-grow">
                <div class="flex justify-between">
                    <span>ღირებულება ($${item.priceUSD}):</span>
                    <span class="text-gray-200">${(item.priceUSD * item.rate).toFixed(2)} ₾</span>
                </div>
                <div class="flex justify-between">
                    <span>ტრანსპორტირება (${item.weight} kg):</span>
                    <span class="text-gray-200">${item.deliveryGEL} ₾</span>
                </div>
                
                ${hasTax ? `
                <div class="flex justify-between text-red-400/90 bg-red-900/10 px-2 py-1 rounded border border-red-900/20">
                    <span>განბაჟება + დღგ:</span>
                    <span>${item.taxTotal} ₾</span>
                </div>
                ` : `
                <div class="text-xs text-right text-brand-lime/50 pt-1">
                    *განბაჟების გარეშე
                </div>
                `}
            </div>

            <div class="mt-4 pt-3 border-t border-brand-border flex justify-between items-center">
                <span class="text-xs text-gray-500 font-medium">სულ გადასახდელი</span>
                <span class="text-brand-lime font-bold text-xl">${item.total} ₾</span>
            </div>
        `;
        historyContainer.appendChild(card);
    });
}

function saveItemToHistory(data) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    history.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    loadAndRenderHistory();
}

function deleteItem(id) {
    if(!confirm('ნამდვილად გსურთ წაშლა?')) return;
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    loadAndRenderHistory();
}

document.addEventListener('DOMContentLoaded', loadAndRenderHistory);