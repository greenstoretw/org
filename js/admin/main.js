// ===== admin/main.js =====
window.currentPage = 'dashboard';

var pageTitles = {
  'dashboard': '後台數據總覽',
  'shops': '商店管理系統',
  'audit': '商店審核工作區',
  'reports': '回報問題清單',
  'newsletter': '電子報訂閱管理',
  'reviews': '商店評價管理',
  'announcements': '系統公告發布',
  'policy': '網站政策修訂',
  'badges': '會員徽章賦予',
  'receipts': '打卡憑證管理',
  'users': '使用者帳號管理',
  'trash': '回收站與垃圾桶'
};

var navItems = document.querySelectorAll('.nav-item');
for (var i = 0; i < navItems.length; i++) {
  (function(item) {
    item.addEventListener('click', function() {
      var allNavs = document.querySelectorAll('.nav-item');
      for (var j = 0; j < allNavs.length; j++) allNavs[j].classList.remove('active');
      
      item.classList.add('active');
      var page = item.dataset.page;
      window.currentPage = page;
      
      var allPages = document.querySelectorAll('.page');
      for (var k = 0; k < allPages.length; k++) allPages[k].classList.remove('active');
      
      var targetPage = document.getElementById('page-' + page);
      if (targetPage) targetPage.classList.add('active');
      
      var titleEl = document.getElementById('page-title') || document.getElementById('header-title');
      if (titleEl) titleEl.textContent = pageTitles[page] || '管理後台';
      
      if (page === 'dashboard' && window.loadDashboard) window.loadDashboard();
      if (page === 'shops' && window.loadShops) window.loadShops();
      if (page === 'audit' && window.loadShops) window.loadShops();
      if (page === 'reports' && window.loadReports) window.loadReports();
      if (page === 'newsletter' && window.loadNewsletter) window.loadNewsletter();
      if (page === 'reviews' && window.loadReviews) window.loadReviews();
      if (page === 'announcements' && window.loadAnnouncements) window.loadAnnouncements();
      if (page === 'policy' && window.loadPolicy) window.loadPolicy();
      if (page === 'badges' && window.loadBadges) window.loadBadges();
      if (page === 'receipts' && window.loadReceipts) window.loadReceipts();
      if (page === 'users' && window.loadUsers) window.loadUsers();
      if (page === 'trash' && window.loadTrash) window.loadTrash();
    });
  })(navItems[i]);
}

window.closeModal = function(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
};

// Global click to close modals
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});
