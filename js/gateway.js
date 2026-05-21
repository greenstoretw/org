// ===== GREENROOF GATEWAY & FEATURE REGISTRY =====
// This file acts as the central navigation directory (Gateway) telling the system
// where each modular feature is registered and resolved.
(function() {
    window.Gateway = {
        registry: {},
        
        // Register a feature handler
        register: function(featureName, handler) {
            this.registry[featureName] = handler;
            // Also expose to window global scope for backward compatibility with existing code
            window[featureName] = handler;
            return handler;
        },
        
        // Invoke/Retrieve a feature
        invoke: function(featureName) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (this.registry[featureName]) {
                return this.registry[featureName].apply(null, args);
            } else {
                console.warn('Feature request not found in Gateway registry: ' + featureName);
            }
        }
    };
    console.log('GREENROOF Gateway initialized successfully!');
})();
