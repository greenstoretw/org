// ===== GREENROOF UI MODULE: COMMON =====
// This file is modularly extracted and registered with the Gateway router.
// Compatibility is maintained globally via window.Gateway.

window.Gateway.register('setLanguage', function(lang) {
    var updateUI = function() {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        var i18nElements = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < i18nElements.length; i++) {
            var el = i18nElements[i];
            var key = el.getAttribute('data-i18n');
            var translation = (window.locales[lang] && window.locales[lang][key]) || (window.locales['zh-TW'] && window.locales['zh-TW'][key]);
            if (translation) {
                if (translation.indexOf('<') !== -1 && translation.indexOf('>') !== -1) {
                    el.innerHTML = translation;
                } else {
                    el.textContent = translation;
                }
            }
        }
        var navLinks = document.querySelector('.nav-links');
        if (navLinks && window.innerWidth >= 768) navLinks.style.display = 'flex';
        
        currentLoadedShops = 0;
        if (window.filterAndDisplayShops) window.filterAndDisplayShops();
    };

    if (!window.locales[lang]) {
        var script = document.createElement('script');
        script.src = 'js/locales/' + lang + '.js';
        script.onload = function() {
            updateUI();
        };
        script.onerror = function() {
            console.error('Failed to load locale: ' + lang);
            updateUI(); 
        };
        document.body.appendChild(script);
    } else {
        updateUI();
    }
});

// ===== PREMIUM DYNAMIC ECO-FEATURES (ES5 VANILLA COMPLIANT) =====