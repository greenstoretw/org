// ===== GLOBAL STATE (SHARED ACROSS MODULES) =====
// NOTE: markersGroup is initialized in app.js after Leaflet loads
window.allShops = [];
window.currentFilterCategory = 'all';
window.currentSearchQuery = '';
window.shopsPerPage = 9;
window.currentLoadedShops = 0;
window.mapInstance = null;
window.markersGroup = null; // initialized after L loads
window.favoriteShops = [];
window.currentLang = localStorage.getItem('lang') || 'zh-TW';
window.currentEcoFilters = [];
window.showOpenNow = false;
window.isOpenNow = function(hoursStr) { return !!hoursStr; };

// Premium Features State
window.userCheckins = [];
window.userAchievements = [];
window.isDarkMode = localStorage.getItem('theme') !== 'light';
window.activeRoutingList = [];
window.isRoutingMode = false;
window.userLocation = null;
window.routingPolyline = null;
window.userMarker = null;
window.closestSortActive = false;
