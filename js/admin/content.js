// ===== admin/content.js (Reports, Newsletter, Announcements, Policy, Badges, Trash) =====

// ===== REPORTS =====
window.loadReports = function() {
  Promise.all([
    db.collection('reports').orderBy('timestamp','desc').limit(30).get(),
    db.collection('issues').orderBy('timestamp','desc').limit(30).get()
  ]).then(function(results) {
    var reps = results[0];
    var issues = results[1];

    var shopMap = {};
    (window.adminAllShops || []).forEach(function(s) {
      shopMap[s.id] = (s.name && s.name['zh-TW']) || s.id;
    });

    var repList = document.getElementById('reports-list');
    if (repList) {
      repList.innerHTML = reps.docs.map(function(doc) {
        var r = doc.data();
        var statusColor = r.status === 'resolved' ? 'badge-green' : 'badge-yellow';
        var date = r.timestamp ? r.timestamp.toDate().toLocaleDateString() : '—';
        return '<div style="border:1px solid #fee2e2;border-radius:8px;padding:12px;margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
          '<strong>' + (shopMap[r.shopId] || '未知商店') + '</strong>' +
          '<span class="badge ' + statusColor + '">' + (r.status || '待處理') + '</span>' +
          '</div>' +
          '<p style="font-size:.8rem;color:#6b7280;margin-top:4px"><strong>原因：</strong>' + (r.reason || '—') + '</p>' +
          (r.description ? '<p style="font-size:.75rem;color:#6b7280;background:#fef2f2;padding:6px;border-radius:4px;margin-top:4px"><strong>補充說明：</strong>' + r.description + '</p>' : '') +
          '<div style="display:flex;gap:6px;margin-top:8px">' +
          '<button class="btn btn-green btn-sm" onclick="window.resolveItem(\'reports\',\'' + doc.id + '\')">標記已處理</button>' +
          '<span style="font-size:11px;color:#9ca3af;align-self:center">' + date + '</span>' +
          '</div>' +
          '</div>';
      }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無檢舉</p>';
    }

    var issuesList = document.getElementById('issues-list');
    if (issuesList) {
      issuesList.innerHTML = issues.docs.map(function(doc) {
        var r = doc.data();
        var date = r.reportedAt ? r.reportedAt.toDate().toLocaleDateString() : '—';
        return '<div style="border:1px solid #dbeafe;border-radius:8px;padding:12px;margin-bottom:8px">' +
          '<p style="font-size:.85rem">' + (r.description || r.message || '—') + '</p>' +
          '<div style="display:flex;gap:6px;margin-top:8px">' +
          '<button class="btn btn-green btn-sm" onclick="window.resolveItem(\'issues\',\'' + doc.id + '\')">標記已處理</button>' +
          '<span style="font-size:11px;color:#9ca3af;align-self:center">' + date + '</span>' +
          '</div>' +
          '</div>';
      }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無問題回報</p>';
    }
  }).catch(function(err) { console.error('loadReports error:', err); });
};

// ===== REVIEWS =====
window.loadReviews = function() {
  db.collection('reviews').orderBy('timestamp','desc').limit(50).get()
    .then(function(snap) {
      var shopMap = {};
      (window.adminAllShops || []).forEach(function(s) {
        shopMap[s.id] = (s.name && s.name['zh-TW']) || s.id;
      });

      var tbody = document.getElementById('reviews-tbody');
      if (tbody) {
        tbody.innerHTML = snap.docs.map(function(doc) {
          var r = doc.data();
          var date = r.timestamp ? r.timestamp.toDate().toLocaleDateString() : '—';
          var stars = '';
          for (var i = 0; i < 5; i++) stars += (i < (r.rating || 0)) ? '★' : '☆';
          return '<tr>' +
            '<td>' + (shopMap[r.shopId] || '未知商店') + '</td>' +
            '<td style="color:#f59e0b;font-weight:bold" title="' + (r.rating || 0) + '/5">' + stars + '</td>' +
            '<td style="font-size:.85rem">' + (r.comment || '<span style="color:#9ca3af">無評論</span>') + '</td>' +
            '<td style="font-size:.8rem;color:#6b7280">' + date + '</td>' +
            '<td><button class="btn btn-red btn-sm" onclick="window.deleteReview(\'' + doc.id + '\')" title="刪除"><i class="fa fa-trash"></i></button></td>' +
            '</tr>';
        }).join('') || '<tr><td colspan="5" style="text-align:center;color:#9ca3af">目前無評價</td></tr>';
      }
    }).catch(function(err) { console.error('loadReviews error:', err); });
};

window.deleteReview = function(id) {
  if (!confirm('確定永久刪除此評價？')) return;
  db.collection('reviews').doc(id).delete().then(function() {
    window.loadReviews();
  });
};

window.resolveItem = function(col, id) {
  db.collection(col).doc(id).update({
    status: 'resolved',
    resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function() {
    window.loadReports();
  });
};

// ===== NEWSLETTER =====
window.loadNewsletter = function() {
  db.collection('newsletter').orderBy('subscribedAt','desc').get()
    .then(function(snap) {
      var subCount = document.getElementById('sub-count');
      if (subCount) subCount.textContent = snap.size;

      var tbody = document.getElementById('newsletter-tbody');
      if (tbody) {
        tbody.innerHTML = snap.docs.map(function(doc) {
          var d = doc.data();
          var date = d.subscribedAt ? d.subscribedAt.toDate().toLocaleDateString() : '—';
          var source = d.source || 'Direct';
          return '<tr>' +
            '<td>' + (d.email || '—') + '</td>' +
            '<td><span style="font-size:11px;background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:99px">' + source + '</span></td>' +
            '<td>' + date + '</td>' +
            '<td><button class="btn btn-red btn-sm" onclick="window.removeSub(\'' + doc.id + '\')"><i class="fa fa-trash"></i></button></td>' +
            '</tr>';
        }).join('') || '<tr><td colspan="4" style="text-align:center;color:#9ca3af">目前無訂閱者</td></tr>';
      }
    }).catch(function(err) { console.error('loadNewsletter error:', err); });
};

window.removeSub = function(id) {
  if (!confirm('確定移除此訂閱者？')) return;
  db.collection('newsletter').doc(id).delete().then(function() {
    window.loadNewsletter();
  });
};

// ===== ANNOUNCEMENTS =====
window.loadAnnouncements = function() {
  db.collection('announcements').orderBy('createdAt','desc').limit(10).get()
    .then(function(snap) {
      var annList = document.getElementById('ann-list');
      if (annList) {
        annList.innerHTML = snap.docs.map(function(doc) {
          var d = doc.data();
          var date = d.createdAt ? d.createdAt.toDate().toLocaleString() : '—';
          return '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
            '<div>' +
            '<strong style="font-size:.9rem">' + (d.title || '未命名') + '</strong>' +
            '<p style="font-size:.75rem;color:#9ca3af;margin-top:4px">' + date + '</p>' +
            '</div>' +
            '<button class="btn btn-red btn-sm" onclick="window.deleteAnn(\'' + doc.id + '\')"><i class="fa fa-trash"></i></button>' +
            '</div>' +
            '</div>';
        }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無公告</p>';
      }
    }).catch(function(err) { console.error('loadAnnouncements error:', err); });
};

window.saveAnnouncement = function() {
  var title = document.getElementById('ann-title').value.trim();
  var contentEl = document.getElementById('rte-content');
  var content = contentEl ? contentEl.innerHTML : '';
  if (!title) { alert('請輸入標題'); return; }
  db.collection('announcements').add({
    title: title,
    content: content,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function() {
    document.getElementById('ann-title').value = '';
    if (contentEl) contentEl.innerHTML = '';
    window.loadAnnouncements();
  });
};

window.deleteAnn = function(id) {
  if (!confirm('確定刪除此公告？')) return;
  db.collection('announcements').doc(id).delete().then(function() {
    window.loadAnnouncements();
  });
};

window.fmt = function(cmd) {
  document.execCommand(cmd, false, null);
  var rte = document.getElementById('rte-content');
  if (rte) rte.focus();
};
window.fmtLink = function() {
  var url = prompt('請輸入連結 URL:');
  if (url) document.execCommand('createLink', false, url);
};

// ===== POLICY =====
window.loadPolicy = function() {
  var typeEl = document.getElementById('policy-type');
  if (!typeEl) return;
  var type = typeEl.value;
  db.collection('policies').doc(type).get().then(function(snap) {
    var contentEl = document.getElementById('policy-content');
    if (contentEl) contentEl.value = snap.exists ? snap.data().content : '';
  }).catch(function(err) { console.error('loadPolicy error:', err); });
};

var policyTypeEl = document.getElementById('policy-type');
if (policyTypeEl) policyTypeEl.addEventListener('change', window.loadPolicy);

window.savePolicy = function() {
  var typeEl = document.getElementById('policy-type');
  var contentEl = document.getElementById('policy-content');
  if (!typeEl || !contentEl) return;
  var type = typeEl.value;
  var content = contentEl.value;
  
  db.collection('policies').doc(type).set({
    content: content,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function() {
    return db.collection('policyHistory').add({
      type: type,
      content: content,
      savedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(function() {
    alert('政策已儲存！');
  });
};

window.loadPolicyHistory = function() {
  var typeEl = document.getElementById('policy-type');
  if (!typeEl) return;
  var type = typeEl.value;
  db.collection('policyHistory').where('type','==',type).orderBy('savedAt','desc').limit(5).get()
    .then(function(snap) {
      var el = document.getElementById('policy-history');
      if (!el) return;
      el.style.display = 'block';
      el.innerHTML = '<h4 style="font-weight:700;margin-bottom:8px">版本紀錄</h4>' +
        snap.docs.map(function(doc) {
          var d = doc.data();
          var date = d.savedAt ? d.savedAt.toDate().toLocaleString() : '—';
          var escapedContent = (d.content || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          return '<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;cursor:pointer" onclick="document.getElementById(\'policy-content\').value=\'' + escapedContent + '\'">' +
            '<div style="font-size:.8rem;color:#6b7280">' + date + ' <span style="color:#2563eb">(點擊還原)</span></div>' +
            '</div>';
        }).join('') || '<p style="color:#9ca3af;font-size:.85rem">無版本紀錄</p>';
    }).catch(function(err) { console.error('loadPolicyHistory error:', err); });
};

// ===== BADGES =====
window.loadBadges = function() {
  var listContainer = document.getElementById('badges-list');
  if (!listContainer) return;
  listContainer.innerHTML = '<p style="color:#9ca3af;font-size:.85rem;text-align:center;padding:16px">載入中...</p>';
  var grantSelect = document.getElementById('grant-badge-select');
  
  db.collection('badges').get().then(function(snap) {
    var badges = snap.docs.map(function(doc) { var d = doc.data(); d.id = doc.id; return d; });
    if (grantSelect) {
      grantSelect.innerHTML = badges.map(function(b) {
        return '<option value="' + b.id + '">' + (b.icon || '') + ' ' + (b.name || b.id) + '</option>';
      }).join('') || '<option value="">尚無徽章</option>';
    }
    listContainer.innerHTML = badges.map(function(b) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px">' +
        '<div><span style="font-size:1.5rem;margin-right:8px">' + (b.icon || '🏅') + '</span>' +
        '<strong>' + (b.name || '未命名') + '</strong>' +
        (b.desc ? '<p style="font-size:.75rem;color:#6b7280;margin-top:4px">' + b.desc + '</p>' : '') + '</div>' +
        '<button class="btn btn-red btn-sm" onclick="window.deleteBadge(\'' + b.id + '\')"><i class="fa fa-trash"></i></button>' +
        '</div>';
    }).join('') || '<p style="color:#9ca3af;font-size:.85rem">尚無徽章，請從左側新增</p>';
  }).catch(function(err) {
    listContainer.innerHTML = '<p style="color:#ef4444">載入失敗：' + err.message + '</p>';
  });
};

window.saveBadge = function() {
  var name = document.getElementById('badge-name').value.trim();
  var icon = document.getElementById('badge-icon').value.trim();
  var desc = document.getElementById('badge-desc').value.trim();
  if (!name) { alert('請輸入徽章名稱'); return; }
  db.collection('badges').add({ name: name, icon: icon || '🏅', desc: desc, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function() {
    document.getElementById('badge-name').value = '';
    document.getElementById('badge-icon').value = '';
    document.getElementById('badge-desc').value = '';
    alert('徽章已建立！');
    window.loadBadges();
  });
};

window.deleteBadge = function(id) {
  if (!confirm('確定刪除此徽章？')) return;
  db.collection('badges').doc(id).delete().then(function() {
    window.loadBadges();
  });
};

window.grantBadge = function() {
  var uid = document.getElementById('grant-uid').value.trim();
  var badgeId = document.getElementById('grant-badge-select').value;
  if (!uid || !badgeId) { alert('請填寫使用者 UID 並選擇徽章'); return; }
  db.collection('badges').doc(badgeId).get().then(function(badgeSnap) {
    if (!badgeSnap.exists) { alert('徽章不存在'); return; }
    var bd = badgeSnap.data();
    return db.collection('users').doc(uid).update({
      badges: firebase.firestore.FieldValue.arrayUnion({ id: badgeId, name: bd.name, icon: bd.icon, grantedAt: new Date().toISOString() })
    });
  }).then(function() {
    alert('徽章頒發成功！');
  }).catch(function(err) { alert('頒發失敗：' + err.message); });
};

window.toggleBadge = function(shopId, field, value) {
  var update = {};
  update[field] = value;
  db.collection('merchants').doc(shopId).update(update).catch(function(err) {
    alert('更新失敗：' + err.message);
  });
};

// ===== TRASH (Banned shops + users) =====
window.loadTrash = function() {
  var shopsContainer = document.getElementById('trash-shops');
  var usersContainer = document.getElementById('trash-users');
  if (shopsContainer) shopsContainer.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:16px">載入中...</p>';
  if (usersContainer) usersContainer.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:16px">載入中...</p>';
  
  Promise.all([
    db.collection('merchants').where('status','==','banned').get(),
    db.collection('users').where('status','==','banned').get()
  ]).then(function(results) {
    var shopSnap = results[0];
    var userSnap = results[1];
    if (shopsContainer) {
      shopsContainer.innerHTML = shopSnap.empty
        ? '<p style="color:#9ca3af;font-size:.85rem;text-align:center;padding:16px">垃圾桶是空的</p>'
        : shopSnap.docs.map(function(doc) {
            var s = doc.data();
            var name = (s.name && s.name['zh-TW']) || '未命名';
            var deleted = s.deletedAt ? s.deletedAt.toDate().toLocaleDateString() : '—';
            return '<div style="border:1px solid #fee2e2;border-radius:8px;padding:10px;margin-bottom:8px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<div><strong>' + name + '</strong><span style="font-size:11px;color:#9ca3af;margin-left:8px">' + deleted + '</span></div>' +
              '<div style="display:flex;gap:4px">' +
              '<button class="btn btn-green btn-sm" onclick="window.restoreShop(\'' + doc.id + '\')"><i class="fa fa-undo"></i> 還原</button>' +
              '<button class="btn btn-red btn-sm" onclick="window.permanentDelete(\'' + doc.id + '\')"><i class="fa fa-trash"></i></button>' +
              '</div></div></div>';
          }).join('');
    }
    if (usersContainer) {
      usersContainer.innerHTML = userSnap.empty
        ? '<p style="color:#9ca3af;font-size:.85rem;text-align:center;padding:16px">無被封禁的使用者</p>'
        : userSnap.docs.map(function(doc) {
            var u = doc.data();
            return '<div style="border:1px solid #fee2e2;border-radius:8px;padding:10px;margin-bottom:8px">' +
              '<div style="display:flex;justify-content:space-between;align-items:center">' +
              '<div style="font-size:.8rem">' + doc.id + ' <span style="color:#9ca3af">[' + (u.role||'user') + ']</span></div>' +
              '<button class="btn btn-green btn-sm" onclick="window.restoreUser(\'' + doc.id + '\')"><i class="fa fa-undo"></i> 解封</button>' +
              '</div></div>';
          }).join('');
    }
  }).catch(function(err) {
    if (shopsContainer) shopsContainer.innerHTML = '<p style="color:#ef4444">載入失敗</p>';
  });
};

window.restoreShop = function(id) {
  if (!confirm('確定要還原並重新上架此商店嗎？')) return;
  db.collection('merchants').doc(id).update({ status: 'active', deletedAt: null }).then(function() {
    window.loadTrash();
  });
};

window.permanentDelete = function(id) {
  if (!confirm('警告：此操作將永久刪除商店，無法復原！\n確定繼續？')) return;
  db.collection('merchants').doc(id).delete().then(function() {
    window.loadTrash();
  });
};

window.restoreUser = function(id) {
  db.collection('users').doc(id).update({ status: 'active' }).then(function() {
    window.loadTrash();
  });
};

window.emptyTrash = function(type) {
  var isShops = type === 'shops';
  if (!confirm('確定要永久刪除所有「' + (isShops ? '商店' : '用戶') + '」垃圾桶項目？此操作無法復原！')) return;
  
  var query = isShops
    ? db.collection('merchants').where('status','==','banned')
    : db.collection('users').where('status','==','banned');
  
  query.get().then(function(snap) {
    var batch = db.batch();
    snap.docs.forEach(function(doc) { batch.delete(doc.ref); });
    return batch.commit().then(function() { return snap.size; });
  }).then(function(size) {
    alert('已清空 ' + size + ' 筆資料');
    window.loadTrash();
  }).catch(function(err) { alert('清空失敗：' + err.message); });
};

// ===== CHECK-IN RECEIPTS (ADMIN PREVIEW MODAL) =====
window.loadedCheckinsMap = {};
window.loadReceipts = function() {
  var tbody = document.getElementById('receipts-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:16px">載入中...</td></tr>';
  
  db.collection('checkins').orderBy('timestamp', 'desc').limit(50).get()
    .then(function(snap) {
      if (snap.empty) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:16px">尚無打卡記錄</td></tr>';
        return;
      }
      
      tbody.innerHTML = snap.docs.map(function(doc) {
        var data = doc.data();
        var date = '—';
        if (data.timestamp) {
          if (data.timestamp.toDate) {
            date = data.timestamp.toDate().toLocaleString('zh-TW', { hour12: false });
          } else {
            date = new Date(data.timestamp).toLocaleString('zh-TW', { hour12: false });
          }
        }
        var recordId = data.recordId || ('GE-' + doc.id.substring(0, 8).toUpperCase());
        var isSimulatedLabel = data.simulated ? ' <span class="badge badge-yellow" style="font-size: 10px; padding: 1px 4px; border-radius: 0 !important;">模擬</span>' : '';
        
        return '<tr onclick="window.previewAdminReceipt(\'' + doc.id + '\')" style="cursor:pointer">' +
          '<td><strong style="color: #16a34a">' + recordId + '</strong>' + isSimulatedLabel + '</td>' +
          '<td>' + (data.userName || '未知用戶') + '</td>' +
          '<td>' + (data.shopName || '未知商店') + '</td>' +
          '<td><span style="color:#16a34a; font-weight:bold">' + (data.carbonSaved || 0) + ' g</span></td>' +
          '<td>' + date + '</td>' +
          '</tr>';
      }).join('');
      
      snap.docs.forEach(function(doc) {
        window.loadedCheckinsMap[doc.id] = doc.data();
      });
    }).catch(function(err) {
      console.error('loadReceipts error:', err);
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:16px">載入失敗：' + err.message + '</td></tr>';
    });
};

window.previewAdminReceipt = function(docId) {
  var data = window.loadedCheckinsMap && window.loadedCheckinsMap[docId];
  if (!data) return;
  
  var modal = document.getElementById('admin-receipt-modal');
  var img = document.getElementById('admin-receipt-img');
  var downloadBtn = document.getElementById('admin-receipt-download');
  
  if (img && data.base64Receipt) {
    img.src = data.base64Receipt;
  }
  
  if (downloadBtn && data.base64Receipt) {
    downloadBtn.href = data.base64Receipt;
    var safeShopName = (data.shopName || 'shop').replace(/\s+/g, '_');
    downloadBtn.download = 'eco-receipt-' + safeShopName + '-' + (data.recordId || docId) + '.png';
  }
  
  if (modal) {
    modal.classList.add('open');
  }
};

