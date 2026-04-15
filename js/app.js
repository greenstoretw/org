document.addEventListener('DOMContentLoaded', () => {
    // ===== CONFIGURATION =====
    // !!! 重要 !!! 請務必貼上您從 Google Apps Script「新增部署作業」後取得的「新」網址。
    const API_URL = 'https://script.google.com/macros/s/AKfycbzVebFWCKnDEiJOc1bJKtc5qIHifZceuXssrwb7Zir6FYOQLokhgzNoFeLZkFdLK7f5oA/exec';

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

    // ===== API & ERROR HANDLING =====
    function showErrorModal(error, action) {
        let details = `Action: ${action}\n`;
        details += `Error: ${error.name || 'Unknown Error'}: ${error.message}\n\n`;
        if(error.responseText) {
            details += `Backend Response:\n------------------\n${error.responseText}\n------------------\n\n`;
        }
        if(error.stack) {
            details += `Stack Trace:\n${error.stack}`;
        }
        ui.errorDetails.textContent = details;
        ui.errorModal.classList.remove('hidden');
    }
    
    async function apiFetch(action, payload = {}, requiresAuth = false) {
        ui.loadingOverlay.classList.remove('hidden');
        try {
            const token = localStorage.getItem('authToken');
            if (requiresAuth && !token) {
                throw new Error("Authentication required.");
            }
            
            const body = { action, ...payload };
            if (requiresAuth) body.token = token;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(body),
                mode: 'cors'
            });
            
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                const parseError = new Error("Failed to parse JSON response from backend.");
                parseError.responseText = text;
                throw parseError;
            }

            if (result.status === 'error') throw new Error(result.message);
            return result.data;

        } catch (error) {
            console.error(`API Fetch Error (${action}):`, error);
            showErrorModal(error, action);
            return null;
        } finally {
            ui.loadingOverlay.classList.add('hidden');
        }
    }

    // ===== CORE FUNCTIONS =====
    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = translations[lang]?.[key] || translations['zh-TW'][key];
            if (el.placeholder) {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        });
        
        document.getElementById('language-select').value = lang;
        document.getElementById('language-select-mobile').value = lang;
        
        currentLoadedShops = 0;
        filterAndDisplayShops();
        
        if (!ui.shopDetailModal.classList.contains('hidden')) {
            const shopId = ui.shopDetailModal.dataset.shopId;
            if (shopId) showShopDetail(shopId);
        }
    }

    function getFilteredShops() {
        return allShops.filter(shop => {
            if (!shop || !shop.id) return false;
            
            if (currentFilterCategory === 'favorites') {
                return favoriteShops.includes(shop.id);
            }

            const matchesCategory = currentFilterCategory === 'all' || (shop['type_zh-TW']) === currentFilterCategory;

            const name = shop[`name_${currentLang}`] || shop['name_zh-TW'] || '';
            const address = shop[`address_${currentLang}`] || shop['address_zh-TW'] || '';
            const desc = shop[`description_${currentLang}`] || shop['description_zh-TW'] || '';
            const query = currentSearchQuery.toLowerCase();
            
            const matchesSearch = !query ||
                name.toLowerCase().includes(query) ||
                address.toLowerCase().includes(query) ||
                desc.toLowerCase().includes(query);

            return matchesCategory && matchesSearch;
        });
    }

    function renderShopCards(filteredShops) {
        if (currentLoadedShops === 0) {
            ui.shopCardsContainer.innerHTML = '';
        }

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
                    <div>
                        <h3 class="text-xl font-bold">${shop[`name_${currentLang}`] || shop['name_zh-TW']}</h3>
                        <div class="flex flex-wrap gap-1 mt-1 mb-2">
                            <span class="tag px-2 py-1 rounded-full text-xs">${shop[`type_${currentLang}`] || shop['type_zh-TW']}</span>
                            ${shop.badges ? shop.badges.split(',').map(b => `<span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm"><i class="fas fa-medal mr-1"></i>${b.trim()}</span>`).join('') : ''}
                        </div>
                        <p class="text-gray-600 my-4 h-20 overflow-hidden">${shop[`description_${currentLang}`] || shop['description_zh-TW']}</p>
                    </div>
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
            if(shop.lat && shop.lng) {
                const marker = L.marker([shop.lat, shop.lng]);
                marker.bindPopup(`
                    <div class="p-1">
                        <h3 class="font-bold text-base">${shop[`name_${currentLang}`] || shop['name_zh-TW']}</h3>
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
    
    window.showShopDetail = (shopId) => {
        const shop = allShops.find(s => s.id === shopId);
        if (!shop) return;
        
        ui.shopDetailModal.dataset.shopId = shopId;
        const T = (key) => translations[currentLang][key] || translations['zh-TW'][key];

        ui.shopDetailContainer.innerHTML = `
            <div class="shop-detail-header py-12 text-white rounded-t-xl text-center relative">
                <h1 class="text-3xl font-bold">${shop[`name_${currentLang}`] || shop['name_zh-TW']}</h1>
                <p class="text-lg">${shop[`type_${currentLang}`] || shop['type_zh-TW']}</p>
                <button id="close-modal" class="absolute top-4 right-4 bg-white/80 rounded-full p-2 text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div class="p-6">
                 <p class="text-gray-700 mb-4">${shop[`longDescription_${currentLang}`] || shop[`longDescription_zh-TW`] || shop[`description_${currentLang}`] || shop['description_zh-TW'] || T('notProvided')}</p>
                 <div class="bg-green-50 p-4 rounded-xl space-y-2">
                    <p><strong>${T('modalAddress')}:</strong> ${shop[`address_${currentLang}`] || shop['address_zh-TW'] || T('notProvided')}</p>
                    <p><strong>${T('modalPhone')}:</strong> ${shop.phone || T('notProvided')}</p>
                    <p><strong>${T('modalWebsite')}:</strong> ${shop.website ? `<a href="//${shop.website.replace(/^https?:\/\//,'')}" target="_blank" class="text-green-600 hover:underline">${shop.website}</a>` : T('notProvided')}</p>
                 </div>
                 ${localStorage.getItem('authToken') ? `<button id="recommend-btn" data-shop-id="${shopId}" class="mt-4 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">${T('adminRecommendBtn')}</button>` : ''}
            </div>
        `;
        
        ui.shopDetailModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        document.getElementById('close-modal').addEventListener('click', closeModal);
        const recommendBtn = document.getElementById('recommend-btn');
        if(recommendBtn) recommendBtn.addEventListener('click', handleRecommend);
    }
    
    function closeModal() {
        ui.shopDetailModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    function showMessage(message) {
        ui.messageModalText.textContent = message;
        ui.messageModal.classList.remove('hidden');
    }

    async function showPolicies() {
        const policies = await apiFetch('getPublicPolicies');
        if (policies) {
            const T = (key) => translations[currentLang][key] || key.charAt(0).toUpperCase() + key.slice(1);
            
            ui.policyModalBody.innerHTML = policies
                .map(policy => {
                    const title = T(policy.key);
                    // 將 \n 轉換為 <br>，並將純文字 URL 轉換為可點擊的連結
                    const contentWithBreaks = policy.value.replace(/\n/g, '<br />');
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const content = contentWithBreaks.replace(urlRegex, '<a href="$1" target="_blank" class="text-green-600 hover:underline">$1</a>');
                    return `<h3 class="text-xl font-bold mt-4 mb-2 first:mt-0">${title}</h3><div class="text-gray-700 leading-relaxed">${content}</div>`;
                }).join('');

            ui.policyModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    // ===== EVENT HANDLERS =====
    function handleSearch() {
        currentSearchQuery = document.getElementById('search-input').value.trim();
        currentLoadedShops = 0;
        filterAndDisplayShops();
    }

    function handleFilter(e) {
        const btn = e.target.closest('.tag');
        if (!btn) return;
        document.querySelectorAll('#filter-buttons-container .tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilterCategory = btn.dataset.category;
        currentLoadedShops = 0;
        filterAndDisplayShops();
    }
    
    function toggleFavorite(shopId) {
        const index = favoriteShops.indexOf(shopId);
        if (index > -1) {
            favoriteShops.splice(index, 1);
        } else {
            favoriteShops.push(shopId);
        }
        localStorage.setItem('favoriteShops', JSON.stringify(favoriteShops));
        
        const btn = document.querySelector(`.favorite-btn[data-shop-id="${shopId}"]`);
        if(btn) btn.classList.toggle('favorited', index === -1);

        if (currentFilterCategory === 'favorites') {
            currentLoadedShops = 0;
            filterAndDisplayShops();
        }
    }

    async function handleNewsletter(e) {
        e.preventDefault();
        const email = document.getElementById('newsletter-email').value.trim();
        if (!email) return;
        const result = await apiFetch('subscribe', { email });
        if (result) {
            showMessage(result.message || translations[currentLang].newsletterSuccess);
            e.target.reset();
        }
    }
    
    async function handleRecommend(e) {
        const shopId = e.target.dataset.shopId;
        if(!shopId) return;
        
        showMessage(translations[currentLang].recommendationSending);
        
        const result = await apiFetch('sendRecommendation', { shopId }, true);
        if (result) {
            showMessage(result.message || translations[currentLang].recommendationSuccess);
        }
    }

    function promptAdminLogin() {
        const password = prompt(translations[currentLang].adminLoginPrompt);
        if (!password) return;
        apiFetch('login', { payload: { password } }).then(data => {
            if (data && data.token) {
                localStorage.setItem('authToken', data.token);
                ui.adminIndicator.classList.remove('hidden');
                showMessage(translations[currentLang].adminLoginSuccess);
            }
        });
    }

    // ===== INITIALIZATION =====
    async function initialize() {
        const data = await apiFetch('getPublicData');
        if (data && data.shops) {
            allShops = data.shops;
            
            const shopTypes = [...new Set(allShops.map(s => s['type_zh-TW']))];
            const filterContainer = document.getElementById('filter-buttons-container');
            shopTypes.forEach(type => {
                if(!type) return;
                const btn = document.createElement('button');
                btn.className = 'tag px-3 py-1 rounded-full text-sm';
                btn.dataset.category = type; 
                btn.textContent = type;
                filterContainer.appendChild(btn);
            });
            
            filterAndDisplayShops();
        }
        if (data && data.announcements && String(data.announcements).trim()) {
            ui.announcementText.textContent = data.announcements;
            ui.announcementBar.classList.remove('hidden');
        }

        initializeMap();
        setLanguage(currentLang);
        setupEventListeners();

        if (localStorage.getItem('authToken')) {
            ui.adminIndicator.classList.remove('hidden');
        }
    }

    function initializeMap() {
        if (document.getElementById('sustainability-map')._leaflet_id) return;
        mapInstance = L.map('sustainability-map').setView([25.0330, 121.5654], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance);
        markersGroup.addTo(mapInstance);
    }
    
    function setupEventListeners() {
        document.getElementById('language-select').addEventListener('change', (e) => setLanguage(e.target.value));
        document.getElementById('language-select-mobile').addEventListener('change', (e) => setLanguage(e.target.value));
        document.getElementById('menu-toggle').addEventListener('click', () => document.getElementById('mobile-menu').classList.toggle('hidden'));
        document.getElementById('search-button').addEventListener('click', handleSearch);
        document.getElementById('search-input').addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());
        document.getElementById('filter-buttons-container').addEventListener('click', handleFilter);
        ui.loadMoreButton.addEventListener('click', () => renderShopCards(getFilteredShops()));
        ui.shopCardsContainer.addEventListener('click', e => {
            const viewBtn = e.target.closest('.view-details-btn');
            const favBtn = e.target.closest('.favorite-btn');
            if (viewBtn) showShopDetail(viewBtn.dataset.shopId);
            if (favBtn) toggleFavorite(favBtn.dataset.shopId);
        });
        document.getElementById('newsletter-form').addEventListener('submit', handleNewsletter);
        
        document.getElementById('issue-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            const issueText = document.getElementById('issue').value.trim();
            const submitButton = this.querySelector('button[type="submit"]');
            if (!issueText) return;

            submitButton.disabled = true;
            submitButton.textContent = '...';

            try {
                const response = await apiFetch('submitIssue', { message: issueText });
                document.getElementById('issue-message').classList.remove('hidden');
                this.reset();
                setTimeout(() => { document.getElementById('issue-message').classList.add('hidden'); }, 5000);
            } catch (error) {
                console.error("Issue report error:", error);
                showMessage(translations[currentLang].reportIssueErrorMsg);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = translations[currentLang].reportIssueSubmitBtn;
            }
        });
        
        document.getElementById('close-message-modal').addEventListener('click', () => ui.messageModal.classList.add('hidden'));
        document.getElementById('close-error-modal').addEventListener('click', () => ui.errorModal.classList.add('hidden'));
        ui.shopDetailModal.addEventListener('click', (e) => e.target === ui.shopDetailModal && closeModal());
        document.addEventListener('keydown', e => (e.ctrlKey && e.shiftKey && e.key === 'A') && promptAdminLogin());

        // --- 新增的政策視窗事件監聽 ---
        document.getElementById('policy-link').addEventListener('click', e => {
            e.preventDefault();
            showPolicies();
        });

        const closePolicyModal = () => {
            ui.policyModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        };

        document.getElementById('close-policy-modal-btn').addEventListener('click', closePolicyModal);
        ui.policyModal.addEventListener('click', e => {
            if (e.target === ui.policyModal) {
                closePolicyModal();
            }
        });
    }

    initialize();
});
