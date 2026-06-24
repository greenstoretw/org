// ===== admin/auth.js =====
auth.onAuthStateChanged(function(user) {
  if (!user) { window.showLogin(); return; }
  db.collection('users').doc(user.uid).get().then(function(doc) {
    if (!doc.exists || (doc.data().role !== 'admin' && doc.data().role !== 'owner')) {
      alert('權限不足，只有管理員權限者可登入！');
      auth.signOut();
      return;
    }
    window.currentUserRole = doc.data().role;
    document.getElementById('user-name').textContent = user.displayName || user.email.split('@')[0];
    document.getElementById('user-avatar').textContent = (user.displayName || 'A')[0].toUpperCase();
    document.getElementById('role-badge').textContent = window.currentUserRole === 'owner' ? '所有者' : '管理員';
    if (window.currentUserRole === 'owner') document.body.classList.add('is-owner');
    window.hideLogin();
    window.loadDashboard();
  }).catch(function(err) {
    console.error('Auth error:', err);
    auth.signOut();
  });
});

var loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.onclick = function() {
    var email = document.getElementById('login-email').value;
    var pass = document.getElementById('login-pass').value;
    var err = document.getElementById('login-err');
    auth.signInWithEmailAndPassword(email, pass).catch(function(e) {
      err.textContent = '登入失敗：' + e.message;
      err.style.display = 'block';
    });
  };
}

var googleLoginBtn = document.getElementById('google-login-btn');
if (googleLoginBtn) {
  googleLoginBtn.onclick = function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    var err = document.getElementById('login-err');
    auth.signInWithPopup(provider).catch(function(e) {
      if (e.code !== 'auth/cancelled-popup-request' && e.code !== 'auth/popup-closed-by-user') {
        err.textContent = '登入失敗：' + e.message;
        err.style.display = 'block';
      }
    });
  };
}

var logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.onclick = function() {
    auth.signOut();
  };
}

window.showLogin = function() { document.getElementById('login-screen').style.display = 'flex'; };
window.hideLogin = function() { document.getElementById('login-screen').style.display = 'none'; };