// ===== GREENROOF UI MODULE: MAP-ROUTE =====
// Optimized for MapTiler SDK & Vector Maps

window.Gateway.register('updateMapMarkers', function(filteredShops) {
    if (!window.mapInstance || !window.maptilersdk) return;
    
    if (window.googleMarkers && window.googleMarkers.length > 0) {
        window.googleMarkers.forEach(function(m) { if (m.remove) m.remove(); });
    }
    window.googleMarkers = [];
    
    var bounds = new maptilersdk.LngLatBounds();
    var validCount = 0;
    
    filteredShops.forEach(function(shop) {
        if (shop.location && shop.location.latitude && shop.location.longitude) {
            validCount++;
            var lng = Number(shop.location.longitude);
            var lat = Number(shop.location.latitude);
            bounds.extend([lng, lat]);
            
            var shopName = (shop.name && shop.name[window.currentLang || 'zh-TW']) || (shop.name && shop.name['zh-TW']) || 'Shop';
            var btnText = (window.locales[window.currentLang || 'zh-TW'] && window.locales[window.currentLang || 'zh-TW'].viewDetailsBtn) || 'View Details';
            
            var popupHTML = '<div class="p-2"><h3 class="font-bold text-base text-gray-900 mb-1">' + shopName + '</h3><button onclick="window.showShopDetail(\'' + shop.id + '\')" class="text-green-600 font-bold text-xs hover:underline block cursor-pointer">' + btnText + '</button></div>';
            var popup = new maptilersdk.Popup({ offset: 25 }).setHTML(popupHTML);
            
            var marker = new maptilersdk.Marker({ color: '#16a34a' })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(window.mapInstance);
                
            window.googleMarkers.push(marker);
        }
    });
    
    if (validCount > 0) {
        window.mapInstance.fitBounds(bounds, { padding: 60, maxZoom: 16 });
    }
});

window.Gateway.register('surpriseMe', function() {
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
        var lng = Number(randomShop.location.longitude);
        var lat = Number(randomShop.location.latitude);
        window.mapInstance.flyTo({ center: [lng, lat], zoom: 16, duration: 1500 });
        setTimeout(function() {
            window.showShopDetail(randomShop.id);
        }, 800);
    } else {
        window.showShopDetail(randomShop.id);
    }
});

window.Gateway.register('toggleRoutingShop', function(shopId) {
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
});

window.Gateway.register('updateRoutingPanel', function() {
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
});

window.Gateway.register('drawRoutePolyline', function() {
    if (!window.mapInstance || !window.maptilersdk) return;
    
    var coords = [];
    var bounds = new maptilersdk.LngLatBounds();
    
    window.activeRoutingList.forEach(function(id) {
        var shop = window.allShops.find(function(s) { return s.id === id; });
        if (shop && shop.location && shop.location.latitude && shop.location.longitude) {
            var lng = Number(shop.location.longitude);
            var lat = Number(shop.location.latitude);
            coords.push([lng, lat]);
            bounds.extend([lng, lat]);
        }
    });
    
    var geoJson = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: coords
        }
    };
    
    if (window.mapInstance.getSource('route-source')) {
        window.mapInstance.getSource('route-source').setData(geoJson);
    } else {
        window.mapInstance.addSource('route-source', {
            type: 'geojson',
            data: geoJson
        });
        window.mapInstance.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route-source',
            paint: {
                'line-color': '#3b82f6',
                'line-width': 4,
                'line-dasharray': [2, 2]
            }
        });
    }
    
    if (coords.length >= 2) {
        window.mapInstance.fitBounds(bounds, { padding: 60 });
    }
});
