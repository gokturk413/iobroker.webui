/**
 * Frontend License Information
 * Note: Primary protection is in backend (adapter won't start without license)
 * This is just UI information layer
 */

(function() {
    'use strict';
    
    // Show license information in console
    function showLicenseInfo() {
        console.log('%c🔒 ioBroker WebUI - Licensed Software', 'font-size: 18px; font-weight: bold; color: #667eea; background: #f0f4ff; padding: 10px; border-radius: 4px;');
        console.log('%cCustom WebUI by gokturk413', 'font-size: 14px; color: #555; font-style: italic;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
        console.log('%c✅ License Protection Active', 'color: #4caf50; font-weight: bold;');
        console.log('%c• Backend validation: ENABLED', 'color: #666;');
        console.log('%c• Hardware binding: ENABLED', 'color: #666;');
        console.log('%c• Obfuscated code: ENABLED', 'color: #666;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
        console.log('%cℹ️  If editor is not working, check adapter settings', 'color: #2196f3;');
        console.log('%c   Admin → Instances → webui → Settings → License Key', 'color: #999; font-size: 11px;');
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showLicenseInfo);
    } else {
        showLicenseInfo();
    }
})();
