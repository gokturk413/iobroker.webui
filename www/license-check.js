/**
 * Frontend License Validation
 * Prevents unauthorized access to WebUI Editor
 */

(function() {
    'use strict';
    
    // Check license status from backend
    async function checkLicense() {
        try {
            // Try to connect to ioBroker socket.io
            const response = await fetch('/admin/getStates?pattern=webui.0.license.*');
            
            if (!response.ok) {
                blockEditor('Unable to verify license - backend communication failed');
                return;
            }
            
            const states = await response.json();
            const licenseValid = states['webui.0.license.valid'];
            
            if (!licenseValid || !licenseValid.val) {
                blockEditor('License validation failed - This adapter requires a valid license key');
                return;
            }
            
            console.log('✅ License validated - Editor access granted');
            
        } catch (error) {
            // If state doesn't exist, block (no license configured)
            blockEditor('License validation required - Please configure license in adapter settings');
        }
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
                    <li>Open ioBroker Admin Panel</li>
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
        
        // Prevent any interaction with the page
        document.body.style.overflow = 'hidden';
        
        console.error('❌ Editor blocked:', message);
    }
    
    // Run license check when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkLicense);
    } else {
        checkLicense();
    }
})();
