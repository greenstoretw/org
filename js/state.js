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
