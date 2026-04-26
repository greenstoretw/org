document.addEventListener('DOMContentLoaded', () => {
    // ===== GLOBAL STATE =====
    let allShops = [];
    let currentFilterCategory = 'all';
    let currentSearchQuery = '';
    const shopsPerPage = 6;
    let currentLoadedShops = 0;
    let mapInstance;
    let markersGroup = L.featureGroup();
    let favoriteShops = JSON.parse(localStorage.getItem('favoriteShops')) || [];
    let currentLang = localStorage.getItem('lang') || 'zh-TW';

    // ===== UI ELEMENTS =====
    const ui = {
        loadingOverlay: document.getElementById('loading-overlay'),
        adminIndicator: document.getElementById('admin-indicator'),
        shopCardsContainer: document.getElementById('shop-cards-container'),
        loadMoreButton: document.getElementById('load-more-button'),
        announcementBar: document.getElementById('announcement-bar'),
        announcementText: document.getElementById('announcement-text'),
        messageModal: document.getElementById('message-modal'),
        messageModalText: document.getElementById('message-modal-text'),
        shopDetailModal: document.getElementById('shop-detail-modal'),
        shopDetailContainer: document.getElementById('shop-detail-container'),
        errorModal: document.getElementById('error-modal'),
        errorDetails: document.getElementById('error-details'),
        policyModal: document.getElementById('policy-modal'),
        policyModalBody: document.getElementById('policy-modal-body')
    };

    // ===== FIREBASE DATA FETCHING =====
    async function fetchShops() {
        ui.loadingOverlay.classList.remove('hidden');
        try {
            // 只抓取 status 為 'active' 的商家 (支援回收桶邏輯)
            const snapshot = await db.collection('merchants').where('status', '==', 'active').get();
            allShops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // 初始化篩選按鈕
            renderFilterButtons();
            filterAndDisplayShops();
        } catch (error) {
            console.error("Error fetching shops:", error);
            showErrorModal(error, "fetchShops");
        } finally {
            ui.loadingOverlay.classList.add('hidden');
        }
    }

    function renderFilterButtons() {
        const shopTypes = [...new Set(allShops.map(s => s.type && s.type['zh-TW']))];
        const filterContainer = document.getElementById('filter-buttons-container');
        // 清空除了「全部」和「收藏」以外的按鈕
        const defaultBtns = Array.from(filterContainer.querySelectorAll('button')).slice(0, 2);
        filterContainer.innerHTML = '';
        defaultBtns.forEach(btn => filterContainer.appendChild(btn));

        shopTypes.forEach(type => {
            if(!type) return;
            const btn = document.createElement('button');
            btn.className = 'tag px-3 py-1 rounded-full text-sm';
            btn.dataset.category = type; 
            btn.textContent = type;
            filterContainer.appendChild(btn);
        });
    }

    // ===== CORE FUNCTIONS (UPDATED FOR MULTILINGUAL OBJECTS) =====
    function getFilteredShops() {
        return allShops.filter(shop => {
            if (!shop || !shop.id) return false;
            if (currentFilterCategory === 'favorites') return favoriteShops.includes(shop.id);

            const matchesCategory = currentFilterCategory === 'all' || (shop.type && shop.type['zh-TW']) === currentFilterCategory;

            const name = (shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW']) || '';
            const address = (shop.address && shop.address[currentLang]) || (shop.address && shop.address['zh-TW']) || '';
            const desc = (shop.description && shop.description[currentLang]) || (shop.description && shop.description['zh-TW']) || '';
            const query = currentSearchQuery.toLowerCase();
            
            const matchesSearch = !query ||
                name.toLowerCase().includes(query) ||
                address.toLowerCase().includes(query) ||
                desc.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    }

    function renderShopCards(filteredShops) {
        if (currentLoadedShops === 0) ui.shopCardsContainer.innerHTML = '';
        const shopsToDisplay = filteredShops.slice(currentLoadedShops, currentLoadedShops + shopsPerPage);
        
        shopsToDisplay.forEach(shop => {
            const isFavorited = favoriteShops.includes(shop.id);
            const card = document.createElement('div');
            card.className = 'shop-card bg-white rounded-xl overflow-hidden shadow-md relative';
            card.innerHTML = `
                <div class="h-48 bg-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-shop-id="${shop.id}">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
                <div class="p-6">
                    <h3 class="text-xl font-bold">${(shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW'])}</h3>
                    <div class="flex flex-wrap gap-1 mt-1 mb-2">
                        <span class="tag px-2 py-1 rounded-full text-xs">${(shop.type && shop.type[currentLang]) || (shop.type && shop.type['zh-TW'])}</span>
                    </div>
                    <p class="text-gray-600 my-4 h-20 overflow-hidden">${(shop.description && shop.description[currentLang]) || (shop.description && shop.description['zh-TW'])}</p>
                    <button class="block w-full text-center py-2 btn-primary rounded-lg font-medium view-details-btn" data-shop-id="${shop.id}">${translations[currentLang].viewDetailsBtn}</button>
                </div>
            `;
            ui.shopCardsContainer.appendChild(card);
        });

        currentLoadedShops += shopsToDisplay.length;
        ui.loadMoreButton.classList.toggle('hidden', currentLoadedShops >= filteredShops.length);
    }

    function updateMapMarkers(filteredShops) {
        if (!mapInstance) return;
        markersGroup.clearLayers();
        filteredShops.forEach(shop => {
            if(shop.location) {
                const marker = L.marker([shop.location.latitude, shop.location.longitude]);
                marker.bindPopup(`
                    <div class="p-1">
                        <h3 class="font-bold text-base">${(shop.name && shop.name[currentLang]) || (shop.name && shop.name['zh-TW'])}</h3>
                        <button onclick="window.showShopDetail('${shop.id}')" class="text-green-600 text-sm hover:underline">${translations[currentLang].viewDetailsBtn}</button>
                    </div>
                `);
                markersGroup.addLayer(marker);
            }
        });
        if (filteredShops.length > 0 && markersGroup.getLayers().length > 0) {
           mapInstance.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
        }
    }

    function filterAndDisplayShops() {
        const filteredShops = getFilteredShops();
        renderShopCards(filteredShops);
        updateMapMarkers(filteredShops);
    }

    // ===== AUTHENTICATION & ADMIN =====
    function handleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).then(result => {
            const user = result.user;
            // 檢查是否為管理員 (需預先在 Firestore users 集合中設定)
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().role === 'admin') {
                    localStorage.setItem('isAdmin', 'true');
                    ui.adminIndicator.classList.remove('hidden');
                }
                showMessage(`${user.displayName} 登入成功`);
            });
        }).catch(error => showErrorModal(error, "Login"));
    }

    // ===== EVENT LISTENERS & INITIALIZATION =====
    function initialize() {
        if (document.getElementById('sustainability-map')._leaflet_id) return;
        mapInstance = L.map('sustainability-map').setView([25.0330, 121.5654], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
        markersGroup.addTo(mapInstance);

        fetchShops();
        setupEventListeners();
        setLanguage(currentLang);
        
        if (localStorage.getItem('isAdmin')) ui.adminIndicator.classList.remove('hidden');
    }

    function setupEventListeners() {
        document.getElementById('language-select').addEventListener('change', (e) => setLanguage(e.target.value));
        document.getElementById('search-button').addEventListener('click', () => {
            currentSearchQuery = document.getElementById('search-input').value.trim();
            currentLoadedShops = 0;
            filterAndDisplayShops();
        });
        document.getElementById('filter-buttons-container').addEventListener('click', (e) => {
            const btn = e.target.closest('.tag');
            if (!btn) return;
            currentFilterCategory = btn.dataset.category;
            currentLoadedShops = 0;
            filterAndDisplayShops();
        });
        ui.loadMoreButton.addEventListener('click', () => renderShopCards(getFilteredShops()));
        // 隱藏快捷鍵登入，改為點擊 Logo 或特定按鈕觸發 Firebase Auth
        document.addEventListener('keydown', e => (e.ctrlKey && e.shiftKey && e.key === 'L') && handleLogin());
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = translations[lang]?.[key] || translations['zh-TW'][key];
        });
        currentLoadedShops = 0;
        filterAndDisplayShops();
    }

    initialize();
});
