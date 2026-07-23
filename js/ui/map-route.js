// ===== GREENROOF UI MODULE: MAP-ROUTE =====
// This file is modularly extracted and registered with the Gateway router.
// Compatibility is maintained globally via window.Gateway.

window.Gateway.register('updateMapMarkers', function(filteredShops) {
    if (!window.mapInstance || !window.google || !window.google.maps) return;
    if (window.googleMarkers && window.googleMarkers.length > 0) {
        window.googleMarkers.forEach(function(m) { m.setMap(null); });
    }
    window.googleMarkers = [];
    
    var bounds = new google.maps.LatLngBounds();
    var validCount = 0;
    
    filteredShops.forEach(function(shop) {
        if(shop.location && shop.location.latitude && shop.location.longitude) {
            validCount++;
            var pos = { lat: Number(shop.location.latitude), lng: Number(shop.location.longitude) };
            bounds.extend(pos);
            
            var shopName = (shop.name && shop.name[window.currentLang || 'zh-TW']) || (shop.name && shop.name['zh-TW']) || 'Shop';
            var btnText = (window.locales[window.currentLang || 'zh-TW'] && window.locales[window.currentLang || 'zh-TW'].viewDetailsBtn) || 'View Details';
            
            var marker = new google.maps.Marker({
                position: pos,
                map: window.mapInstance,
                title: shopName
            });
            
            var infoWindow = new google.maps.InfoWindow({
                content: '<div class="p-1"><h3 class="font-bold text-base">' + shopName + '</h3><button onclick="window.showShopDetail(\'' + shop.id + '\')" class="text-green-600 text-sm hover:underline mt-1 block cursor-pointer">' + btnText + '</button></div>'
            });
            
            marker.addListener('click', function() {
                if (window.currentInfoWindow) window.currentInfoWindow.close();
                infoWindow.open(window.mapInstance, marker);
                window.currentInfoWindow = infoWindow;
            });
            
            window.googleMarkers.push(marker);
        }
    });
    
    if (validCount > 0) {
        window.mapInstance.fitBounds(bounds);
        if (validCount === 1) {
            window.mapInstance.setZoom(15);
        }
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
        window.mapInstance.panTo({ lat: Number(randomShop.location.latitude), lng: Number(randomShop.location.longitude) });
        window.mapInstance.setZoom(16);
        setTimeout(function() {
            window.showShopDetail(randomShop.id);
        }, 600);
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
    if (!window.mapInstance || !window.google || !window.google.maps) return;
    
    if (window.routingPolyline) {
        window.routingPolyline.setMap(null);
        window.routingPolyline = null;
    }
    
    var path = [];
    var bounds = new google.maps.LatLngBounds();
    
    window.activeRoutingList.forEach(function(id) {
        var shop = window.allShops.find(function(s) { return s.id === id; });
        if (shop && shop.location && shop.location.latitude && shop.location.longitude) {
            var pos = { lat: Number(shop.location.latitude), lng: Number(shop.location.longitude) };
            path.push(pos);
            bounds.extend(pos);
        }
    });
    
    if (path.length >= 2) {
        window.routingPolyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: window.mapInstance
        });
        
        window.mapInstance.fitBounds(bounds);
    }
});
