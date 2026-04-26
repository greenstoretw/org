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
  const fields = ['name-zh','name-en','type-zh','addr-zh','lat','lng','desc-zh','hours','eco','status'];
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
