// ===== AUTHENTICATION LOGIC =====
var isLoggingIn = false;

window.handleLogin = function() {
    if (isLoggingIn) return;
    if (auth.currentUser) {
        auth.signOut().then(function() {
            localStorage.removeItem('isAdmin');
            var indicator = document.getElementById('admin-indicator');
            if (indicator) indicator.classList.add('hidden');
            window.updateLoginButtons(false);
            window.showMessage("已登出");
        });
        return;
    }

    isLoggingIn = true;
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(function(result) {
        var user = result.user;
        window.updateLoginButtons(true);
        
        return db.collection('users').doc(user.uid).get().then(function(doc) {
            if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'owner')) {
                localStorage.setItem('isAdmin', 'true');
                var indicator = document.getElementById('admin-indicator');
                if (indicator) indicator.classList.remove('hidden');
            }
            window.showMessage(user.displayName + " 登入成功");
        });
    }).catch(function(error) {
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
            window.showErrorModal(error, "Login");
        }
    }).finally(function() {
        isLoggingIn = false;
    });
};

window.updateLoginButtons = function(isLoggedIn) {
    var text = isLoggedIn ? ((window.locales[window.currentLang] && window.locales[window.currentLang].logout) || 'Logout') : ((window.locales[window.currentLang] && window.locales[window.currentLang].login) || 'Login');
    var btn = document.getElementById('login-btn');
    var btnMobile = document.getElementById('login-btn-mobile');
    if (btn) btn.textContent = text;
    if (btnMobile) btnMobile.textContent = text;
};
