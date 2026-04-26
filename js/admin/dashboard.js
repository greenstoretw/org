// ===== admin/dashboard.js =====
window.trendChart = null;
window.sourceChart = null;

window.loadDashboard = async function() {
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
  window.renderTrendChart();
  window.renderSourceChart(subs.size);
};

window.renderTrendChart = function() {
  const ctx = document.getElementById('trend-chart').getContext('2d');
  if (window.trendChart) window.trendChart.destroy();
  const labels = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return `${d.getMonth()+1}/${d.getDate()}`;});
  window.trendChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label:'PV', data:labels.map(()=>Math.floor(Math.random()*200+50)), borderColor:'#16a34a', backgroundColor:'rgba(22,163,74,.1)', fill:true, tension:0.4 }] },
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
  });
};

window.renderSourceChart = function(subs) {
  const ctx = document.getElementById('source-chart').getContext('2d');
  if (window.sourceChart) window.sourceChart.destroy();
  window.sourceChart = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:['直接訪問','搜尋引擎','社群媒體'], datasets:[{ data:[45,35,20], backgroundColor:['#16a34a','#2563eb','#9333ea'], borderWidth:0 }] },
    options:{ responsive:true, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ font:{ size:11 } } } } }
  });
};
