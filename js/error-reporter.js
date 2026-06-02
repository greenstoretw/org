// ===== GLOBAL ERROR & BUG REPORTER MODULE =====
// Captures global JS errors and unhandled promise rejections, logging them to Firestore in real-time.

(function() {
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("Global JS Error captured:", message, "at", source, ":", lineno);
        
        // Ignore errors during maintenance mode or related to application suspension
        if (message && String(message).includes("System under Maintenance")) return;
        if (document.body && document.body.innerHTML.includes("System under Maintenance")) return;
        
        if (window.db && window.firebase) {
            var errDesc = "Global JS Error:\n" +
                "Message: " + message + "\n" +
                "Source: " + source + "\n" +
                "Line: " + lineno + ":" + colno + "\n" +
                "Stack: " + (error ? error.stack : 'N/A') + "\n" +
                "UserAgent: " + navigator.userAgent;
                
            window.db.collection('issues').add({
                description: errDesc,
                reportedAt: window.firebase.firestore.Timestamp.now(),
                status: 'pending',
                type: 'runtime_bug'
            }).catch(function(e) {
                console.warn("Failed to log error to Firestore:", e);
            });
        }
    };

    window.onunhandledrejection = function(event) {
        console.error("Global Unhandled Promise Rejection:", event.reason);
        
        if (window.db && window.firebase) {
            var errDesc = "Unhandled Promise Rejection:\n" +
                "Reason: " + (event.reason ? (event.reason.message || String(event.reason)) : 'Unknown') + "\n" +
                "Stack: " + (event.reason && event.reason.stack ? event.reason.stack : 'N/A') + "\n" +
                "UserAgent: " + navigator.userAgent;
                
            window.db.collection('issues').add({
                description: errDesc,
                reportedAt: window.firebase.firestore.Timestamp.now(),
                status: 'pending',
                type: 'promise_bug'
            }).catch(function(e) {
                console.warn("Failed to log rejection to Firestore:", e);
            });
        }
    };
    
    console.log("GREENROOF Error Reporter initialized successfully!");
})();
