/**
 * Frontend License Protection
 * Checks if backend adapter is running (license validation)
 */

(function() {
    'use strict';
    
    let checkAttempts = 0;
    const maxAttempts = 3;
    
    // Check if backend adapter is running and licensed
    async function checkBackend() {
        checkAttempts++;
        
        // Wait for socket connection ( frontend needs this)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
            // Try to access adapter instance info via socket
            if (window.servConn && window.servConn._socket && window.servConn._socket.readyState === 1) {
                // Socket is connected - check if webui adapter is alive
                window.servConn.getState('system.adapter.webui.0.alive', function(err, state) {
                    if (err || !state || !state.val) {
                        // Adapter is not running
                        console.error('❌ WebUI adapter is not running or not licensed');
                        blockEditor('Adapter is not running - License validation required');
                    } else {
                        // Adapter is alive and running
                        showLicenseInfo();
                    }
                });
            } else {
                // Socket not ready - retry
                if (checkAttempts < maxAttempts) {
                    console.log(`⏳ Waiting for backend... (${checkAttempts}/${maxAttempts})`);
                    setTimeout(checkBackend, 2000);
                } else {
                    blockEditor('Backend adapter is not running - License validation required');
                }
            }
        } catch (error) {
            // Error checking state
            if (checkAttempts < maxAttempts) {
                console.log(`⏳ Waiting for backend... (${checkAttempts}/${maxAttempts})`);
                setTimeout(checkBackend, 2000);
            } else {
                console.error('Backend check error:', error);
                blockEditor('Backend adapter is not running - License validation required');
            }
        }
    }
    
    function showLicenseInfo() {
        console.log('%c🔒 gokturk413 WebUI - Licensed Software', 'font-size: 18px; font-weight: bold; color: #667eea; background: #f0f4ff; padding: 10px; border-radius: 4px;');
        console.log('%cCustom WebUI by gokturk413', 'font-size: 14px; color: #555; font-style: italic;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
        console.log('%c✅ License Protection Active', 'color: #4caf50; font-weight: bold;');
        console.log('%c• Backend validation: ENABLED', 'color: #666;');
        console.log('%c• Hardware binding: ENABLED', 'color: #666;');
        console.log('%c• Obfuscated code: ENABLED', 'color: #666;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ccc;');
        console.log('%cℹ️  Backend adapter is running - Editor ready', 'color: #4caf50;');
    }
    
    function blockEditor(message) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'license-block-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 40px 60px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
        `;
        
        content.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
            <h1 style="color: #333; margin: 0 0 16px 0; font-size: 28px;">License Required</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${message}
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <p style="color: #333; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
                    📋 To activate this adapter:
                </p>
                <ol style="color: #666; font-size: 14px; text-align: left; margin: 0; padding-left: 20px;">
                    <li>Open  Admin Panel</li>
                    <li>Go to <strong>Instances</strong> → <strong>webui</strong> → <strong>Settings</strong></li>
                    <li>Enter your license key</li>
                    <li>Save and restart the adapter</li>
                </ol>
            </div>
            <p style="color: #999; font-size: 12px; margin: 0;">
                Custom WebUI by gokturk413 | Hardware-bound licensed software
            </p>
        `;
        
        overlay.appendChild(content);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        console.error('❌ Editor blocked:', message);
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkBackend);
    } else {
        checkBackend();
    }
})();
