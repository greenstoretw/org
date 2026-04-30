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

window.handleShopAction = async function(shopId, action) {
    if (!auth.currentUser) {
        window.showMessage("請先登入後再執行此操作");
        return;
    }
    
    switch(action) {
        case 'favorite':
            window.toggleFavorite(shopId);
            const heart = document.querySelector(`#shop-detail-modal .fill-red-500`) || document.querySelector(`#shop-detail-modal svg[data-action="favorite"]`);
            if (heart) heart.classList.toggle('fill-red-500');
            break;
        case 'rate':
            const rating = prompt("請輸入評價分數 (1-5):", "5");
            if (rating >= 1 && rating <= 5) {
                await db.collection('reviews').add({
                    shopId,
                    userId: auth.currentUser.uid,
                    rating: Number(rating),
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.showMessage("感謝您的評價！");
            }
            break;
        case 'report':
            const reason = prompt("請輸入檢舉原因:");
            if (reason) {
                await db.collection('reports').add({
                    shopId,
                    userId: auth.currentUser.uid,
                    reason,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.showMessage("檢舉已收到，我們將盡快查核。");
            }
            break;
    }
};
