// ===== AUTHENTICATION LOGIC =====
var isLoggingIn = false;

window.Gateway.register('handleLogin', function() {
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
});

window.Gateway.register('updateLoginButtons', function(isLoggedIn) {
    // Update settings dropdown UI
    var guestBlock = document.getElementById('settings-guest');
    var userBlock = document.getElementById('settings-user');
    
    if (isLoggedIn) {
        if (guestBlock) guestBlock.style.display = 'none';
        if (userBlock) userBlock.style.display = 'flex';
        
        var user = firebase.auth().currentUser;
        if (user) {
            var nameEl = document.getElementById('settings-user-name');
            var emailEl = document.getElementById('settings-user-email');
            if (nameEl) nameEl.textContent = user.displayName || '用戶';
            if (emailEl) emailEl.textContent = user.email || '';
        }
    } else {
        if (guestBlock) guestBlock.style.display = 'flex';
        if (userBlock) userBlock.style.display = 'none';
        
        // Hide admin section if logged out
        var adminSection = document.getElementById('settings-admin-section');
        if (adminSection) adminSection.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (window.Gateway && window.Gateway.handlers && window.Gateway.handlers.handleLogin) {
                window.Gateway.handlers.handleLogin[0](); // Triggers the signout if logged in
            } else if (firebase.auth().currentUser) {
                firebase.auth().signOut().then(function() {
                    localStorage.removeItem('isAdmin');
                    window.updateLoginButtons(false);
                    window.showMessage("已登出");
                });
            }
        });
    }
});