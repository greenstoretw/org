// ===== GREENROOF UI MODULE: MODAL =====
// This file is modularly extracted and registered with the Gateway router.
// Compatibility is maintained globally via window.Gateway.

window.Gateway.register('showShopDetail', function(shopId) {
    var shop = window.allShops.find(function(s) { return s.id === shopId; });
    if (!shop) return;

    var name = escapeHtml((shop.name && shop.name[window.currentLang]) || (shop.name && shop.name['zh-TW']) || '');
    var type = escapeHtml((shop.type && shop.type[window.currentLang]) || (shop.type && shop.type['zh-TW']) || '');
    var addr = escapeHtml((shop.address && shop.address[window.currentLang]) || (shop.address && shop.address['zh-TW']) || '');
    var desc = escapeHtml((shop.description && shop.description[window.currentLang]) || (shop.description && shop.description['zh-TW']) || '');
    var isFavorited = window.favoriteShops.indexOf(shop.id) !== -1;
    
    var shopBranches = window.allShops.filter(function(b) { return b.isBranch && b.parentId === shop.id; });

    var container = document.getElementById('shop-detail-container');
    var html = '<div class="relative"><div class="h-64 md:h-96 bg-slate-100 flex items-center justify-center overflow-hidden">';
    if (shop.imageUrl) {
        html += '<img src="' + shop.imageUrl + '" class="w-full h-full object-cover" alt="' + name + '" loading="lazy" onerror="this.onerror=null; this.src=\'\';">';
    } else {
        html += '<div class="flex items-center justify-center h-full opacity-20"><svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>';
    }
    html += '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40"></div>';
    html += '<div class="absolute bottom-6 left-8"><span class="text-xs font-bold text-white uppercase tracking-widest bg-black/30 backdrop-blur-md px-3 py-1 inline-block shadow-lg">實景街景瀏覽 Street View</span></div></div>';
    html += '<button class="close-modal-btn absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 transition z-[1010] cursor-pointer rounded-full" aria-label="關閉視窗"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>';
    
    html += '<div class="p-5 md:p-8"><div class="flex flex-col md:flex-row justify-between items-start mb-6 gap-4"><div><div class="flex items-center gap-2 mb-2">';
    html += '<span class="tag px-3 py-1 text-sm font-medium inline-block">' + type + '</span>';
    if (shop.verified) html += '<span class="tag px-2 py-1 text-[10px] bg-blue-50 text-blue-600 border-blue-200" title="官方審核認證"><i class="fa-solid fa-circle-check"></i> 官方認證</span>';
    if (shop.isPartner) html += '<span class="tag px-2 py-1 text-[10px] bg-yellow-50 text-yellow-600 border-yellow-200" title="合作店家"><i class="fa-solid fa-handshake"></i> 合作店家</span>';
    
    var isOpen = window.isOpenNow && window.isOpenNow(shop.openingHours);
    html += '<span class="px-2 py-1 text-[10px] font-bold rounded-full ' + (isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500') + '">';
    html += '<span class="inline-block w-1.5 h-1.5 rounded-full ' + (isOpen ? 'bg-green-500' : 'bg-gray-400') + ' mr-1"></span>' + (isOpen ? '營業中' : '休息中') + '</span></div>';
    
    html += '<h2 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">' + name + '</h2>';
    html += '<div class="mt-2 flex items-center gap-2"><span class="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-bold">🌿 預估可省 ' + window.calculateCarbonSaving(shop) + 'g 碳排</span></div>';
    
    html += '<div class="mt-4 flex flex-wrap gap-2">';
    html += '<button onclick="window.handleCheckIn(\'' + shop.id + '\')" class="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 text-xs transition uppercase tracking-wider flex items-center gap-2" style="border-radius:0!important"><i class="fa-solid fa-location-dot"></i> 打卡簽到</button>';
    var inRoute = window.activeRoutingList.indexOf(shop.id) !== -1;
    var routeBtnText = inRoute ? '✓ 已在散步路線中' : '+ 加入散步路線';
    var routeBtnClass = inRoute ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
    html += '<button id="detail-route-btn" onclick="window.toggleRoutingShop(\'' + shop.id + '\')" class="font-bold px-6 py-2.5 text-xs transition uppercase tracking-wider flex items-center gap-2 ' + routeBtnClass + '" style="border-radius:0!important"><i class="fa-solid fa-route"></i> ' + routeBtnText + '</button>';
    html += '</div></div>';
    
    html += '<div class="flex gap-2 w-full md:w-auto">';
    var favClass = isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover:text-red-500';
    html += '<button onclick="window.handleShopAction(\'' + shop.id + '\', \'favorite\')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-red-500 hover:bg-red-50 transition group flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ' + favClass + '" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>';
    html += '<button onclick="window.handleShopAction(\'' + shop.id + '\', \'rate\')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-yellow-500 hover:bg-yellow-50 transition group flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400 group-hover:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg></button>';
    html += '<button onclick="window.handleShopAction(\'' + shop.id + '\', \'report\')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition group flex justify-center" aria-label="檢舉錯誤"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></button>';
    html += '<button onclick="window.shareShop(\'' + shop.id + '\')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition group flex justify-center" aria-label="分享商店"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button></div></div>';
    
    html += '<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12"><div class="lg:col-span-2"><h4 class="text-xl font-bold mb-4 border-l-4 border-green-600 pl-3">關於品牌</h4>';
    html += '<p class="text-slate-700 leading-relaxed mb-8 text-sm md:text-base">' + desc + '</p>';
    html += '<div class="bg-slate-50 p-5 md:p-6 border border-slate-200 mb-8"><h4 class="text-green-800 font-bold mb-4 flex items-center gap-2"><i class="fa-solid fa-leaf"></i> 永續特點</h4><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-green-700">';
    var ecoList = (shop.ecoFeatures && shop.ecoFeatures.length > 0) ? shop.ecoFeatures.map(function(f) { return '<div class="flex items-center gap-2">✓ ' + f + '</div>'; }).join('') : '暫無詳細資料';
    html += ecoList + '</div></div>';
    
    if (shopBranches.length > 0) {
        html += '<div class="mt-8"><h4 class="text-xl font-bold mb-4 border-l-4 border-blue-600 pl-3">分店資訊 (' + shopBranches.length + ')</h4><div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        var branchesHtml = shopBranches.map(function(b) { 
            var bName = (b.name && b.name['zh-TW']) || '分店';
            var bAddr = (b.address && b.address['zh-TW']) || '地址未提供';
            var branchInner = '<div class="border border-slate-200 p-4 bg-white hover:border-blue-400 transition cursor-pointer">';
            branchInner += '<h5 class="font-bold text-slate-800 mb-1">' + bName + '</h5>';
            branchInner += '<p class="text-xs text-slate-500 flex items-start gap-1"><i class="fa-solid fa-location-dot mt-0.5"></i> ' + bAddr + '</p>';
            if (b.openingHours) branchInner += '<p class="text-xs text-slate-500 mt-2 flex items-start gap-1"><i class="fa-solid fa-clock mt-0.5"></i> ' + b.openingHours + '</p>';
            branchInner += '</div>';
            return branchInner;
        }).join('');
        html += branchesHtml + '</div></div>';
    }
    html += '</div>';
    
    html += '<div class="space-y-8 bg-white border border-slate-100 p-5 md:p-6 shadow-sm self-start"><div><h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>總店地址</h4>';
    html += '<div class="flex items-start justify-between mt-1"><p class="text-slate-600 text-sm flex-1">' + addr + '</p>';
    if (addr) {
        var mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(shop.location ? shop.location.latitude + ',' + shop.location.longitude : addr);
        html += '<a href="' + mapUrl + '" target="_blank" class="ml-3 px-3 py-1 bg-green-50 text-green-700 text-xs hover:bg-green-100 transition flex items-center gap-1 shrink-0"><i class="fa-solid fa-map-location-dot"></i> 導航</a>';
    }
    html += '</div></div><hr class="border-slate-100"><div><h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>營業時間</h4>';
    html += '<p class="mt-1 text-slate-600 text-sm whitespace-pre-line">' + escapeHtml(shop.openingHours || '暫無營業時間') + '</p></div><hr class="border-slate-100"><div><h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2"><i class="fa-solid fa-phone text-green-600 w-5 text-center"></i>電話</h4>';
    html += '<p class="mt-1 text-slate-600 text-sm whitespace-pre-line">' + escapeHtml(shop.phone || '暫無資料') + '</p></div><hr class="border-slate-100"><div><h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2"><i class="fa-solid fa-globe text-green-600 w-5 text-center"></i>網站</h4>';
    if (shop.website) html += '<a href="' + escapeHtml(shop.website) + '" target="_blank" class="mt-1 text-blue-600 hover:underline text-sm break-all">' + escapeHtml(shop.website) + '</a>';
    else html += '<p class="mt-1 text-slate-600 text-sm">未提供</p>';
    html += '</div></div></div>';
    
    html += '<div class="mt-12 border-t border-slate-200 pt-8"><div class="flex items-center justify-between mb-6"><h4 class="text-xl font-bold flex items-center gap-2 text-slate-800"><i class="fa-solid fa-star text-yellow-500"></i>用戶評價</h4><button onclick="window.handleShopAction(\'' + shop.id + '\', \'rate\')" class="text-sm text-green-600 hover:underline">寫評價</button></div>';
    html += '<div id="shop-reviews-container" class="space-y-4"><div class="text-center py-4 text-slate-400 text-sm"><i class="fa-solid fa-circle-notch fa-spin"></i> 載入評價中...</div></div></div>';
    
    html += '<div class="mt-12 border-t border-slate-200 pt-8"><h4 class="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>你可能也會喜歡</h4>';
    html += '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="recommendations-container"></div></div></div>';
    
    container.innerHTML = html;
    
    // Recommendations
    var recContainer = container.querySelector('#recommendations-container');
    var similarShops = window.allShops.filter(function(s) { 
        return s.id !== shop.id && s.type && s.type['zh-TW'] && shop.type && shop.type['zh-TW'] && s.type['zh-TW'] === shop.type['zh-TW']; 
    }).slice(0, 3);
        
    if (similarShops.length > 0) {
        recContainer.innerHTML = similarShops.map(function(s) { 
            var sName = escapeHtml((s.name && s.name['zh-TW']) || '');
            var sAddr = escapeHtml((s.address && s.address['zh-TW']) || '');
            var sType = escapeHtml((s.type && s.type['zh-TW']) || '');
            var recInner = '<div class="border border-slate-200 bg-white hover:border-green-500 transition cursor-pointer flex flex-col h-full group" onclick="window.showShopDetail(\'' + s.id + '\')">';
            recInner += '<div class="h-24 bg-slate-100 overflow-hidden relative">';
            if (s.imageUrl) recInner += '<img src="' + s.imageUrl + '" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="' + sName + '" loading="lazy">';
            else recInner += '<div class="flex items-center justify-center h-full"><i class="fa-solid fa-image text-slate-300 text-2xl"></i></div>';
            recInner += '</div><div class="p-3 flex flex-col flex-grow"><h5 class="font-bold text-slate-800 text-sm line-clamp-1">' + sName + '</h5><p class="text-xs text-slate-500 mt-1 line-clamp-1">' + sAddr + '</p><div class="mt-auto pt-2"><span class="text-[10px] bg-green-50 text-green-700 px-2 py-1">' + sType + '</span></div></div></div>';
            return recInner;
        }).join('');
    } else {
        recContainer.innerHTML = '<p class="text-slate-500 text-sm col-span-3">暫無推薦商店</p>';
    }

    document.getElementById('shop-detail-modal').classList.remove('hidden');
    var closeBtn = container.querySelector('.close-modal-btn');
    if (closeBtn) closeBtn.onclick = function() { document.getElementById('shop-detail-modal').classList.add('hidden'); };
    
    window.fetchAndRenderShopReviews(shop.id);
});

window.Gateway.register('fetchAndRenderShopReviews', function(shopId) {
    var container = document.getElementById('shop-reviews-container');
    if (!container) return;
    
    db.collection('reviews')
        .where('shopId', '==', shopId)
        .get()
        .then(function(snap) {
            if (snap.empty) {
                container.innerHTML = '<p class="text-slate-500 text-sm text-center py-4 bg-slate-50 dark:bg-slate-800">目前還沒有評價，成為第一個留下評價的人吧！</p>';
                return;
            }
            
            var docs = snap.docs.map(function(doc) { 
                var d = doc.data();
                d.id = doc.id;
                return d;
            }).sort(function(a, b) {
                var tA = a.timestamp ? a.timestamp.toMillis() : 0;
                var tB = b.timestamp ? b.timestamp.toMillis() : 0;
                return tB - tA;
            }).slice(0, 5);
            
            container.innerHTML = docs.map(function(data) {
                var date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : '剛剛';
                var r = data.rating || 0;
                var stars = '';
                for (var i = 0; i < 5; i++) stars += (i < r ? '★' : '☆');
                var commentText = data.comment ? '<p class="text-slate-600 dark:text-slate-300 text-sm mt-2">' + escapeHtml(data.comment) + '</p>' : '';
                return '<div class="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">' +
                       '<div class="flex justify-between items-center mb-2">' +
                       '<div class="font-bold text-sm text-slate-700 dark:text-slate-200">' + (data.userName || '熱心環保客') + '</div>' +
                       '<div class="text-xs text-slate-400">' + date + '</div>' +
                       '</div>' +
                       '<div class="text-yellow-500 text-sm mb-1 tracking-widest">' + stars + '</div>' +
                       commentText +
                       '</div>';
            }).join('');
        })
        .catch(function(err) {
            console.error("Failed to load reviews:", err);
            container.innerHTML = '<p class="text-red-400 text-sm">無法載入評價</p>';
        });
});

window.Gateway.register('shareShop', function(shopId) {
    var shop = window.allShops.find(function(s) { return s.id === shopId; });
    var shopName = (shop && shop.name && shop.name['zh-TW']) || '綠簷永續商店';
    var url = window.location.origin + window.location.pathname + '?shop=' + shopId;
    
    if (navigator.share) {
        navigator.share({
            title: shopName,
            text: '來看看這間很棒的永續商店：' + shopName,
            url: url
        }).catch(function(e) { console.error(e); });
    } else {
        var tempInput = document.createElement('input');
        tempInput.value = url;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('商店連結已複製到剪貼簿！');
    }
});
