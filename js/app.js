// app.js — main initialization

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

document.addEventListener('DOMContentLoaded', function() {

    // ===== INITIALIZATION =====
    function initialize() {
        // Init Leaflet objects (Leaflet must be loaded first)
        window.markersGroup = L.featureGroup();
        var mapEl = document.getElementById('sustainability-map');
        if (!mapEl || mapEl._leaflet_id) return;

        window.mapInstance = L.map('sustainability-map').setView([25.0330, 121.5654], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(window.mapInstance);
        window.markersGroup.addTo(window.mapInstance);

        // Add geolocation button
        L.Control.LocationButton = L.Control.extend({
            onAdd: function(map) {
                var btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control');
                btn.title = '我的位置';
                btn.style.cssText = 'background:#fff;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
                L.DomEvent.disableClickPropagation(btn);
                btn.onclick = function() {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(pos) {
                            map.setView([pos.coords.latitude, pos.coords.longitude], 15);
                            L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map).bindPopup('您的目前位置').openPopup();
                        }, function() { alert('無法取得您的位置。'); });
                    } else {
                        alert('您的瀏覽器不支援地理位置功能。');
                    }
                };
                return btn;
            }
        });
        new L.Control.LocationButton({ position: 'topleft' }).addTo(window.mapInstance);

        // Force show nav-links on desktop
        var navLinks = document.querySelector('.nav-links');
        if (navLinks && window.innerWidth >= 768) navLinks.style.display = 'flex';
        // Real-time Announcements Listener
        if (window.db) {
            window.db.collection('announcements').orderBy('createdAt', 'desc').limit(1).onSnapshot(function(snap) {
                var container = document.getElementById('prominent-announcement-container');
                var content = document.getElementById('announcement-text-content');
                if (container && content) {
                    if (!snap.empty) {
                        var data = snap.docs[0].data();
                        var html = '';
                        if (data.title) {
                            html += '<span class="text-red-500 font-extrabold mr-2">[' + data.title + ']</span>';
                        }
                        html += data.content || '';
                        content.innerHTML = html;
                        container.classList.remove('hidden');
                    } else {
                        container.classList.add('hidden');
                    }
                }
            }, function(err) {
                console.warn("Failed to listen to announcements:", err);
            });

            // Real-time Maintenance Mode Interceptor
            window.db.collection('settings').doc('maintenance').onSnapshot(function(doc) {
                if (doc.exists) {
                    var data = doc.data();
                    var isUnderMaint = false;
                    
                    if (data.active) {
                        isUnderMaint = true;
                    } else if (data.scheduled && data.startTime && data.endTime) {
                        var localNow = new Date();
                        var offset = localNow.getTimezoneOffset() * 60000;
                        var localISOTime = new Date(localNow - offset).toISOString().slice(0, 16);
                        if (localISOTime >= data.startTime && localISOTime <= data.endTime) {
                            isUnderMaint = true;
                        }
                    }
                    
                    if (isUnderMaint) {
                        var maintenanceHtml = `
                        <div style="position:fixed;inset:0;background:linear-gradient(135deg,#000000,#111827);z-index:99999;display:flex;align-items:center;justify-content:center;color:#ffffff;font-family:'Noto Sans TC',sans-serif;text-align:center;padding:24px;">
                            <div>
                                <div style="background:#dc262615;width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;border:2px solid #dc2626;animation:pulse 2s infinite">
                                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2.2rem;color:#dc2626"></i>
                                </div>
                                <h1 style="font-size:2.5rem;font-weight:900;letter-spacing:-0.03em;margin-bottom:16px;text-shadow:0 2px 10px rgba(0,0,0,0.5)">網站停服更新中</h1>
                                <p style="font-size:1.1rem;color:#9ca3af;max-width:500px;line-height:1.6;margin:0 auto 24px;white-space:pre-line">${data.message || '為了提供更好的服務，網站正在進行維護升級，請稍後再試。'}</p>
                                <div style="font-size:0.8rem;color:#4b5563;letter-spacing:0.05em;text-transform:uppercase">GREENROOF System Engineering</div>
                            </div>
                        </div>
                        <style>
                            @keyframes pulse {
                                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
                                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
                                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
                            }
                        </style>
                        `;
                        document.body.innerHTML = maintenanceHtml;
                        throw new Error("Application suspended: System under Maintenance.");
                    }
                }
            }, function(err) {
                console.warn("Failed to listen to maintenance settings:", err);
            });
        }

        // Dark Mode startup check
        if (window.isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Geolocation Position Watcher Setup
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function(pos) {
                window.userLocation = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                };
                
                if (window.mapInstance) {
                    if (window.userMarker) {
                        window.userMarker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
                    } else {
                        var userIcon = L.divIcon({
                            html: '<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);"></div>',
                            className: 'user-gps-marker',
                            iconSize: [14, 14]
                        });
                        window.userMarker = L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon })
                            .addTo(window.mapInstance)
                            .bindPopup('您的目前位置');
                    }
                }
            }, function(err) {
                console.warn("Geolocation watch error:", err);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        }

        window.fetchShops();
        setupEventListeners();
        window.setLanguage(window.currentLang);
        logVisit();

        var indicator = document.getElementById('admin-indicator');
        if (indicator && localStorage.getItem('isAdmin')) indicator.classList.remove('hidden');
    }

    function logVisit() {
        if (!db) return;
        db.collection('analytics').add({
            type: 'page_view',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent
        }).catch(function(e) { /* silent */ });
    }

    function setupEventListeners() {
        var langSelect = document.getElementById('language-select');
        var langSelectMobile = document.getElementById('language-select-mobile');
        if (langSelect) langSelect.addEventListener('change', function(e) { window.setLanguage(e.target.value); });
        if (langSelectMobile) langSelectMobile.addEventListener('change', function(e) { window.setLanguage(e.target.value); });

        var searchInput = document.getElementById('search-input');
        var searchBtn = document.getElementById('search-button');
        var doSearch = window.debounce(function() {
            window.currentSearchQuery = searchInput ? searchInput.value.trim() : '';
            window.currentLoadedShops = 0;
            if (window.renderSkeletonCards) window.renderSkeletonCards();
            setTimeout(function() {
                window.filterAndDisplayShops();
            }, 300);
        }, 300);

        if (searchBtn) searchBtn.addEventListener('click', doSearch);
        if (searchInput) searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') doSearch();
        });

        var filterContainer = document.getElementById('filter-buttons-container');
        if (filterContainer) {
            filterContainer.addEventListener('click', function(e) {
                var btn = e.target.closest('.tag');
                if (!btn) return;
                window.currentFilterCategory = btn.dataset.category || 'all';
                var allTags = document.querySelectorAll('#filter-buttons-container .tag');
                for (var i = 0; i < allTags.length; i++) allTags[i].classList.remove('active');
                btn.classList.add('active');
                window.currentLoadedShops = 0;
                if (window.renderSkeletonCards) window.renderSkeletonCards();
                setTimeout(function() {
                    window.filterAndDisplayShops();
                }, 300);
            });
        }

        var openNowFilter = document.getElementById('open-now-filter');
        if (openNowFilter) {
            openNowFilter.addEventListener('change', function(e) {
                window.showOpenNow = e.target.checked;
                window.currentLoadedShops = 0;
                window.filterAndDisplayShops();
            });
        }

        var ecoContainer = document.getElementById('eco-features-container');
        if (ecoContainer) {
            ecoContainer.addEventListener('click', function(e) {
                var btn = e.target.closest('.eco-filter-btn');
                if (!btn) return;
                var feature = btn.dataset.feature;
                var idx = window.currentEcoFilters.indexOf(feature);
                if (idx !== -1) {
                    window.currentEcoFilters.splice(idx, 1);
                    btn.classList.remove('active');
                } else {
                    window.currentEcoFilters.push(feature);
                    btn.classList.add('active');
                }
                window.currentLoadedShops = 0;
                window.filterAndDisplayShops();
            });
        }

        var shopCardsContainer = document.getElementById('shop-cards-container');
        if (shopCardsContainer) {
            shopCardsContainer.addEventListener('click', function(e) {
                var favBtn = e.target.closest('.favorite-btn');
                if (favBtn) {
                    favBtn.classList.toggle('favorited');
                    window.toggleFavorite(favBtn.dataset.shopId);
                }
                var detailBtn = e.target.closest('.view-details-btn');
                if (detailBtn) window.showShopDetail(detailBtn.dataset.shopId);
            });
        }

        var loadMoreBtn = document.getElementById('load-more-button');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function() {
                window.renderShopCards(window.getFilteredShops());
            });
        }

        var loginBtn = document.getElementById('login-btn');
        var loginBtnMobile = document.getElementById('login-btn-mobile');
        if (loginBtn) loginBtn.addEventListener('click', window.handleLogin);
        if (loginBtnMobile) loginBtnMobile.addEventListener('click', window.handleLogin);

        var dashBtn = document.getElementById('dashboard-btn');
        if (dashBtn) dashBtn.addEventListener('click', window.showUserDashboard);
        var closeDashBtn = document.getElementById('close-dashboard-btn');
        if (closeDashBtn) closeDashBtn.onclick = function() {
            document.getElementById('user-dashboard-modal').classList.add('hidden');
        };

        auth.onAuthStateChanged(function(user) {
            window.updateLoginButtons(!!user);
            var dashBtn2 = document.getElementById('dashboard-btn');
            if (user) {
                if (dashBtn2) dashBtn2.classList.remove('hidden');
                window.fetchUserFavorites(user.uid);
                
                db.collection('users').doc(user.uid).get().then(function(doc) {
                    var needsAnon = true;
                    if (doc.exists) {
                        var uData = doc.data();
                        window.currentUserData = uData;
                        if (uData.anonymousName) {
                            needsAnon = false;
                        }
                    }
                    
                    if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'owner')) {
                        var ind = document.getElementById('admin-indicator');
                        if (ind) ind.classList.remove('hidden');
                    }
                    
                    if (needsAnon) {
                        window.promptAnonymousName(user, doc.exists ? doc.data() : null);
                    }
                }).catch(function(err) {
                    console.warn("Failed to retrieve user profile:", err);
                });
            } else {
                window.currentUserData = null;
                if (dashBtn2) dashBtn2.classList.add('hidden');
                window.favoriteShops = JSON.parse(localStorage.getItem('favoriteShops') || '[]');
                window.filterAndDisplayShops();
            }
        });

        document.addEventListener('click', function(e) {
            var modalIds = ['shop-detail-modal', 'user-dashboard-modal'];
            for (var i = 0; i < modalIds.length; i++) {
                var m = document.getElementById(modalIds[i]);
                if (m && !m.classList.contains('hidden') && e.target === m) m.classList.add('hidden');
            }
        });

        var policyLink = document.getElementById('policy-link');
        if (policyLink) {
            policyLink.onclick = function(e) {
                e.preventDefault();
                document.getElementById('policy-modal').classList.remove('hidden');
            };
        }

        var menuToggle = document.getElementById('menu-toggle');
        var mobileMenu = document.getElementById('mobile-menu');
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
            });
        }

        var newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var email = document.getElementById('newsletter-email').value.trim();
                if (!email) return;
                
                var source = 'Direct';
                if (document.referrer.indexOf('google') !== -1) source = 'Google';
                else if (document.referrer.indexOf('facebook') !== -1) source = 'Facebook';

                db.collection('newsletter').add({
                    email: email,
                    source: source,
                    subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(function() {
                    var msg = (window.locales[window.currentLang] && window.locales[window.currentLang].newsletterSuccess) || '感謝您的訂閱！';
                    window.showMessage(msg);
                    newsletterForm.reset();
                }).catch(function(err) { window.showErrorModal(err, 'Newsletter'); });
            });
        }

        var issueForm = document.getElementById('issue-form');
        if (issueForm) {
            issueForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var issueText = document.getElementById('issue').value.trim();
                if (!issueText) return;
                
                db.collection('issues').add({
                    description: issueText,
                    reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending'
                }).then(function() {
                    var successMsg = document.getElementById('issue-message');
                    if (successMsg) {
                        successMsg.classList.remove('hidden');
                        setTimeout(function() { successMsg.classList.add('hidden'); }, 3000);
                    } else {
                        window.showMessage((window.locales[window.currentLang] && window.locales[window.currentLang].reportIssueSuccessMsg) || '感謝您的回報！');
                    }
                    issueForm.reset();
                }).catch(function(err) { window.showErrorModal(err, 'ReportIssue'); });
            });
        }

        var closePolicyBtn = document.getElementById('close-policy-modal-btn');
        if (closePolicyBtn) closePolicyBtn.onclick = function() {
            document.getElementById('policy-modal').classList.add('hidden');
        };

        // ===== PREMIUM ECO-FEATURES EVENT LISTENERS =====
        
        var toggleDark = function() {
            window.isDarkMode = !window.isDarkMode;
            if (window.isDarkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        };
        var darkBtn = document.getElementById('dark-mode-toggle');
        var darkBtnMobile = document.getElementById('dark-mode-toggle-mobile');
        if (darkBtn) darkBtn.addEventListener('click', toggleDark);
        if (darkBtnMobile) darkBtnMobile.addEventListener('click', toggleDark);

        var closestSortBtn = document.getElementById('closest-sort-btn');
        if (closestSortBtn) {
            closestSortBtn.addEventListener('click', function() {
                if (!window.userLocation) {
                    alert("尚未取得您的 GPS 定位，請確保已允許瀏覽器定位權限。");
                    return;
                }
                window.closestSortActive = !window.closestSortActive;
                if (window.closestSortActive) {
                    closestSortBtn.classList.add('active');
                } else {
                    closestSortBtn.classList.remove('active');
                }
                window.currentLoadedShops = 0;
                window.filterAndDisplayShops();
            });
        }

        var surpriseMeBtn = document.getElementById('surprise-me-btn');
        if (surpriseMeBtn) {
            surpriseMeBtn.addEventListener('click', function() {
                window.surpriseMe();
            });
        }

        var routingToggleBtn = document.getElementById('routing-toggle-btn');
        var routingPanel = document.getElementById('routing-panel');
        if (routingToggleBtn) {
            routingToggleBtn.addEventListener('click', function() {
                window.isRoutingMode = !window.isRoutingMode;
                if (window.isRoutingMode) {
                    routingToggleBtn.classList.add('active');
                    if (routingPanel) routingPanel.classList.remove('hidden');
                    window.updateRoutingPanel();
                    window.drawRoutePolyline();
                } else {
                    routingToggleBtn.classList.remove('active');
                    if (routingPanel) routingPanel.classList.add('hidden');
                    if (window.routingPolyline && window.mapInstance) {
                        window.mapInstance.removeLayer(window.routingPolyline);
                        window.routingPolyline = null;
                    }
                }
            });
        }

        var closeRoutingBtn = document.getElementById('close-routing-btn');
        if (closeRoutingBtn) {
            closeRoutingBtn.addEventListener('click', function() {
                window.isRoutingMode = false;
                if (routingToggleBtn) routingToggleBtn.classList.remove('active');
                if (routingPanel) routingPanel.classList.add('hidden');
                if (window.routingPolyline && window.mapInstance) {
                    window.mapInstance.removeLayer(window.routingPolyline);
                    window.routingPolyline = null;
                }
            });
        }

        var clearRoutingBtn = document.getElementById('clear-routing-btn');
        if (clearRoutingBtn) {
            clearRoutingBtn.addEventListener('click', function() {
                window.activeRoutingList = [];
                
                var detailRouteBtn = document.getElementById('detail-route-btn');
                if (detailRouteBtn) {
                    detailRouteBtn.textContent = '+ 加入散步路線';
                    detailRouteBtn.className = 'font-bold px-6 py-2.5 text-xs transition uppercase tracking-wider flex items-center gap-2 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
                }
                
                window.updateRoutingPanel();
                if (window.routingPolyline && window.mapInstance) {
                    window.mapInstance.removeLayer(window.routingPolyline);
                    window.routingPolyline = null;
                }
                window.showMessage("已清空您的散步路線");
            });
        }

        var drawPolylineBtn = document.getElementById('draw-route-polyline-btn');
        if (drawPolylineBtn) {
            drawPolylineBtn.addEventListener('click', function() {
                if (window.activeRoutingList.length < 2) {
                    window.showMessage("規劃路線需要至少加入 2 間商店喔！");
                    return;
                }
                window.drawRoutePolyline();
                window.showMessage("已在地圖上為您繪製專屬的散步綠線！🗺️");
            });
        }
    }

        // ===== FLOATING ACTION PANEL (FAB) =====
        (function() {
            var fabBar = document.getElementById('fab-bar');
            var fabTrigger = document.getElementById('fab-main-trigger');
            var fabMobileMenu = document.getElementById('fab-mobile-menu');
            var fabOpen = false;

            if (fabBar) {
                window.addEventListener('scroll', function() {
                    if (window.scrollY > 180) {
                        fabBar.classList.remove('hidden-fab');
                        fabBar.classList.add('visible-fab');
                    } else {
                        fabBar.classList.remove('visible-fab');
                        fabBar.classList.add('hidden-fab');
                    }
                });
            }

            if (fabTrigger && fabMobileMenu) {
                fabTrigger.addEventListener('click', function() {
                    fabOpen = !fabOpen;
                    fabTrigger.classList.toggle('open', fabOpen);
                    if (fabOpen) {
                        fabMobileMenu.classList.remove('hidden');
                        setTimeout(function() { fabMobileMenu.classList.add('open'); }, 10);
                    } else {
                        fabMobileMenu.classList.remove('open');
                    }
                });
            }

            function triggerClosest() {
                var btn = document.getElementById('closest-sort-btn');
                if (btn) btn.click();
                if (fabOpen && fabTrigger) { fabOpen = false; fabTrigger.classList.remove('open'); if (fabMobileMenu) fabMobileMenu.classList.remove('open'); }
            }
            function triggerSurprise() {
                if (window.surpriseMe) window.surpriseMe();
                if (fabOpen && fabTrigger) { fabOpen = false; fabTrigger.classList.remove('open'); if (fabMobileMenu) fabMobileMenu.classList.remove('open'); }
            }
            function triggerRouting() {
                var btn = document.getElementById('routing-toggle-btn');
                if (btn) btn.click();
                if (fabOpen && fabTrigger) { fabOpen = false; fabTrigger.classList.remove('open'); if (fabMobileMenu) fabMobileMenu.classList.remove('open'); }
            }

            [['fab-closest-btn', triggerClosest], ['fab-surprise-btn', triggerSurprise], ['fab-routing-btn', triggerRouting],
             ['fab-m-closest-btn', triggerClosest], ['fab-m-surprise-btn', triggerSurprise], ['fab-m-routing-btn', triggerRouting]
            ].forEach(function(pair) {
                var el = document.getElementById(pair[0]);
                if (el) el.addEventListener('click', pair[1]);
            });
        })();

        // ===== REPORT SECTION FORM =====
        (function() {
            var issueFormSection = document.getElementById('issue-form-section');
            if (issueFormSection) {
                issueFormSection.addEventListener('submit', function(e) {
                    e.preventDefault();
                    var text = (document.getElementById('issue-section') || {}).value;
                    if (!text || !text.trim()) return;
                    if (!db) { window.showMessage('資料庫連線中斷，請稍後再試。'); return; }
                    db.collection('issues').add({
                        description: text.trim(),
                        reportedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        status: 'pending'
                    }).then(function() {
                        var msg = document.getElementById('issue-section-message');
                        if (msg) { msg.classList.remove('hidden'); setTimeout(function() { msg.classList.add('hidden'); }, 4000); }
                        issueFormSection.reset();
                    }).catch(function(err) { window.showErrorModal(err, 'ReportSection'); });
                });
            }
            var newsletterFormSection = document.getElementById('newsletter-form-section');
            if (newsletterFormSection) {
                newsletterFormSection.addEventListener('submit', function(e) {
                    e.preventDefault();
                    var email = (document.getElementById('newsletter-email-section') || {}).value;
                    if (!email || !email.trim()) return;
                    var source = document.referrer.indexOf('google') !== -1 ? 'Google' : document.referrer.indexOf('facebook') !== -1 ? 'Facebook' : 'Direct';
                    if (!db) { window.showMessage('資料庫連線中斷，請稍後再試。'); return; }
                    db.collection('subscribers').add({
                        email: email.trim(),
                        source: source,
                        subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(function() {
                        var msg = document.getElementById('newsletter-section-message');
                        if (msg) { msg.classList.remove('hidden'); setTimeout(function() { msg.classList.add('hidden'); }, 4000); }
                        newsletterFormSection.reset();
                    }).catch(function(err) { window.showErrorModal(err, 'NewsletterSection'); });
                });
            }
        })();
    // ===== CORE LOGIC =====
    window.getFilteredShops = function() {
        var branches = window.allShops.filter(function(s) { return s.isBranch && s.parentId; });

        var filtered = window.allShops.filter(function(shop) {
            if (!shop || !shop.id || shop.isBranch) return false;
            if (window.currentFilterCategory === 'favorites') {
                return window.favoriteShops.indexOf(shop.id) !== -1;
            }
            var matchesCategory = window.currentFilterCategory === 'all' ||
                (shop.type && shop.type['zh-TW']) === window.currentFilterCategory;

            var lang = window.currentLang;
            var name = (shop.name && (shop.name[lang] || shop.name['zh-TW'])) || '';
            var address = (shop.address && (shop.address[lang] || shop.address['zh-TW'])) || '';
            var desc = (shop.description && (shop.description[lang] || shop.description['zh-TW'])) || '';
            var query = window.currentSearchQuery.toLowerCase();

            var matchesSearch = !query ||
                name.toLowerCase().indexOf(query) !== -1 ||
                address.toLowerCase().indexOf(query) !== -1 ||
                desc.toLowerCase().indexOf(query) !== -1;

            if (query && !matchesSearch) {
                var shopBranches = branches.filter(function(b) { return b.parentId === shop.id; });
                for (var i = 0; i < shopBranches.length; i++) {
                    var b = shopBranches[i];
                    if (((b.name && b.name['zh-TW']) || '').toLowerCase().indexOf(query) !== -1 ||
                        ((b.address && b.address['zh-TW']) || '').toLowerCase().indexOf(query) !== -1) {
                        matchesSearch = true;
                        break;
                    }
                }
            }

            var matchesOpenNow = !window.showOpenNow || window.isOpenNow(shop.openingHours);

            var matchesEco = true;
            if (window.currentEcoFilters.length > 0) {
                if (!shop.ecoFeatures || !Array.isArray(shop.ecoFeatures)) {
                    matchesEco = false;
                } else {
                    for (var j = 0; j < window.currentEcoFilters.length; j++) {
                        if (shop.ecoFeatures.indexOf(window.currentEcoFilters[j]) === -1) {
                            matchesEco = false;
                            break;
                        }
                    }
                }
            }

            return matchesCategory && matchesSearch && matchesOpenNow && matchesEco;
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





// Sleek glassmorphic setup anonymous name prompt
window.promptAnonymousName = function(user, existingData) {
    if (document.getElementById('anon-prompt-modal')) return;
    
    var modal = document.createElement('div');
    modal.id = 'anon-prompt-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    var content = document.createElement('div');
    content.className = 'w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-2xl relative transition-all';
    content.style.borderRadius = '0px';
    
    content.innerHTML = '<div class="mb-6 text-center">' +
        '<div class="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">' +
            '<i class="fa-solid fa-user-secret text-2xl"></i>' +
        '</div>' +
        '<h3 class="text-xl font-black text-slate-900 dark:text-white mb-2">設定您的社群匿名</h3>' +
        '<p class="text-sm text-slate-500 dark:text-slate-400">為了維護您的隱私，請設定一個綠色社群「匿名」。本平台所有打卡、評價與憑證，均會以該匿名形式對外及後台顯示。</p>' +
    '</div>' +
    '<div class="space-y-4">' +
        '<div>' +
            '<label class="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">匿名名稱</label>' +
            '<input type="text" id="anon-name-input" placeholder="例如: 減碳小幫手 / 綠篷衛士" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 font-bold" style="border-radius:0px">' +
        '</div>' +
        '<button id="anon-submit-btn" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 uppercase tracking-wider transition cursor-pointer" style="border-radius:0px">確認儲存</button>' +
    '</div>';
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    setTimeout(function() {
        var input = document.getElementById('anon-name-input');
        if (input) input.focus();
    }, 100);
    
    document.getElementById('anon-submit-btn').onclick = function() {
        var input = document.getElementById('anon-name-input');
        var name = input ? input.value.trim() : '';
        if (!name) {
            alert('請輸入一個社群匿名！');
            return;
        }
        
        var loading = document.getElementById('app-loading');
        if (loading) loading.classList.remove('hidden');
        
        db.collection('users').doc(user.uid).set({
            uid: user.uid,
            realName: user.displayName || 'Google User',
            email: user.email || '',
            anonymousName: name,
            role: (existingData && existingData.role) || 'user',
            createdAt: (existingData && existingData.createdAt) || firebase.firestore.FieldValue.serverTimestamp(),
            lastActionAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function() {
            window.currentUserData = {
                uid: user.uid,
                realName: user.displayName || 'Google User',
                email: user.email || '',
                anonymousName: name,
                role: (existingData && existingData.role) || 'user'
            };
            document.body.removeChild(modal);
            if (loading) loading.classList.add('hidden');
            window.showMessage("社群匿名「" + name + "」設定成功！");
        }).catch(function(err) {
            console.error("Failed to save anonymous name:", err);
            if (loading) loading.classList.add('hidden');
            alert('儲存失敗，請重試！');
        });
    };
};


// Automated body scroll lock observer for all active modals
if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function(mutations) {
        var anyModalOpen = false;
        var modals = document.querySelectorAll('#shop-detail-modal, #user-dashboard-modal, #rate-modal, #report-modal, #policy-modal, #receipt-preview-modal, #anon-prompt-modal');
        for (var i = 0; i < modals.length; i++) {
            if (modals[i] && !modals[i].classList.contains('hidden')) {
                anyModalOpen = true;
                break;
            }
        }
        if (anyModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
    });
    
    // Bind to DOM when ready
    document.addEventListener('DOMContentLoaded', function() {
        var config = { attributes: true, attributeFilter: ['class'] };
        var ids = ['shop-detail-modal', 'user-dashboard-modal', 'rate-modal', 'report-modal', 'policy-modal', 'receipt-preview-modal'];
        ids.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) observer.observe(el, config);
        });
    });
}
