// ===== AUTHENTICATION LOGIC =====
var isLoggingIn = false;

// Open Login Modal or Sign Out if already logged in
window.Gateway.register('handleLogin', function() {
    if (auth && auth.currentUser) {
        auth.signOut().then(function() {
            localStorage.removeItem('isAdmin');
            var indicator = document.getElementById('admin-indicator');
            if (indicator) indicator.classList.add('hidden');
            window.updateLoginButtons(false);
            window.showMessage("已登出");
        });
        return;
    }

    var loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.classList.remove('hidden');
    } else {
        window.doGoogleLogin();
    }
});

// Google Popup Login
window.doGoogleLogin = function() {
    if (isLoggingIn || !auth) return;
    isLoggingIn = true;

    var modal = document.getElementById('login-modal');
    var provider = new firebase.auth.GoogleAuthProvider();
    
    auth.signInWithPopup(provider).then(function(result) {
        if (modal) modal.classList.add('hidden');
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
        console.error("Popup Login Error:", error);
        if (error.code === 'auth/popup-blocked') {
            window.showMessage("瀏覽器已阻擋彈窗，為您啟動網頁轉向登入模式...");
            setTimeout(function() { window.doGoogleLoginRedirect(); }, 1200);
        } else if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
            window.showErrorModal(error, "Google 登入失敗");
        }
    }).finally(function() {
        isLoggingIn = false;
    });
};

// Google Redirect Login (Fallback for mobile/popup-blocked environments)
window.doGoogleLoginRedirect = function() {
    if (!auth) return;
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider);
};

window.Gateway.register('updateLoginButtons', function(isLoggedIn) {
    var guestBlock = document.getElementById('settings-guest');
    var userBlock = document.getElementById('settings-user');
    
    if (isLoggedIn) {
        if (guestBlock) guestBlock.style.display = 'none';
        if (userBlock) userBlock.style.display = 'flex';
        
        var user = firebase.auth && firebase.auth().currentUser;
        if (user) {
            var nameEl = document.getElementById('settings-user-name');
            var emailEl = document.getElementById('settings-user-email');
            if (nameEl) nameEl.textContent = user.displayName || '用戶';
            if (emailEl) emailEl.textContent = user.email || '';
        }
    } else {
        if (guestBlock) guestBlock.style.display = 'flex';
        if (userBlock) userBlock.style.display = 'none';
        
        var adminSection = document.getElementById('settings-admin-section');
        if (adminSection) adminSection.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Check redirect result on load
    if (window.auth) {
        auth.getRedirectResult().then(function(result) {
            if (result && result.user) {
                var user = result.user;
                window.updateLoginButtons(true);
                window.showMessage(user.displayName + " 登入成功");
            }
        }).catch(function(err) {
            console.warn("Redirect result check:", err);
        });
    }

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (auth && auth.currentUser) {
                auth.signOut().then(function() {
                    localStorage.removeItem('isAdmin');
                    window.updateLoginButtons(false);
                    window.showMessage("已登出");
                });
            }
        });
    }
});