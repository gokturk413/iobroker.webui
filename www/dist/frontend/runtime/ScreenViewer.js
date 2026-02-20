var ScreenViewer_1;
import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, css, cssFromString, customElement, DomHelper, html, property } from "@node-projects/base-custom-webcomponent";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
import { convertCssUnitToPixel } from "@node-projects/web-component-designer/dist/elements/helper/CssUnitConverter.js";
import { isFirefox } from "@node-projects/web-component-designer/dist/elements/helper/Browser.js";
import { PropertiesHelper } from "@node-projects/web-component-designer/dist/elements/services/propertiesService/services/PropertiesHelper.js";
import { visibilityService } from "./VisibilityService.js";
let ScreenViewer = class ScreenViewer extends BaseCustomWebComponentConstructorAppend {
    static { ScreenViewer_1 = this; }
    static style = css `
    :host {
        height: 100%;
        position: relative;
        display: block;
    }

    *[node-projects-hide-at-run-time] {
        display: none !important;
    }`;
    static styleIfFromScreen = css `
    :host {
        background: transparent;
        border: none;
        transform: none;
        padding: 0;
        margin: 0;
    }

    *[node-projects-hide-at-run-time] {
        display: none !important;
    }`;
    static template = html `<div id="root"></div>`;
    _iobBindings;
    _loading;
    _refreshViewSubscription;
    _screensChangedSubscription;
    _scriptObject;
    _resizeObserver;
    _root;
    _rootShadow;
    #eventListeners = [];
    _stretch;
    get stretch() {
        return this._stretch;
    }
    set stretch(value) {
        if (this._stretch != value) {
            this._stretch = value;
            this._loadScreen();
        }
    }
    _stretchWidth;
    get stretchWidth() {
        return this._stretchWidth;
    }
    set stretchWidth(value) {
        if (this._stretchWidth != value) {
            this._stretchWidth = value;
            this._loadScreen();
        }
    }
    _stretchHeight;
    get stretchHeight() {
        return this._stretchHeight;
    }
    set stretchHeight(value) {
        if (this._stretchHeight != value) {
            this._stretchHeight = value;
            this._loadScreen();
        }
    }
    _relativeSignalsPath;
    get relativeSignalsPath() {
        return this._relativeSignalsPath;
    }
    set relativeSignalsPath(value) {
        if (this._relativeSignalsPath != value) {
            this._relativeSignalsPath = value;
        }
    }
    _screenName;
    get screenName() {
        return this._screenName;
    }
    set screenName(value) {
        if (this._screenName != value) {
            this._screenName = value;
            this._loadScreen();
        }
    }
    async setScreenNameAndLoad(screen) {
        if (this._screenName != screen) {
            this._screenName = screen;
            await this._loadScreen();
        }
    }
    objects;
    _useStyleFromScreenForViewer;
    get useStyleFromScreenForViewer() {
        return this._useStyleFromScreenForViewer;
    }
    set useStyleFromScreenForViewer(value) {
        if (this._useStyleFromScreenForViewer != value) {
            this._useStyleFromScreenForViewer = value;
            this._loadScreen();
        }
    }
    constructor() {
        super();
        this._root = super._getDomElement('root');
        this._rootShadow = this._root.attachShadow({ mode: 'open' });
        this._restoreCachedInititalValues();
    }
    _getDomElement(id) {
        return this._rootShadow.getElementById(id);
    }
    _getDomElements(selectors) {
        return this._rootShadow.querySelectorAll(selectors);
    }
    ready() {
        this._parseAttributesToProperties();
        if (this._screenName)
            this._loadScreen();
    }
    removeBindings() {
        if (this._iobBindings)
            this._iobBindings.forEach(x => x());
        this._iobBindings = null;
    }
    async _loadScreen() {
        console.log('🔄 [ScreenViewer] _loadScreen called for:', this.screenName);
        if (this.screenName) {
            if (!this._loading) {
                this._loading = true;
                console.log('🔄 [ScreenViewer] Starting to load screen:', this.screenName);
                await iobrokerHandler.waitForReady();
                this._loading = false;
                this.removeBindings();
                
                try {
                    console.log('📥 [ScreenViewer] Getting screen object for:', this.screenName);
                    const screen = await iobrokerHandler.getWebuiObject('screen', this.screenName);
                    console.log('📥 [ScreenViewer] Screen object received:', screen ? 'YES' : 'NO');
                    
                    DomHelper.removeAllChildnodes(this._rootShadow);
                    
                    if (screen) {
                        console.log('🚀 [ScreenViewer] Loading screen data...');
                        await this.loadScreenData(screen.html, screen.style, screen.script, screen.settings, screen.properties);
                        console.log('✅ [ScreenViewer] Screen loaded successfully:', this.screenName);
                    } else {
                        console.warn('⚠️ [ScreenViewer] Screen object is null for:', this.screenName);
                    }
                } catch (err) {
                    console.error('❌ [ScreenViewer] Error loading screen "' + this.screenName + '":', err);
                    this._rootShadow.innerHTML = '<div style="padding:20px;color:red;">Error loading screen: ' + err.message + '</div>';
                }
            }
        }
    }
    async loadScreenData(html, style, script, settings, properties) {
        // SECURITY: First verify if this screen was saved with visibility settings
        const screenData = await iobrokerHandler.getScreen(this.screenName);
        const originalSettings = screenData?.settings || {};
        
        // Check if original screen has visibility enabled
        if (originalSettings.visibilityEnabled) {
            console.log('🔒 [Screen Visibility] This screen has visibility protection enabled');
            
            // SECURITY CHECK: If original has visibility but provided settings don't match hash - BLOCK!
            if (!settings || !settings._visibilityHash || settings._visibilityHash !== originalSettings._visibilityHash) {
                console.error('🚨 [Security] Attempt to bypass visibility settings detected!');
                console.error('🚨 [Security] Original hash:', originalSettings._visibilityHash);
                console.error('🚨 [Security] Provided hash:', settings?._visibilityHash);
                
                this._rootShadow.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;background:#fff;">
                        <div style="text-align:center;padding:40px;">
                            <div style="font-size:64px;margin-bottom:20px;">🚨</div>
                            <h2 style="margin:0 0 10px 0;color:#d32f2f;">Security Violation</h2>
                            <p style="color:#999;">Unauthorized access attempt detected.</p>
                            <p style="color:#999;font-size:12px;">This incident will be logged.</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Use original settings for validation
            settings = originalSettings;
        }
        
        // Check screen visibility settings
        if (settings?.visibilityEnabled) {
            console.log('🔒 [Screen Visibility] Checking access for screen:', this.screenName);
            
            try {
                // SECURITY: Verify settings hash to prevent tampering
                if (settings._visibilityHash) {
                    const visData = JSON.stringify({
                        enabled: settings.visibilityEnabled,
                        groups: settings.visibilityGroups || [],
                        action: settings.visibilityAction,
                        redirect: settings.visibilityRedirectScreen
                    });
                    
                    const encoder = new TextEncoder();
                    const data = encoder.encode(visData + window.location.hostname);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    if (computedHash !== settings._visibilityHash) {
                        console.error('🚨 [Security] Visibility settings hash mismatch - potential tampering detected!');
                        console.error('🚨 [Security] Expected:', settings._visibilityHash);
                        console.error('🚨 [Security] Computed:', computedHash);
                        
                        // SECURITY BREACH - block access
                        this._rootShadow.innerHTML = `
                            <div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;background:#fff;">
                                <div style="text-align:center;padding:40px;">
                                    <div style="font-size:64px;margin-bottom:20px;">🚨</div>
                                    <h2 style="margin:0 0 10px 0;color:#d32f2f;">Security Error</h2>
                                    <p style="color:#999;">Screen settings have been tampered with.</p>
                                    <p style="color:#999;font-size:12px;">Please contact your administrator.</p>
                                </div>
                            </div>
                        `;
                        return;
                    }
                    
                    console.log('✅ [Security] Visibility settings hash verified');
                }
                
                const currentUser = await iobrokerHandler.getCurrentUser();
                const userGroupIds = currentUser.groups || [];
                
                console.log('👥 [Screen Visibility] User groups:', userGroupIds);
                console.log('🔒 [Screen Visibility] Required groups:', settings.visibilityGroups);
                
                // Check if user is in allowed groups
                if (settings.visibilityGroups && settings.visibilityGroups.length > 0) {
                    const hasAccess = settings.visibilityGroups.some(groupId => 
                        userGroupIds.some(userGroup => 
                            userGroup.toLowerCase() === groupId.toLowerCase()
                        )
                    );
                    
                    if (!hasAccess) {
                        console.warn('⛔ [Screen Visibility] Access denied for screen:', this.screenName);
                        
                        const action = settings.visibilityAction || 'hide';
                        
                        if (action === 'redirect' && settings.visibilityRedirectScreen) {
                            console.log('🔄 [Screen Visibility] Redirecting to:', settings.visibilityRedirectScreen);
                            this.screenName = settings.visibilityRedirectScreen;
                            this._loadScreen();
                            return;
                        } else {
                            // Hide screen - show access denied message
                            console.log('🚫 [Screen Visibility] Hiding screen');
                            this._rootShadow.innerHTML = `
                                <div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;">
                                    <div style="text-align:center;padding:40px;">
                                        <div style="font-size:48px;margin-bottom:20px;">🔒</div>
                                        <h2 style="margin:0 0 10px 0;color:#666;">Access Denied</h2>
                                        <p style="color:#999;">You don't have permission to view this screen.</p>
                                    </div>
                                </div>
                            `;
                            return;
                        }
                    }
                }
                
                console.log('✅ [Screen Visibility] Access granted');
            } catch (err) {
                console.error('❌ [Screen Visibility] Check failed:', err);
                // On error, allow access (fail-open)
            }
        }
        
        if (properties) {
            for (const p in properties) {
                const prp = properties[p];
                Object.defineProperty(this, p, {
                    get() {
                        return this['_' + p];
                    },
                    set(newValue) {
                        if (this['_' + p] !== newValue) {
                            this['_' + p] = newValue;
                            //this._bindingsRefresh(p);
                            this.dispatchEvent(new CustomEvent(PropertiesHelper.camelToDashCase(p) + '-changed', { detail: { newValue } }));
                        }
                    },
                    enumerable: true,
                    configurable: true,
                });
                if (prp.default) {
                    this['_' + p] = prp.default;
                }
            }
        }
        let globalStyle = iobrokerHandler.config?.globalStyle ?? '';
        this._stretchView(settings);
        let parsedStyle = null;
        if (style) {
            try {
                const boundCss = await window.appShell.bindingsHelper.parseCssBindings(style, this, this.relativeSignalsPath, this);
                parsedStyle = boundCss[0];
                this._iobBindings = boundCss[1];
            }
            catch (err) {
                console.warn(err);
                parsedStyle = cssFromString(style);
            }
        }
        else {
            this._iobBindings = null;
        }
        if (globalStyle && style)
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style, iobrokerHandler.globalStylesheet, parsedStyle];
        else if (globalStyle)
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style, iobrokerHandler.globalStylesheet];
        else if (style)
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style, parsedStyle];
        else
            this._rootShadow.adoptedStyleSheets = [ScreenViewer_1.style];
        if (this._useStyleFromScreenForViewer) {
            this.shadowRoot.adoptedStyleSheets = [ScreenViewer_1.styleIfFromScreen, ...this._rootShadow.adoptedStyleSheets];
        }
        let myDocument;
        if (Document.parseHTMLUnsafe && !isFirefox) {
            this._rootShadow.setHTMLUnsafe(html);
        }
        else {
            //@ts-ignore
            myDocument = new DOMParser().parseFromString(html, 'text/html', { includeShadowRoots: true });
            const fragment = document.createDocumentFragment();
            for (const n of myDocument.head.childNodes)
                fragment.appendChild(n);
            for (const n of myDocument.body.childNodes)
                fragment.appendChild(n);
            this._rootShadow.appendChild(fragment);
        }
        const res = window.appShell.bindingsHelper.applyAllBindings(this._rootShadow, this.relativeSignalsPath, this);
        if (this._iobBindings)
            this._iobBindings.push(...res);
        else
            this._iobBindings = res;
        this._scriptObject = await window.appShell.scriptSystem.assignAllScripts('screenviewer - ' + this.screenName, script, this._rootShadow, this, iobrokerHandler);
        
        console.log('📜 [ScreenViewer] Script object for "' + this.screenName + '":', this._scriptObject);
        console.log('📜 [ScreenViewer] Object type:', Object.prototype.toString.call(this._scriptObject));
        console.log('📜 [ScreenViewer] Has default?', this._scriptObject?.default);
        console.log('📜 [ScreenViewer] Has connectedCallback?', typeof this._scriptObject?.connectedCallback);
        console.log('📜 [ScreenViewer] Has default.connectedCallback?', typeof this._scriptObject?.default?.connectedCallback);
        
        // If module with default export, use it
        if (this._scriptObject?.default && !this._scriptObject?.connectedCallback) {
            console.log('🔄 [ScreenViewer] Using default export for "' + this.screenName + '"');
            this._scriptObject = this._scriptObject.default;
        }
        
        // Call connectedCallback after script is loaded
        if (this._scriptObject?.connectedCallback) {
            console.log('✅ [ScreenViewer] Calling connectedCallback after script load for "' + this.screenName + '"');
            try {
                this._scriptObject.connectedCallback(this, this._rootShadow);
                console.log('✅ [ScreenViewer] connectedCallback executed successfully for "' + this.screenName + '"');
            } catch (err) {
                console.error('❌ [ScreenViewer] Error in connectedCallback for "' + this.screenName + '":', err);
            }
        }
        
        // Apply visibility rules after screen is loaded
        await visibilityService.scanAndApply(this._rootShadow);
    }
    _stretchView(settings) {
        const stretch = this.stretch ?? settings?.stretch;
        if (!stretch || stretch === 'none')
            return;
        const width = this._stretchWidth ?? convertCssUnitToPixel(settings.width, this, 'width');
        const height = this._stretchHeight ?? convertCssUnitToPixel(settings.height, this, 'height');
        this._root.style.width = width + 'px';
        this._root.style.height = height + 'px';
        let scaleX = this.offsetWidth / width;
        let scaleY = this.offsetHeight / height;
        let translateX = 0;
        let translateY = 0;
        if (stretch == 'uniform') {
            if (scaleX > scaleY) {
                scaleX = scaleY;
                translateX = (this.offsetWidth - (width * scaleX)) / 2;
            }
            else {
                scaleY = scaleX;
                translateY = (this.offsetHeight - (height * scaleY)) / 2;
            }
        }
        else if (stretch == 'uniformToFill') {
            if (scaleX > scaleY) {
                scaleY = scaleX;
                translateY = (this.offsetHeight - (height * scaleY)) / 2;
            }
            else {
                scaleX = scaleY;
                translateX = (this.offsetWidth - (width * scaleX)) / 2;
            }
        }
        this._root.style.transformOrigin = '0 0';
        this._root.style.scale = scaleX + ' ' + scaleY;
        this._root.style.translate = translateX + 'px ' + translateY + 'px';
        if (!this._resizeObserver) {
            this._resizeObserver = new ResizeObserver(() => { this._stretchView(settings); });
            this._resizeObserver.observe(this);
        }
    }
    _getRelativeSignalsPath() {
        return this._relativeSignalsPath;
    }
    connectedCallback() {
        this._refreshViewSubscription = iobrokerHandler.refreshView.on(() => this._loadScreen());
        this._screensChangedSubscription = iobrokerHandler.objectsChanged.on(d => {
            if (this._screenName && d.type == 'screen' && d.name === this._screenName)
                this._loadScreen();
        });
        console.log('🔗 [ScreenViewer] connectedCallback for "' + this.screenName + '"');
        
        // Check if module with default export
        let scriptObj = this._scriptObject;
        if (scriptObj?.default && !scriptObj?.connectedCallback) {
            console.log('🔄 [ScreenViewer] Using default export in connectedCallback');
            scriptObj = scriptObj.default;
        }
        
        console.log('🔗 [ScreenViewer] Final scriptObj:', scriptObj);
        console.log('🔗 [ScreenViewer] Has callback?', typeof scriptObj?.connectedCallback);
        
        if (scriptObj?.connectedCallback) {
            console.log('✅ [ScreenViewer] Calling connectedCallback for "' + this.screenName + '"');
            scriptObj.connectedCallback(this, this._rootShadow);
        } else {
            console.warn('⚠️ [ScreenViewer] No connectedCallback for "' + this.screenName + '"');
        }
        for (let e of this.#eventListeners) {
            this.addEventListener(e[0], e[1]);
        }
        if (this._resizeObserver)
            this._resizeObserver.observe(this);
    }
    disconnectedCallback() {
        for (let e of this.#eventListeners) {
            this.removeEventListener(e[0], e[1]);
        }
        this._refreshViewSubscription?.dispose();
        this._screensChangedSubscription?.dispose();
        this._scriptObject?.disconnectedCallback?.(this, this._rootShadow);
        if (this._resizeObserver)
            this._resizeObserver.disconnect();
    }
    _assignEvent(event, callback) {
        const arrayEl = [event, callback];
        this.#eventListeners.push(arrayEl);
        this.addEventListener(event, callback);
        return {
            remove: () => {
                const index = this.#eventListeners.indexOf(arrayEl);
                this.#eventListeners.splice(index, 1);
                this.removeEventListener(event, callback);
            }
        };
    }
};
__decorate([
    property()
], ScreenViewer.prototype, "stretch", null);
__decorate([
    property()
], ScreenViewer.prototype, "stretchWidth", null);
__decorate([
    property()
], ScreenViewer.prototype, "stretchHeight", null);
__decorate([
    property()
], ScreenViewer.prototype, "relativeSignalsPath", null);
__decorate([
    property()
], ScreenViewer.prototype, "screenName", null);
__decorate([
    property(Boolean)
], ScreenViewer.prototype, "useStyleFromScreenForViewer", null);
ScreenViewer = ScreenViewer_1 = __decorate([
    customElement("iobroker-webui-screen-viewer")
], ScreenViewer);
export { ScreenViewer };
window.ScreenViewer = ScreenViewer;
