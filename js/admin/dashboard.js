// ===== admin/dashboard.js =====
window.trendChart = null;
window.sourceChart = null;

window.loadDashboard = function() {
  var sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  Promise.all([
    db.collection('merchants').where('status','==','active').get(),
    db.collection('users').get(),
    db.collection('newsletter').get(),
    db.collection('reviews').get(),
    db.collection('analytics').where('timestamp', '>', sevenDaysAgo).get(),
    db.collection('merchants').where('status','==','active').where('verified','==',false).get()
  ]).then(function(results) {
    var shops = results[0];
    var users = results[1];
    var subs = results[2];
    var reviews = results[3];
    var analyticsSnap = results[4];
    var pendingSnap = results[5];

    var pendingAudit = pendingSnap.size;
    var stats = [
      { label:'上架商店', val: shops.size, icon:'fa-shopping-basket', color:'#166534' },
      { label:'使用者', val: users.size, icon:'fa-users', color:'#1e40af' },
      { label:'訂閱人數', val: subs.size, icon:'fa-envelope', color:'#7e22ce' },
      { label:'評價數', val: reviews.size, icon:'fa-star', color:'#b45309' },
      { label:'待審核', val: pendingAudit, icon:'fa-check-square-o', color: pendingAudit > 0 ? '#dc2626' : '#6b7280', extra: pendingAudit > 0 ? ' <a onclick="document.querySelector(\'[data-page=audit]\').click()" style="cursor:pointer;font-size:11px;color:#dc2626;font-weight:bold;display:block;margin-top:4px">點擊前往審核 →</a>' : '' }
    ];

    var statGrid = document.getElementById('stat-grid');
    if (statGrid) {
      statGrid.innerHTML = stats.map(function(s) {
        return '<div class="stat-card">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
            '<div><div class="val" style="color:' + s.color + '">' + s.val + '</div><div class="label">' + s.label + '</div>' + (s.extra || '') + '</div>' +
            '<div style="background:' + s.color + '15;padding:10px;border-radius:10px"><i class="fa ' + s.icon + '" style="color:' + s.color + ';font-size:1.3rem"></i></div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    
    window.renderTrendChart(analyticsSnap.docs.map(function(doc) { return doc.data(); }));
    window.renderSourceChart(subs.docs.map(function(doc) { return doc.data(); }));
  }).catch(function(err) { console.error('loadDashboard error:', err); });
};

window.renderTrendChart = function(visitData) {
  var canvas = document.getElementById('trend-chart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window.trendChart) window.trendChart.destroy();
  
  var last7Days = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date();
    d.setDate(d.getDate() - 6 + i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  var counts = last7Days.map(function(date) {
    return visitData.filter(function(v) {
      return v.timestamp && v.timestamp.toDate().toISOString().split('T')[0] === date;
    }).length;
  });

  var displayLabels = last7Days.map(function(d) {
    var parts = d.split('-');
    return parts[1] + '/' + parts[2];
  });

  window.trendChart = new Chart(ctx, {
    type:'line',
    data:{ 
      labels: displayLabels, 
      datasets:[{ 
        label:'PV', 
        data: counts, 
        borderColor:'#16a34a', 
        backgroundColor:'rgba(22,163,74,.1)', 
        fill:true, 
        tension:0.4 
      }] 
    },
    options:{ 
      responsive:true, 
      plugins:{legend:{display:false}}, 
      scales:{y:{beginAtZero:true, ticks: { stepSize: 1 }}} 
    }
  });
};

window.renderSourceChart = function(subData) {
  var canvas = document.getElementById('source-chart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (window.sourceChart) window.sourceChart.destroy();
  
  var sources = subData.reduce(function(acc, curr) {
    var s = curr.source || 'Direct';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  var labels = [];
  var counts = [];
  for (var key in sources) {
    if (sources.hasOwnProperty(key)) {
      labels.push(key);
      counts.push(sources[key]);
    }
  }

  window.sourceChart = new Chart(ctx, {
    type:'doughnut',
    data:{ 
      labels: labels.length ? labels : ['無數據'], 
      datasets:[{ 
        data: counts.length ? counts : [1], 
        backgroundColor:['#16a34a','#2563eb','#9333ea','#f59e0b','#ef4444'], 
        borderWidth:0 
      }] 
    },
    options:{ 
      responsive:true, 
      cutout:'65%', 
      plugins:{ 
        legend:{ position:'bottom', labels:{ font:{ size:11 } } } 
      } 
    }
  });
};
