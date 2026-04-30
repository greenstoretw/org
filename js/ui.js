// ===== UI RENDERING & MODALS =====
window.renderFilterButtons = function() {
    const shopTypes = [...new Set(allShops.map(function(s) { 
        return s.type && s.type['zh-TW']; 
    }))];
    const filterContainer = document.getElementById('filter-buttons-container');
    if (!filterContainer) return;
    
    const defaultBtns = Array.from(filterContainer.querySelectorAll('button')).slice(0, 2);
    filterContainer.innerHTML = '';
    defaultBtns.forEach(function(btn) { filterContainer.appendChild(btn); });

    shopTypes.forEach(function(type) {
        if(!type) return;
        const btn = document.createElement('button');
        btn.className = 'tag px-3 py-1 rounded-full text-sm';
        btn.dataset.category = type; 
        btn.textContent = type;
        filterContainer.appendChild(btn);
    });

    // Populate Eco Features
    const ecoFeaturesContainer = document.getElementById('eco-features-container');
    if (ecoFeaturesContainer) {
        ecoFeaturesContainer.innerHTML = '';
        let allFeatures = new Set();
        allShops.forEach(function(s) {
            if (s.ecoFeatures && Array.isArray(s.ecoFeatures)) {
                s.ecoFeatures.forEach(function(f) { allFeatures.add(f.trim()); });
            }
        });
        
        [...allFeatures].filter(Boolean).forEach(function(feature) {
            const btn = document.createElement('button');
            btn.className = 'tag px-3 py-1 rounded-full text-sm eco-filter-btn';
            btn.dataset.feature = feature;
            btn.textContent = feature;
            ecoFeaturesContainer.appendChild(btn);
        });
    }
};

window.renderShopCards = function(filteredShops) {
    const container = document.getElementById('shop-cards-container');
    const loadMoreButton = document.getElementById('load-more-button');
    if (currentLoadedShops === 0) container.innerHTML = '';
    
    const shopsToDisplay = filteredShops.slice(currentLoadedShops, currentLoadedShops + shopsPerPage);
    
    shopsToDisplay.forEach(function(shop) {
        const isFavorited = favoriteShops.includes(shop.id);
        const shopBranches = window.allShops.filter(function(b) { return b.isBranch && b.parentId === shop.id; });
        
        const card = document.createElement('div');
        card.className = 'shop-card bg-white overflow-hidden relative';
        
        const shopName = (shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW']) || 'Shop';
        const shopType = (shop.type && shop.type[currentLang]) || (shop.type && shop.type['zh-TW']) || '';
        const shopDesc = (shop.description && shop.description[currentLang]) || (shop.description && shop.description['zh-TW']) || '';

        card.innerHTML = `
            ${shop.featured ? `<div class="featured-badge">FEATURED</div>` : ''}
            <div class="h-48 bg-slate-100 flex items-center justify-center">
                ${shop.imageUrl 
                  ? `<img src="${shop.imageUrl}" class="w-full h-full object-cover" alt="${shopName}" loading="lazy" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<svg class=\\'h-16 w-16 text-slate-300\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'currentColor\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'1.5\\' d=\\'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\\' /></svg>';">`
                  : `<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`}
            </div>
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-shop-id="${shop.id}" aria-label="收藏商店">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <div class="p-6 flex-grow flex flex-col justify-between">
                <div>
                    <div class="flex flex-wrap gap-2 items-center mb-1">
                        ${shop.verified ? `<span class="tag px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 border-blue-200" title="官方審核認證"><i class="fa-solid fa-circle-check"></i> 官方認證</span>` : ''}
                        ${shop.isPartner ? `<span class="tag px-2 py-0.5 text-[10px] bg-yellow-50 text-yellow-600 border-yellow-200" title="合作店家"><i class="fa-solid fa-handshake"></i> 合作店家</span>` : ''}
                    </div>
                    <h3 class="text-xl font-black text-slate-900">${shopName}</h3>
                    <div class="flex flex-wrap gap-1 mt-1 mb-2">
                        <span class="tag px-2 py-0.5 text-[10px]">${shopType}</span>
                    </div>
                    <p class="text-slate-500 text-sm my-4 h-16 overflow-hidden">${shopDesc}</p>
                    ${shopBranches.length > 0 ? `
                        <div class="mb-4 bg-slate-50 p-2 border border-slate-200 text-xs text-slate-600">
                            <strong><i class="fa-solid fa-location-dot text-green-600 mr-1"></i>其他分店 (${shopBranches.length})</strong>
                            <ul class="mt-1 ml-4 list-disc space-y-1">
                                ${shopBranches.slice(0, 2).map(function(b) { return `<li>${(b.name && b.name['zh-TW']) || '分店'}</li>`; }).join('')}
                                ${shopBranches.length > 2 ? `<li>...及其他 ${shopBranches.length - 2} 間</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <button class="block w-full text-center py-3 mt-auto btn-primary text-sm tracking-widest view-details-btn" data-shop-id="${shop.id}">${(window.locales[currentLang] && window.locales[currentLang].viewDetailsBtn) || 'VIEW DETAILS'}</button>
            </div>
        `;
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
            const shopName = (shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW']) || 'Shop';
            const marker = L.marker([shop.location.latitude, shop.location.longitude]);
            marker.bindPopup(`
                <div class="p-1">
                    <h3 class="font-bold text-base">${shopName}</h3>
                    <button onclick="window.showShopDetail('${shop.id}')" class="text-green-600 text-sm hover:underline">${(window.locales[currentLang] && window.locales[currentLang].viewDetailsBtn) || 'View Details'}</button>
                </div>
            `);
            markersGroup.addLayer(marker);
        }
    });
    if (filteredShops.length > 0 && markersGroup.getLayers().length > 0) {
       mapInstance.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
    }
};

window.showShopDetail = function(shopId) {
    const shop = allShops.find(function(s) { return s.id === shopId; });
    if (!shop) return;

    const name = (shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW']) || '';
    const type = (shop.type && shop.type[currentLang]) || (shop.type && shop.type['zh-TW']) || '';
    const addr = (shop.address && shop.address[currentLang]) || (shop.address && shop.address['zh-TW']) || '';
    const desc = (shop.description && shop.description[currentLang]) || (shop.description && shop.description['zh-TW']) || '';
    const isFavorited = favoriteShops.includes(shop.id);
    
    const shopBranches = window.allShops.filter(function(b) { return b.isBranch && b.parentId === shop.id; });

    const container = document.getElementById('shop-detail-container');
    container.innerHTML = `
        <div class="relative">
            <div class="h-48 md:h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
                ${shop.imageUrl 
                  ? `<img src="${shop.imageUrl}" class="w-full h-full object-cover" alt="${name}" loading="lazy" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<svg class=\\'h-24 w-24 text-slate-300\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'currentColor\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'1.5\\' d=\\'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z\\' /></svg>';">`
                  : `<svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`}
            </div>
            <button class="close-modal-btn absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 transition z-[1010] cursor-pointer rounded-full" aria-label="關閉視窗">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div class="p-5 md:p-8">
            <div class="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="tag px-3 py-1 text-sm font-medium inline-block">${type}</span>
                        ${shop.verified ? `<span class="tag px-2 py-1 text-[10px] bg-blue-50 text-blue-600 border-blue-200" title="官方審核認證"><i class="fa-solid fa-circle-check"></i> 官方認證</span>` : ''}
                        ${shop.isPartner ? `<span class="tag px-2 py-1 text-[10px] bg-yellow-50 text-yellow-600 border-yellow-200" title="合作店家"><i class="fa-solid fa-handshake"></i> 合作店家</span>` : ''}
                        <span class="px-2 py-1 text-[10px] font-bold rounded-full ${window.isOpenNow && window.isOpenNow(shop.openingHours) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                            <span class="inline-block w-1.5 h-1.5 rounded-full ${window.isOpenNow && window.isOpenNow(shop.openingHours) ? 'bg-green-500' : 'bg-gray-400'} mr-1"></span>
                            ${window.isOpenNow && window.isOpenNow(shop.openingHours) ? '營業中' : '休息中'}
                        </span>
                    </div>
                    <h2 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">${name}</h2>
                </div>
                <div class="flex gap-2 w-full md:w-auto">
                    <button onclick="window.handleShopAction('${shop.id}', 'favorite')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-red-500 hover:bg-red-50 transition group flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover:text-red-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                    <button onclick="window.handleShopAction('${shop.id}', 'rate')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-yellow-500 hover:bg-yellow-50 transition group flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400 group-hover:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </button>
                    <button onclick="window.handleShopAction('${shop.id}', 'report')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition group flex justify-center" aria-label="檢舉錯誤">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </button>
                    <button onclick="window.shareShop('${shop.id}')" class="flex-1 md:flex-none p-3 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition group flex justify-center" aria-label="分享商店">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                <div class="lg:col-span-2">
                    <h4 class="text-xl font-bold mb-4 border-l-4 border-green-600 pl-3">關於品牌</h4>
                    <p class="text-slate-700 leading-relaxed mb-8 text-sm md:text-base">${desc}</p>
                    
                    <div class="bg-slate-50 p-5 md:p-6 border border-slate-200 mb-8">
                        <h4 class="text-green-800 font-bold mb-4 flex items-center gap-2">
                            <i class="fa-solid fa-leaf"></i> 永續特點
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-green-700">
                            ${shop.ecoFeatures && shop.ecoFeatures.length > 0 ? shop.ecoFeatures.map(function(f) { return `<div class="flex items-center gap-2">✓ ${f}</div>`; }).join('') : '暫無詳細資料'}
                        </div>
                    </div>
                    
                    ${shopBranches.length > 0 ? `
                    <div class="mt-8">
                        <h4 class="text-xl font-bold mb-4 border-l-4 border-blue-600 pl-3">分店資訊 (${shopBranches.length})</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            ${shopBranches.map(function(b) { 
                                return `
                                <div class="border border-slate-200 p-4 bg-white hover:border-blue-400 transition cursor-pointer">
                                    <h5 class="font-bold text-slate-800 mb-1">${(b.name && b.name['zh-TW']) || '分店'}</h5>
                                    <p class="text-xs text-slate-500 flex items-start gap-1"><i class="fa-solid fa-location-dot mt-0.5"></i> ${(b.address && b.address['zh-TW']) || '地址未提供'}</p>
                                    ${b.openingHours ? `<p class="text-xs text-slate-500 mt-2 flex items-start gap-1"><i class="fa-solid fa-clock mt-0.5"></i> ${b.openingHours}</p>` : ''}
                                </div>
                            `; }).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="space-y-8 bg-white border border-slate-100 p-5 md:p-6 shadow-sm self-start">
                    <div>
                        <h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            ${(window.locales[currentLang] && window.locales[currentLang].modalAddress) || '總店地址'}
                        </h4>
                        <div class="flex items-start justify-between mt-1">
                            <p class="text-slate-600 text-sm flex-1">${addr}</p>
                            ${addr ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location ? shop.location.latitude+','+shop.location.longitude : addr)}" target="_blank" class="ml-3 px-3 py-1 bg-green-50 text-green-700 text-xs hover:bg-green-100 transition flex items-center gap-1 shrink-0"><i class="fa-solid fa-map-location-dot"></i> 導航</a>` : ''}
                        </div>
                    </div>
                    <hr class="border-slate-100">
                    <div>
                        <h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ${(window.locales[currentLang] && window.locales[currentLang].modalOpeningHours) || '營業時間'}
                        </h4>
                        <p class="mt-1 text-slate-600 text-sm whitespace-pre-line">${shop.openingHours || ((window.locales[currentLang] && window.locales[currentLang].notProvided) || '未提供')}</p>
                    </div>
                    <hr class="border-slate-100">
                    <div>
                        <h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2">
                            <i class="fa-solid fa-phone text-green-600 w-5 text-center"></i>
                            ${(window.locales[currentLang] && window.locales[currentLang].modalPhone) || '電話'}
                        </h4>
                        <p class="mt-1 text-slate-600 text-sm whitespace-pre-line">${shop.phone || ((window.locales[currentLang] && window.locales[currentLang].notProvided) || '未提供')}</p>
                    </div>
                    <hr class="border-slate-100">
                    <div>
                        <h4 class="font-bold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider mb-2">
                            <i class="fa-solid fa-globe text-green-600 w-5 text-center"></i>
                            ${(window.locales[currentLang] && window.locales[currentLang].modalWebsite) || '網站'}
                        </h4>
                        ${shop.website ? `<a href="${shop.website}" target="_blank" class="mt-1 text-blue-600 hover:underline text-sm break-all">${shop.website}</a>` : `<p class="mt-1 text-slate-600 text-sm">${(window.locales[currentLang] && window.locales[currentLang].notProvided) || '未提供'}</p>`}
                    </div>
                </div>
            </div>
            
            <!-- User Reviews Section -->
            <div class="mt-12 border-t border-slate-200 pt-8">
                <div class="flex items-center justify-between mb-6">
                    <h4 class="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <i class="fa-solid fa-star text-yellow-500"></i>
                        用戶評價
                    </h4>
                    <button onclick="window.handleShopAction('${shop.id}', 'rate')" class="text-sm text-green-600 hover:underline">寫評價</button>
                </div>
                <div id="shop-reviews-container" class="space-y-4">
                    <div class="text-center py-4 text-slate-400 text-sm"><i class="fa-solid fa-circle-notch fa-spin"></i> 載入評價中...</div>
                </div>
            </div>
            
            <!-- Recommendations Section -->
            <div class="mt-12 border-t border-slate-200 pt-8">
                <h4 class="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    你可能也會喜歡
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="recommendations-container">
                    <!-- Populated by JS below -->
                </div>
            </div>
        </div>
    `;
    
    // Logic for Recommendations (AI Recommendations substitute based on type/location)
    const recContainer = container.querySelector('#recommendations-container');
    const similarShops = allShops
        .filter(function(s) { 
            return s.id !== shop.id && s.type && s.type['zh-TW'] && shop.type && shop.type['zh-TW'] && s.type['zh-TW'] === shop.type['zh-TW']; 
        })
        .slice(0, 3);
        
    if (similarShops.length > 0) {
        recContainer.innerHTML = similarShops.map(function(s) { 
            const sName = (s.name && s.name['zh-TW']) || '';
            const sAddr = (s.address && s.address['zh-TW']) || '';
            const sType = (s.type && s.type['zh-TW']) || '';
            return `
            <div class="border border-slate-200 bg-white hover:border-green-500 transition cursor-pointer flex flex-col h-full group" onclick="window.showShopDetail('${s.id}')">
                <div class="h-24 bg-slate-100 overflow-hidden relative">
                    ${s.imageUrl ? `<img src="${s.imageUrl}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="${sName}" loading="lazy">` : `<div class="flex items-center justify-center h-full"><i class="fa-solid fa-image text-slate-300 text-2xl"></i></div>`}
                </div>
                <div class="p-3 flex flex-col flex-grow">
                    <h5 class="font-bold text-slate-800 text-sm line-clamp-1">${sName}</h5>
                    <p class="text-xs text-slate-500 mt-1 line-clamp-1">${sAddr}</p>
                    <div class="mt-auto pt-2">
                        <span class="text-[10px] bg-green-50 text-green-700 px-2 py-1">${sType}</span>
                    </div>
                </div>
            </div>
        `; }).join('');
    } else {
        recContainer.innerHTML = '<p class="text-slate-500 text-sm col-span-3">暫無推薦商店</p>';
    }

    document.getElementById('shop-detail-modal').classList.remove('hidden');
    // Close on button click
    const closeBtn = container.querySelector('.close-modal-btn');
    if (closeBtn) closeBtn.onclick = function() { document.getElementById('shop-detail-modal').classList.add('hidden'); };
    
    // Fetch and render reviews dynamically
    fetchAndRenderShopReviews(shop.id);
};

// Helper: Fetch and render reviews for the specific shop
async function fetchAndRenderShopReviews(shopId) {
    const container = document.getElementById('shop-reviews-container');
    if (!container) return;
    
    try {
        const snap = await db.collection('reviews')
            .where('shopId', '==', shopId)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
            
        if (snap.empty) {
            container.innerHTML = '<p class="text-slate-500 text-sm text-center py-4 bg-slate-50">目前還沒有評價，成為第一個留下評價的人吧！</p>';
            return;
        }
        
        container.innerHTML = snap.docs.map(function(doc) {
            const data = doc.data();
            const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : '剛剛';
            const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
            return `
                <div class="p-4 border border-slate-100 bg-white">
                    <div class="flex justify-between items-center mb-2">
                        <div class="font-bold text-sm text-slate-700">熱心環保客</div>
                        <div class="text-xs text-slate-400">${date}</div>
                    </div>
                    <div class="text-yellow-500 text-sm mb-1 tracking-widest">${stars}</div>
                    ${data.comment ? `<p class="text-slate-600 text-sm mt-2">${data.comment}</p>` : ''}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Failed to load reviews:", err);
        container.innerHTML = '<p class="text-red-400 text-sm">無法載入評價</p>';
    }
}

// Helper: Share Shop
window.shareShop = function(shopId) {
    const shop = window.allShops.find(function(s) { return s.id === shopId; });
    const nameData = shop && shop.name ? shop.name : {};
    const shopName = nameData['zh-TW'] || '綠簷永續商店';
    const url = window.location.origin + window.location.pathname + '?shop=' + shopId;
    
    if (navigator.share) {
        navigator.share({
            title: shopName,
            text: '來看看這間很棒的永續商店：' + shopName,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(function() {
            alert('商店連結已複製到剪貼簿！');
        });
    }
};

window.showUserDashboard = async function() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const favContainer = document.getElementById('dashboard-favorites');
        const revContainer = document.getElementById('dashboard-reviews');
        const repContainer = document.getElementById('dashboard-reports');
        if (favContainer) favContainer.innerHTML = '載入中...';
        if (revContainer) revContainer.innerHTML = '載入中...';
        if (repContainer) repContainer.innerHTML = '載入中...';

        const favShops = (window.allShops || []).filter(function(s) { return (window.favoriteShops || []).includes(s.id); });
        if (favContainer) {
            favContainer.innerHTML = favShops.map(function(s) { 
                return `
                <div class="p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-red-200 transition">
                    <div class="font-bold text-gray-800">${(s.name && s.name['zh-TW']) || '未知商家'}</div>
                    <button onclick="window.showShopDetail('${s.id}')" class="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> 查看詳情
                    </button>
                </div>
            `; }).join('') || '<p class="text-gray-400 text-sm">尚無收藏</p>';
        }

        const revSnap = await db.collection('reviews').where('userId', '==', user.uid).orderBy('timestamp', 'desc').get();
        if (revContainer) {
            revContainer.innerHTML = revSnap.docs.map(function(doc) {
                const r = doc.data();
                const s = (window.allShops || []).find(function(shop) { return shop.id === r.shopId; });
                return `
                    <div class="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-gray-800">${s ? s.name['zh-TW'] : '未知商家'}</span>
                            <span class="text-yellow-500 text-sm font-bold">★ ${r.rating}</span>
                        </div>
                        <p class="text-xs text-gray-400">${r.timestamp ? r.timestamp.toDate().toLocaleDateString() : '剛剛'}</p>
                    </div>
                `;
            }).join('') || '<p class="text-gray-400 text-sm">尚無評價</p>';
        }

        const repSnap = await db.collection('reports').where('userId', '==', user.uid).orderBy('timestamp', 'desc').get();
        if (repContainer) {
            repContainer.innerHTML = repSnap.docs.map(function(doc) {
                const r = doc.data();
                const s = (window.allShops || []).find(function(shop) { return shop.id === r.shopId; });
                return `
                    <div class="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                        <div class="flex justify-between items-start">
                            <span class="font-bold text-gray-800">${s ? s.name['zh-TW'] : '未知商家'}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-bold">處理中</span>
                        </div>
                        <p class="text-xs text-gray-600 mt-2">原因：${r.reason}</p>
                    </div>
                `;
            }).join('') || '<p class="text-gray-400 text-sm">尚無檢舉紀錄</p>';
        }

        document.getElementById('user-dashboard-modal').classList.remove('hidden');
        
        // Initialize Footprint Map
        setTimeout(function() {
            const mapContainer = document.getElementById('dashboard-footprint-map');
            if (!mapContainer) return;
            
            // Clear existing map if any
            if (window.footprintMap) {
                window.footprintMap.remove();
            }
            
            window.footprintMap = L.map('dashboard-footprint-map').setView([23.6978, 120.9605], 7); // Center of Taiwan
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.footprintMap);
            
            const footprintMarkers = L.featureGroup().addTo(window.footprintMap);
            
            // Combine favorites and reviewed shops
            const reviewedShopIds = revSnap.docs.map(function(doc) { return doc.data().shopId; });
            const footprintShopIds = [...new Set([...(window.favoriteShops || []), ...reviewedShopIds])];
            
            const footprintShops = window.allShops.filter(function(s) { return footprintShopIds.includes(s.id) && s.location; });
            
            footprintShops.forEach(function(shop) {
                const isFavorite = window.favoriteShops.includes(shop.id);
                const isReviewed = reviewedShopIds.includes(shop.id);
                
                let iconColor = isFavorite ? 'red' : 'blue';
                if (isFavorite && isReviewed) iconColor = 'purple';
                
                const markerHtml = `<div style="background-color: ${iconColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`;
                const customIcon = L.divIcon({ html: markerHtml, className: 'custom-footprint-icon', iconSize: [12, 12] });
                
                L.marker([shop.location.latitude, shop.location.longitude], { icon: customIcon })
                    .bindPopup(`<div class="text-sm font-bold">${shop.name && shop.name['zh-TW']}</div>`)
                    .addTo(footprintMarkers);
            });
            
            if (footprintShops.length > 0) {
                window.footprintMap.fitBounds(footprintMarkers.getBounds(), { padding: [30, 30], maxZoom: 14 });
            }
        }, 300); // Slight delay to ensure modal is visible for Leaflet to calculate size
        
    } catch (error) {
        window.showErrorModal(error, "showUserDashboard");
    }
};

window.setLanguage = function(lang) {
    try {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            var translation = (window.locales[lang] && window.locales[lang][key]) || (window.locales['zh-TW'] && window.locales['zh-TW'][key]);
            if (translation) {
                el.textContent = translation;
            }
        });
        // Force show nav-links after translation to be safe
        var navLinks = document.querySelector('.nav-links');
        if (navLinks && window.innerWidth >= 768) navLinks.style.display = 'flex';
        
        currentLoadedShops = 0;
        if (window.filterAndDisplayShops) window.filterAndDisplayShops();
    } catch (e) {
        console.error("setLanguage Error:", e);
    }
};
