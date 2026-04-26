// ===== admin/auth.js =====
auth.onAuthStateChanged(async user => {
  if (!user) { window.showLogin(); return; }
  const doc = await db.collection('users').doc(user.uid).get();
  if (!doc.exists || !['admin','owner'].includes(doc.data().role)) {
    alert('無管理員權限'); auth.signOut(); return;
  }
  window.currentUserRole = doc.data().role;
  document.getElementById('user-name').textContent = user.displayName || user.email.split('@')[0];
  document.getElementById('user-avatar').textContent = (user.displayName || 'A')[0].toUpperCase();
  document.getElementById('role-badge').textContent = window.currentUserRole === 'owner' ? '版主' : '管理員';
  if (window.currentUserRole === 'owner') document.body.classList.add('is-owner');
  window.hideLogin();
  window.loadDashboard();
});

document.getElementById('login-btn').onclick = async () => {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-err');
  try { await auth.signInWithEmailAndPassword(email, pass); }
  catch(e) { err.textContent = '登入失敗：' + e.message; err.style.display = 'block'; }
};
document.getElementById('logout-btn').onclick = () => auth.signOut();

window.showLogin = function() { document.getElementById('login-screen').style.display = 'flex'; };
window.hideLogin = function() { document.getElementById('login-screen').style.display = 'none'; };
