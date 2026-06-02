// ===== GREENROOF UI MODULE: CHECKIN =====
// This file is modularly extracted and registered with the Gateway router.
// Compatibility is maintained globally via window.Gateway.

window.Gateway.register('handleCheckIn', function(shopId) {
    var user = auth.currentUser;
    if (!user) {
        window.showMessage("請先登入後再進行打卡簽到");
        return;
    }
    var shop = window.allShops.find(function(s) { return s.id === shopId; });
    if (!shop) return;

    var shopName = (shop.name && shop.name['zh-TW']) || '永續商店';
    var carbonSaved = window.calculateCarbonSaving(shop);

    var simulated = false;
    if (window.userLocation && shop.location) {
        var dist = window.getDistance(
            window.userLocation.latitude,
            window.userLocation.longitude,
            shop.location.latitude,
            shop.location.longitude
        );
        if (dist > 300) {
            var ok = confirm("您目前距離商店約 " + Math.round(dist) + " 公尺（超過 300 公尺限制）。是否要進行「模擬簽到」？");
            if (!ok) return;
            simulated = true;
        }
    } else {
        var okSim = confirm("無法取得您的 GPS 位置。是否要進行「模擬簽到」？");
        if (!okSim) return;
        simulated = true;
    }

    var userName = (window.currentUserData && window.currentUserData.anonymousName) || '熱心環保客';

    var loadingOverlay = document.getElementById('app-loading');
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    window.generateReceiptBase64(shopName, userName, carbonSaved, function(base64Receipt, recordId) {
        window.submitCheckIn(shopId, shopName, userName, carbonSaved, base64Receipt, recordId, simulated)
            .then(function() {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                
                window.triggerConfetti();
                
                window.showMessage("打卡簽到成功！感謝您為地球節省了 " + carbonSaved + "g 碳排！🌿");
                
                var modal = document.getElementById('receipt-preview-modal');
                var img = document.getElementById('receipt-preview-img');
                var btn = document.getElementById('receipt-download-btn');
                
                if (img) img.src = base64Receipt;
                if (btn) {
                    btn.href = base64Receipt;
                    btn.download = 'Green-Eaves-Receipt-' + recordId + '.png';
                }
                if (modal) modal.classList.remove('hidden');
                
                window.checkAndUnlockBadges();
            })
            .catch(function(err) {
                if (loadingOverlay) loadingOverlay.classList.add('hidden');
                window.showErrorModal(err, "handleCheckIn");
            });
    });
});
