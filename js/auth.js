// ===== AUTHENTICATION LOGIC =====
let isLoggingIn = false;

window.handleLogin = function() {
    if (isLoggingIn) return;
    if (auth.currentUser) {
        auth.signOut().then(() => {
            localStorage.removeItem('isAdmin');
            document.getElementById('admin-indicator').classList.add('hidden');
            window.updateLoginButtons(false);
            window.showMessage("已登出");
        });
        return;
    }

    isLoggingIn = true;
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
        const user = result.user;
        window.updateLoginButtons(true);
        
        return db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && (doc.data().role === 'admin' || doc.data().role === 'owner')) {
                localStorage.setItem('isAdmin', 'true');
                document.getElementById('admin-indicator').classList.remove('hidden');
            }
            window.showMessage(`${user.displayName} 登入成功`);
        });
    }).catch(error => {
        if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
            window.showErrorModal(error, "Login");
        }
    }).finally(() => {
        isLoggingIn = false;
    });
};

window.updateLoginButtons = function(isLoggedIn) {
    const text = isLoggedIn ? (translations[currentLang]?.logout || 'Logout') : (translations[currentLang]?.login || 'Login');
    const btn = document.getElementById('login-btn');
    const btnMobile = document.getElementById('login-btn-mobile');
    if (btn) btn.textContent = text;
    if (btnMobile) btnMobile.textContent = text;
};
