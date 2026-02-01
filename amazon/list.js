// Key for LocalStorage
const STORAGE_KEY = 'calc_history_v1';

/**
 * Loads items from storage and renders them to the list container
 */
function loadAndRenderHistory() {
    const historyContainer = document.getElementById('history-list');
    if (!historyContainer) return;

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    // Clear current list
    historyContainer.innerHTML = '';

    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                ისტორია ცარიელია
            </div>
        `;
        return;
    }

    // Render items (Newest first)
    history.slice().reverse().forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-brand-card border border-brand-border rounded-xl p-4 mb-4 relative group transition-all hover:border-brand-lime/30';
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h4 class="text-white font-bold text-lg">${item.title || 'Untitled Item'}</h4>
                    <p class="text-xs text-brand-text-muted">${item.date}</p>
                </div>
                <button onclick="deleteItem(${item.id})" class="text-gray-600 hover:text-red-500 transition-colors p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                    <span class="text-gray-500 block text-xs">ფასი (USD)</span>
                    <span class="text-gray-300">$${item.priceUSD}</span>
                </div>
                <div>
                    <span class="text-gray-500 block text-xs">წონა</span>
                    <span class="text-gray-300">${item.weight} ${item.unit}</span>
                </div>
                <div>
                    <span class="text-gray-500 block text-xs">ტრანსპორტირება</span>
                    <span class="text-gray-300">${item.deliveryGEL} ₾</span>
                </div>
                <div>
                    <span class="text-gray-500 block text-xs">დღგ + გადასახადები</span>
                    <span class="text-gray-300">${item.taxTotal} ₾</span>
                </div>
            </div>

            <div class="mt-4 pt-3 border-t border-brand-border flex justify-between items-center">
                <span class="text-xs text-gray-500">კურსი: ${item.rate}</span>
                <span class="text-brand-lime font-bold text-xl">${item.total} ₾</span>
            </div>
        `;
        historyContainer.appendChild(card);
    });
}

/**
 * Save a new item to LocalStorage
 */
function saveItemToHistory(data) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Add new item
    history.push(data);
    
    // Save back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    // Refresh list
    loadAndRenderHistory();
}

/**
 * Delete an item by ID
 */
function deleteItem(id) {
    if(!confirm('ნამდვილად გსურთ წაშლა?')) return;

    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newHistory = history.filter(item => item.id !== id);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    loadAndRenderHistory();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadAndRenderHistory);