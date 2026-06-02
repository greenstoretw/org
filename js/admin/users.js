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

// ===== USERS TABLE & REAL-TIME SEARCH =====
window.allUsersCached = [];

window.loadUsers = function() {
  db.collection('users').get().then(function(snap) {
    window.allUsersCached = snap.docs.map(function(doc) {
      var d = doc.data();
      d.uid = doc.id;
      return d;
    });
    
    window.renderUsersTable(window.allUsersCached);
    
    // Bind search input event
    var searchInput = document.getElementById('user-search-input');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener('input', function() {
        var query = this.value.trim().toLowerCase();
        if (!query) {
          window.renderUsersTable(window.allUsersCached);
        } else {
          var filtered = window.allUsersCached.filter(function(u) {
            var anon = (u.anonymousName || '').toLowerCase();
            var real = (u.displayName || u.realName || '').toLowerCase();
            var email = (u.email || '').toLowerCase();
            var uid = (u.uid || '').toLowerCase();
            return anon.indexOf(query) !== -1 || real.indexOf(query) !== -1 || email.indexOf(query) !== -1 || uid.indexOf(query) !== -1;
          });
          window.renderUsersTable(filtered);
        }
      });
    }
  }).catch(function(err) {
    console.error("loadUsers error:", err);
  });
};

window.renderUsersTable = function(usersList) {
  var tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = usersList.map(function(u) {
    var roleColors = { owner:'badge-purple', admin:'badge-blue', user:'badge-gray', banned:'badge-red' };
    var roleLabels = { owner:'版主', admin:'管理員', user:'一般用戶', banned:'已封禁' };
    var r = u.role || 'user';
    var roleClass = roleColors[r] || 'badge-gray';
    var roleLabel = roleLabels[r] || '未知';

    return '<tr>' +
      '<td>' +
        '<div style="font-size:.9rem;font-weight:700;color:#16a34a">' + (escapeHtml(u.anonymousName || '未設定匿名')) + '</div>' +
        '<div style="font-size:.75rem;color:#6b7280;margin-top:2px;">真實姓名: ' + escapeHtml(u.displayName || u.realName || '—') + '</div>' +
        '<div style="font-size:.7rem;color:#9ca3af;margin-top:1px;">UID: ' + u.uid + '</div>' +
      '</td>' +
      '<td>' + (escapeHtml(u.email || '—')) + '</td>' +
      '<td><span class="badge ' + roleClass + '">' + roleLabel + '</span></td>' +
      '<td>' + (u.totalCarbonSaved || 0) + 'g</td>' +
      '<td><div style="display:flex;gap:4px">' +
        '<button class="btn btn-blue btn-sm" onclick="window.setUserRole(\'' + u.uid + '\', \'admin\')">設為管理</button>' +
        '<button class="btn btn-red btn-sm" onclick="window.setUserRole(\'' + u.uid + '\', \'banned\')">停權</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
};

window.setUserRole = function(uid, role) {
  if (!confirm('確定更改此使用者權限為 ' + role + '？')) return;
  db.collection('users').doc(uid).update({ role: role, status: (role === 'banned' ? 'banned' : 'active') }).then(function() {
    window.loadUsers();
    if (window.loadTrash) window.loadTrash();
  });
};
