// ===== admin/shops.js =====
// Fully ES5-compliant. All async/await rewritten to .then()/.catch() Promises.

window.adminAllShops = [];
window.loadShops = function() {
  db.collection('merchants').get()
    .then(function(snap) {
      window.adminAllShops = snap.docs.map(function(d) {
        var data = d.data();
        data.id = d.id;
        return data;
      });
      window.renderShopsTable(window.adminAllShops);
      window.renderAuditTable(window.adminAllShops.filter(function(s) {
        return !s.verified && s.status !== 'banned';
      }));
      if (window.rebuildRAGIndex) window.rebuildRAGIndex();
      var searchInput = document.getElementById('shop-search');
      if (searchInput) {
        searchInput.oninput = function(e) {
          var q = e.target.value.toLowerCase();
          window.renderShopsTable(window.adminAllShops.filter(function(s) {
            var nameZh = (s.name && s.name['zh-TW']) || '';
            return nameZh.toLowerCase().indexOf(q) !== -1;
          }));
        };
      }
    })
    .catch(function(err) {
      console.error('loadShops error:', err);
    });
};

window.renderAuditTable = function(shops) {
  var tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  if (shops.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:16px">目前沒有待審核的商店</td></tr>';
    return;
  }
  tbody.innerHTML = shops.map(function(s) {
    var nameZh = escapeHtml((s.name && s.name['zh-TW']) || '—');
    var typeZh = escapeHtml((s.type && s.type['zh-TW']) || '—');
    return '<tr>' +
      '<td><strong>' + nameZh + '</strong></td>' +
      '<td>' + typeZh + '</td>' +
      '<td style="display:flex;gap:6px">' +
        '<button class="btn btn-green btn-sm" onclick="window.approveShop(\'' + s.id + '\')">審核通過</button>' +
        '<button class="btn btn-blue btn-sm" onclick="window.openShopModal(\'' + s.id + '\')">編輯內容</button>' +
        '<button class="btn btn-red btn-sm" onclick="window.deleteShop(\'' + s.id + '\')">移至垃圾桶</button>' +
      '</td>' +
    '</tr>';
  }).join('');
};

window.approveShop = function(id) {
  if (!confirm('確認核發「官方審核認證」標章？')) return;
  db.collection('merchants').doc(id).update({ verified: true })
    .then(function() { window.loadShops(); })
    .catch(function(err) { alert('審核失敗：' + err.message); });
};

window.renderShopsTable = function(shops) {
  var tbody = document.getElementById('shops-tbody');
  if (!tbody) return;
  tbody.innerHTML = shops.map(function(s) {
    var nameZh = escapeHtml((s.name && s.name['zh-TW']) || '—');
    var typeZh = escapeHtml((s.type && s.type['zh-TW']) || '—');
    var statusClass = s.status === 'active' ? 'badge-green' : 'badge-gray';
    var statusText = s.status === 'active' ? '上架' : '隱藏';
    var toggleBtnClass = s.status === 'active' ? 'btn-gray' : 'btn-green';
    var toggleBtnText = s.status === 'active' ? '下架' : '上架';

    var html = '<tr>' +
      '<td>' +
        '<strong>' + nameZh + '</strong>' +
        (s.verified ? '<span style="margin-left:4px;font-size:10px;color:#16a34a;" title="官方認證">✔ 認證</span>' : '') +
        (s.isPartner ? '<span style="margin-left:4px;font-size:10px;color:#d97706;" title="合作店家">★ 合作</span>' : '') +
      '</td>' +
      '<td>' + typeZh + '</td>' +
      '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
      '<td>' +
        (s.status !== 'banned' ? (
          '<button class="btn btn-blue btn-sm" onclick="window.openShopModal(\'' + s.id + '\')"><i class="fa fa-edit"></i></button> ' +
          '<button class="btn ' + toggleBtnClass + ' btn-sm" onclick="window.toggleShopStatus(\'' + s.id + '\',\'' + s.status + '\')">' + toggleBtnText + '</button> ' +
          '<button class="btn btn-red btn-sm" onclick="window.deleteShop(\'' + s.id + '\')"><i class="fa fa-trash"></i></button>'
        ) : '<span style="color:#9ca3af;font-size:12px">已刪除</span>') +
      '</td>' +
    '</tr>';
    return html;
  }).join('');
};

window.openShopModal = function(id) {
  var modal = document.getElementById('shop-modal');
  if (!modal) return;
  var titleEl = document.getElementById('shop-modal-title');
  var idField = document.getElementById('shop-edit-id');

  if (id) {
    if (titleEl) titleEl.textContent = '編輯商店';
    if (idField) idField.value = id;
    var shop = window.adminAllShops.find(function(s) { return s.id === id; });
    if (shop) {
      document.getElementById('s-name-zh').value = (shop.name && shop.name['zh-TW']) || '';
      document.getElementById('s-name-en').value = (shop.name && shop.name['en']) || '';
      document.getElementById('s-type-zh').value = (shop.type && shop.type['zh-TW']) || '';
      document.getElementById('s-addr-zh').value = (shop.address && shop.address['zh-TW']) || '';
      document.getElementById('s-lat').value = (shop.location && shop.location.latitude) || '';
      document.getElementById('s-lng').value = (shop.location && shop.location.longitude) || '';
      document.getElementById('s-desc-zh').value = (shop.description && shop.description['zh-TW']) || '';
      document.getElementById('s-hours').value = shop.openingHours || '';
      document.getElementById('s-phone').value = shop.phone || '';
      document.getElementById('s-website').value = shop.website || '';
      document.getElementById('s-image').value = shop.imageUrl || '';
      document.getElementById('s-eco').value = (shop.ecoFeatures || []).join(', ');
      document.getElementById('s-status').value = shop.status || 'active';
      document.getElementById('s-featured').checked = !!shop.featured;
      document.getElementById('s-verified').checked = !!shop.verified;
      document.getElementById('s-partner').checked = !!shop.isPartner;
    }
  } else {
    if (titleEl) titleEl.textContent = '新增商店';
    if (idField) idField.value = '';
    var fields = ['s-name-zh','s-name-en','s-type-zh','s-addr-zh','s-lat','s-lng','s-desc-zh','s-hours','s-phone','s-website','s-image','s-eco'];
    fields.forEach(function(fid) { var el = document.getElementById(fid); if (el) el.value = ''; });
    document.getElementById('s-status').value = 'active';
    document.getElementById('s-featured').checked = false;
    document.getElementById('s-verified').checked = false;
    document.getElementById('s-partner').checked = false;
  }
  modal.dataset.isBranch = 'false';
  modal.dataset.parentId = '';
  modal.classList.add('open');
};


window.geocodeAddress = function() {
  var addr = document.getElementById('s-addr-zh').value.trim();
  if (!addr) {
    alert('請先輸入中文地址！');
    return Promise.reject('No address');
  }
  
  var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(addr);
  return fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data && data.length > 0) {
        document.getElementById('s-lat').value = data[0].lat;
        document.getElementById('s-lng').value = data[0].lon;
        alert('成功取得座標：' + data[0].lat + ', ' + data[0].lon);
        return true;
      } else {
        alert('無法解析該地址的座標，請手動確認地址是否正確。');
        return false;
      }
    })
    .catch(function(err) {
      alert('自動取得座標失敗：' + err.message);
      return false;
    });
};

window.saveShop = function() {
  var id = document.getElementById('shop-edit-id').value;
  var latVal = document.getElementById('s-lat').value;
  var lngVal = document.getElementById('s-lng').value;
  var nameZh = document.getElementById('s-name-zh').value.trim();

  if (!latVal || !lngVal) {
    var addr = document.getElementById('s-addr-zh').value.trim();
    if (addr) {
      alert('座標未填寫，系統正自動嘗試從地址取得座標...');
      window.geocodeAddress().then(function(success) {
        if (success) {
          window.saveShop();
        }
      });
      return;
    }
  }

  var data = {
    name: { 'zh-TW': nameZh, 'en': document.getElementById('s-name-en').value.trim() },
    type: { 'zh-TW': document.getElementById('s-type-zh').value.trim() },
    address: { 'zh-TW': document.getElementById('s-addr-zh').value.trim() },
    description: { 'zh-TW': document.getElementById('s-desc-zh').value.trim() },
    openingHours: document.getElementById('s-hours').value.trim(),
    phone: document.getElementById('s-phone').value.trim(),
    website: document.getElementById('s-website').value.trim(),
    imageUrl: document.getElementById('s-image').value.trim(),
    ecoFeatures: document.getElementById('s-eco').value.split(',').map(function(x) { return x.trim(); }).filter(function(x) { return x; }),
    location: latVal && lngVal ? new firebase.firestore.GeoPoint(parseFloat(latVal), parseFloat(lngVal)) : null,
    status: document.getElementById('s-status').value,
    featured: document.getElementById('s-featured').checked,
    verified: document.getElementById('s-verified').checked,
    isPartner: document.getElementById('s-partner').checked,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  var modal = document.getElementById('shop-modal');
  var isExistingBranch = modal.dataset.isBranch === 'true';
  if (isExistingBranch) {
    data.isBranch = true;
    data.parentId = modal.dataset.parentId;
  }

  var existingShop = window.adminAllShops.find(function(s) {
    return s.id !== id && s.name && s.name['zh-TW'] === nameZh;
  });
  if (existingShop && !isExistingBranch) {
    if (confirm('店名 "' + nameZh + '" 已經存在！\n是否將此店面標記為「分店」？')) {
      data.isBranch = true;
      data.parentId = existingShop.parentId || existingShop.id;
    } else {
      return;
    }
  }

  var promise;
  if (id) {
    promise = db.collection('merchants').doc(id).update(data);
  } else {
    data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    promise = db.collection('merchants').add(data);
  }

  promise
    .then(function() { window.closeModal('shop-modal'); window.loadShops(); })
    .catch(function(err) { alert('儲存失敗：' + err.message); });
};

window.toggleShopStatus = function(id, currentStatus) {
  var newStatus = currentStatus === 'active' ? 'hidden' : 'active';
  db.collection('merchants').doc(id).update({ status: newStatus })
    .then(function() { window.loadShops(); })
    .catch(function(err) { alert('狀態更新失敗：' + err.message); });
};

window.deleteShop = function(id) {
  if (!confirm('確定要移至垃圾桶嗎？')) return;
  db.collection('merchants').doc(id).update({ status: 'banned', deletedAt: firebase.firestore.FieldValue.serverTimestamp() })
    .then(function() { window.loadShops(); })
    .catch(function(err) { alert('刪除失敗：' + err.message); });
};

var csvInput = document.getElementById('csv-input');
if (csvInput) {
  csvInput.addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(evt) {
      var text = evt.target.result;
      var allRows = text.split('\n').filter(function(r) { return r.trim(); });
      if (allRows.length === 0) return;
      var header = allRows[0];
      var rows = allRows.slice(1);
      var keys = header.split(',').map(function(k) { return k.trim(); });
      var importPromise = Promise.resolve();
      var count = 0;

      rows.forEach(function(row) {
        var vals = row.split(',').map(function(v) { return v.trim(); });
        var obj = {};
        keys.forEach(function(k, idx) { obj[k] = vals[idx]; });
        if (!obj.name_zh) return;
        importPromise = importPromise.then(function() {
          count++;
          return db.collection('merchants').add({
            name: { 'zh-TW': obj.name_zh, 'en': obj.name_en || '' },
            type: { 'zh-TW': obj.type_zh || '' },
            address: { 'zh-TW': obj.address_zh || '' },
            description: { 'zh-TW': obj.desc_zh || '' },
            phone: obj.phone || '',
            website: obj.website || '',
            openingHours: obj.opening_hours || '',
            ecoFeatures: obj.eco_features ? obj.eco_features.split('|').map(function(x) { return x.trim(); }) : [],
            location: obj.lat && obj.lng ? new firebase.firestore.GeoPoint(parseFloat(obj.lat), parseFloat(obj.lng)) : null,
            status: 'active',
            verified: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        });
      });

      importPromise
        .then(function() {
          alert('成功匯入 ' + count + ' 筆商店資料！');
          window.loadShops();
          e.target.value = '';
        })
        .catch(function(err) { alert('CSV 匯入失敗：' + err.message); });
    };
    reader.readAsText(file);
  });
}

window.exportShopsCSV = function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以匯出');
  var headers = ['id','name_zh','name_en','type_zh','address_zh','lat','lng','phone','website','status','featured'];
  var rows = window.adminAllShops.map(function(s) {
    var nameZh = (s.name && s.name['zh-TW']) || '';
    var nameEn = (s.name && s.name['en']) || '';
    var typeZh = (s.type && s.type['zh-TW']) || '';
    var addrZh = (s.address && s.address['zh-TW']) || '';
    var lat = (s.location && s.location.latitude) || '';
    var lng = (s.location && s.location.longitude) || '';
    return [s.id, '"'+nameZh.replace(/"/g,'""')+'"', '"'+nameEn.replace(/"/g,'""')+'"', '"'+typeZh.replace(/"/g,'""')+'"', '"'+addrZh.replace(/"/g,'""')+'"', lat, lng, '"'+(s.phone||'').replace(/"/g,'""')+'"', '"'+(s.website||'').replace(/"/g,'""')+'"', s.status||'active', s.featured?'true':'false'].join(',');
  });
  var csvContent = "﻿" + headers.join(',') + "\n" + rows.join('\n');
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "shops_export_" + new Date().getTime() + ".csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

window.backupShops = function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以備份');
  var backupData = JSON.stringify(window.adminAllShops, null, 2);
  var blob = new Blob([backupData], {type: "application/json;charset=utf-8"});
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "shops_backup_" + new Date().getTime() + ".json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.onlineBackupShops = function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以備份');
  if (!confirm('確定要建立線上備份嗎？')) return;
  var backupData = {
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    shopCount: window.adminAllShops.length,
    data: window.adminAllShops
  };
  db.collection('backups').add(backupData)
    .then(function() { alert('線上備份成功建立！'); })
    .catch(function(err) { console.error('Online backup error:', err); alert('線上備份失敗：' + err.message); });
};

window.clearAllShops = function() {
  if (!confirm('警告：此操作將會把所有商店移至垃圾桶。\n\n確定要繼續嗎？')) return;
  if (!confirm('請再次確認，這會影響所有前台顯示的商店！')) return;
  var batch = db.batch();
  var count = 0;
  window.adminAllShops.forEach(function(shop) {
    if (shop.status !== 'banned') {
      var shopRef = db.collection('merchants').doc(shop.id);
      batch.update(shopRef, { status: 'banned', deletedAt: firebase.firestore.FieldValue.serverTimestamp() });
      count++;
    }
  });
  if (count > 0) {
    batch.commit()
      .then(function() { alert('已成功將 ' + count + ' 間商店移至垃圾桶。'); window.loadShops(); })
      .catch(function(err) { console.error('Clear all error:', err); alert('清除失敗：' + err.message); });
  } else {
    alert('目前沒有可以清除的商店。');
  }
};
