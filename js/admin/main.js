// ===== admin/main.js =====
window.currentUserRole = 'admin';

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
    window.loadPage(page);
  });
});

window.loadPage = function(page) {
  switch(page) {
    case 'dashboard': window.loadDashboard(); break;
    case 'shops': window.loadShops(); break;
    case 'reports': window.loadReports(); break;
    case 'newsletter': window.loadNewsletter(); break;
    case 'announcements': window.loadAnnouncements(); break;
    case 'policy': window.loadPolicy(); break;
    case 'badges': window.loadBadges(); break;
    case 'users': window.loadUsers(); break;
    case 'trash': window.loadTrash(); break;
  }
};

window.closeModal = function(id) { 
  document.getElementById(id).classList.remove('open'); 
};
