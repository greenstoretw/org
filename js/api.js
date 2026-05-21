// ===== FIREBASE API CALLS =====
window.Gateway.register('fetchShops', function() {
    var loadingOverlay = document.getElementById('app-loading');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    if (window.renderSkeletonCards) window.renderSkeletonCards();
    
    if (typeof db === 'undefined' || !db) { console.error('Firebase DB not initialized'); if (loadingOverlay) loadingOverlay.classList.add('hidden'); return; }
    db.collection('merchants').where('status', '==', 'active').get()
        .then(function(snapshot) {
            window.allShops = snapshot.docs.map(function(doc) { 
                var data = doc.data();
                data.id = doc.id;
                return data;
            });
            
            window.renderFilterButtons();
            window.filterAndDisplayShops();
        })
        .catch(function(error) {
            window.showErrorModal(error, "fetchShops");
        })
        .finally(function() {
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
        });
});

window.Gateway.register('toggleFavorite', function(shopId) {
    var user = auth.currentUser;
    var index = window.favoriteShops.indexOf(shopId);
    
    if (index === -1) {
        window.favoriteShops.push(shopId);
    } else {
        window.favoriteShops.splice(index, 1);
    }

    if (user) {
        db.collection('users').doc(user.uid).set({
            favorites: window.favoriteShops
        }, { merge: true }).catch(function(error) {
            console.error("Sync error:", error);
        });
    } else {
        localStorage.setItem('favoriteShops', JSON.stringify(window.favoriteShops));
    }
    
    if (window.currentFilterCategory === 'favorites') {
        window.filterAndDisplayShops();
    }
});

window.Gateway.register('fetchUserFavorites', function(uid) {
    db.collection('users').doc(uid).get()
        .then(function(doc) {
            if (doc.exists && doc.data().favorites) {
                window.favoriteShops = doc.data().favorites;
                window.filterAndDisplayShops();
            }
        })
        .catch(function(error) {
            console.error("Error fetching favorites:", error);
        });
});

window.Gateway.register('handleShopAction', function(shopId, action) {
    if (!auth.currentUser) {
        window.showMessage("請先登入後再執行此操作");
        return;
    }
    
    var el;
    switch(action) {
        case 'favorite':
            window.toggleFavorite(shopId);
            break;
        case 'rate':
            document.getElementById('rate-shop-id').value = shopId;
            document.getElementById('rate-value').value = '0';
            document.getElementById('rate-comment').value = '';
            
            var starBtns = document.querySelectorAll('.star-btn');
            for (var i = 0; i < starBtns.length; i++) {
                el = starBtns[i];
                el.classList.remove('text-yellow-400');
                el.classList.add('text-slate-300');
                
                (function(btn) {
                    btn.onclick = function() {
                        var val = Number(btn.dataset.value);
                        document.getElementById('rate-value').value = val;
                        var allStars = document.querySelectorAll('.star-btn');
                        for (var j = 0; j < allStars.length; j++) {
                            var b = allStars[j];
                            var bVal = Number(b.dataset.value);
                            if (bVal <= val) {
                                b.classList.add('text-yellow-400');
                                b.classList.remove('text-slate-300');
                            } else {
                                b.classList.remove('text-yellow-400');
                                b.classList.add('text-slate-300');
                            }
                        }
                    };
                })(el);
            }
            document.getElementById('rate-modal').classList.remove('hidden');
            break;
        case 'report':
            document.getElementById('report-shop-id').value = shopId;
            document.getElementById('report-desc').value = '';
            var radioBtns = document.querySelectorAll('input[name="report-reason"]');
            for (var k = 0; k < radioBtns.length; k++) radioBtns[k].checked = false;
            document.getElementById('report-modal').classList.remove('hidden');
            break;
    }
});

window.Gateway.register('calculateCarbonSaving', function(shop) {
    if (shop.carbonSavingPerVisit) return Number(shop.carbonSavingPerVisit);
    
    var type = (shop.type && shop.type['zh-TW']) || '';
    var features = (shop.ecoFeatures || []).join(',');
    
    if (type.indexOf('無包裝') !== -1 || features.indexOf('無包裝') !== -1) return 150;
    if (type.indexOf('蔬食') !== -1 || type.indexOf('素食') !== -1 || features.indexOf('蔬食') !== -1) return 800;
    if (type.indexOf('二手') !== -1 || type.indexOf('循環') !== -1 || features.indexOf('二手') !== -1) return 500;
    
    return 50; 
});

window.Gateway.register('submitRating', function() {
    var shopId = document.getElementById('rate-shop-id').value;
    var rating = Number(document.getElementById('rate-value').value);
    var comment = document.getElementById('rate-comment').value.trim();
    
    if (!rating) { window.showMessage("請選擇評分星數"); return; }
    
    var user = auth.currentUser;
    var shop = null;
    for (var i = 0; i < window.allShops.length; i++) {
        if (window.allShops[i].id === shopId) {
            shop = window.allShops[i];
            break;
        }
    }
    var carbonSaved = window.calculateCarbonSaving(shop || {});

    var batch = db.batch();
    var reviewRef = db.collection('reviews').doc();
    batch.set(reviewRef, {
        shopId: shopId,
        userId: user.uid,
        rating: rating,
        comment: comment || null,
        carbonSaved: carbonSaved,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    var userRef = db.collection('users').doc(user.uid);
    batch.set(userRef, {
        totalCarbonSaved: firebase.firestore.FieldValue.increment(carbonSaved),
        lastActionAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    batch.commit()
        .then(function() {
            document.getElementById('rate-modal').classList.add('hidden');
            window.showMessage("感謝您的評價！您為地球節省了 " + carbonSaved + "g 碳排！🌿");
            if (!document.getElementById('shop-detail-modal').classList.contains('hidden')) {
                window.fetchAndRenderShopReviews(shopId);
            }
        })
        .catch(function(err) {
            window.showErrorModal(err, "submitRating");
        });
});

window.Gateway.register('submitReport', function() {
    var shopId = document.getElementById('report-shop-id').value;
    var reasonEl = document.querySelector('input[name="report-reason"]:checked');
    var desc = document.getElementById('report-desc').value.trim();
    
    if (!reasonEl) { window.showMessage("請選擇檢舉原因"); return; }
    
    db.collection('reports').add({
        shopId: shopId,
        userId: auth.currentUser.uid,
        reason: reasonEl.value,
        description: desc || null,
        status: 'pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        document.getElementById('report-modal').classList.add('hidden');
        window.showMessage("檢舉已收到，我們將盡快查核。");
    })
    .catch(function(err) {
        window.showErrorModal(err, "submitReport");
    });
});

window.Gateway.register('submitCheckIn', function(shopId, shopName, userName, carbonSaved, base64Receipt, recordId, simulated) {
    var user = auth.currentUser;
    if (!user) {
        return Promise.reject(new Error("用戶未登入"));
    }
    
    var batch = db.batch();
    var checkinRef = db.collection('checkins').doc();
    batch.set(checkinRef, {
        userId: user.uid,
        userName: userName || 'Anonymous',
        shopId: shopId,
        shopName: shopName || 'Green Store',
        carbonSaved: carbonSaved,
        base64Receipt: base64Receipt,
        recordId: recordId,
        simulated: !!simulated,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    var userRef = db.collection('users').doc(user.uid);
    batch.set(userRef, {
        totalCarbonSaved: firebase.firestore.FieldValue.increment(carbonSaved),
        checkinCount: firebase.firestore.FieldValue.increment(1),
        lastActionAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return batch.commit();
});

window.Gateway.register('fetchUserCheckins', function(uid) {
    return db.collection('checkins')
        .where('userId', '==', uid)
        .orderBy('timestamp', 'desc')
        .get();
});


