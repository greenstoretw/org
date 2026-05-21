// ===== GREENROOF UI MODULE: DASHBOARD =====
// This file is modularly extracted and registered with the Gateway router.
// Compatibility is maintained globally via window.Gateway.

window.Gateway.register('showUserDashboard', function() {
    var user = auth.currentUser;
    if (!user) return;

    var favContainer = document.getElementById('dashboard-favorites');
    var revContainer = document.getElementById('dashboard-reviews');
    var repContainer = document.getElementById('dashboard-reports');
    if (favContainer) favContainer.innerHTML = '載入中...';
    if (revContainer) revContainer.innerHTML = '載入中...';
    if (repContainer) repContainer.innerHTML = '載入中...';

    db.collection('users').doc(user.uid).get().then(function(userDoc) {
        var userData = userDoc.exists ? userDoc.data() : {};
        var totalGrams = userData.totalCarbonSaved || 0;
        var totalKg = (totalGrams / 1000).toFixed(2);
        
        var carbonSavedEl = document.getElementById('dashboard-carbon-saved');
        var treesEl = document.getElementById('dashboard-trees-equivalent');
        var bagsEl = document.getElementById('dashboard-bags-equivalent');
        var carbonTextEl = document.getElementById('dashboard-carbon-text');
        
        if (carbonSavedEl) carbonSavedEl.textContent = totalKg;
        if (treesEl) treesEl.textContent = (totalKg / 12).toFixed(1);
        if (bagsEl) bagsEl.textContent = Math.floor(totalGrams / 50);
        
        if (carbonTextEl) {
            if (totalGrams > 5000) carbonTextEl.textContent = "太棒了！您已經是永續生活的模範！";
            else if (totalGrams > 1000) carbonTextEl.textContent = "繼續保持！您對地球的貢獻正逐漸累積。";
            else carbonTextEl.textContent = "您正在為地球帶來正向改變！";
        }

        var favShops = (window.allShops || []).filter(function(s) { 
            return (window.favoriteShops || []).indexOf(s.id) !== -1; 
        });
        if (favContainer) {
            favContainer.innerHTML = favShops.map(function(s) { 
                return '<div class="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-red-200 transition"><div class="font-bold text-gray-800">' + ((s.name && s.name['zh-TW']) || '未知商家') + '</div><button onclick="window.showShopDetail(\'' + s.id + '\')" class="text-xs text-red-500 mt-2 flex items-center gap-1"><i class="fa-solid fa-arrow-up-right-from-square"></i> 查看詳情</button></div>';
            }).join('') || '<p class="text-gray-400 text-sm">尚無收藏</p>';
        }

        return db.collection('reviews').where('userId', '==', user.uid).orderBy('timestamp', 'desc').get();
    }).then(function(revSnap) {
        var reviewsCount = revSnap.size;
        
        // Calculate and Render achievements dynamically
        db.collection('users').doc(user.uid).get().then(function(uDoc) {
            var uData = uDoc.exists ? uDoc.data() : {};
            var checkinCount = uData.checkinCount || 0;
            var totalCarbon = uData.totalCarbonSaved || 0;
            var favoritesCount = (window.favoriteShops || []).length;
            var unlockedBadges = uData.achievements || [];
            
            var achievements = [
                { id: 'plastic_free_explorer', name: '無塑探險家', desc: '收藏 5 間永續商店', icon: '🍃', condition: '收藏 ' + favoritesCount + '/5' },
                { id: 'green_critic', name: '綠色評論家', desc: '發表 3 次綠色評價', icon: '✍️', condition: '評價 ' + reviewsCount + '/3' },
                { id: 'carbon_shield', name: '碳減防護盾', desc: '累積減碳 1000g', icon: '🛡️', condition: '減碳 ' + totalCarbon + '/1000g' },
                { id: 'checkin_pro', name: '綠色簽到達人', desc: '累積簽到打卡 3 次', icon: '📍', condition: '簽到 ' + checkinCount + '/3' }
            ];
            
            var achContainer = document.getElementById('dashboard-achievements');
            if (achContainer) {
                achContainer.innerHTML = achievements.map(function(badge) {
                    var isUnlocked = unlockedBadges.indexOf(badge.id) !== -1;
                    var activeClass = isUnlocked ? 'border-green-600 bg-green-50/50 dark:bg-emerald-950/20 badge-glow' : 'border-slate-200 bg-slate-100 dark:bg-slate-800 dark:border-slate-700 opacity-50 badge-locked';
                    var lockIcon = isUnlocked ? '' : ' <i class="fa-solid fa-lock text-xs text-slate-400"></i>';
                    return '<div class="p-4 border-2 flex flex-col items-center text-center relative transition-all duration-300 hover:scale-105 ' + activeClass + '" style="border-radius:0!important">' +
                           '<div class="text-3xl mb-2">' + badge.icon + '</div>' +
                           '<h5 class="font-bold text-xs text-slate-800 dark:text-slate-200">' + badge.name + lockIcon + '</h5>' +
                           '<p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">' + badge.desc + '</p>' +
                           '<span class="text-[9px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mt-3" style="border-radius:0!important">' + badge.condition + '</span>' +
                           '</div>';
                }).join('');
            }
            
            // Also update the Virtual Forest visual 🌱
            var forestVisual = document.getElementById('virtual-forest-visual');
            var forestProgress = document.getElementById('virtual-forest-progress');
            if (forestVisual && forestProgress) {
                // Determine stage based on check-ins and reviews count
                var totalActions = checkinCount + reviewsCount;
                var stageEmoji = '🌱';
                var widthPct = Math.min(100, Math.max(10, totalActions * 10));
                
                if (totalActions >= 10) stageEmoji = '🌳';
                else if (totalActions >= 6) stageEmoji = '🌿';
                else if (totalActions >= 3) stageEmoji = '☘️';
                else if (totalActions >= 1) stageEmoji = '🌱';
                else stageEmoji = '🌰';
                
                forestVisual.textContent = stageEmoji;
                forestProgress.style.width = widthPct + '%';
            }
        }).catch(function(e) {
            console.error("Error building achievements stage:", e);
        });
        
        // Fetch and Render User Check-in Receipts
        if (window.fetchUserCheckins) {
            window.fetchUserCheckins(user.uid).then(function(checkinsSnap) {
                var receiptsContainer = document.getElementById('dashboard-receipts');
                if (receiptsContainer) {
                    if (checkinsSnap.empty) {
                        receiptsContainer.innerHTML = '<p class="col-span-2 sm:col-span-4 text-center text-slate-400 text-sm py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" style="border-radius:0!important">目前尚無打卡憑證</p>';
                        return;
                    }
                    
                    receiptsContainer.innerHTML = checkinsSnap.docs.map(function(doc) {
                        var c = doc.data();
                        var dateStr = '—';
                        if (c.timestamp) {
                            if (c.timestamp.toDate) dateStr = c.timestamp.toDate().toLocaleDateString();
                            else dateStr = new Date(c.timestamp).toLocaleDateString();
                        }
                        var simulatedLabel = c.simulated ? ' <span class="text-[8px] bg-yellow-100 text-yellow-800 px-1 font-bold">模擬</span>' : '';
                        return '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 cursor-pointer shadow-sm hover:shadow-md transition flex flex-col items-center relative group" style="border-radius:0!important" onclick="window.previewUserReceipt(\'' + doc.id + '\')">' +
                               '<div class="w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">' +
                               '<img src="' + c.base64Receipt + '" class="w-full h-auto transition-transform duration-300 group-hover:scale-105" alt="憑證">' +
                               '<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold"><i class="fa-solid fa-magnifying-glass-plus mr-1"></i>放大檢視</div>' +
                               '</div>' +
                               '<span class="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-bold flex items-center gap-1">' + dateStr + simulatedLabel + '</span>' +
                               '</div>';
                    }).join('');
                    
                    window.userCheckinsMap = {};
                    checkinsSnap.docs.forEach(function(doc) {
                        window.userCheckinsMap[doc.id] = doc.data();
                    });
                }
            }).catch(function(err) {
                console.error("fetchUserCheckins error:", err);
            });
        }

        var reviewsHtml = revSnap.docs.map(function(doc) {
            var r = doc.data();
            var s = (window.allShops || []).find(function(shop) { return shop.id === r.shopId; });
            var date = r.timestamp ? r.timestamp.toDate().toLocaleDateString() : '剛剛';
            var carbonInfo = r.carbonSaved ? '<span class="text-[10px] text-green-600 font-bold">🌿 -' + r.carbonSaved + 'g</span>' : '';
            return '<div class="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"><div class="flex justify-between items-center mb-1"><span class="font-bold text-gray-800">' + (s ? s.name['zh-TW'] : '未知商家') + '</span><span class="text-yellow-500 text-sm font-bold">★ ' + r.rating + '</span></div><div class="flex justify-between items-center mt-1"><p class="text-xs text-gray-400">' + date + '</p>' + carbonInfo + '</div></div>';
        }).join('') || '<p class="text-gray-400 text-sm">尚無評價</p>';
        if (revContainer) revContainer.innerHTML = reviewsHtml;

        return db.collection('reports').where('userId', '==', user.uid).orderBy('timestamp', 'desc').get();
    }).then(function(repSnap) {
        var reportsHtml = repSnap.docs.map(function(doc) {
            var r = doc.data();
            var s = (window.allShops || []).find(function(shop) { return shop.id === r.shopId; });
            var statusLabel = (r.status === 'resolved' ? '已處理' : '處理中');
            return '<div class="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"><div class="flex justify-between items-start"><span class="font-bold text-gray-800">' + (s ? s.name['zh-TW'] : '未知商家') + '</span><span class="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">' + statusLabel + '</span></div><p class="text-xs text-gray-600 mt-2">原因：' + r.reason + '</p></div>';
        }).join('') || '<p class="text-gray-400 text-sm">尚無檢舉紀錄</p>';
        if (repContainer) repContainer.innerHTML = reportsHtml;

        document.getElementById('user-dashboard-modal').classList.remove('hidden');
        
        setTimeout(function() {
            var mapContainer = document.getElementById('dashboard-footprint-map');
            if (!mapContainer) return;
            if (window.footprintMap) window.footprintMap.remove();
            
            window.footprintMap = L.map('dashboard-footprint-map').setView([23.6978, 120.9605], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.footprintMap);
            var footprintMarkers = L.featureGroup().addTo(window.footprintMap);
            
            var revIds = revSnap.docs.map(function(doc) { return doc.data().shopId; });
            var combinedIds = (window.favoriteShops || []).concat(revIds);
            var uniqueIds = [];
            combinedIds.forEach(function(id) { if (uniqueIds.indexOf(id) === -1) uniqueIds.push(id); });
            
            var footprintShops = window.allShops.filter(function(s) { return uniqueIds.indexOf(s.id) !== -1 && s.location; });
            
            footprintShops.forEach(function(shop) {
                var isFav = window.favoriteShops.indexOf(shop.id) !== -1;
                var isRev = revIds.indexOf(shop.id) !== -1;
                var iconColor = (isFav && isRev) ? 'purple' : (isFav ? 'red' : 'blue');
                
                var markerHtml = '<div style="background-color: ' + iconColor + '; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>';
                var customIcon = L.divIcon({ html: markerHtml, className: 'custom-footprint-icon', iconSize: [12, 12] });
                
                L.marker([shop.location.latitude, shop.location.longitude], { icon: customIcon })
                    .bindPopup('<div class="text-sm font-bold">' + (shop.name && shop.name['zh-TW']) + '</div>')
                    .addTo(footprintMarkers);
            });
            
            if (footprintShops.length > 0) {
                window.footprintMap.fitBounds(footprintMarkers.getBounds(), { padding: [30, 30], maxZoom: 14 });
            }
        }, 300);
    }).catch(function(error) {
        window.showErrorModal(error, "showUserDashboard");
    });
});

window.Gateway.register('checkAndUnlockBadges', function() {
    var user = auth.currentUser;
    if (!user) return;
    
    var favoritesCount = (window.favoriteShops || []).length;
    
    var p1 = db.collection('reviews').where('userId', '==', user.uid).get();
    var p2 = db.collection('checkins').where('userId', '==', user.uid).get();
    var p3 = db.collection('users').doc(user.uid).get();
    
    Promise.all([p1, p2, p3]).then(function(results) {
        var reviewsCount = results[0].size;
        var checkinCount = results[1].size;
        
        var userData = results[2].exists ? results[2].data() : {};
        var totalCarbon = userData.totalCarbonSaved || 0;
        var unlockedBadges = userData.achievements || [];
        
        var badgesToUnlock = [];
        
        if (favoritesCount >= 5 && unlockedBadges.indexOf('plastic_free_explorer') === -1) {
            badgesToUnlock.push('plastic_free_explorer');
        }
        if (reviewsCount >= 3 && unlockedBadges.indexOf('green_critic') === -1) {
            badgesToUnlock.push('green_critic');
        }
        if (totalCarbon >= 1000 && unlockedBadges.indexOf('carbon_shield') === -1) {
            badgesToUnlock.push('carbon_shield');
        }
        if (checkinCount >= 3 && unlockedBadges.indexOf('checkin_pro') === -1) {
            badgesToUnlock.push('checkin_pro');
        }
        
        if (badgesToUnlock.length > 0) {
            var newUnlocked = unlockedBadges.concat(badgesToUnlock);
            db.collection('users').doc(user.uid).set({
                achievements: newUnlocked
            }, { merge: true }).then(function() {
                badgesToUnlock.forEach(function(badgeId) {
                    var badgeName = '';
                    if (badgeId === 'plastic_free_explorer') badgeName = '【無塑探險家 🍃】';
                    else if (badgeId === 'green_critic') badgeName = '【綠色評論家 ✍️】';
                    else if (badgeId === 'carbon_shield') badgeName = '【碳減防護盾 🛡️】';
                    else if (badgeId === 'checkin_pro') badgeName = '【綠色簽到達人 📍】';
                    
                    setTimeout(function() {
                        window.triggerConfetti();
                        alert('🎉 恭喜解鎖全新綠色成就：' + badgeName + '\n您可在個人儀表板中查看徽章！');
                    }, 500);
                });
            }).catch(function(e) {
                console.error("Error unlocking badge sync:", e);
            });
        }
    }).catch(function(err) {
        console.error("Error checking badge requirements:", err);
    });
});

window.Gateway.register('previewUserReceipt', function(docId) {
    var data = window.userCheckinsMap && window.userCheckinsMap[docId];
    if (!data) return;
    
    var modal = document.getElementById('receipt-preview-modal');
    var img = document.getElementById('receipt-preview-img');
    var downloadBtn = document.getElementById('receipt-download-btn');
    
    if (img && data.base64Receipt) {
        img.src = data.base64Receipt;
    }
    if (downloadBtn && data.base64Receipt) {
        downloadBtn.href = data.base64Receipt;
        downloadBtn.download = 'Green-Eaves-Receipt-' + (data.recordId || docId) + '.png';
    }
    if (modal) {
        modal.classList.remove('hidden');
    }
});
