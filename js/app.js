// ===== GLOBAL STATE (SHARED ACROSS MODULES) =====
window.allShops = [];
window.currentFilterCategory = 'all';
window.currentSearchQuery = '';
window.shopsPerPage = 6;
window.currentLoadedShops = 0;
window.mapInstance = null;
window.markersGroup = L.featureGroup();
window.favoriteShops = [];
window.currentLang = localStorage.getItem('lang') || 'zh-TW';
window.currentEcoFilters = [];
window.showOpenNow = false;

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW registered!', reg);
        }).catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}

// Helper: Open Now Check
function isOpenNow(hoursStr) {
    if (!hoursStr) return false;
    // Simple heuristic: just check if there's any time string. For a real app, parse "10:00-20:00".
    // As a placeholder for "Open Now" logic since data format is unstructured.
    // In a real scenario we'd parse day of week and current hour.
    return true; // Mock true for now unless we have structured data
}

document.addEventListener('DOMContentLoaded', () => {
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
                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>`;
                btn.onclick = function() {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(pos => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            map.setView([lat, lng], 15);
                            L.marker([lat, lng]).addTo(map).bindPopup('您的目前位置').openPopup();
                        }, err => {
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
        const langSelect = document.getElementById('language-select');
        const langSelectMobile = document.getElementById('language-select-mobile');
        if (langSelect) langSelect.addEventListener('change', (e) => window.setLanguage(e.target.value));
        if (langSelectMobile) langSelectMobile.addEventListener('change', (e) => window.setLanguage(e.target.value));

        // 搜尋
        document.getElementById('search-button').addEventListener('click', () => {
            window.currentSearchQuery = document.getElementById('search-input').value.trim();
            window.currentLoadedShops = 0;
            window.filterAndDisplayShops();
        });

        // 類別篩選
        document.getElementById('filter-buttons-container').addEventListener('click', (e) => {
            const btn = e.target.closest('.tag');
            if (!btn) return;
            window.currentFilterCategory = btn.dataset.category;
            
            // UI Update for category
            document.querySelectorAll('#filter-buttons-container .tag').forEach(b => b.classList.remove('active', 'bg-green-600', 'text-white'));
            btn.classList.add('active', 'bg-green-600', 'text-white');
            
            window.currentLoadedShops = 0;
            window.filterAndDisplayShops();
        });

        // 營業中篩選
        const openNowFilter = document.getElementById('open-now-filter');
        if(openNowFilter) {
            openNowFilter.addEventListener('change', (e) => {
                window.showOpenNow = e.target.checked;
                window.currentLoadedShops = 0;
                window.filterAndDisplayShops();
            });
        }

        // 永續特點篩選
        const ecoFeaturesContainer = document.getElementById('eco-features-container');
        if(ecoFeaturesContainer) {
            ecoFeaturesContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.eco-filter-btn');
                if (!btn) return;
                const feature = btn.dataset.feature;
                
                if (window.currentEcoFilters.includes(feature)) {
                    window.currentEcoFilters = window.currentEcoFilters.filter(f => f !== feature);
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
        document.getElementById('shop-cards-container').addEventListener('click', e => {
            const btn = e.target.closest('.favorite-btn');
            if (btn) {
                // Optimistic UI Update: Toggle class immediately
                btn.classList.toggle('favorited');
                window.toggleFavorite(btn.dataset.shopId);
            }
            
            const detailBtn = e.target.closest('.view-details-btn');
            if (detailBtn) window.showShopDetail(detailBtn.dataset.shopId);
        });

        // 載入更多
        const loadMoreBtn = document.getElementById('load-more-button');
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => window.renderShopCards(window.getFilteredShops()));
        
        // 登入
        const loginBtn = document.getElementById('login-btn');
        const loginBtnMobile = document.getElementById('login-btn-mobile');
        if (loginBtn) loginBtn.addEventListener('click', window.handleLogin);
        if (loginBtnMobile) loginBtnMobile.addEventListener('click', window.handleLogin);

        // Dashboard
        const dashBtn = document.getElementById('dashboard-btn');
        if (dashBtn) dashBtn.addEventListener('click', window.showUserDashboard);
        const closeDashBtn = document.getElementById('close-dashboard-btn');
        if (closeDashBtn) closeDashBtn.onclick = () => document.getElementById('user-dashboard-modal').classList.add('hidden');

        // Auth 狀態監控
        auth.onAuthStateChanged(user => {
            window.updateLoginButtons(!!user);
            if (user) {
                if (dashBtn) dashBtn.classList.remove('hidden');
                window.fetchUserFavorites(user.uid);
                db.collection('users').doc(user.uid).get().then(doc => {
                    if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'owner')) {
                        document.getElementById('admin-indicator').classList.remove('hidden');
                    }
                });
            } else {
                if (dashBtn) dashBtn.classList.add('hidden');
                window.favoriteShops = JSON.parse(localStorage.getItem('favoriteShops')) || [];
                window.filterAndDisplayShops();
            }
        });

        // 通用 Modal 關閉 (shop detail)
        document.addEventListener('click', (e) => {
            const shopModal = document.getElementById('shop-detail-modal');
            if (shopModal && !shopModal.classList.contains('hidden') && e.target === shopModal) {
                shopModal.classList.add('hidden');
            }
            const dashModal = document.getElementById('user-dashboard-modal');
            if (dashModal && !dashModal.classList.contains('hidden') && e.target === dashModal) {
                dashModal.classList.add('hidden');
            }
        });
        
        // 政策連結
        const policyLink = document.getElementById('policy-link');
        if (policyLink) {
            policyLink.onclick = (e) => {
                e.preventDefault();
                // 這裡可以串接 API 獲取最新政策，目前先顯示 Modal
                document.getElementById('policy-modal').classList.remove('hidden');
            };
        }

        // 手機版選單切換
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // 訂閱電子報
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('newsletter-email').value;
                if (!email) return;
                
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const source = urlParams.get('utm_source') || (document.referrer.includes('google') ? 'Google' : (document.referrer.includes('facebook') ? 'Facebook' : 'Direct'));
                    
                    await db.collection('newsletter').add({
                        email,
                        source: source,
                        subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    window.showMessage(window.locales[window.currentLang]?.newsletterSuccess || '感謝您的訂閱！');
                    newsletterForm.reset();
                } catch (err) {
                    window.showErrorModal(err, "Newsletter");
                }
            });
        }

        // 問題回報
        const issueForm = document.getElementById('issue-form');
        if (issueForm) {
            issueForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const issueText = document.getElementById('issue').value;
                if (!issueText) return;

                try {
                    await db.collection('issues').add({
                        description: issueText,
                        reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending'
                    });
                    const successMsg = document.getElementById('issue-message');
                    if (successMsg) {
                        successMsg.classList.remove('hidden');
                        setTimeout(() => successMsg.classList.add('hidden'), 3000);
                    } else {
                        window.showMessage(window.locales[window.currentLang]?.reportIssueSuccessMsg || '感謝您的回報！');
                    }
                    issueForm.reset();
                } catch (err) {
                    window.showErrorModal(err, "ReportIssue");
                }
            });
        }
    }

    // ===== CORE LOGIC (Remaining in app.js for coordination) =====
    window.getFilteredShops = function() {
        const branches = window.allShops.filter(s => s.isBranch && s.parentId);
        
        let filtered = window.allShops.filter(shop => {
            if (!shop || !shop.id) return false;
            if (shop.isBranch) return false; // Hide branches from top-level

            if (window.currentFilterCategory === 'favorites') return window.favoriteShops.includes(shop.id);

            const matchesCategory = window.currentFilterCategory === 'all' || 
                                   (shop.type && shop.type['zh-TW']) === window.currentFilterCategory;

            const name = (shop.name && shop.name[window.currentLang]) || (shop.name && shop.name['zh-TW']) || '';
            const address = (shop.address && shop.address[window.currentLang]) || (shop.address && shop.address['zh-TW']) || '';
            const desc = (shop.description && shop.description[window.currentLang]) || (shop.description && shop.description['zh-TW']) || '';
            const query = window.currentSearchQuery.toLowerCase();
            
            let matchesSearch = !query ||
                name.toLowerCase().includes(query) ||
                address.toLowerCase().includes(query) ||
                desc.toLowerCase().includes(query);

            if (query && !matchesSearch) {
                const shopBranches = branches.filter(b => b.parentId === shop.id);
                matchesSearch = shopBranches.some(b => {
                    const bName = (b.name && window.currentLang) ? b.name[window.currentLang] : (b.name?.['zh-TW'] || '');
                    const bAddr = (b.address && window.currentLang) ? b.address[window.currentLang] : (b.address?.['zh-TW'] || '');
                    return bName.toLowerCase().includes(query) || bAddr.toLowerCase().includes(query);
                });
            }

            // Check Open Now
            let matchesOpenNow = true;
            if (window.showOpenNow) {
                matchesOpenNow = isOpenNow(shop.openingHours);
            }
            
            // Check Eco Features
            let matchesEcoFeatures = true;
            if (window.currentEcoFilters.length > 0) {
                if (!shop.ecoFeatures || !Array.isArray(shop.ecoFeatures)) {
                    matchesEcoFeatures = false;
                } else {
                    matchesEcoFeatures = window.currentEcoFilters.every(f => shop.ecoFeatures.includes(f));
                }
            }

            return matchesCategory && matchesSearch && matchesOpenNow && matchesEcoFeatures;
        });

        // Optimization: Sort by 'featured' first, then by name
        return filtered.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return 0;
        });
    };

    window.filterAndDisplayShops = function() {
        const filteredShops = window.getFilteredShops();
        window.renderShopCards(filteredShops);
        window.updateMapMarkers(filteredShops);
    };

    initialize();
});
