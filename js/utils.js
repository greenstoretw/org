// ===== UTILS & UI HELPERS =====
window.showMessage = function(msg) {
    const modal = document.getElementById('message-modal');
    const text = document.getElementById('message-modal-text');
    if (text) text.textContent = msg;
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('hidden'), 3000);
    }
};

window.showErrorModal = function(error, context) {
    console.error(`Error in ${context}:`, error);
    const modal = document.getElementById('error-modal');
    const details = document.getElementById('error-details');
    if (details) details.textContent = `[${context}] ${error.message || error}`;
    if (modal) modal.classList.remove('hidden');
};

window.formatTime = function(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${minutes}:${secs.toString().padStart(2, '0')}`;
};
