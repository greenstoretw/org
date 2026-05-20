// ===== admin/users.js =====

// ===== BADGES MANAGEMENT =====
window.loadBadges = function() {
  db.collection('badges').get().then(function(snap) {
    window.allBadges = snap.docs.map(function(doc) {
      var data = doc.data();
      data.id = doc.id;
      return data;
    });
    
    var badgesList = document.getElementById('badges-list');
    if (badgesList) {
      badgesList.innerHTML = window.allBadges.map(function(b) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px">' +
          '<div><span style="font-size:1.5rem;margin-right:8px">' + (b.icon || '🏅') + '</span>' +
          '<strong>' + (b.name || b.id) + '</strong></div>' +
          '<button class="btn btn-red btn-sm" onclick="window.deleteBadge(\'' + b.id + '\')"><i class="fa fa-trash"></i></button>' +
        '</div>';
      }).join('') || '<p style="color:#9ca3af;font-size:.85rem">尚無徽章</p>';
    }

    var sel = document.getElementById('grant-badge-select');
    if (sel) {
      sel.innerHTML = window.allBadges.map(function(b) {
        return '<option value="' + b.id + '">' + (b.icon || '') + ' ' + (b.name || b.id) + '</option>';
      }).join('');
    }
  });
};

window.saveBadge = function() {
  var name = document.getElementById('badge-name').value.trim();
  var icon = document.getElementById('badge-icon').value.trim();
  var desc = document.getElementById('badge-desc').value.trim();
  if (!name) return;

  db.collection('badges').add({
    name: name,
    icon: icon || '🏅',
    desc: desc,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function() {
    var ids = ['badge-name','badge-icon','badge-desc'];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.value = '';
    }
    window.loadBadges();
  });
};

window.grantBadge = function() {
  var uid = document.getElementById('grant-uid').value.trim();
  var badgeId = document.getElementById('grant-badge-select').value;
  if (!uid || !badgeId) return;

  var badge = null;
  for (var i = 0; i < window.allBadges.length; i++) {
      if (window.allBadges[i].id === badgeId) {
          badge = window.allBadges[i];
          break;
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
  });
};

// ===== TRASH & BACKUPS (Moved logic from content.js if needed) =====
window.loadTrash = function() {
  var shopsContainer = document.getElementById('trash-shops');
  var usersContainer = document.getElementById('trash-users');
  
  Promise.all([
    db.collection('merchants').where('status', '==', 'banned').get(),
    db.collection('users').where('role', '==', 'banned').get()
  ]).then(function(results) {
    var shops = results[0];
    var users = results[1];
    
    if (shopsContainer) {
      shopsContainer.innerHTML = shops.docs.map(function(doc) {
        var s = doc.data();
        var name = (s.name && s.name['zh-TW']) || doc.id;
        return '<div style="border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">' +
          '<span>' + name + '</span>' +
          '<button class="btn btn-green btn-sm" onclick="window.restoreShop(\'' + doc.id + '\')">還原</button>' +
        '</div>';
      }).join('') || '<p style="color:#9ca3af;font-size:.85rem">空</p>';
    }

    if (usersContainer) {
      usersContainer.innerHTML = users.docs.map(function(doc) {
        return '<div style="border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">' +
          '<span>' + doc.id + '</span>' +
          '<button class="btn btn-green btn-sm" onclick="window.setUserRole(\'' + doc.id + '\',\'user\')">解封</button>' +
        '</div>';
      }).join('') || '<p style="color:#9ca3af;font-size:.85rem">空</p>';
    }
  });
};

window.emptyTrash = function(type) {
  var collection = type === 'shops' ? 'merchants' : 'users';
  var queryField = type === 'shops' ? 'status' : 'role';
  var queryVal = 'banned';

  if (!confirm('確定要永久刪除所有已封禁的項目嗎？\n\n注意：此操作無法撤銷！')) return;

  db.collection(collection).where(queryField, '==', queryVal).get().then(function(snap) {
    if (snap.empty) { alert('垃圾桶已空'); return; }
    
    var batch = db.batch();
    snap.docs.forEach(function(doc) {
      batch.delete(doc.ref);
    });
    
    return batch.commit().then(function() {
      alert('已永久刪除 ' + snap.size + ' 個項目。');
      window.loadTrash();
    });
  }).catch(function(err) { alert('操作失敗：' + err.message); });
};
