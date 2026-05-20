// ===== admin/shops.js =====
window.adminAllShops = [];
window.loadShops = async function() {
  try {
    var snap = await db.collection('merchants').get();
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
  } catch (err) {
    console.error('loadShops error:', err);
  }
};

window.renderAuditTable = function(shops) {
  var tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  tbody.innerHTML = shops.map(function(s) {
    var nameZh = (s.name && s.name['zh-TW']) || '—';
    var typeZh = (s.type && s.type['zh-TW']) || '—';
    return '<tr>' +
      '<td><strong>' + nameZh + '</strong></td>' +
      '<td>' + typeZh + '</td>' +
      '<td style="display:flex;gap:6px">' +
        '<button class="btn btn-green btn-sm" onclick="window.approveShop(\'' + s.id + '\')"><i class="fa fa-check"></i> 審核通過</button>' +
        '<button class="btn btn-blue btn-sm" onclick="window.openShopModal(\'' + s.id + '\')"><i class="fa fa-edit"></i> 編輯內容</button>' +
        '<button class="btn btn-red btn-sm" onclick="window.deleteShop(\'' + s.id + '\')"><i class="fa fa-trash"></i> 移至垃圾桶</button>' +
      '</td>' +
    '</tr>';
  }).join('');
};

window.approveShop = async function(id) {
  if (!confirm('確認核發「官方審核認證」標章？')) return;
  try {
    await db.collection('merchants').doc(id).update({ verified: true });
    window.loadShops();
  } catch (err) {
    alert('審核失敗：' + err.message);
  }
};

window.renderShopsTable = function(shops) {
  var tbody = document.getElementById('shops-tbody');
  if (!tbody) return;
  tbody.innerHTML = shops.map(function(s) {
    var nameZh = (s.name && s.name['zh-TW']) || '—';
    var typeZh = (s.type && s.type['zh-TW']) || '—';
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
      '<td style="display:flex;gap:6px">' +
        '<button class="btn btn-purple btn-sm" onclick="window.verifyShopWithAI(\'' + s.id + '\')" title="AI 查核" style="display:flex;align-items:center;justify-content:center">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>' +
        '</button>' +
        '<button class="btn btn-blue btn-sm" onclick="window.openShopModal(\'' + s.id + '\')" title="編輯" style="display:flex;align-items:center;justify-content:center">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>' +
        '</button>' +
        '<button class="btn ' + toggleBtnClass + ' btn-sm" onclick="window.toggleShopStatus(\'' + s.id + '\',\'' + s.status + '\')">' + toggleBtnText + '</button>' +
        '<button class="btn btn-red btn-sm" onclick="window.deleteShop(\'' + s.id + '\')" title="刪除" style="display:flex;align-items:center;justify-content:center">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>' +
        '</button>' +
      '</td>' +
    '</tr>';
    return html;
  }).join('');
};

window.openShopModal = function(id) {
  var fields = ['name-zh','name-en','type-zh','addr-zh','lat','lng','desc-zh','hours','eco','status','phone','website','image'];
  fields.forEach(function(f) { 
    var el = document.getElementById('s-'+f); 
    if(el) el.value=''; 
  });
  document.getElementById('s-featured').checked = false;
  document.getElementById('s-verified').checked = false;
  document.getElementById('s-partner').checked = false;
  document.getElementById('shop-edit-id').value = '';
  document.getElementById('shop-modal-title').textContent = id ? '編輯商店' : '新增商店';
  
  var modal = document.getElementById('shop-modal');
  modal.dataset.isBranch = 'false';
  modal.dataset.parentId = '';

  if (id) {
    var s = null;
    for (var i = 0; i < window.adminAllShops.length; i++) {
      if (window.adminAllShops[i].id === id) {
        s = window.adminAllShops[i];
        break;
      }
    }
    if (!s) return;
    document.getElementById('shop-edit-id').value = id;
    document.getElementById('s-name-zh').value = (s.name && s.name['zh-TW']) || '';
    document.getElementById('s-name-en').value = (s.name && s.name['en']) || '';
    document.getElementById('s-type-zh').value = (s.type && s.type['zh-TW']) || '';
    document.getElementById('s-addr-zh').value = (s.address && s.address['zh-TW']) || '';
    document.getElementById('s-lat').value = (s.location && s.location.latitude) || '';
    document.getElementById('s-lng').value = (s.location && s.location.longitude) || '';
    document.getElementById('s-desc-zh').value = (s.description && s.description['zh-TW']) || '';
    document.getElementById('s-hours').value = s.openingHours || '';
    document.getElementById('s-phone').value = s.phone || '';
    document.getElementById('s-website').value = s.website || '';
    document.getElementById('s-image').value = s.imageUrl || '';
    document.getElementById('s-eco').value = (s.ecoFeatures || []).join(',');
    document.getElementById('s-status').value = s.status || 'active';
    document.getElementById('s-featured').checked = s.featured || false;
    document.getElementById('s-verified').checked = s.verified || false;
    document.getElementById('s-partner').checked = s.isPartner || false;
    
    if (s.isBranch) {
        modal.dataset.isBranch = 'true';
        modal.dataset.parentId = s.parentId || '';
    }
  }
  document.getElementById('shop-modal').classList.add('open');
};

window.saveShop = async function() {
  var id = document.getElementById('shop-edit-id').value;
  var latVal = document.getElementById('s-lat').value;
  var lngVal = document.getElementById('s-lng').value;
  var lat = parseFloat(latVal);
  var lng = parseFloat(lngVal);
  var nameZh = document.getElementById('s-name-zh').value.trim();
  
  var data = {
    name: { 'zh-TW': nameZh, 'en': document.getElementById('s-name-en').value },
    type: { 'zh-TW': document.getElementById('s-type-zh').value },
    address: { 'zh-TW': document.getElementById('s-addr-zh').value },
    description: { 'zh-TW': document.getElementById('s-desc-zh').value },
    openingHours: document.getElementById('s-hours').value,
    phone: document.getElementById('s-phone').value.trim(),
    website: document.getElementById('s-website').value.trim(),
    imageUrl: document.getElementById('s-image').value.trim(),
    ecoFeatures: document.getElementById('s-eco').value.split(',').map(function(x){ return x.trim(); }).filter(Boolean),
    status: document.getElementById('s-status').value,
    featured: document.getElementById('s-featured').checked,
    verified: document.getElementById('s-verified').checked,
    isPartner: document.getElementById('s-partner').checked,
    location: !isNaN(lat) && !isNaN(lng) && latVal !== '' && lngVal !== '' ? new firebase.firestore.GeoPoint(lat, lng) : null,
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
    if (confirm('店名 "' + nameZh + '" 已經存在！\n是否將此店面標記為「分店」？\n(按「確定」設為分店，按「取消」放棄儲存)')) {
      data.isBranch = true;
      data.parentId = existingShop.parentId || existingShop.id;
    } else {
      return; 
    }
  }

  try {
    if (id) { 
      await db.collection('merchants').doc(id).update(data); 
    } else { 
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); 
      await db.collection('merchants').add(data); 
    }
    window.closeModal('shop-modal');
    window.loadShops();
  } catch (err) {
    alert('儲存失敗：' + err.message);
  }
};

window.toggleShopStatus = async function(id, currentStatus) {
  var newStatus = currentStatus === 'active' ? 'hidden' : 'active';
  try {
    await db.collection('merchants').doc(id).update({ status: newStatus });
    window.loadShops();
  } catch (err) {
    alert('狀態更新失敗：' + err.message);
  }
};

window.deleteShop = async function(id) {
  if (!confirm('確定要移至垃圾桶嗎？')) return;
  try {
    await db.collection('merchants').doc(id).update({ status: 'banned', deletedAt: firebase.firestore.FieldValue.serverTimestamp() });
    window.loadShops();
  } catch (err) {
    alert('刪除失敗：' + err.message);
  }
};

var csvInput = document.getElementById('csv-input');
if (csvInput) {
  csvInput.addEventListener('change', async function(e) {
    var file = e.target.files[0]; 
    if (!file) return;
    try {
      var text = await file.text();
      var allRows = text.split('\n').filter(function(r){ return r.trim(); });
      if (allRows.length === 0) return;
      var header = allRows[0];
      var rows = allRows.slice(1);
      var keys = header.split(',').map(function(k){ return k.trim(); });
      var count = 0;
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var vals = row.split(',').map(function(v){ return v.trim(); });
        var obj = {};
        keys.forEach(function(k, idx) { obj[k] = vals[idx]; });
        if (!obj.name_zh) continue;
        await db.collection('merchants').add({
          name: { 'zh-TW': obj.name_zh, 'en': obj.name_en||'' },
          type: { 'zh-TW': obj.type_zh||'' },
          address: { 'zh-TW': obj.address_zh||'' },
          description: { 'zh-TW': obj.desc_zh||'' },
          phone: obj.phone || '',
          website: obj.website || '',
          openingHours: obj.opening_hours || '',
          ecoFeatures: obj.eco_features ? obj.eco_features.split('|').map(function(x){ return x.trim(); }) : [],
          location: obj.lat && obj.lng ? new firebase.firestore.GeoPoint(parseFloat(obj.lat), parseFloat(obj.lng)) : null,
          status: 'active', 
          verified: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        count++;
      }
      alert('成功匯入 ' + count + ' 筆商店資料！');
      window.loadShops();
      e.target.value = '';
    } catch (err) {
      alert('CSV 匯入失敗：' + err.message);
    }
  });
}

window.exportShopsCSV = function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以匯出');
  
  var headers = ['id', 'name_zh', 'name_en', 'type_zh', 'address_zh', 'lat', 'lng', 'phone', 'website', 'status', 'featured'];
  var rows = window.adminAllShops.map(function(s) {
    var nameZh = (s.name && s.name['zh-TW']) || '';
    var nameEn = (s.name && s.name['en']) || '';
    var typeZh = (s.type && s.type['zh-TW']) || '';
    var addrZh = (s.address && s.address['zh-TW']) || '';
    var lat = (s.location && s.location.latitude) || '';
    var lng = (s.location && s.location.longitude) || '';
    return [
      s.id,
      '"' + nameZh.replace(/"/g, '""') + '"',
      '"' + nameEn.replace(/"/g, '""') + '"',
      '"' + typeZh.replace(/"/g, '""') + '"',
      '"' + addrZh.replace(/"/g, '""') + '"',
      lat,
      lng,
      '"' + (s.phone || '').replace(/"/g, '""') + '"',
      '"' + (s.website || '').replace(/"/g, '""') + '"',
      s.status || 'active',
      s.featured ? 'true' : 'false'
    ].join(',');
  });
  
  var csvContent = "\uFEFF" + headers.join(',') + "\n" + rows.join('\n');
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

window.onlineBackupShops = async function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以備份');
  if (!confirm('確定要建立線上備份嗎？這將儲存一份當前所有商店的快照。')) return;

  try {
    var backupData = {
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      shopCount: window.adminAllShops.length,
      data: window.adminAllShops
    };
    
    await db.collection('backups').add(backupData);
    alert('線上備份成功建立！');
  } catch (err) {
    console.error('Online backup error:', err);
    alert('線上備份失敗：' + err.message);
  }
};

window.clearAllShops = async function() {
  if (!confirm('警告：此操作將會把所有商店移至垃圾桶(封禁狀態)。\n\n確定要繼續嗎？')) return;
  if (!confirm('請再次確認，這會影響所有前台顯示的商店！')) return;
  
  try {
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
      await batch.commit();
      alert('已成功將 ' + count + ' 間商店移至垃圾桶。');
      window.loadShops();
    } else {
      alert('目前沒有可以清除的商店。');
    }
  } catch (err) {
    console.error('Clear all error:', err);
    alert('清除失敗：' + err.message);
  }
};
