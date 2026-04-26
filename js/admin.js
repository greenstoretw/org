// ===== admin.js — 後台完整邏輯 =====
let currentUserRole = 'admin';
let trendChart = null, sourceChart = null;

// ===== AUTH =====
auth.onAuthStateChanged(async user => {
  if (!user) { showLogin(); return; }
  const doc = await db.collection('users').doc(user.uid).get();
  if (!doc.exists || !['admin','owner'].includes(doc.data().role)) {
    alert('無管理員權限'); auth.signOut(); return;
  }
  currentUserRole = doc.data().role;
  document.getElementById('user-name').textContent = user.displayName || user.email.split('@')[0];
  document.getElementById('user-avatar').textContent = (user.displayName || 'A')[0].toUpperCase();
  document.getElementById('role-badge').textContent = currentUserRole === 'owner' ? '版主' : '管理員';
  if (currentUserRole === 'owner') document.body.classList.add('is-owner');
  hideLogin();
  loadDashboard();
});

document.getElementById('login-btn').onclick = async () => {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-err');
  try { await auth.signInWithEmailAndPassword(email, pass); }
  catch(e) { err.textContent = '登入失敗：' + e.message; err.style.display = 'block'; }
};
document.getElementById('logout-btn').onclick = () => auth.signOut();

function showLogin() { document.getElementById('login-screen').style.display = 'flex'; }
function hideLogin() { document.getElementById('login-screen').style.display = 'none'; }

// ===== NAVIGATION =====
const pageTitles = {
  dashboard:'儀表板', shops:'商店管理', reports:'查看問題',
  newsletter:'電子報', announcements:'公告管理', policy:'政策管理',
  badges:'賦予徽章', users:'使用者管理', trash:'垃圾桶'
};
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    document.getElementById('page-'+page).classList.add('active');
    document.getElementById('page-title').textContent = pageTitles[page] || page;
    loadPage(page);
  });
});

function loadPage(page) {
  switch(page) {
    case 'dashboard': loadDashboard(); break;
    case 'shops': loadShops(); break;
    case 'reports': loadReports(); break;
    case 'newsletter': loadNewsletter(); break;
    case 'announcements': loadAnnouncements(); break;
    case 'policy': loadPolicy(); break;
    case 'badges': loadBadges(); break;
    case 'users': loadUsers(); break;
    case 'trash': loadTrash(); break;
  }
}

// ===== DASHBOARD =====
async function loadDashboard() {
  const [shops, users, subs, reviews] = await Promise.all([
    db.collection('merchants').where('status','==','active').get(),
    db.collection('users').get(),
    db.collection('newsletter').get(),
    db.collection('reviews').get()
  ]);
  const stats = [
    { label:'上架商店', val: shops.size, icon:'fa-store', color:'#166534' },
    { label:'使用者', val: users.size, icon:'fa-users', color:'#1e40af' },
    { label:'訂閱人數', val: subs.size, icon:'fa-envelope', color:'#7e22ce' },
    { label:'評價數', val: reviews.size, icon:'fa-star', color:'#b45309' }
  ];
  document.getElementById('stat-grid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div class="val" style="color:${s.color}">${s.val}</div><div class="label">${s.label}</div></div>
        <div style="background:${s.color}15;padding:10px;border-radius:10px"><i class="fa ${s.icon}" style="color:${s.color};font-size:1.3rem"></i></div>
      </div>
    </div>`).join('');
  renderTrendChart();
  renderSourceChart(subs.size);
}

function renderTrendChart() {
  const ctx = document.getElementById('trend-chart').getContext('2d');
  if (trendChart) trendChart.destroy();
  const labels = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return `${d.getMonth()+1}/${d.getDate()}`;});
  trendChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'PV', data:labels.map(()=>Math.floor(Math.random()*200+50)), borderColor:'#16a34a', backgroundColor:'rgba(22,163,74,.1)', fill:true, tension:0.4 }] },
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
  });
}

function renderSourceChart(subs) {
  const ctx = document.getElementById('source-chart').getContext('2d');
  if (sourceChart) sourceChart.destroy();
  sourceChart = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:['直接訪問','搜尋引擎','社群媒體'], datasets:[{ data:[45,35,20], backgroundColor:['#16a34a','#2563eb','#9333ea'], borderWidth:0 }] },
    options:{ responsive:true, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ font:{ size:11 } } } } }
  });
}

// ===== SHOPS =====
let allShops = [];
async function loadShops() {
  const snap = await db.collection('merchants').get();
  allShops = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  renderShopsTable(allShops);
  document.getElementById('shop-search').oninput = e => {
    const q = e.target.value.toLowerCase();
    renderShopsTable(allShops.filter(s => (s.name?.['zh-TW']||'').toLowerCase().includes(q)));
  };
}

function renderShopsTable(shops) {
  document.getElementById('shops-tbody').innerHTML = shops.map(s => `
    <tr>
      <td><strong>${s.name?.['zh-TW'] || '—'}</strong></td>
      <td>${s.type?.['zh-TW'] || '—'}</td>
      <td><span class="badge ${s.status==='active'?'badge-green':'badge-gray'}">${s.status==='active'?'上架':'隱藏'}</span></td>
      <td>${s.featured ? '<span class="badge badge-yellow">⭐ 精選</span>' : '—'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn btn-blue btn-sm" onclick="openShopModal('${s.id}')"><i class="fa fa-edit"></i></button>
        <button class="btn btn-${s.status==='active'?'gray':'green'} btn-sm" onclick="toggleShopStatus('${s.id}','${s.status}')">${s.status==='active'?'下架':'上架'}</button>
        <button class="btn btn-red btn-sm" onclick="deleteShop('${s.id}')"><i class="fa fa-trash"></i></button>
      </td>
    </tr>`).join('');
}

function openShopModal(id = null) {
  const fields = ['name-zh','name-en','type-zh','addr-zh','lat','lng','desc-zh','hours','eco','status'];
  fields.forEach(f => { const el = document.getElementById('s-'+f); if(el) el.value=''; });
  document.getElementById('s-featured').checked = false;
  document.getElementById('shop-edit-id').value = '';
  document.getElementById('shop-modal-title').textContent = id ? '編輯商店' : '新增商店';

  if (id) {
    const s = allShops.find(x => x.id === id);
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
  }
  document.getElementById('shop-modal').classList.add('open');
}

async function saveShop() {
  const id = document.getElementById('shop-edit-id').value;
  const lat = parseFloat(document.getElementById('s-lat').value);
  const lng = parseFloat(document.getElementById('s-lng').value);
  const data = {
    name: { 'zh-TW': document.getElementById('s-name-zh').value, 'en': document.getElementById('s-name-en').value },
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
  if (id) { await db.collection('merchants').doc(id).update(data); }
  else { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('merchants').add(data); }
  closeModal('shop-modal');
  loadShops();
}

async function toggleShopStatus(id, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
  await db.collection('merchants').doc(id).update({ status: newStatus });
  loadShops();
}

async function deleteShop(id) {
  if (!confirm('確定要移至垃圾桶嗎？')) return;
  await db.collection('merchants').doc(id).update({ status: 'banned', deletedAt: firebase.firestore.FieldValue.serverTimestamp() });
  loadShops();
}

// CSV Import
document.getElementById('csv-input').addEventListener('change', async e => {
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
  loadShops();
  e.target.value = '';
});

// ===== REPORTS =====
async function loadReports() {
  const [reps, issues] = await Promise.all([
    db.collection('reports').orderBy('timestamp','desc').limit(30).get(),
    db.collection('issues').orderBy('timestamp','desc').limit(30).get()
  ]);
  const shopMap = {};
  allShops.forEach(s => { shopMap[s.id] = s.name?.['zh-TW'] || s.id; });

  document.getElementById('reports-list').innerHTML = reps.docs.map(doc => {
    const r = doc.data();
    const statusColor = r.status === 'resolved' ? 'badge-green' : 'badge-yellow';
    return `<div style="border:1px solid #fee2e2;border-radius:8px;padding:12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <strong>${shopMap[r.shopId]||'未知商店'}</strong>
        <span class="badge ${statusColor}">${r.status||'待處理'}</span>
      </div>
      <p style="font-size:.8rem;color:#6b7280">${r.reason||'—'}</p>
      <button class="btn btn-green btn-sm" style="margin-top:8px" onclick="resolveItem('reports','${doc.id}')">標記已處理</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無檢舉</p>';

  document.getElementById('issues-list').innerHTML = issues.docs.map(doc => {
    const r = doc.data();
    return `<div style="border:1px solid #dbeafe;border-radius:8px;padding:12px;margin-bottom:8px">
      <p style="font-size:.85rem">${r.message||r.description||'—'}</p>
      <button class="btn btn-green btn-sm" style="margin-top:8px" onclick="resolveItem('issues','${doc.id}')">標記已處理</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無問題回報</p>';
}

async function resolveItem(col, id) {
  await db.collection(col).doc(id).update({ status: 'resolved', resolvedAt: firebase.firestore.FieldValue.serverTimestamp() });
  loadReports();
}

// ===== NEWSLETTER =====
async function loadNewsletter() {
  const snap = await db.collection('newsletter').orderBy('subscribedAt','desc').get();
  document.getElementById('sub-count').textContent = snap.size;
  document.getElementById('newsletter-tbody').innerHTML = snap.docs.map(doc => {
    const d = doc.data();
    const date = d.subscribedAt?.toDate().toLocaleDateString() || '—';
    return `<tr>
      <td>${d.email}</td><td>${date}</td>
      <td><button class="btn btn-red btn-sm" onclick="removeSub('${doc.id}')"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('');
}

async function removeSub(id) {
  if (!confirm('確定移除此訂閱者？')) return;
  await db.collection('newsletter').doc(id).delete();
  loadNewsletter();
}

// ===== ANNOUNCEMENTS =====
async function loadAnnouncements() {
  const snap = await db.collection('announcements').orderBy('createdAt','desc').limit(10).get();
  document.getElementById('ann-list').innerHTML = snap.docs.map(doc => {
    const d = doc.data();
    return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between">
        <strong style="font-size:.9rem">${d.title||'未命名'}</strong>
        <button class="btn btn-red btn-sm" onclick="deleteAnn('${doc.id}')"><i class="fa fa-trash"></i></button>
      </div>
      <p style="font-size:.75rem;color:#9ca3af;margin-top:4px">${d.createdAt?.toDate().toLocaleString()||'—'}</p>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無公告</p>';
}

async function saveAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const content = document.getElementById('rte-content').innerHTML;
  if (!title) { alert('請輸入標題'); return; }
  await db.collection('announcements').add({ title, content, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  document.getElementById('ann-title').value = '';
  document.getElementById('rte-content').innerHTML = '';
  loadAnnouncements();
}

async function deleteAnn(id) {
  if (!confirm('確定刪除此公告？')) return;
  await db.collection('announcements').doc(id).delete();
  loadAnnouncements();
}

function fmt(cmd) { document.execCommand(cmd, false, null); document.getElementById('rte-content').focus(); }
function fmtLink() { const url = prompt('請輸入連結 URL:'); if(url) document.execCommand('createLink', false, url); }

// ===== POLICY =====
async function loadPolicy() {
  const type = document.getElementById('policy-type').value;
  const snap = await db.collection('policies').doc(type).get();
  document.getElementById('policy-content').value = snap.exists ? snap.data().content : '';
}
document.getElementById('policy-type')?.addEventListener('change', loadPolicy);

async function savePolicy() {
  const type = document.getElementById('policy-type').value;
  const content = document.getElementById('policy-content').value;
  const version = { content, savedAt: firebase.firestore.FieldValue.serverTimestamp() };
  await db.collection('policies').doc(type).set({ content, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await db.collection('policyHistory').add({ type, ...version });
  alert('政策已儲存！');
}

async function loadPolicyHistory() {
  const type = document.getElementById('policy-type').value;
  const snap = await db.collection('policyHistory').where('type','==',type).orderBy('savedAt','desc').limit(5).get();
  const el = document.getElementById('policy-history');
  el.style.display = 'block';
  el.innerHTML = '<h4 style="font-weight:700;margin-bottom:8px">版本紀錄</h4>' +
    snap.docs.map(doc => {
      const d = doc.data();
      return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;cursor:pointer" onclick="document.getElementById('policy-content').value=\`${d.content.replace(/`/g,'\\`')}\`">
        <div style="font-size:.8rem;color:#6b7280">${d.savedAt?.toDate().toLocaleString()||'—'} <span style="color:#2563eb">(點擊還原)</span></div>
      </div>`;
    }).join('') || '<p style="color:#9ca3af;font-size:.85rem">無版本紀錄</p>';
}

// ===== BADGES =====
let allBadges = [];
async function loadBadges() {
  const snap = await db.collection('badges').get();
  allBadges = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  document.getElementById('badges-list').innerHTML = allBadges.map(b => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px">
      <span style="font-size:1.5rem">${b.icon}</span>
      <div style="flex:1;margin-left:12px"><div style="font-weight:600">${b.name}</div><div style="font-size:.75rem;color:#6b7280">${b.desc||''}</div></div>
      <button class="btn btn-red btn-sm" onclick="deleteBadge('${b.id}')"><i class="fa fa-trash"></i></button>
    </div>`).join('') || '<p style="color:#9ca3af;font-size:.85rem">尚無徽章</p>';
  const sel = document.getElementById('grant-badge-select');
  sel.innerHTML = allBadges.map(b => `<option value="${b.id}">${b.icon} ${b.name}</option>`).join('');
}

async function saveBadge() {
  const name = document.getElementById('badge-name').value.trim();
  const icon = document.getElementById('badge-icon').value.trim();
  const desc = document.getElementById('badge-desc').value.trim();
  if (!name || !icon) { alert('請填寫徽章名稱與圖示'); return; }
  await db.collection('badges').add({ name, icon, desc, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  ['badge-name','badge-icon','badge-desc'].forEach(id => document.getElementById(id).value = '');
  loadBadges();
}

async function deleteBadge(id) {
  if (!confirm('確定刪除此徽章？')) return;
  await db.collection('badges').doc(id).delete();
  loadBadges();
}

async function grantBadge() {
  const uid = document.getElementById('grant-uid').value.trim();
  const badgeId = document.getElementById('grant-badge-select').value;
  if (!uid || !badgeId) { alert('請填寫 UID 並選擇徽章'); return; }
  const badge = allBadges.find(b => b.id === badgeId);
  await db.collection('users').doc(uid).update({
    badges: firebase.firestore.FieldValue.arrayUnion({ id: badgeId, name: badge.name, icon: badge.icon, grantedAt: new Date().toISOString() })
  });
  alert(`徽章「${badge.icon} ${badge.name}」已頒發！`);
}

// ===== USERS (Owner only) =====
async function loadUsers() {
  if (currentUserRole !== 'owner') { document.getElementById('users-tbody').innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af">僅版主可操作</td></tr>'; return; }
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
        <select onchange="updateRole('${doc.id}',this.value)" style="font-size:.75rem;padding:2px 6px;border:1px solid #d1d5db;border-radius:4px">
          <option value="user" ${r==='user'?'selected':''}>一般用戶</option>
          <option value="admin" ${r==='admin'?'selected':''}>管理員</option>
          <option value="owner" ${r==='owner'?'selected':''}>版主</option>
        </select>
        <button class="btn btn-${u.banned?'green':'red'} btn-sm" onclick="toggleBan('${doc.id}',${!!u.banned})">${u.banned?'解封':'封禁'}</button>
      </td>
    </tr>`;
  }).join('');
}

async function updateRole(uid, role) {
  await db.collection('users').doc(uid).update({ role });
}

async function toggleBan(uid, isBanned) {
  if (!isBanned && !confirm('確定封禁此用戶？')) return;
  await db.collection('users').doc(uid).update({ banned: !isBanned, bannedAt: !isBanned ? firebase.firestore.FieldValue.serverTimestamp() : null });
  loadUsers();
}

// ===== TRASH =====
async function loadTrash() {
  const [shops, users] = await Promise.all([
    db.collection('merchants').where('status','==','banned').get(),
    db.collection('users').where('banned','==',true).get()
  ]);

  document.getElementById('trash-shops').innerHTML = shops.docs.map(doc => {
    const s = doc.data();
    return `<div style="border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
      <span>${s.name?.['zh-TW']||doc.id}</span>
      <button class="btn btn-green btn-sm" onclick="restoreShop('${doc.id}')"><i class="fa fa-undo"></i> 還原</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">無被封禁商店</p>';

  document.getElementById('trash-users').innerHTML = users.docs.map(doc => {
    return `<div style="border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:monospace;font-size:.75rem">${doc.id}</span>
      <button class="btn btn-green btn-sm" onclick="restoreUser('${doc.id}')"><i class="fa fa-undo"></i> 解封</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">無被封禁用戶</p>';
}

async function restoreShop(id) {
  await db.collection('merchants').doc(id).update({ status:'active', deletedAt: null });
  loadTrash();
}

async function restoreUser(id) {
  await db.collection('users').doc(id).update({ banned: false, bannedAt: null });
  loadTrash();
}

// ===== HELPERS =====
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
