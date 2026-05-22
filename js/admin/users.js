// ===== admin/users.js =====

// ===== BADGES MANAGEMENT =====
window.grantBadge = function() {
  var uid = document.getElementById('grant-uid').value.trim();
  var badgeId = document.getElementById('grant-badge-select').value;
  if (!uid || !badgeId) return;

  var badge = null;
  if (window.allBadges) {
    for (var i = 0; i < window.allBadges.length; i++) {
      if (window.allBadges[i].id === badgeId) {
        badge = window.allBadges[i];
        break;
      }
    }
  }
  if (!badge) return;

  db.collection('users').doc(uid).update({
    badges: firebase.firestore.FieldValue.arrayUnion({
      id: badgeId,
      name: badge.name,
      icon: badge.icon,
      grantedAt: new Date().toISOString()
    })
  }).then(function() {
    alert('徽章「' + badge.icon + ' ' + badge.name + '」已頒發！');
  });
};

// ===== USERS TABLE =====
window.loadUsers = function() {
  db.collection('users').limit(50).get().then(function(snap) {
    var tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = snap.docs.map(function(doc) {
      var u = doc.data();
      var roleColors = { owner:'badge-purple', admin:'badge-blue', user:'badge-gray', banned:'badge-red' };
      var roleLabels = { owner:'版主', admin:'管理員', user:'一般用戶', banned:'已封禁' };
      var r = u.role || 'user';
      var roleClass = roleColors[r] || 'badge-gray';
      var roleLabel = roleLabels[r] || '未知';

      return '<tr>' +
        '<td><div style="font-size:.85rem;font-weight:600">' + (u.displayName || '未設定名稱') + '</div><div style="font-size:.7rem;color:#9ca3af">' + doc.id + '</div></td>' +
        '<td>' + (u.email || '—') + '</td>' +
        '<td><span class="badge ' + roleClass + '">' + roleLabel + '</span></td>' +
        '<td>' + (u.totalCarbonSaved || 0) + 'g</td>' +
        '<td><div style="display:flex;gap:4px">' +
          '<button class="btn btn-blue btn-sm" onclick="window.setUserRole(\'' + doc.id + '\',\'admin\')">設為管理</button>' +
          '<button class="btn btn-red btn-sm" onclick="window.setUserRole(\'' + doc.id + '\',\'banned\')">停權</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  });
};

window.setUserRole = function(uid, role) {
  if (!confirm('確定更改此使用者權限為 ' + role + '？')) return;
  db.collection('users').doc(uid).update({ role: role, status: (role === 'banned' ? 'banned' : 'active') }).then(function() {
    window.loadUsers();
    if (window.loadTrash) window.loadTrash();
  });
};
