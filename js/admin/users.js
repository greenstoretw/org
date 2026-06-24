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
    alert('成功授予勳章 ' + badge.icon + ' ' + badge.name + '！');
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
  
  var roleLabels = { owner: '版主', admin: '二版主', user: '普通用戶', banned: '已封鎖' };

  tbody.innerHTML = usersList.map(function(u) {
    var roleColors = { owner:'badge-purple', admin:'badge-blue', user:'badge-gray', banned:'badge-red' };
    var r = u.role || 'user';
    var roleClass = roleColors[r] || 'badge-gray';
    var roleLabel = roleLabels[r] || '未知';

    // Generates action buttons based on logged-in user's role (only owner can modify admin roles)
    var actionsHtml = '';
    if (window.currentUserRole === 'owner') {
      if (r === 'user') {
        actionsHtml += '<button class="btn btn-blue btn-sm" onclick="window.setUserRole(\'' + u.uid + '\', \'admin\')">設為二版主</button>';
        actionsHtml += '<button class="btn btn-red btn-sm" onclick="window.setUserRole(\'' + u.uid + '\', \'banned\')">封鎖</button>';
      } else if (r === 'admin') {
        actionsHtml += '<button class="btn btn-gray btn-sm" onclick="window.setUserRole(\'' + u.uid + '\', \'user\')">降為普通用戶</button>';
        actionsHtml += '<button class="btn btn-red btn-sm" onclick="window.setUserRole(\'' + u.uid + '\', \'banned\')">封鎖</button>';
      } else if (r === 'banned') {
        actionsHtml += '<button class="btn btn-green btn-sm" onclick="window.setUserRole(\'' + u.uid + '\', \'user\')">解除封鎖</button>';
      } else {
        actionsHtml += '<span style="color:#9ca3af;font-size:0.8rem">-</span>';
      }
    } else {
      actionsHtml = '<span style="color:#9ca3af;font-size:0.8rem">無操作權限</span>';
    }

    return '<tr>' +
      '<td>' +
        '<div style="font-size:.9rem;font-weight:700;color:#16a34a">' + (escapeHtml(u.anonymousName || '未命名(匿名)')) + '</div>' +
        '<div style="font-size:.75rem;color:#6b7280;margin-top:2px;">真實姓名: ' + escapeHtml(u.displayName || u.realName || '無姓名') + '</div>' +
        '<div style="font-size:.7rem;color:#9ca3af;margin-top:1px;">UID: ' + u.uid + '</div>' +
      '</td>' +
      '<td>' + (escapeHtml(u.email || '無電子郵件')) + '</td>' +
      '<td><span class="badge ' + roleClass + '">' + roleLabel + '</span></td>' +
      '<td>' + (u.totalCarbonSaved || 0) + 'g</td>' +
      '<td><div style="display:flex;gap:4px">' + actionsHtml + '</div></td>' +
    '</tr>';
  }).join('');
};

window.setUserRole = function(uid, role) {
  var roleLabels = { owner: '版主', admin: '二版主', user: '普通用戶', banned: '已封鎖' };
  var targetLabel = roleLabels[role] || role;
  if (!confirm('您確定要將該使用者的權限設定為「' + targetLabel + '」嗎？')) return;
  db.collection('users').doc(uid).update({ role: role, status: (role === 'banned' ? 'banned' : 'active') }).then(function() {
    window.loadUsers();
    if (window.loadTrash) window.loadTrash();
  });
};
