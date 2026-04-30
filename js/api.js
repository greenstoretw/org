// ===== FIREBASE API CALLS =====
window.fetchShops = async function() {
    var loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    try {
        var snapshot = await db.collection('merchants').where('status', '==', 'active').get();
        window.allShops = snapshot.docs.map(function(doc) { 
            var data = doc.data();
            data.id = doc.id;
            return data;
        });
        
        window.renderFilterButtons();
        window.filterAndDisplayShops();
    } catch (error) {
        window.showErrorModal(error, "fetchShops");
    } finally {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
};

window.toggleFavorite = async function(shopId) {
    var user = auth.currentUser;
    var index = window.favoriteShops.indexOf(shopId);
    
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
    
    if (window.currentFilterCategory === 'favorites') {
        window.filterAndDisplayShops();
    }
};

window.fetchUserFavorites = async function(uid) {
    try {
        var doc = await db.collection('users').doc(uid).get();
        if (doc.exists && doc.data().favorites) {
            window.favoriteShops = doc.data().favorites;
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
            document.getElementById('rate-shop-id').value = shopId;
            document.getElementById('rate-value').value = '0';
            document.getElementById('rate-comment').value = '';
            document.querySelectorAll('.star-btn').forEach(function(b) { b.classList.replace('text-yellow-400', 'text-slate-300'); });
            
            document.querySelectorAll('.star-btn').forEach(function(btn) {
                btn.onclick = function() {
                    var val = Number(btn.dataset.value);
                    document.getElementById('rate-value').value = val;
                    document.querySelectorAll('.star-btn').forEach(function(b) {
                        var bVal = Number(b.dataset.value);
                        if (bVal <= val) {
                            b.classList.add('text-yellow-400');
                            b.classList.remove('text-slate-300');
                        } else {
                            b.classList.remove('text-yellow-400');
                            b.classList.add('text-slate-300');
                        }
                    });
                };
            });
            document.getElementById('rate-modal').classList.remove('hidden');
            break;
        case 'report':
            document.getElementById('report-shop-id').value = shopId;
            document.getElementById('report-desc').value = '';
            document.querySelectorAll('input[name="report-reason"]').forEach(function(r) { r.checked = false; });
            document.getElementById('report-modal').classList.remove('hidden');
            break;
    }
};

window.submitRating = async function() {
    var shopId = document.getElementById('rate-shop-id').value;
    var rating = Number(document.getElementById('rate-value').value);
    var comment = document.getElementById('rate-comment').value.trim();
    
    if (!rating) { window.showMessage("請選擇評分星數"); return; }
    
    try {
        await db.collection('reviews').add({
            shopId: shopId,
            userId: auth.currentUser.uid,
            rating: rating,
            comment: comment || null,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('rate-modal').classList.add('hidden');
        window.showMessage("感謝您的評價！");
        if (!document.getElementById('shop-detail-modal').classList.contains('hidden')) {
            window.fetchAndRenderShopReviews(shopId);
        }
    } catch(err) {
        window.showErrorModal(err, "submitRating");
    }
};

window.submitReport = async function() {
    var shopId = document.getElementById('report-shop-id').value;
    var reasonEl = document.querySelector('input[name="report-reason"]:checked');
    var desc = document.getElementById('report-desc').value.trim();
    
    if (!reasonEl) { window.showMessage("請選擇檢舉原因"); return; }
    
    try {
        await db.collection('reports').add({
            shopId: shopId,
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
