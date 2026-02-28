/**
 * Frontend License Validation
 * Prevents unauthorized access to WebUI Editor
 */

(function() {
    'use strict';
    
    // Check license status from backend state
    async function checkLicense() {
        // Wait for page load to access window.io
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            // Check if ioBroker connection exists
            if (!window.iobrokerSocketSession) {
                console.log('⏳ Waiting for ioBroker connection...');
                // Retry after connection established
                setTimeout(checkLicense, 2000);
                return;
            }
            
            // Read license state from ioBroker
            window.iobrokerSocketSession.getState('webui.0.license.valid', function(err, state) {
                if (err || !state) {
                    console.error('License state error:', err);
                    blockEditor('License validation required - Please configure license in adapter settings');
                    return;
                }
                
                if (!state.val) {
                    blockEditor('License validation failed - This adapter requires a valid license key');
                    return;
                }
                
                console.log('✅ License validated - Editor access granted');
            });
            
        } catch (error) {
            console.error('License check error:', error);
            blockEditor('Unable to verify license - backend communication failed');
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
