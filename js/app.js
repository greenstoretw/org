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
        
        if (localStorage.getItem('isAdmin')) document.getElementById('admin-indicator').classList.remove('hidden');
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
            window.currentLoadedShops = 0;
            window.filterAndDisplayShops();
        });

        // 商店列表點擊 (愛心與詳情)
        document.getElementById('shop-cards-container').addEventListener('click', e => {
            const btn = e.target.closest('.favorite-btn');
            if (btn) window.toggleFavorite(btn.dataset.shopId);
            
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

        // 通用 Modal 關閉
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.fixed');
                if (modal) modal.classList.add('hidden');
            });
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
    }

    // ===== CORE LOGIC (Remaining in app.js for coordination) =====
    window.getFilteredShops = function() {
        return window.allShops.filter(shop => {
            if (!shop || !shop.id) return false;
            if (window.currentFilterCategory === 'favorites') return window.favoriteShops.includes(shop.id);

            const matchesCategory = window.currentFilterCategory === 'all' || 
                                   (shop.type && shop.type['zh-TW']) === window.currentFilterCategory;

            const name = (shop.name && shop.name[window.currentLang]) || (shop.name && shop.name['zh-TW']) || '';
            const address = (shop.address && shop.address[window.currentLang]) || (shop.address && shop.address['zh-TW']) || '';
            const desc = (shop.description && shop.description[window.currentLang]) || (shop.description && shop.description['zh-TW']) || '';
            const query = window.currentSearchQuery.toLowerCase();
            
            const matchesSearch = !query ||
                name.toLowerCase().includes(query) ||
                address.toLowerCase().includes(query) ||
                desc.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    };

    window.filterAndDisplayShops = function() {
        const filteredShops = window.getFilteredShops();
        window.renderShopCards(filteredShops);
        window.updateMapMarkers(filteredShops);
    };

    initialize();
});
