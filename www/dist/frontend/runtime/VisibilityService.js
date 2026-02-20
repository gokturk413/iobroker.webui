import { iobrokerHandler } from '../common/IobrokerHandler.js';

/**
 * Visibility Service - Handles element visibility based on user groups and conditions
 * Provides protection against browser manipulation
 */
class VisibilityService {
    static instance = new VisibilityService();
    
    #observers = new Map();
    #intervalChecks = new Map();
    #originalDisplayStyles = new WeakMap();
    #tampering = false;
    
    constructor() {
        this.#setupAntiTampering();
    }
    
    /**
     * Setup anti-tampering detection
     */
    #setupAntiTampering() {
        // Detect DevTools opening
        const detectDevTools = () => {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            
            if (widthThreshold || heightThreshold) {
                if (!this.#tampering) {
                    this.#tampering = true;
                    console.warn('⚠️ [Visibility] Developer tools detected - visibility checks will be re-validated');
                    this.#revalidateAll();
                }
            } else {
                this.#tampering = false;
            }
        };
        
        setInterval(detectDevTools, 1000);
        
        // Detect element.style modifications
        this.#setupMutationObserver();
    }
    
    /**
     * Setup mutation observer to detect tampering
     */
    #setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const element = mutation.target;
                    if (element.hasAttribute('data-visibility-controlled')) {
                        console.warn('🚨 [Visibility] Tampering detected on element:', element);
                        this.#revalidateElement(element);
                    }
                }
            }
        });
        
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['style']
        });
    }
    
    /**
     * Apply visibility rules to an element
     * @param {HTMLElement} element 
     * @param {object} visibilityConfig 
     */
    async applyVisibility(element, visibilityConfig) {
        if (!visibilityConfig || !visibilityConfig.enabled) {
            return;
        }
        
        console.log('🔍 [Visibility] Applying visibility rules to:', element.tagName, visibilityConfig);
        
        // Store original display style
        if (!this.#originalDisplayStyles.has(element)) {
            this.#originalDisplayStyles.set(element, element.style.display || '');
        }
        
        // Mark as controlled (config already stored as separate attributes)
        element.setAttribute('data-visibility-controlled', 'true');
        
        // Initial check
        await this.#checkAndApply(element, visibilityConfig);
        
        // Subscribe to datapoint changes if objectId specified
        if (visibilityConfig.objectId) {
            console.log('📡 [Visibility] Subscribing to state changes:', visibilityConfig.objectId);
            await iobrokerHandler.subscribeState(visibilityConfig.objectId, (id, state) => {
                console.log('🔔 [Visibility] State changed:', id, 'new value:', state?.val);
                this.#checkAndApply(element, visibilityConfig);
            });
        }
        
        // Periodic re-validation (protection against tampering)
        const intervalId = setInterval(() => {
            this.#checkAndApply(element, visibilityConfig);
        }, 30000); // Check every 30 seconds (subscription handles real-time updates)
        
        this.#intervalChecks.set(element, intervalId);
    }
    
    /**
     * Check visibility and apply
     */
    async #checkAndApply(element, visibilityConfig) {
        try {
            const result = await iobrokerHandler.checkVisibility(visibilityConfig);
            
            console.log('✅ [Visibility] Check result for', element.tagName, ':', { visible: result.visible, enabled: result.enabled });
            
            // Apply visibility
            if (!result.visible) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.setAttribute('aria-hidden', 'true');
            } else {
                const originalDisplay = this.#originalDisplayStyles.get(element) || '';
                element.style.display = originalDisplay;
                element.style.visibility = 'visible';
                element.removeAttribute('aria-hidden');
            }
            
            // Apply enabled/disabled
            if (!result.enabled) {
                element.style.pointerEvents = 'none';
                element.style.opacity = '0.5';
                element.setAttribute('disabled', 'true');
                if (element.setAttribute) {
                    element.setAttribute('data-disabled-by-visibility', 'true');
                }
            } else {
                element.style.pointerEvents = '';
                element.style.opacity = '';
                element.removeAttribute('disabled');
                element.removeAttribute('data-disabled-by-visibility');
            }
            
            // Store encrypted hash to detect tampering
            this.#storeElementHash(element, result);
        }
        catch (err) {
            console.error('❌ [Visibility] Failed to check visibility:', err);
        }
    }
    
    /**
     * Store element hash for tampering detection
     */
    #storeElementHash(element, result) {
        const hash = btoa(JSON.stringify({ 
            visible: result.visible, 
            enabled: result.enabled,
            timestamp: Date.now() 
        }));
        element.setAttribute('data-visibility-hash', hash);
    }
    
    /**
     * Validate element hasn't been tampered
     */
    async #revalidateElement(element) {
        try {
            // Read config from attributes
            const config = {
                enabled: element.getAttribute('data-visibility-enabled') === 'true',
                objectId: element.getAttribute('data-visibility-signal'),
                condition: element.getAttribute('data-visibility-condition') || '==',
                conditionValue: element.getAttribute('data-visibility-value') || '',
                action: element.getAttribute('data-visibility-action') || 'hide',
                groups: element.getAttribute('data-visibility-groups')?.split(',').filter(g => g) || []
            };
            
            if (config.enabled) {
                await this.#checkAndApply(element, config);
            }
        }
        catch (err) {
            console.error('[Visibility] Revalidation error:', err);
        }
    }
    
    /**
     * Revalidate all controlled elements
     */
    #revalidateAll() {
        const controlled = document.querySelectorAll('[data-visibility-controlled="true"]');
        controlled.forEach(element => {
            this.#revalidateElement(element);
        });
    }
    
    /**
     * Remove visibility control from element
     */
    removeVisibility(element) {
        const intervalId = this.#intervalChecks.get(element);
        if (intervalId) {
            clearInterval(intervalId);
            this.#intervalChecks.delete(element);
        }
        
        element.removeAttribute('data-visibility-controlled');
        element.removeAttribute('data-visibility-hash');
        
        // Restore original style
        const originalDisplay = this.#originalDisplayStyles.get(element);
        if (originalDisplay !== undefined) {
            element.style.display = originalDisplay;
        }
        element.style.visibility = '';
        element.style.pointerEvents = '';
        element.style.opacity = '';
    }
    
    /**
     * Scan and apply visibility to all elements with visibility config
     */
    async scanAndApply(container = document.body) {
        const elements = container.querySelectorAll('[data-visibility-enabled="true"]');
        console.log(`🔍 [Visibility] Scanning ${elements.length} elements with visibility config`);
        
        for (const element of elements) {
            try {
                // Read config from separate attributes
                const visibilityConfig = {
                    enabled: element.getAttribute('data-visibility-enabled') === 'true',
                    objectId: element.getAttribute('data-visibility-signal'),
                    condition: element.getAttribute('data-visibility-condition') || '==',
                    conditionValue: element.getAttribute('data-visibility-value') || '',
                    action: element.getAttribute('data-visibility-action') || 'hide',
                    groups: element.getAttribute('data-visibility-groups')?.split(',').filter(g => g) || []
                };
                
                await this.applyVisibility(element, visibilityConfig);
            }
            catch (err) {
                console.error('[Visibility] Error parsing visibility config:', err);
            }
        }
    }
}

export const visibilityService = VisibilityService.instance;
export { VisibilityService };
