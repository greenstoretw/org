// ===== GREENROOF UI MODULE: CARDS =====
// This file is modularly extracted and registered with the Gateway router.
// Compatibility is maintained globally via window.Gateway.

window.Gateway.register('renderFilterButtons', function() {
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
        btn.className = 'tag px-4 py-2 rounded-full text-sm font-bold';
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
            btn.className = 'tag px-4 py-2 rounded-full text-sm font-bold eco-filter-btn';
            btn.dataset.feature = feature;
            btn.textContent = feature;
            ecoFeaturesContainer.appendChild(btn);
        });
    }
});

window.Gateway.register('renderShopCards', function(filteredShops) {
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
});

window.Gateway.register('renderSkeletonCards', function() {
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
});
