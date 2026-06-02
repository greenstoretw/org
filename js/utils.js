// ===== UTILS & UI HELPERS =====
window.Gateway.register('escapeHtml', function(text) {
    if (!text) return '';
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
});

window.Gateway.register('showMessage', function(msg) {
    var modal = document.getElementById('message-modal');
    var text = document.getElementById('message-modal-text');
    if (text) text.textContent = msg;
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(function() { modal.classList.add('hidden'); }, 3000);
    }
});

window.Gateway.register('showErrorModal', function(error, context) {
    console.error('Error in ' + context + ':', error);
    var modal = document.getElementById('error-modal');
    var details = document.getElementById('error-details');
    if (details) details.textContent = '[' + context + '] ' + (error.message || String(error));
    if (modal) modal.classList.remove('hidden');
});

window.Gateway.register('formatTime', function(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = seconds % 60;
    
    var pad = function(n) { 
        var s = n.toString();
        return s.length < 2 ? '0' + s : s;
    };
    
    return hours > 0 ? hours + ':' + pad(minutes) + ':' + pad(secs) : minutes + ':' + pad(secs);
});

// Debounce helper for search performance
window.Gateway.register('debounce', function(fn, delay) {
    var timer;
    return function() {
        clearTimeout(timer);
        var args = arguments;
        var ctx = this;
        timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
});

window.Gateway.register('isOpenNow', function(hoursString) {
    if (!hoursString) return true; 
    
    var now = new Date();
    var currentTime = now.getHours() * 100 + now.getMinutes();

    try {
        var timeMatch = hoursString.match(/(\d{1,2})[:：](\d{2})\s*[-–~]\s*(\d{1,2})[:：](\d{2})/);
        if (timeMatch) {
            var start = parseInt(timeMatch[1], 10) * 100 + parseInt(timeMatch[2], 10);
            var end = parseInt(timeMatch[3], 10) * 100 + parseInt(timeMatch[4], 10);
            
            if (start > end) {
                return currentTime >= start || currentTime <= end;
            }
            return currentTime >= start && currentTime <= end;
        }
    } catch (e) {
        console.error("isOpenNow parse error:", e);
    }
    
    return true; 
});

// Haversine Distance Calculator (returns distance in meters)
window.Gateway.register('getDistance', function(lat1, lon1, lat2, lon2) {
    var R = 6371e3; // Earth radius in meters
    var phi1 = lat1 * Math.PI / 180;
    var phi2 = lat2 * Math.PI / 180;
    var deltaPhi = (lat2 - lat1) * Math.PI / 180;
    var deltaLambda = (lon2 - lon1) * Math.PI / 180;

    var a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
});

// Fullscreen Canvas Confetti Particle System
window.Gateway.register('triggerConfetti', function() {
    var canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.position = 'fixed';
        canvas.style.inset = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '99999';
        document.body.appendChild(canvas);
    }
    
    var ctx = canvas.getContext('2d');
    var particles = [];
    var colors = ['#22c55e', '#16a34a', '#86efac', '#facc15', '#eab308', '#38bdf8', '#60a5fa'];
    
    var resize = function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Create particles
    for (var i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedX: Math.random() * 4 - 2,
            speedY: Math.random() * 5 + 3,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: Math.random() * 0.1 - 0.05
        });
    }
    
    var animationFrameId;
    var duration = 4000; // 4 seconds duration
    var startTime = Date.now();
    
    var animate = function() {
        var elapsed = Date.now() - startTime;
        if (elapsed > duration) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            window.removeEventListener('resize', resize);
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (var k = 0; k < particles.length; k++) {
            var p = particles[k];
            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotationSpeed;
            
            if (p.y > canvas.height) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
            }
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }
        
        animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
});

// Canvas-based Green Check-in Receipt Generator (Base64)
window.Gateway.register('generateReceiptBase64', function(shopName, userName, carbonSaved, callback) {
    var canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 560;
    var ctx = canvas.getContext('2d');
    
    // Background (Clean premium Paper texture)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Receipt Outer Dotted border
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    ctx.setLineDash([]); // Reset line dash
    
    // Green Accent Header banner
    ctx.fillStyle = '#15803d';
    ctx.fillRect(25, 25, canvas.width - 50, 80);
    
    // White text inside header banner
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
    ctx.fillText('GREENROOF ECO-CHECKIN', canvas.width / 2, 60);
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillText('SUSTAINABLE FOOTPRINT RECORD', canvas.width / 2, 85);
    
    // Receipt Details
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    
    var startY = 150;
    var lineH = 30;
    
    // Decorative lines
    var drawDotLine = function(y) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(canvas.width - 35, y);
        ctx.stroke();
        ctx.setLineDash([]);
    };
    
    var timeStr = new Date().toLocaleString('zh-TW', { hour12: false });
    
    ctx.fillText('MEMBER NAME (用戶名稱):', 35, startY);
    ctx.font = 'normal 13px "Noto Sans TC", sans-serif';
    ctx.fillText(userName || 'Anonymous (環保旅客)', 220, startY);
    
    drawDotLine(startY + 15);
    
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    ctx.fillText('SHOP NAME (店家名稱):', 35, startY + lineH);
    ctx.font = 'normal 13px "Noto Sans TC", sans-serif';
    ctx.fillText(shopName || 'Green Store', 220, startY + lineH);
    
    drawDotLine(startY + lineH + 15);
    
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    ctx.fillText('TIMESTAMP (簽到時間):', 35, startY + lineH * 2);
    ctx.font = 'normal 12px "Inter", sans-serif';
    ctx.fillText(timeStr, 200, startY + lineH * 2);
    
    drawDotLine(startY + lineH * 2 + 15);
    
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    ctx.fillText('CARBON PREVENTED (減碳貢獻):', 35, startY + lineH * 3);
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.fillText(carbonSaved + ' g CO2e 🌿', 220, startY + lineH * 3);
    ctx.fillStyle = '#334155';
    
    drawDotLine(startY + lineH * 3 + 15);
    
    // Status
    ctx.font = 'bold 13px "Noto Sans TC", sans-serif';
    ctx.fillText('RECORD ID (憑證編號):', 35, startY + lineH * 4);
    ctx.font = 'normal 12px "Inter", sans-serif';
    var recordId = 'GE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    ctx.fillText(recordId, 220, startY + lineH * 4);
    
    drawDotLine(startY + lineH * 4 + 15);
    
    // Receipt Bottom visual (Fake Barcode)
    var barY = startY + lineH * 5 + 15;
    ctx.fillStyle = '#0f172a';
    var barcodePattern = [2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4];
    var barX = 75;
    for (var j = 0; j < barcodePattern.length; j++) {
        var w = barcodePattern[j] * 2;
        ctx.fillRect(barX, barY, w, 40);
        barX += w + 2;
    }
    
    // Thank you text
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.font = 'italic 12px "Noto Sans TC", sans-serif';
    ctx.fillText('Thank you for making our planet greener!', canvas.width / 2, barY + 70);
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillText('GREENROOF PROJECT • GREENSTORE-1CE0F', canvas.width / 2, barY + 90);
    
    // Output base64
    setTimeout(function() {
        var base64 = canvas.toDataURL('image/png');
        if (callback) callback(base64, recordId);
    }, 100);
});

