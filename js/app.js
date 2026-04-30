// app.js initialized

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(reg) {
            console.log('SW registered!', reg);
        }).catch(function(err) {
            console.log('SW registration failed: ', err);
        });
    });
}

// Helper: Open Now Check
function isOpenNow(hoursStr) {
    if (!hoursStr) return false;
    return true; // Mock true for now
}

document.addEventListener('DOMContentLoaded', function() {
    // ===== INITIALIZATION =====
    function initialize() {
        if (document.getElementById('sustainability-map')._leaflet_id) return;
        window.mapInstance = L.map('sustainability-map').setView([25.0330, 121.5654], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.mapInstance);
        window.markersGroup.addTo(window.mapInstance);

        window.fetchShops();
        setupEventListeners();
        window.setLanguage(window.currentLang);
        logVisit();
        
        if (localStorage.getItem('isAdmin')) document.getElementById('admin-indicator').classList.remove('hidden');

        // Add Current Location Control
        L.Control.LocationButton = L.Control.extend({
            onAdd: function(map) {
                var btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
                btn.style.backgroundColor = 'white';
                btn.style.width = '34px';
                btn.style.height = '34px';
                btn.style.cursor = 'pointer';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
                btn.onclick = function() {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(pos) {
                            var lat = pos.coords.latitude;
                            var lng = pos.coords.longitude;
                            map.setView([lat, lng], 15);
                            L.marker([lat, lng]).addTo(map).bindPopup('您的目前位置').openPopup();
                        }, function(err) {
                            alert('無法取得您的位置。');
                        });
                    } else {
                        alert('您的瀏覽器不支援地理位置功能。');
                    }
                };
                return btn;
            }
        });
        new L.Control.LocationButton({ position: 'topleft' }).addTo(window.mapInstance);
    }

    async function logVisit() {
        try {
            await db.collection('analytics').add({
                type: 'page_view',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                referrer: document.referrer || 'direct',
                userAgent: navigator.userAgent
            });
        } catch (err) {
            console.error("Visit logging failed", err);
        }
    }

    function setupEventListeners() {
        // 語言切換
        var langSelect = document.getElementById('language-select');
        var langSelectMobile = document.getElementById('language-select-mobile');
        if (langSelect) langSelect.addEventListener('change', function(e) { window.setLanguage(e.target.value); });
        if (langSelectMobile) langSelectMobile.addEventListener('change', function(e) { window.setLanguage(e.target.value); });

        // 搜尋
        document.getElementById('search-button').addEventListener('click', function() {
            window.currentSearchQuery = document.getElementById('search-input').value.trim();
            window.currentLoadedShops = 0;
            window.filterAndDisplayShops();
        });

        // 類別篩選
        document.getElementById('filter-buttons-container').addEventListener('click', function(e) {
            var btn = e.target.closest('.tag');
            if (!btn) return;
            window.currentFilterCategory = btn.dataset.category;
            
            document.querySelectorAll('#filter-buttons-container .tag').forEach(function(b) { 
                b.classList.remove('active', 'bg-green-600', 'text-white'); 
            });
            btn.classList.add('active', 'bg-green-600', 'text-white');
            
            window.currentLoadedShops = 0;
            window.filterAndDisplayShops();
        });

        // 營業中篩選
        var openNowFilter = document.getElementById('open-now-filter');
        if(openNowFilter) {
            openNowFilter.addEventListener('change', function(e) {
                window.showOpenNow = e.target.checked;
                window.currentLoadedShops = 0;
                window.filterAndDisplayShops();
            });
        }

        // 永續特點篩選
        var ecoFeaturesContainer = document.getElementById('eco-features-container');
        if(ecoFeaturesContainer) {
            ecoFeaturesContainer.addEventListener('click', function(e) {
                var btn = e.target.closest('.eco-filter-btn');
                if (!btn) return;
                var feature = btn.dataset.feature;
                
                if (window.currentEcoFilters.indexOf(feature) !== -1) {
                    window.currentEcoFilters = window.currentEcoFilters.filter(function(f) { return f !== feature; });
                    btn.classList.remove('bg-green-600', 'text-white');
                } else {
                    window.currentEcoFilters.push(feature);
                    btn.classList.add('bg-green-600', 'text-white');
                }
                
                window.currentLoadedShops = 0;
                window.filterAndDisplayShops();
            });
        }

        // 商店列表點擊 (愛心與詳情)
        document.getElementById('shop-cards-container').addEventListener('click', function(e) {
            var favBtn = e.target.closest('.favorite-btn');
            if (favBtn) {
                favBtn.classList.toggle('favorited');
                window.toggleFavorite(favBtn.dataset.shopId);
            }
            
            var detailBtn = e.target.closest('.view-details-btn');
            if (detailBtn) window.showShopDetail(detailBtn.dataset.shopId);
        });

        // 載入更多
        var loadMoreBtn = document.getElementById('load-more-button');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', function() { window.renderShopCards(window.getFilteredShops()); });
        
        // 登入
        var loginBtn = document.getElementById('login-btn');
        var loginBtnMobile = document.getElementById('login-btn-mobile');
        if (loginBtn) loginBtn.addEventListener('click', window.handleLogin);
        if (loginBtnMobile) loginBtnMobile.addEventListener('click', window.handleLogin);

        // Dashboard
        var dashBtn = document.getElementById('dashboard-btn');
        if (dashBtn) dashBtn.addEventListener('click', window.showUserDashboard);
        var closeDashBtn = document.getElementById('close-dashboard-btn');
        if (closeDashBtn) closeDashBtn.onclick = function() { document.getElementById('user-dashboard-modal').classList.add('hidden'); };

        // Auth 狀態監控
        auth.onAuthStateChanged(function(user) {
            window.updateLoginButtons(!!user);
            if (user) {
                if (dashBtn) dashBtn.classList.remove('hidden');
                window.fetchUserFavorites(user.uid);
                db.collection('users').doc(user.uid).get().then(function(doc) {
                    if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'owner')) {
                        var indicator = document.getElementById('admin-indicator');
                        if (indicator) indicator.classList.remove('hidden');
                    }
                });
            } else {
                if (dashBtn) dashBtn.classList.add('hidden');
                window.favoriteShops = JSON.parse(localStorage.getItem('favoriteShops')) || [];
                window.filterAndDisplayShops();
            }
        });

        // 通用 Modal 關閉
        document.addEventListener('click', function(e) {
            var shopModal = document.getElementById('shop-detail-modal');
            if (shopModal && !shopModal.classList.contains('hidden') && e.target === shopModal) {
                shopModal.classList.add('hidden');
            }
            var dashModal = document.getElementById('user-dashboard-modal');
            if (dashModal && !dashModal.classList.contains('hidden') && e.target === dashModal) {
                dashModal.classList.add('hidden');
            }
        });
        
        // 政策連結
        var policyLink = document.getElementById('policy-link');
        if (policyLink) {
            policyLink.onclick = function(e) {
                e.preventDefault();
                document.getElementById('policy-modal').classList.remove('hidden');
            };
        }

        // 手機版選單切換
        var menuToggle = document.getElementById('menu-toggle');
        var mobileMenu = document.getElementById('mobile-menu');
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // 訂閱電子報
        var newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                var email = document.getElementById('newsletter-email').value;
                if (!email) return;
                
                try {
                    var urlParams = new URLSearchParams(window.location.search);
                    var source = urlParams.get('utm_source') || (document.referrer.indexOf('google') !== -1 ? 'Google' : (document.referrer.indexOf('facebook') !== -1 ? 'Facebook' : 'Direct'));
                    
                    await db.collection('newsletter').add({
                        email: email,
                        source: source,
                        subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    var successText = (window.locales[window.currentLang] && window.locales[window.currentLang].newsletterSuccess) || '感謝您的訂閱！';
                    window.showMessage(successText);
                    newsletterForm.reset();
                } catch (err) {
                    window.showErrorModal(err, "Newsletter");
                }
            });
        }

        // 問題回報
        var issueForm = document.getElementById('issue-form');
        if (issueForm) {
            issueForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                var issueText = document.getElementById('issue').value;
                if (!issueText) return;

                try {
                    await db.collection('issues').add({
                        description: issueText,
                        reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending'
                    });
                    var successMsg = document.getElementById('issue-message');
                    if (successMsg) {
                        successMsg.classList.remove('hidden');
                        setTimeout(function() { successMsg.classList.add('hidden'); }, 3000);
                    } else {
                        var successText = (window.locales[window.currentLang] && window.locales[window.currentLang].reportIssueSuccessMsg) || '感謝您的回報！';
                        window.showMessage(successText);
                    }
                    issueForm.reset();
                } catch (err) {
                    window.showErrorModal(err, "ReportIssue");
                }
            });
        }
    }

    // ===== CORE LOGIC =====
    window.getFilteredShops = function() {
        var branches = window.allShops.filter(function(s) { return s.isBranch && s.parentId; });
        
        var filtered = window.allShops.filter(function(shop) {
            if (!shop || !shop.id) return false;
            if (shop.isBranch) return false;

            if (window.currentFilterCategory === 'favorites') return window.favoriteShops.indexOf(shop.id) !== -1;

            var matchesCategory = window.currentFilterCategory === 'all' || 
                                   (shop.type && shop.type['zh-TW']) === window.currentFilterCategory;

            var name = (shop.name && shop.name[window.currentLang]) || (shop.name && shop.name['zh-TW']) || '';
            var address = (shop.address && shop.address[window.currentLang]) || (shop.address && shop.address['zh-TW']) || '';
            var desc = (shop.description && shop.description[window.currentLang]) || (shop.description && shop.description['zh-TW']) || '';
            var query = window.currentSearchQuery.toLowerCase();
            
            var matchesSearch = !query ||
                name.toLowerCase().indexOf(query) !== -1 ||
                address.toLowerCase().indexOf(query) !== -1 ||
                desc.toLowerCase().indexOf(query) !== -1;

            if (query && !matchesSearch) {
                var shopBranches = branches.filter(function(b) { return b.parentId === shop.id; });
                matchesSearch = shopBranches.some(function(b) {
                    var bName = (b.name && b.name['zh-TW']) || '';
                    var bAddr = (b.address && b.address['zh-TW']) || '';
                    return bName.toLowerCase().indexOf(query) !== -1 || bAddr.toLowerCase().indexOf(query) !== -1;
                });
            }

            // Check Open Now
            var matchesOpenNow = true;
            if (window.showOpenNow) {
                matchesOpenNow = isOpenNow(shop.openingHours);
            }
            
            // Check Eco Features
            var matchesEcoFeatures = true;
            if (window.currentEcoFilters.length > 0) {
                if (!shop.ecoFeatures || !Array.isArray(shop.ecoFeatures)) {
                    matchesEcoFeatures = false;
                } else {
                    matchesEcoFeatures = window.currentEcoFilters.every(function(f) { 
                        return shop.ecoFeatures.indexOf(f) !== -1; 
                    });
                }
            }

            return matchesCategory && matchesSearch && matchesOpenNow && matchesEcoFeatures;
        });

        return filtered.sort(function(a, b) {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return 0;
        });
    };

    window.filterAndDisplayShops = function() {
        var filteredShops = window.getFilteredShops();
        window.renderShopCards(filteredShops);
        window.updateMapMarkers(filteredShops);
    };

    initialize();
});
