// ===== admin/content.js (Reports, Newsletter, Announcements, Policy) =====

// ===== REPORTS =====
window.loadReports = async function() {
  const [reps, issues] = await Promise.all([
    db.collection('reports').orderBy('timestamp','desc').limit(30).get(),
    db.collection('issues').orderBy('timestamp','desc').limit(30).get()
  ]);
  const shopMap = {};
  (window.adminAllShops || []).forEach(s => { shopMap[s.id] = s.name?.['zh-TW'] || s.id; });

  document.getElementById('reports-list').innerHTML = reps.docs.map(doc => {
    const r = doc.data();
    const statusColor = r.status === 'resolved' ? 'badge-green' : 'badge-yellow';
    return `<div style="border:1px solid #fee2e2;border-radius:8px;padding:12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <strong>${shopMap[r.shopId]||'未知商店'}</strong>
        <span class="badge ${statusColor}">${r.status||'待處理'}</span>
      </div>
      <p style="font-size:.8rem;color:#6b7280;margin-top:4px"><strong>原因：</strong>${r.reason||'—'}</p>
      ${r.description ? `<p style="font-size:.75rem;color:#6b7280;background:#fef2f2;padding:6px;border-radius:4px;margin-top:4px"><strong>補充說明：</strong>${r.description}</p>` : ''}
      <button class="btn btn-green btn-sm" style="margin-top:8px" onclick="window.resolveItem('reports','${doc.id}')">標記已處理</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無檢舉</p>';

  document.getElementById('issues-list').innerHTML = issues.docs.map(doc => {
    const r = doc.data();
    return `<div style="border:1px solid #dbeafe;border-radius:8px;padding:12px;margin-bottom:8px">
      <p style="font-size:.85rem">${r.message||r.description||'—'}</p>
      <button class="btn btn-green btn-sm" style="margin-top:8px" onclick="window.resolveItem('issues','${doc.id}')">標記已處理</button>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無問題回報</p>';
};

window.loadReviews = async function() {
  const snap = await db.collection('reviews').orderBy('timestamp','desc').limit(50).get();
  const shopMap = {};
  (window.adminAllShops || []).forEach(s => { shopMap[s.id] = s.name?.['zh-TW'] || s.id; });
  
  document.getElementById('reviews-tbody').innerHTML = snap.docs.map(doc => {
    const r = doc.data();
    const date = r.timestamp?.toDate().toLocaleDateString() || '—';
    return `<tr>
      <td>${shopMap[r.shopId]||'未知商店'}</td>
      <td style="color:#f59e0b;font-weight:bold">★ ${r.rating}</td>
      <td style="font-size:.85rem">${r.comment||'<span style="color:#9ca3af">無評論</span>'}</td>
      <td style="font-size:.8rem;color:#6b7280">${date}</td>
      <td><button class="btn btn-red btn-sm" onclick="window.deleteReview('${doc.id}')"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('');
};

window.deleteReview = async function(id) {
  if (!confirm('確定永久刪除此評價？')) return;
  await db.collection('reviews').doc(id).delete();
  window.loadReviews();
};

window.resolveItem = async function(col, id) {
  await db.collection(col).doc(id).update({ status: 'resolved', resolvedAt: firebase.firestore.FieldValue.serverTimestamp() });
  window.loadReports();
};

// ===== NEWSLETTER =====
window.loadNewsletter = async function() {
  const snap = await db.collection('newsletter').orderBy('subscribedAt','desc').get();
  document.getElementById('sub-count').textContent = snap.size;
  document.getElementById('newsletter-tbody').innerHTML = snap.docs.map(doc => {
    const d = doc.data();
    const date = d.subscribedAt?.toDate().toLocaleDateString() || '—';
    return `<tr>
      <td>${d.email}</td><td>${date}</td>
      <td><button class="btn btn-red btn-sm" onclick="window.removeSub('${doc.id}')"><i class="fa fa-trash"></i></button></td>
    </tr>`;
  }).join('');
};

window.removeSub = async function(id) {
  if (!confirm('確定移除此訂閱者？')) return;
  await db.collection('newsletter').doc(id).delete();
  window.loadNewsletter();
};

// ===== ANNOUNCEMENTS =====
window.loadAnnouncements = async function() {
  const snap = await db.collection('announcements').orderBy('createdAt','desc').limit(10).get();
  document.getElementById('ann-list').innerHTML = snap.docs.map(doc => {
    const d = doc.data();
    return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between">
        <strong style="font-size:.9rem">${d.title||'未命名'}</strong>
        <button class="btn btn-red btn-sm" onclick="window.deleteAnn('${doc.id}')"><i class="fa fa-trash"></i></button>
      </div>
      <p style="font-size:.75rem;color:#9ca3af;margin-top:4px">${d.createdAt?.toDate().toLocaleString()||'—'}</p>
    </div>`;
  }).join('') || '<p style="color:#9ca3af;font-size:.85rem">目前無公告</p>';
};

window.saveAnnouncement = async function() {
  const title = document.getElementById('ann-title').value.trim();
  const content = document.getElementById('rte-content').innerHTML;
  if (!title) { alert('請輸入標題'); return; }
  await db.collection('announcements').add({ title, content, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  document.getElementById('ann-title').value = '';
  document.getElementById('rte-content').innerHTML = '';
  window.loadAnnouncements();
};

window.deleteAnn = async function(id) {
  if (!confirm('確定刪除此公告？')) return;
  await db.collection('announcements').doc(id).delete();
  window.loadAnnouncements();
};

window.fmt = function(cmd) { document.execCommand(cmd, false, null); document.getElementById('rte-content').focus(); };
window.fmtLink = function() { const url = prompt('請輸入連結 URL:'); if(url) document.execCommand('createLink', false, url); };

// ===== POLICY =====
window.loadPolicy = async function() {
  const type = document.getElementById('policy-type').value;
  const snap = await db.collection('policies').doc(type).get();
  document.getElementById('policy-content').value = snap.exists ? snap.data().content : '';
};
document.getElementById('policy-type')?.addEventListener('change', window.loadPolicy);

window.savePolicy = async function() {
  const type = document.getElementById('policy-type').value;
  const content = document.getElementById('policy-content').value;
  const version = { content, savedAt: firebase.firestore.FieldValue.serverTimestamp() };
  await db.collection('policies').doc(type).set({ content, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  await db.collection('policyHistory').add({ type, ...version });
  alert('政策已儲存！');
};

window.loadPolicyHistory = async function() {
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
};
