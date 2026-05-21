// ===== UI RENDERING & MODALS =====
window.renderFilterButtons = function() {
    var shopTypes = [];
    var typeSet = {};
    allShops.forEach(function(s) {
        var type = s.type && s.type['zh-TW'];
        if (type && !typeSet[type]) {
            typeSet[type] = true;
            shopTypes.push(type);
        }
    });

    var filterContainer = document.getElementById('filter-buttons-container');
    if (!filterContainer) return;
    
    var buttons = filterContainer.querySelectorAll('button');
    var defaultBtns = [];
    for (var i = 0; i < buttons.length && i < 2; i++) {
        defaultBtns.push(buttons[i]);
    }
    
    filterContainer.innerHTML = '';
    defaultBtns.forEach(function(btn) { filterContainer.appendChild(btn); });

    shopTypes.forEach(function(type) {
        if(!type) return;
        var btn = document.createElement('button');
        btn.className = 'tag px-3 py-1 rounded-full text-sm';
        btn.dataset.category = type; 
        btn.textContent = type;
        filterContainer.appendChild(btn);
    });

    // Populate Eco Features
    var ecoFeaturesContainer = document.getElementById('eco-features-container');
    if (ecoFeaturesContainer) {
        ecoFeaturesContainer.innerHTML = '';
        var allFeatures = [];
        var featureSet = {};
        allShops.forEach(function(s) {
            if (s.ecoFeatures && Array.isArray(s.ecoFeatures)) {
                s.ecoFeatures.forEach(function(f) { 
                    var feat = f.trim();
                    if (feat && !featureSet[feat]) {
                        featureSet[feat] = true;
                        allFeatures.push(feat);
                    }
                });
            }
        });
        
        allFeatures.forEach(function(feature) {
            var btn = document.createElement('button');
            btn.className = 'tag px-3 py-1 rounded-full text-sm eco-filter-btn';
            btn.dataset.feature = feature;
            btn.textContent = feature;
            ecoFeaturesContainer.appendChild(btn);
        });
    }
};

window.renderShopCards = function(filteredShops) {
    var container = document.getElementById('shop-cards-container');
    var loadMoreButton = document.getElementById('load-more-button');
    if (currentLoadedShops === 0) container.innerHTML = '';
    
    // Sort by distance if active
    var shopsCopy = filteredShops.slice();
    if (window.closestSortActive && window.userLocation) {
        shopsCopy.sort(function(a, b) {
            if (!a.location) return 1;
            if (!b.location) return -1;
            var distA = window.getDistance(window.userLocation.latitude, window.userLocation.longitude, a.location.latitude, a.location.longitude);
            var distB = window.getDistance(window.userLocation.latitude, window.userLocation.longitude, b.location.latitude, b.location.longitude);
            return distA - distB;
        });
    }
    
    var shopsToDisplay = shopsCopy.slice(currentLoadedShops, currentLoadedShops + shopsPerPage);
    
    shopsToDisplay.forEach(function(shop) {
        var isFavorited = favoriteShops.indexOf(shop.id) !== -1;
        var shopBranches = window.allShops.filter(function(b) { return b.isBranch && b.parentId === shop.id; });
        
        var card = document.createElement('div');
        card.className = 'shop-card bg-white overflow-hidden relative';
        
        var shopName = (shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW']) || 'Shop';
        var shopType = (shop.type && shop.type[currentLang]) || (shop.type && shop.type['zh-TW']) || '';
        var shopDesc = (shop.description && shop.description[currentLang]) || (shop.description && shop.description['zh-TW']) || '';

        var html = '';
        if (shop.featured) html += '<div class="featured-badge">FEATURED</div>';
        html += '<div class="shop-image-container h-56 relative overflow-hidden bg-slate-200">';
        if (shop.imageUrl) {
            html += '<img src="' + shop.imageUrl + '" class="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="' + shopName + '" loading="lazy" onerror="this.onerror=null; this.src=\'\';">';
        } else {
            html += '<div class="flex items-center justify-center h-full opacity-30"><svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>';
        }
        html += '<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>';
        html += '<div class="absolute bottom-4 left-4 right-4">';
        html += '<span class="text-[10px] font-bold text-white/80 uppercase tracking-widest bg-black/20 backdrop-blur-sm px-2 py-0.5 inline-block mb-1">Street View 實景</span>';
        html += '</div><div class="card-shimmer"></div></div>';
        
        html += '<button class="favorite-btn ' + (isFavorited ? 'favorited' : '') + '" data-shop-id="' + shop.id + '" aria-label="收藏商店">';
        html += '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        html += '</button>';
        
        html += '<div class="p-6 flex-grow flex flex-col justify-between">';
        html += '<div><div class="flex flex-wrap gap-2 items-center mb-1">';
        if (shop.verified) html += '<span class="tag px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 border-blue-200" title="官方審核認證"><i class="fa-solid fa-circle-check"></i> 官方認證</span>';
        if (shop.isPartner) html += '<span class="tag px-2 py-0.5 text-[10px] bg-yellow-50 text-yellow-600 border-yellow-200" title="合作店家"><i class="fa-solid fa-handshake"></i> 合作店家</span>';
        html += '</div><h3 class="text-xl font-black text-slate-900">' + shopName + '</h3>';
        
        var distHtml = '';
        if (window.userLocation && shop.location) {
            var distMeters = window.getDistance(window.userLocation.latitude, window.userLocation.longitude, shop.location.latitude, shop.location.longitude);
            var distText = distMeters > 1000 ? (distMeters / 1000).toFixed(1) + ' km' : Math.round(distMeters) + ' m';
            distHtml = '<span class="tag px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200"><i class="fa-solid fa-location-arrow"></i> ' + distText + '</span>';
        }
        
        html += '<div class="flex flex-wrap gap-1 mt-1 mb-2"><span class="tag px-2 py-0.5 text-[10px]">' + shopType + '</span>' + distHtml + '</div>';
        html += '<p class="text-slate-500 text-sm my-4 h-16 overflow-hidden">' + shopDesc + '</p>';
        
        if (shopBranches.length > 0) {
            html += '<div class="mb-4 bg-slate-50 p-2 border border-slate-200 text-xs text-slate-600">';
            html += '<strong><i class="fa-solid fa-location-dot text-green-600 mr-1"></i>其他分店 (' + shopBranches.length + ')</strong>';
            html += '<ul class="mt-1 ml-4 list-disc space-y-1">';
            var branchList = shopBranches.slice(0, 2).map(function(b) { return '<li>' + ((b.name && b.name['zh-TW']) || '分店') + '</li>'; }).join('');
            html += branchList;
            if (shopBranches.length > 2) html += '<li>...及其他 ' + (shopBranches.length - 2) + ' 間</li>';
            html += '</ul></div>';
        }
        
        html += '</div>';
        var btnText = (window.locales[currentLang] && window.locales[currentLang].viewDetailsBtn) || 'VIEW DETAILS';
        html += '<button class="block w-full text-center py-3 mt-auto btn-primary text-sm tracking-widest view-details-btn" data-shop-id="' + shop.id + '">' + btnText + '</button>';
        html += '</div>';
        
        card.innerHTML = html;
        container.appendChild(card);
    });

    currentLoadedShops += shopsToDisplay.length;
    if (loadMoreButton) loadMoreButton.classList.toggle('hidden', currentLoadedShops >= filteredShops.length);
};

window.updateMapMarkers = function(filteredShops) {
    if (!mapInstance) return;
    markersGroup.clearLayers();
    filteredShops.forEach(function(shop) {
        if(shop.location) {
            var shopName = (shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW']) || 'Shop';
            var marker = L.marker([shop.location.latitude, shop.location.longitude]);
            var btnText = (window.locales[currentLang] && window.locales[currentLang].viewDetailsBtn) || 'View Details';
            marker.bindPopup('<div class="p-1"><h3 class="font-bold text-base">' + shopName + '</h3><button onclick="window.showShopDetail(\'' + shop.id + '\')" class="text-green-600 text-sm hover:underline">' + btnText + '</button></div>');
            markersGroup.addLayer(marker);
        }
    });
    if (filteredShops.length > 0 && markersGroup.getLayers().length > 0) {
       mapInstance.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
    }
};

window.showShopDetail = function(shopId) {
    var shop = allShops.find(function(s) { return s.id === shopId; });
    if (!shop) return;

    var name = (shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW']) || '';
    var type = (shop.type && shop.type[currentLang]) || (shop.type && shop.type['zh-TW']) || '';
    var addr = (shop.address && shop.address[currentLang]) || (shop.address && shop.address['zh-TW']) || '';
    var desc = (shop.description && shop.description[currentLang]) || (shop.description && shop.description['zh-TW']) || '';
    var isFavorited = favoriteShops.indexOf(shop.id) !== -1;
    
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
    html += '<p class="mt-1 text-slate-600 text-sm whitespace-pre-line">' + (shop.openingHours || '未提供') + '</p></div><hr class="border-slate-100"><div><h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2"><i class="fa-solid fa-phone text-green-600 w-5 text-center"></i>電話</h4>';
    html += '<p class="mt-1 text-slate-600 text-sm whitespace-pre-line">' + (shop.phone || '未提供') + '</p></div><hr class="border-slate-100"><div><h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2"><i class="fa-solid fa-globe text-green-600 w-5 text-center"></i>網站</h4>';
    if (shop.website) html += '<a href="' + shop.website + '" target="_blank" class="mt-1 text-blue-600 hover:underline text-sm break-all">' + shop.website + '</a>';
    else html += '<p class="mt-1 text-slate-600 text-sm">未提供</p>';
    html += '</div></div></div>';
    
    html += '<div class="mt-12 border-t border-slate-200 pt-8"><div class="flex items-center justify-between mb-6"><h4 class="text-xl font-bold flex items-center gap-2 text-slate-800"><i class="fa-solid fa-star text-yellow-500"></i>用戶評價</h4><button onclick="window.handleShopAction(\'' + shop.id + '\', \'rate\')" class="text-sm text-green-600 hover:underline">寫評價</button></div>';
    html += '<div id="shop-reviews-container" class="space-y-4"><div class="text-center py-4 text-slate-400 text-sm"><i class="fa-solid fa-circle-notch fa-spin"></i> 載入評價中...</div></div></div>';
    
    html += '<div class="mt-12 border-t border-slate-200 pt-8"><h4 class="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>你可能也會喜歡</h4>';
    html += '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="recommendations-container"></div></div></div>';
    
    container.innerHTML = html;
    
    // Recommendations
    var recContainer = container.querySelector('#recommendations-container');
    var similarShops = allShops.filter(function(s) { 
        return s.id !== shop.id && s.type && s.type['zh-TW'] && shop.type && shop.type['zh-TW'] && s.type['zh-TW'] === shop.type['zh-TW']; 
    }).slice(0, 3);
        
    if (similarShops.length > 0) {
        recContainer.innerHTML = similarShops.map(function(s) { 
            var sName = (s.name && s.name['zh-TW']) || '';
            var sAddr = (s.address && s.address['zh-TW']) || '';
            var sType = (s.type && s.type['zh-TW']) || '';
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
};

window.fetchAndRenderShopReviews = function(shopId) {
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
                var commentText = data.comment ? '<p class="text-slate-600 dark:text-slate-300 text-sm mt-2">' + data.comment + '</p>' : '';
                return '<div class="p-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">' +
                       '<div class="flex justify-between items-center mb-2">' +
                       '<div class="font-bold text-sm text-slate-700 dark:text-slate-200">熱心環保客</div>' +
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
};


window.shareShop = function(shopId) {
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
};

window.showUserDashboard = function() {
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
};

window.setLanguage = function(lang) {
    var updateUI = function() {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        var i18nElements = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < i18nElements.length; i++) {
            var el = i18nElements[i];
            var key = el.getAttribute('data-i18n');
            var translation = (window.locales[lang] && window.locales[lang][key]) || (window.locales['zh-TW'] && window.locales['zh-TW'][key]);
            if (translation) el.textContent = translation;
        }
        var navLinks = document.querySelector('.nav-links');
        if (navLinks && window.innerWidth >= 768) navLinks.style.display = 'flex';
        
        currentLoadedShops = 0;
        if (window.filterAndDisplayShops) window.filterAndDisplayShops();
    };

    if (!window.locales[lang]) {
        var script = document.createElement('script');
        script.src = 'js/locales/' + lang + '.js';
        script.onload = function() {
            updateUI();
        };
        script.onerror = function() {
            console.error('Failed to load locale: ' + lang);
            updateUI(); 
        };
        document.body.appendChild(script);
    } else {
        updateUI();
    }
};

// ===== PREMIUM DYNAMIC ECO-FEATURES (ES5 VANILLA COMPLIANT) =====

window.renderSkeletonCards = function() {
    var container = document.getElementById('shop-cards-container');
    if (!container) return;
    var html = '';
    for (var i = 0; i < 6; i++) {
        html += '<div class="skeleton-card pulse">' +
                   '<div class="skeleton-img"></div>' +
                   '<div class="skeleton-content">' +
                       '<div class="skeleton-text skeleton-title"></div>' +
                       '<div class="skeleton-text skeleton-desc"></div>' +
                       '<div class="skeleton-btn"></div>' +
                   '</div>' +
                '</div>';
    }
    container.innerHTML = html;
};

window.surpriseMe = function() {
    if (!window.allShops || window.allShops.length === 0) {
        window.showMessage("目前尚無店家可探索");
        return;
    }
    var validShops = window.allShops.filter(function(s) {
        return s.location && s.location.latitude && s.location.longitude;
    });
    if (validShops.length === 0) {
        window.showMessage("目前尚無具有位置資訊的店家");
        return;
    }
    var randomShop = validShops[Math.floor(Math.random() * validShops.length)];
    if (window.mapInstance) {
        window.mapInstance.flyTo([randomShop.location.latitude, randomShop.location.longitude], 16, {
            animate: true,
            duration: 1.5
        });
        setTimeout(function() {
            window.showShopDetail(randomShop.id);
        }, 1600);
    } else {
        window.showShopDetail(randomShop.id);
    }
};

window.handleCheckIn = function(shopId) {
    var user = auth.currentUser;
    if (!user) {
        window.showMessage("請先登入後再進行打卡簽到");
        return;
    }
    var shop = window.allShops.find(function(s) { return s.id === shopId; });
    if (!shop) return;

    var shopName = (shop.name && shop.name['zh-TW']) || '永續商店';
    var carbonSaved = window.calculateCarbonSaving(shop);

    var simulated = false;
    if (window.userLocation && shop.location) {
        var dist = window.getDistance(
            window.userLocation.latitude,
            window.userLocation.longitude,
            shop.location.latitude,
            shop.location.longitude
        );
        if (dist > 300) {
            var ok = confirm("您目前距離商店約 " + Math.round(dist) + " 公尺（超過 300 公尺限制）。是否要進行「模擬簽到」？");
            if (!ok) return;
            simulated = true;
        }
    } else {
        var okSim = confirm("無法取得您的 GPS 位置。是否要進行「模擬簽到」？");
        if (!okSim) return;
        simulated = true;
    }

    var userName = user.displayName || user.email || '環保旅客';

    var loadingOverlay = document.getElementById('app-loading');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    window.generateReceiptBase64(shopName, userName, carbonSaved, function(base64Receipt, recordId) {
        window.submitCheckIn(shopId, shopName, userName, carbonSaved, base64Receipt, recordId, simulated)
            .then(function() {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                
                window.triggerConfetti();
                
                window.showMessage("打卡簽到成功！感謝您為地球節省了 " + carbonSaved + "g 碳排！🌿");
                
                var modal = document.getElementById('receipt-preview-modal');
                var img = document.getElementById('receipt-preview-img');
                var btn = document.getElementById('receipt-download-btn');
                
                if (img) img.src = base64Receipt;
                if (btn) {
                    btn.href = base64Receipt;
                    btn.download = 'Green-Eaves-Receipt-' + recordId + '.png';
                }
                if (modal) modal.classList.remove('hidden');
                
                window.checkAndUnlockBadges();
            })
            .catch(function(err) {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                window.showErrorModal(err, "handleCheckIn");
            });
    });
};

window.toggleRoutingShop = function(shopId) {
    var idx = window.activeRoutingList.indexOf(shopId);
    var btn = document.getElementById('detail-route-btn');
    
    if (idx !== -1) {
        window.activeRoutingList.splice(idx, 1);
        if (btn) {
            btn.textContent = '+ 加入散步路線';
            btn.className = 'font-bold px-6 py-2.5 text-xs transition uppercase tracking-wider flex items-center gap-2 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
        }
        window.showMessage("已將此商店移出您的散步路線");
    } else {
        if (window.activeRoutingList.length >= 8) {
            window.showMessage("為了最佳體驗，散步路線最多只能加入 8 間商店喔！");
            return;
        }
        window.activeRoutingList.push(shopId);
        if (btn) {
            btn.textContent = '✓ 已在散步路線中';
            btn.className = 'font-bold px-6 py-2.5 text-xs transition uppercase tracking-wider flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700';
        }
        window.showMessage("已成功將商店加入您的散步路線！");
    }
    
    window.updateRoutingPanel();
    window.drawRoutePolyline();
};

window.updateRoutingPanel = function() {
    var listContainer = document.getElementById('routing-shops-list');
    var distanceEl = document.getElementById('routing-distance');
    var timeEl = document.getElementById('routing-time');
    var carbonEl = document.getElementById('routing-carbon');
    var panel = document.getElementById('routing-panel');
    
    if (!listContainer) return;
    
    if (window.activeRoutingList.length === 0) {
        listContainer.innerHTML = '<p class="text-center py-4 text-slate-400">目前尚無規劃的商店</p>';
        if (distanceEl) distanceEl.textContent = '0 km';
        if (timeEl) timeEl.textContent = '0 分鐘';
        if (carbonEl) carbonEl.textContent = '0 g 🌿';
        return;
    }
    
    var totalDistance = 0;
    var totalCarbon = 0;
    var html = '';
    
    var routeShops = [];
    window.activeRoutingList.forEach(function(id) {
        var shop = window.allShops.find(function(s) { return s.id === id; });
        if (shop) routeShops.push(shop);
    });
    
    routeShops.forEach(function(shop, idx) {
        var shopName = (shop.name && shop.name['zh-TW']) || '永續商店';
        totalCarbon += window.calculateCarbonSaving(shop);
        
        if (idx > 0 && shop.location && routeShops[idx - 1].location) {
            totalDistance += window.getDistance(
                routeShops[idx - 1].location.latitude,
                routeShops[idx - 1].location.longitude,
                shop.location.latitude,
                shop.location.longitude
            );
        }
        
        html += '<div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 relative group" style="border-radius:0!important">' +
                    '<div class="flex items-center gap-1.5 min-w-0">' +
                        '<span class="w-5 h-5 flex items-center justify-center bg-green-600 text-white font-bold text-[10px] rounded-full shrink-0">' + (idx + 1) + '</span>' +
                        '<span class="font-bold truncate text-slate-800 dark:text-slate-200">' + shopName + '</span>' +
                    '</div>' +
                    '<button onclick="window.toggleRoutingShop(\'' + shop.id + '\')" class="text-slate-400 hover:text-red-500 font-bold shrink-0 transition text-sm cursor-pointer" aria-label="移除商店">&times;</button>' +
                '</div>';
    });
    
    listContainer.innerHTML = html;
    
    var distKm = (totalDistance / 1000).toFixed(2);
    var timeMin = Math.round((totalDistance / 1000) / 5 * 60);
    
    if (distanceEl) distanceEl.textContent = distKm + ' km';
    if (timeEl) timeEl.textContent = timeMin + ' 分鐘';
    if (carbonEl) carbonEl.textContent = totalCarbon + ' g 🌿';
    
    if (panel && window.isRoutingMode) {
        panel.classList.remove('hidden');
    }
};

window.drawRoutePolyline = function() {
    if (!window.mapInstance) return;
    
    if (window.routingPolyline) {
        window.mapInstance.removeLayer(window.routingPolyline);
        window.routingPolyline = null;
    }
    
    var latlngs = [];
    window.activeRoutingList.forEach(function(id) {
        var shop = window.allShops.find(function(s) { return s.id === id; });
        if (shop && shop.location && shop.location.latitude && shop.location.longitude) {
            latlngs.push([shop.location.latitude, shop.location.longitude]);
        }
    });
    
    if (latlngs.length >= 2) {
        window.routingPolyline = L.polyline(latlngs, {
            color: '#3b82f6',
            weight: 4,
            dashArray: '10, 8',
            opacity: 0.8
        }).addTo(window.mapInstance);
        
        window.mapInstance.fitBounds(window.routingPolyline.getBounds(), { padding: [50, 50] });
    }
};

window.checkAndUnlockBadges = function() {
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
};

window.previewUserReceipt = function(docId) {
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
};

