// ===== FIREBASE API CALLS =====
window.fetchShops = async function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    try {
        const snapshot = await db.collection('merchants').where('status', '==', 'active').get();
        window.allShops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        window.renderFilterButtons();
        window.filterAndDisplayShops();
    } catch (error) {
        window.showErrorModal(error, "fetchShops");
    } finally {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
};

window.toggleFavorite = async function(shopId) {
    const user = auth.currentUser;
    const index = window.favoriteShops.indexOf(shopId);
    
    if (index === -1) {
        window.favoriteShops.push(shopId);
    } else {
        window.favoriteShops.splice(index, 1);
    }

    if (user) {
        try {
            await db.collection('users').doc(user.uid).set({
                favorites: window.favoriteShops
            }, { merge: true });
        } catch (error) {
            console.error("Sync error:", error);
        }
    } else {
        localStorage.setItem('favoriteShops', JSON.stringify(window.favoriteShops));
    }
    
    // Only re-render if we are currently filtering by favorites, 
    // otherwise the optimistic UI already handled the icon toggle.
    if (window.currentFilterCategory === 'favorites') {
        window.filterAndDisplayShops();
    }
};

window.fetchUserFavorites = async function(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists && doc.data().favorites) {
            favoriteShops = doc.data().favorites;
            window.filterAndDisplayShops();
        }
    } catch (error) {
        console.error("Error fetching favorites:", error);
    }
};

window.handleShopAction = function(shopId, action) {
    if (!auth.currentUser) {
        window.showMessage("請先登入後再執行此操作");
        return;
    }
    
    switch(action) {
        case 'favorite':
            window.toggleFavorite(shopId);
            break;
        case 'rate':
            // Open rate modal
            document.getElementById('rate-shop-id').value = shopId;
            document.getElementById('rate-value').value = '0';
            document.getElementById('rate-comment').value = '';
            document.querySelectorAll('.star-btn').forEach(b => b.classList.replace('text-yellow-400', 'text-slate-300'));
            // Setup star interaction
            document.querySelectorAll('.star-btn').forEach(btn => {
                btn.onclick = () => {
                    const val = Number(btn.dataset.value);
                    document.getElementById('rate-value').value = val;
                    document.querySelectorAll('.star-btn').forEach(b => {
                        b.classList.toggle('text-yellow-400', Number(b.dataset.value) <= val);
                        b.classList.toggle('text-slate-300', Number(b.dataset.value) > val);
                    });
                };
            });
            document.getElementById('rate-modal').classList.remove('hidden');
            break;
        case 'report':
            document.getElementById('report-shop-id').value = shopId;
            document.getElementById('report-desc').value = '';
            document.querySelectorAll('input[name="report-reason"]').forEach(r => r.checked = false);
            document.getElementById('report-modal').classList.remove('hidden');
            break;
    }
};

window.submitRating = async function() {
    const shopId = document.getElementById('rate-shop-id').value;
    const rating = Number(document.getElementById('rate-value').value);
    const comment = document.getElementById('rate-comment').value.trim();
    
    if (!rating) { window.showMessage("請選擇評分星數"); return; }
    
    try {
        await db.collection('reviews').add({
            shopId,
            userId: auth.currentUser.uid,
            rating,
            comment: comment || null,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('rate-modal').classList.add('hidden');
        window.showMessage("感謝您的評價！");
        // Refresh reviews if detail modal is open
        if (!document.getElementById('shop-detail-modal').classList.contains('hidden')) {
            fetchAndRenderShopReviews(shopId);
        }
    } catch(err) {
        window.showErrorModal(err, "submitRating");
    }
};

window.submitReport = async function() {
    const shopId = document.getElementById('report-shop-id').value;
    const reasonEl = document.querySelector('input[name="report-reason"]:checked');
    const desc = document.getElementById('report-desc').value.trim();
    
    if (!reasonEl) { window.showMessage("請選擇檢舉原因"); return; }
    
    try {
        await db.collection('reports').add({
            shopId,
            userId: auth.currentUser.uid,
            reason: reasonEl.value,
            description: desc || null,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('report-modal').classList.add('hidden');
        window.showMessage("檢舉已收到，我們將盡快查核。");
    } catch(err) {
        window.showErrorModal(err, "submitReport");
    }
};
