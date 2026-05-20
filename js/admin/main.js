// ===== admin/main.js =====
window.currentPage = 'dashboard';

var pageTitles = {
  'dashboard': '後台數據總覽',
  'shops': '商店管理系統',
  'content': '內容與報告管理',
  'receipts': '打卡憑證管理',
  'users': '權限與垃圾桶'
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
      
      if (page === 'shops' && window.loadShops) window.loadShops();
      if (page === 'receipts' && window.loadReceipts) window.loadReceipts();
      if (page === 'content') {
        if (window.loadReports) window.loadReports();
        if (window.loadReviews) window.loadReviews();
        if (window.loadNewsletter) window.loadNewsletter();
      }
      if (page === 'users') {
        if (window.loadUsers) window.loadUsers();
        if (window.loadBadges) window.loadBadges();
        if (window.loadTrash) window.loadTrash();
      }
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

// Initialization
auth.onAuthStateChanged(function(user) {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  db.collection('users').doc(user.uid).get().then(function(doc) {
    if (!doc.exists || (doc.data().role !== 'admin' && doc.data().role !== 'owner')) {
      alert('權限不足，將返回首頁');
      window.location.href = 'index.html';
    } else {
      // Authorized
      if (window.loadShops) window.loadShops();
    }
  });
});
