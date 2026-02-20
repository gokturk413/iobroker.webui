import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { DocumentContainer, PropertiesHelper, } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
export const defaultNewStyle = `:host {
}

* {
    box-sizing: border-box;
}`;
export class IobrokerWebuiScreenEditor extends BaseCustomWebComponentConstructorAppend {
    _name;
    get name() { return this._name; }
    _type;
    properties;
    _settings;
    scriptModel;
    _configChangedListener;
    documentContainer;
    static template = html ``;
    static style = css ``;
    _webuiBindings;
    _styleBindings;
    _settingsChanged;
    async initialize(name, type, html, style, script, settings, properties, serviceContainer) {
        if (name[0] == '/')
            name = name.substring(1);
        this.title = type + ' - ' + name;
        this._name = name;
        this._type = type;
        this._settings = settings ?? {};
        this.scriptModel = await window.appShell.javascriptEditor.createModel(script ?? '');
        this.properties = properties ? { ...properties } : {};
        this.documentContainer = new DocumentContainer(serviceContainer);
        this.documentContainer.additionalStylesheets = [
            {
                name: "stylesheet.css",
                content: style ?? ''
            }
        ];
        this.documentContainer.instanceServiceContainer.designer = this;
        this.documentContainer.instanceServiceContainer.stylesheetService.stylesheetChanged.on(async (ss) => {
            if (ss.changeSource == 'undo') {
                if (this.bindingsEnabled) {
                    try {
                        const ret = await window.appShell.bindingsHelper.parseCssBindings(model.getValue(), this.documentContainer.designerView.designerCanvas.rootDesignItem.element, this.relativeBindingsPrefix, this.documentContainer.designerView.designerCanvas.rootDesignItem.element);
                        this._styleBindings = ret[1];
                        const sr = this.documentContainer.designerView.designerCanvas.rootDesignItem.element.shadowRoot;
                        sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, ret[0]];
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
            }
        });
        const model = await window.appShell.styleEditor.createModel(this.documentContainer.additionalStylesheets[0].content);
        this.documentContainer.additionalData = { model: model };
        let timer;
        let disableTextChangedEvent = false;
        model.onDidChangeContent((e) => {
            if (!disableTextChangedEvent) {
                if (timer)
                    clearTimeout(timer);
                timer = setTimeout(() => {
                    this.documentContainer.additionalStylesheets = [
                        {
                            name: "stylesheet.css",
                            content: model.getValue()
                        }
                    ];
                    timer = null;
                }, 250);
            }
        });
        this.documentContainer.additionalStylesheetChanged.on(() => {
            disableTextChangedEvent = true;
            if (model.getValue() !== this.documentContainer.additionalStylesheets[0].content)
                model.applyEdits([{ range: model.getFullModelRange(), text: this.documentContainer.additionalStylesheets[0].content, forceMoveMarkers: true }]);
            disableTextChangedEvent = false;
        });
        this.documentContainer.additionalStyleString = iobrokerHandler.config?.globalStyle ?? '';
        if (style) {
            try {
                const ret = await window.appShell.bindingsHelper.parseCssBindings(style, this.documentContainer.designerView.designerCanvas.rootDesignItem.element, this.relativeBindingsPrefix, this.documentContainer.designerView.designerCanvas.rootDesignItem.element);
                this._styleBindings = ret[1];
                const sr = this.documentContainer.designerView.designerCanvas.rootDesignItem.element.shadowRoot;
                sr.adoptedStyleSheets = [...sr.adoptedStyleSheets, ret[0]];
            }
            catch (err) {
                console.error(err);
            }
        }
        if (html) {
            this.documentContainer.content = html;
            this.handlePropertyChanges();
        }
        this._configChangedListener = iobrokerHandler.configChanged.on(() => {
            this.documentContainer.additionalStyleString = iobrokerHandler.config?.globalStyle ?? '';
        });
        this.shadowRoot.appendChild(this.documentContainer);
        setTimeout(() => {
            this.applyBindings();
            this.setWidth(this._settings.width);
            this.setHeight(this._settings.height);
            this.documentContainer.designerView.zoomToFit();
            
            // Visibility configs are stored as HTML attributes (data-visibility-*)
            // They are automatically loaded with HTML
            
            this.documentContainer.designerView.designerCanvas.onContentChanged.on(() => {
                this.applyBindings();
            });
        }, 50);
    }
    //TODO: maybe reload designer, when bindings are disabled???
    #bindingsEnabled = true;
    get bindingsEnabled() {
        return this.#bindingsEnabled;
    }
    set bindingsEnabled(value) {
        if (this.#bindingsEnabled != value) {
            this.#bindingsEnabled == value;
            if (value) {
                this.applyBindings();
            }
            else {
                this.removeBindings();
            }
        }
    }
    relativeBindingsPrefix = '';
    applyBindings() {
        this.removeBindings();
        if (this.bindingsEnabled) {
            try {
                for (let p in this.properties) {
                    Object.defineProperty(this.documentContainer.designerView.designerCanvas.rootDesignItem.element, p, {
                        get() {
                            return this['_' + p];
                        },
                        set(newValue) {
                            if (this['_' + p] !== newValue) {
                                this['_' + p] = newValue;
                                this._bindingsRefresh(p);
                                this.documentContainer.designerView.designerCanvas.rootDesignItem.element.dispatchEvent(new CustomEvent(PropertiesHelper.camelToDashCase(p) + '-changed', { detail: { newValue } }));
                            }
                        },
                        enumerable: true,
                        configurable: true,
                    });
                    if (this.properties[p].default) {
                        this.documentContainer.designerView.designerCanvas.rootDesignItem.element['_' + p] = this.properties[p].default;
                    }
                }
            }
            catch (err) {
                console.warn("applyBindings()", err);
            }
            this._webuiBindings = window.appShell.bindingsHelper.applyAllBindings(this.documentContainer.designerView.designerCanvas.rootDesignItem.element.shadowRoot, this.relativeBindingsPrefix, this.documentContainer.designerView.designerCanvas.rootDesignItem.element);
        }
    }
    removeBindings() {
        this._webuiBindings?.forEach(x => x());
        this._webuiBindings = null;
        this._styleBindings?.forEach(x => x());
        this._styleBindings = null;
    }
    async executeCommand(command) {
        if (command.type == 'save') {
            let html = this.documentContainer.content;
            let style = this.documentContainer.additionalData.model.getValue();
            let script = this.scriptModel.getValue();
            
            // Get fresh properties from control properties editor
            let prp = null;
            if (window.appShell.controlpropertiesEditor) {
                try {
                    if (window.appShell.controlpropertiesEditor.getProperties) {
                        prp = window.appShell.controlpropertiesEditor.getProperties();
                        console.log('✅ [Save] Got properties from editor:', prp);
                    } else {
                        // Fallback: direct access to propertiesObj
                        prp = window.appShell.controlpropertiesEditor.propertiesObj;
                        console.log('ℹ️ [Save] Got properties via propertiesObj:', prp);
                    }
                    
                    // Update local copy
                    if (prp && Object.keys(prp).length > 0) {
                        this.properties = { ...prp };
                    }
                } catch (err) {
                    console.warn('⚠️ [Save] Could not get properties from editor:', err);
                }
            }
            
            // Final fallback
            if (!prp || Object.keys(prp).length === 0) {
                prp = this.properties || null;
                console.log('ℹ️ [Save] Using fallback this.properties:', prp);
            }
            
            // Visibility configs are now stored as HTML attributes (data-visibility-*)
            // No need to save separately in settings
            
            if (this._type == 'screen') {
                // Generate hash for visibility settings to prevent tampering
                if (this._settings.visibilityEnabled) {
                    const visData = JSON.stringify({
                        enabled: this._settings.visibilityEnabled,
                        groups: this._settings.visibilityGroups || [],
                        action: this._settings.visibilityAction,
                        redirect: this._settings.visibilityRedirectScreen
                    });
                    
                    // Simple hash using crypto API
                    const encoder = new TextEncoder();
                    const data = encoder.encode(visData + window.location.hostname);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                    
                    this._settings._visibilityHash = hashHex;
                    console.log('🔐 [Security] Generated visibility settings hash');
                }
                
                let screen = { html, style, script, settings: this._settings, properties: prp };
                await iobrokerHandler.saveObject(this._type, this._name, screen);
            }
            else {
                let control = { html, style, script, settings: this._settings, properties: prp };
                await iobrokerHandler.saveObject(this._type, this._name, control);
                // Generate and save thumbnail for custom controls
                console.log('💾 [Thumbnail] Saving custom control, generating thumbnail for:', this._name);
                await this._generateAndSaveThumbnail();
            }
        }
        else
            this.documentContainer.executeCommand(command);
    }
    async _generateAndSaveThumbnail() {
        console.log('🎨 [Thumbnail] Starting thumbnail generation...');
        try {
            const canvas = this.documentContainer.designerView.designerCanvas;
            const rootElement = canvas.rootDesignItem?.element;
            console.log('📐 [Thumbnail] Canvas and root element:', { canvas, rootElement });
            if (!rootElement) {
                console.warn('❌ [Thumbnail] No root element found, skipping thumbnail generation');
                return;
            }
            
            let blob;
            
            // Method 1: Try to capture using getComputedStyle and manual rendering
            try {
                blob = await this._captureElementManually(rootElement);
                if (blob) {
                    console.log('✅ [Thumbnail] Manual capture successful');
                }
            }
            catch (err) {
                console.warn('⚠️ [Thumbnail] Manual capture failed:', err);
            }
            
            // Method 2: Fallback to placeholder
            if (!blob) {
                console.log('🎨 [Thumbnail] Using placeholder thumbnail');
                blob = await this._renderToCanvas(rootElement);
            }
            // Save thumbnail
            if (blob) {
                console.log('✅ [Thumbnail] Thumbnail blob created, size:', blob.size, 'bytes');
                await iobrokerHandler.saveThumbnail(this._name, blob);
                console.log('💾 [Thumbnail] Thumbnail saved successfully for:', this._name);
            }
            else {
                console.warn('❌ [Thumbnail] Failed to create thumbnail blob');
            }
        }
        catch (err) {
            console.error('❌ [Thumbnail] Error generating thumbnail:', err);
        }
    }
    async _captureElementManually(rootElement) {
        try {
            // Get the actual element bounds
            const rect = rootElement.getBoundingClientRect();
            let width = rect.width || 200;
            let height = rect.height || 150;
            
            // Limit size
            if (width > 800) width = 800;
            if (height > 600) height = 600;
            if (width < 50) width = 200;
            if (height < 50) height = 150;
            
            console.log('📏 [Thumbnail] Element dimensions:', { width, height });
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const scale = Math.min(200 / width, 150 / height, 1);
            canvas.width = width * scale;
            canvas.height = height * scale;
            
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            
            // Try to render the shadow DOM content
            const shadowRoot = rootElement.shadowRoot;
            if (shadowRoot) {
                console.log('🔍 [Thumbnail] Shadow root found, rendering children...');
                
                // Get all visible elements
                const allElements = shadowRoot.querySelectorAll('*');
                console.log('📦 [Thumbnail] Shadow DOM elements count:', allElements.length);
                
                let renderedCount = 0;
                for (const element of allElements) {
                    if (element.tagName === 'STYLE' || element.tagName === 'LINK') continue;
                    
                    const elementRect = element.getBoundingClientRect();
                    const styles = window.getComputedStyle(element);
                    
                    // Skip invisible elements
                    if (styles.display === 'none' || styles.visibility === 'hidden') continue;
                    if (elementRect.width === 0 || elementRect.height === 0) continue;
                    
                    const x = elementRect.left - rect.left;
                    const y = elementRect.top - rect.top;
                    
                    // Draw background
                    if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        ctx.fillStyle = styles.backgroundColor;
                        ctx.fillRect(x, y, elementRect.width, elementRect.height);
                    }
                    
                    // Draw border
                    if (styles.borderWidth && parseFloat(styles.borderWidth) > 0) {
                        ctx.strokeStyle = styles.borderColor || '#000';
                        ctx.lineWidth = parseFloat(styles.borderWidth);
                        ctx.strokeRect(x, y, elementRect.width, elementRect.height);
                    }
                    
                    // Draw SVG elements
                    if (element.tagName === 'SVG' || element.tagName === 'svg') {
                        try {
                            const svgData = new XMLSerializer().serializeToString(element);
                            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                            const url = URL.createObjectURL(svgBlob);
                            
                            await new Promise((resolve) => {
                                const img = new Image();
                                img.onload = () => {
                                    ctx.drawImage(img, x, y, elementRect.width, elementRect.height);
                                    URL.revokeObjectURL(url);
                                    resolve();
                                };
                                img.onerror = () => {
                                    URL.revokeObjectURL(url);
                                    resolve();
                                };
                                img.src = url;
                                
                                // Timeout after 500ms
                                setTimeout(() => {
                                    URL.revokeObjectURL(url);
                                    resolve();
                                }, 500);
                            });
                            renderedCount++;
                        }
                        catch (err) {
                            console.warn('SVG render error:', err);
                        }
                    }
                    
                    // Draw text content
                    if (element.childNodes.length > 0 && styles.color) {
                        for (const node of element.childNodes) {
                            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                                ctx.fillStyle = styles.color;
                                ctx.font = `${styles.fontSize} ${styles.fontFamily}`;
                                ctx.textBaseline = 'top';
                                ctx.fillText(node.textContent.trim(), x + 5, y + 5);
                            }
                        }
                    }
                }
                
                console.log('✅ [Thumbnail] Rendered', renderedCount, 'elements');
            }
            
            return new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/png', 0.95);
            });
        }
        catch (err) {
            console.error('Manual capture error:', err);
            return null;
        }
    }
    async _captureDesignerCanvas(canvasView, rootElement) {
        try {
            // Create instance of the control to capture it
            const controlInstance = document.createElement(rootElement.tagName.toLowerCase());
            
            // Copy all attributes
            for (const attr of rootElement.attributes) {
                controlInstance.setAttribute(attr.name, attr.value);
            }
            
            // Add to a hidden container
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-10000px';
            container.style.top = '-10000px';
            container.style.width = 'auto';
            container.style.height = 'auto';
            container.style.background = 'white';
            container.appendChild(controlInstance);
            document.body.appendChild(container);
            
            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Get dimensions
            const rect = controlInstance.getBoundingClientRect();
            let width = rect.width || 200;
            let height = rect.height || 150;
            
            // Limit size
            if (width > 400) width = 400;
            if (height > 300) height = 300;
            if (width < 50) width = 200;
            if (height < 50) height = 150;
            
            console.log('📏 [Thumbnail] Capture dimensions:', { width, height });
            
            // Create canvas
            const canvas = document.createElement('canvas');
            const scale = Math.min(200 / width, 150 / height, 1);
            canvas.width = width * scale;
            canvas.height = height * scale;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            
            // Draw the control using rasterizeHTML or html2canvas fallback
            let blob = null;
            
            try {
                // Try simple rendering approach - serialize to data URL
                const serializer = new XMLSerializer();
                const shadowRoot = controlInstance.shadowRoot;
                
                if (shadowRoot) {
                    // Get the actual content
                    const content = Array.from(shadowRoot.children)
                        .filter(child => child.tagName !== 'STYLE' && child.tagName !== 'LINK')
                        .map(child => child.outerHTML)
                        .join('');
                    
                    // Get styles
                    const styles = Array.from(shadowRoot.querySelectorAll('style'))
                        .map(style => style.textContent)
                        .join('\n');
                    
                    console.log('📦 [Thumbnail] Content HTML length:', content.length, 'Styles length:', styles.length);
                    
                    if (content) {
                        const svgData = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                                <foreignObject width="100%" height="100%">
                                    <div xmlns="http://www.w3.org/1999/xhtml">
                                        <style>${styles}</style>
                                        ${content}
                                    </div>
                                </foreignObject>
                            </svg>
                        `;
                        
                        blob = await this._svgToBlob(svgData, width, height, scale);
                    }
                }
            }
            catch (err) {
                console.warn('⚠️ [Thumbnail] Advanced capture failed:', err);
            }
            finally {
                // Cleanup
                document.body.removeChild(container);
            }
            
            // If SVG method failed, return simple canvas
            if (!blob) {
                console.log('🎨 [Thumbnail] Using fallback rendering');
                blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png', 0.95);
                });
            }
            
            return blob;
        }
        catch (err) {
            console.error('Failed to capture designer canvas:', err);
            throw err;
        }
    }
    async _svgToBlob(svgData, width, height, scale) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const timeout = setTimeout(() => {
                URL.revokeObjectURL(url);
                reject(new Error('SVG load timeout'));
            }, 1500);
            
            img.onload = () => {
                clearTimeout(timeout);
                const canvas = document.createElement('canvas');
                canvas.width = width * scale;
                canvas.height = height * scale;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                try {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        URL.revokeObjectURL(url);
                        console.log('✅ [Thumbnail] SVG rendered successfully');
                        resolve(blob);
                    }, 'image/png', 0.95);
                }
                catch (err) {
                    URL.revokeObjectURL(url);
                    reject(err);
                }
            };
            
            img.onerror = (err) => {
                clearTimeout(timeout);
                URL.revokeObjectURL(url);
                reject(err);
            };
            
            img.src = url;
        });
    }
    async _scaleCanvas(sourceCanvas, maxWidth, maxHeight) {
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = width * scale;
        thumbnailCanvas.height = height * scale;
        
        const ctx = thumbnailCanvas.getContext('2d');
        ctx.drawImage(sourceCanvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
        
        return new Promise((resolve) => {
            thumbnailCanvas.toBlob(resolve, 'image/png', 0.95);
        });
    }
    async _renderToCanvas(element) {
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = 200;
        thumbnailCanvas.height = 150;
        
        const ctx = thumbnailCanvas.getContext('2d');
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, 150);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 150);
        
        // Draw a nice border
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 196, 146);
        
        // Draw icon/symbol in center
        ctx.fillStyle = '#6c757d';
        ctx.fillRect(70, 40, 60, 40);
        ctx.fillRect(80, 50, 40, 5);
        ctx.fillRect(80, 65, 40, 5);
        
        // Add control name at bottom
        ctx.fillStyle = '#495057';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Truncate name if too long
        let displayName = this._name;
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 18) + '...';
        }
        
        ctx.fillText(displayName, 100, 120);
        
        // Add "Custom Control" label
        ctx.font = '10px Arial';
        ctx.fillStyle = '#868e96';
        ctx.fillText('Custom Control', 100, 135);
        
        // Convert canvas to blob
        console.log('🎨 [Thumbnail] Rendered fallback thumbnail with name:', displayName);
        return new Promise((resolve) => {
            thumbnailCanvas.toBlob(resolve, 'image/png', 0.95);
        });
    }
    canExecuteCommand(command) {
        if (command.type == 'save')
            return true;
        return this.documentContainer.canExecuteCommand(command);
    }
    deactivated() {
        window.appShell.controlpropertiesEditor.setProperties(null);
        window.appShell.settingsEditor.selectedObject = null;
        window.appShell.styleEditor.model = null;
        window.appShell.javascriptEditor.model = null;
        this._settingsChanged?.dispose();
    }
    activated() {
        window.appShell.styleEditor.model = this.documentContainer.additionalData.model;
        window.appShell.javascriptEditor.model = this.scriptModel;
        window.appShell.propertyGrid.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.treeViewExtended.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.eventsAssignment.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.refactorView.instanceServiceContainer = this.documentContainer.instanceServiceContainer;
        window.appShell.controlpropertiesEditor.setProperties(this.properties);
        window.appShell.controlpropertiesEditor.defaultInternal = this._type !== 'control';
        window.appShell.settingsEditor.typeName = this._type == 'control' ? 'IControlSettings' : 'IScreenSettings';
        window.appShell.settingsEditor.selectedObject = this._settings;
        this._settingsChanged = window.appShell.settingsEditor.propertyChanged.on(() => {
            this.handlePropertyChanges();
        });
        
        // Trigger visibility panel update when selection changes
        try {
            const canvas = this.documentContainer.designerView.designerCanvas;
            if (canvas && canvas.selectionChangedEvent) {
                canvas.selectionChangedEvent.on(() => {
                    if (window.appShell._updateVisibilityPanel) {
                        window.appShell._updateVisibilityPanel();
                        console.log('🎯 [Visibility] Selection changed event fired!');
                    }
                });
            } else {
                console.warn('⚠️ [Visibility] Selection event not available on canvas');
            }
        } catch (err) {
            console.error('❌ [Visibility] Error setting up selection listener:', err);
        }
    }
    setWidth(w) {
        this.documentContainer.designerView.designerWidth = w ?? '100%';
    }
    setHeight(h) {
        this.documentContainer.designerView.designerHeight = h ?? '100%';
    }
    handlePropertyChanges() {
        this.documentContainer.designerView.designerWidth = this._settings.width ?? '';
        this.documentContainer.designerView.designerHeight = this._settings.height ?? '';
        
        console.log('📝 [Screen Editor] Settings changed:', this._settings);
    }
    dispose() {
        this.removeBindings();
        this.documentContainer.dispose();
        this._configChangedListener?.dispose();
        this._settingsChanged?.dispose();
        window.appShell.controlpropertiesEditor.setProperties(null);
        window.appShell.settingsEditor.selectedObject = null;
        window.appShell.styleEditor.model = null;
        window.appShell.javascriptEditor.model = null;
    }
}
customElements.define("iobroker-webui-screen-editor", IobrokerWebuiScreenEditor);
