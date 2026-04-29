// ===== admin/shops.js =====
window.adminAllShops = [];
window.loadShops = async function() {
  const snap = await db.collection('merchants').get();
  window.adminAllShops = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  window.renderShopsTable(window.adminAllShops);
  document.getElementById('shop-search').oninput = e => {
    const q = e.target.value.toLowerCase();
    window.renderShopsTable(window.adminAllShops.filter(s => (s.name?.['zh-TW']||'').toLowerCase().includes(q)));
  };
};

window.renderShopsTable = function(shops) {
  document.getElementById('shops-tbody').innerHTML = shops.map(s => `
    <tr>
      <td><strong>${s.name?.['zh-TW'] || '—'}</strong></td>
      <td>${s.type?.['zh-TW'] || '—'}</td>
      <td><span class="badge ${s.status==='active'?'badge-green':'badge-gray'}">${s.status==='active'?'上架':'隱藏'}</span></td>
      <td>${s.featured ? '<span class="badge badge-yellow">⭐ 精選</span>' : '—'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn btn-blue btn-sm" onclick="window.openShopModal('${s.id}')"><i class="fa fa-edit"></i></button>
        <button class="btn btn-${s.status==='active'?'gray':'green'} btn-sm" onclick="window.toggleShopStatus('${s.id}','${s.status}')">${s.status==='active'?'下架':'上架'}</button>
        <button class="btn btn-red btn-sm" onclick="window.deleteShop('${s.id}')"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
};

window.openShopModal = function(id = null) {
  const fields = ['name-zh','name-en','type-zh','addr-zh','lat','lng','desc-zh','hours','eco','status','phone','website'];
  fields.forEach(f => { const el = document.getElementById('s-'+f); if(el) el.value=''; });
  document.getElementById('s-featured').checked = false;
  document.getElementById('shop-edit-id').value = '';
  document.getElementById('shop-modal-title').textContent = id ? '編輯商店' : '新增商店';
  
  const modal = document.getElementById('shop-modal');
  modal.dataset.isBranch = 'false';
  modal.dataset.parentId = '';

  if (id) {
    const s = window.adminAllShops.find(x => x.id === id);
    if (!s) return;
    document.getElementById('shop-edit-id').value = id;
    document.getElementById('s-name-zh').value = s.name?.['zh-TW'] || '';
    document.getElementById('s-name-en').value = s.name?.['en'] || '';
    document.getElementById('s-type-zh').value = s.type?.['zh-TW'] || '';
    document.getElementById('s-addr-zh').value = s.address?.['zh-TW'] || '';
    document.getElementById('s-lat').value = s.location?.latitude || '';
    document.getElementById('s-lng').value = s.location?.longitude || '';
    document.getElementById('s-desc-zh').value = s.description?.['zh-TW'] || '';
    document.getElementById('s-hours').value = s.openingHours || '';
    document.getElementById('s-phone').value = s.phone || '';
    document.getElementById('s-website').value = s.website || '';
    document.getElementById('s-eco').value = (s.ecoFeatures || []).join(',');
    document.getElementById('s-status').value = s.status || 'active';
    document.getElementById('s-featured').checked = s.featured || false;
    
    if (s.isBranch) {
        modal.dataset.isBranch = 'true';
        modal.dataset.parentId = s.parentId || '';
    }
  }
  modal.classList.add('open');
};

window.saveShop = async function() {
  const id = document.getElementById('shop-edit-id').value;
  const lat = parseFloat(document.getElementById('s-lat').value);
  const lng = parseFloat(document.getElementById('s-lng').value);
  const nameZh = document.getElementById('s-name-zh').value.trim();
  
  const data = {
    name: { 'zh-TW': nameZh, 'en': document.getElementById('s-name-en').value },
    type: { 'zh-TW': document.getElementById('s-type-zh').value },
    address: { 'zh-TW': document.getElementById('s-addr-zh').value },
    description: { 'zh-TW': document.getElementById('s-desc-zh').value },
    openingHours: document.getElementById('s-hours').value,
    phone: document.getElementById('s-phone').value.trim(),
    website: document.getElementById('s-website').value.trim(),
    ecoFeatures: document.getElementById('s-eco').value.split(',').map(x=>x.trim()).filter(Boolean),
    status: document.getElementById('s-status').value,
    featured: document.getElementById('s-featured').checked,
    location: !isNaN(lat) && !isNaN(lng) ? new firebase.firestore.GeoPoint(lat, lng) : null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const modal = document.getElementById('shop-modal');
  const isExistingBranch = modal.dataset.isBranch === 'true';
  
  if (isExistingBranch) {
      data.isBranch = true;
      data.parentId = modal.dataset.parentId;
  }

  // Duplicate check and branch logic
  const existingShop = window.adminAllShops.find(s => s.id !== id && s.name?.['zh-TW'] === nameZh);
  if (existingShop && !isExistingBranch) {
    if (confirm(`店名 "${nameZh}" 已經存在！\n是否將此店面標記為「分店」？\n(按「確定」設為分店，按「取消」放棄儲存)`)) {
      data.isBranch = true;
      data.parentId = existingShop.parentId || existingShop.id;
    } else {
      return; // Do not save
    }
  }

  if (id) { await db.collection('merchants').doc(id).update(data); }
  else { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('merchants').add(data); }
  window.closeModal('shop-modal');
  window.loadShops();
};

window.toggleShopStatus = async function(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
  await db.collection('merchants').doc(id).update({ status: newStatus });
  window.loadShops();
};

window.deleteShop = async function(id) {
  if (!confirm('確定要移至垃圾桶嗎？')) return;
  await db.collection('merchants').doc(id).update({ status: 'banned', deletedAt: firebase.firestore.FieldValue.serverTimestamp() });
  window.loadShops();
};

// CSV Import
const csvInput = document.getElementById('csv-input');
if (csvInput) {
  csvInput.addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const [header, ...rows] = text.split('\n').filter(r=>r.trim());
    const keys = header.split(',').map(k=>k.trim());
    let count = 0;
    for (const row of rows) {
      const vals = row.split(',').map(v=>v.trim());
      const obj = {};
      keys.forEach((k,i) => obj[k] = vals[i]);
      if (!obj.name_zh) continue;
      await db.collection('merchants').add({
        name: { 'zh-TW': obj.name_zh, 'en': obj.name_en||'' },
        type: { 'zh-TW': obj.type_zh||'' },
        address: { 'zh-TW': obj.address_zh||'' },
        description: { 'zh-TW': obj.desc_zh||'' },
        location: obj.lat && obj.lng ? new firebase.firestore.GeoPoint(parseFloat(obj.lat), parseFloat(obj.lng)) : null,
        status: 'active', createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      count++;
    }
    alert(`成功匯入 ${count} 筆商店資料！`);
    window.loadShops();
    e.target.value = '';
  });
}

window.exportShopsCSV = function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以匯出');
  
  const headers = ['id', 'name_zh', 'name_en', 'type_zh', 'address_zh', 'lat', 'lng', 'phone', 'website', 'status', 'featured'];
  const rows = window.adminAllShops.map(s => {
    return [
      s.id,
      `"${(s.name?.['zh-TW'] || '').replace(/"/g, '""')}"`,
      `"${(s.name?.['en'] || '').replace(/"/g, '""')}"`,
      `"${(s.type?.['zh-TW'] || '').replace(/"/g, '""')}"`,
      `"${(s.address?.['zh-TW'] || '').replace(/"/g, '""')}"`,
      s.location?.latitude || '',
      s.location?.longitude || '',
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.website || '').replace(/"/g, '""')}"`,
      s.status || 'active',
      s.featured ? 'true' : 'false'
    ].join(',');
  });
  
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + "\n" + rows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `shops_export_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.backupShops = function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以備份');
  
  const backupData = JSON.stringify(window.adminAllShops, null, 2);
  const blob = new Blob([backupData], {type: "application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `shops_backup_${new Date().getTime()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

window.onlineBackupShops = async function() {
  if (!window.adminAllShops || window.adminAllShops.length === 0) return alert('沒有商店資料可以備份');
  if (!confirm('確定要建立線上備份嗎？這將儲存一份當前所有商店的快照。')) return;

  try {
    const backupData = {
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
    const batch = db.batch();
    let count = 0;
    
    window.adminAllShops.forEach(shop => {
      if (shop.status !== 'banned') {
        const shopRef = db.collection('merchants').doc(shop.id);
        batch.update(shopRef, { status: 'banned', deletedAt: firebase.firestore.FieldValue.serverTimestamp() });
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      alert(`已成功將 ${count} 間商店移至垃圾桶。`);
      window.loadShops();
    } else {
      alert('目前沒有可以清除的商店。');
    }
  } catch (err) {
    console.error('Clear all error:', err);
    alert('清除失敗：' + err.message);
  }
};
