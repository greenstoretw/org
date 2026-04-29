// ===== admin/users.js (Users, Badges, Trash) =====

// ===== BADGES =====
window.allBadges = [];
window.loadBadges = async function() {
  const snap = await db.collection('badges').get();
  window.allBadges = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  document.getElementById('badges-list').innerHTML = window.allBadges.map(b => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px">
      <span style="font-size:1.5rem">${b.icon}</span>
      <div style="flex:1;margin-left:12px"><div style="font-weight:600">${b.name}</div><div style="font-size:.75rem;color:#6b7280">${b.desc||''}</div></div>
      <button class="btn btn-red btn-sm" onclick="window.deleteBadge('${b.id}')"><i class="fa fa-trash"></i></button>
    </div>`).join('') || '<p style="color:#9ca3af;font-size:.85rem">尚無徽章</p>';
  const sel = document.getElementById('grant-badge-select');
  sel.innerHTML = window.allBadges.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('');
};

window.saveBadge = async function() {
  const name = document.getElementById('badge-name').value.trim();
  const icon = document.getElementById('badge-icon').value.trim();
  const desc = document.getElementById('badge-desc').value.trim();
  if (!name || !icon) { alert('請填寫徽章名稱與圖示'); return; }
  await db.collection('badges').add({ name, icon, desc, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  ['badge-name','badge-icon','badge-desc'].forEach(id => document.getElementById(id).value = '');
  window.loadBadges();
};

window.deleteBadge = async function(id) {
  if (!confirm('確定刪除此徽章？')) return;
  await db.collection('badges').doc(id).delete();
  window.loadBadges();
};

window.grantBadge = async function() {
  const uid = document.getElementById('grant-uid').value.trim();
  const badgeId = document.getElementById('grant-badge-select').value;
  if (!uid || !badgeId) { alert('請填寫 UID 並選擇徽章'); return; }
  const badge = window.allBadges.find(b => b.id === badgeId);
  await db.collection('users').doc(uid).update({
    badges: firebase.firestore.FieldValue.arrayUnion({ id: badgeId, name: badge.name, icon: badge.icon, grantedAt: new Date().toISOString() })
  });
  alert(`徽章「${badge.icon} ${badge.name}」已頒發！`);
};

// ===== USERS (Owner only) =====
window.loadUsers = async function() {
  if (window.currentUserRole !== 'owner') { document.getElementById('users-tbody').innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af">僅版主可操作</td></tr>'; return; }
  const snap = await db.collection('users').limit(50).get();
  document.getElementById('users-tbody').innerHTML = snap.docs.map(doc => {
    const u = doc.data();
    const roleColors = { owner:'badge-purple', admin:'badge-blue', user:'badge-gray', banned:'badge-red' };
    const roleLabel = { owner:'版主', admin:'管理員', user:'一般用戶', banned:'已封禁' };
    const r = u.role || 'user';
    return `<tr>
      <td style="font-family:monospace;font-size:.75rem">${doc.id}</td>
      <td><span class="badge ${roleColors[r]||'badge-gray'}">${roleLabel[r]||r}</span></td>
      <td><span class="badge ${u.banned?'badge-red':'badge-green'}">${u.banned?'封禁中':'正常'}</span></td>
      <td style="display:flex;gap:4px">
        <select onchange="window.updateRole('${doc.id}',this.value)" style="font-size:.75rem;padding:2px 6px;border:1px solid #d1d5db;border-radius:4px">
          <option value="user" ${r==='user'?'selected':''}>一般用戶</option>
          <option value="admin" ${r==='admin'?'selected':''}>管理員</option>
          <option value="owner" ${r==='owner'?'selected':''}>版主</option>
        </select>
        <button class="btn btn-${u.banned?'green':'red'} btn-sm" onclick="window.toggleBan('${doc.id}',${!!u.banned})">${u.banned?'解封':'封禁'}</button>
      </td>
    </tr>`;
  }).join('');
};

window.updateRole = async function(uid, role) {
  await db.collection('users').doc(uid).update({ role });
};

window.toggleBan = async function(uid, isBanned) {
  if (!isBanned && !confirm('確定封禁此用戶？')) return;
  await db.collection('users').doc(uid).update({ banned: !isBanned, bannedAt: !isBanned ? firebase.firestore.FieldValue.serverTimestamp() : null });
  window.loadUsers();
};

// ===== TRASH =====
window.loadTrash = async function() {
  const [shops, users] = await Promise.all([
    db.collection('merchants').where('status','==','banned').get(),
    db.collection('users').where('banned','==',true).get()
  ]);

  document.getElementById('trash-shops').innerHTML = shops.docs.map(doc => {
    const s = doc.data();
    return `<div style="border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
      <span>${s.name?.['zh-TW']||doc.id}</span>
      <button class="btn btn-green btn-sm" onclick="window.restoreShop('${doc.id}')"><i class="fa fa-undo"></i> 還原</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">無被封禁商店</p>';

  document.getElementById('trash-users').innerHTML = users.docs.map(doc => {
    return `<div style="border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:monospace;font-size:.75rem">${doc.id}</span>
      <button class="btn btn-green btn-sm" onclick="window.restoreUser('${doc.id}')"><i class="fa fa-undo"></i> 解封</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">無被封禁用戶</p>';
};

window.restoreShop = async function(id) {
  await db.collection('merchants').doc(id).update({ status:'active', deletedAt: null });
  window.loadTrash();
};

window.restoreUser = async function(id) {
  await db.collection('users').doc(id).update({ banned: false, bannedAt: null });
  window.loadTrash();
};

window.emptyTrash = async function(type) {
  const collection = type === 'shops' ? 'merchants' : 'users';
  const queryField = type === 'shops' ? 'status' : 'banned';
  const queryVal = type === 'shops' ? 'banned' : true;
  
  if (!confirm(`確定要永久刪除所有已封禁的${type === 'shops' ? '商店' : '使用者'}嗎？\n\n注意：此操作無法撤銷！`)) return;

  try {
    const snap = await db.collection(collection).where(queryField, '==', queryVal).get();
    if (snap.empty) {
      alert('垃圾桶目前是空的。');
      return;
    }

    const batch = db.batch();
    snap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    alert(`已永久刪除 ${snap.size} 個項目。`);
    window.loadTrash();
  } catch (err) {
    console.error('Empty trash error:', err);
    alert('清空失敗：' + err.message);
  }
};
