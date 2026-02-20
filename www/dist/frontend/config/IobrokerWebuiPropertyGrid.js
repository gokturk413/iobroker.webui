import { VisualizationPropertyGrid } from "@node-projects/web-component-designer-visualization-addons";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiPropertyGrid extends VisualizationPropertyGrid {
    saveCallback;
    _visibilityPanel;
    _visibilityPanelCreated = false;
    _screenVisibilityPanel;
    _screenVisibilityPanelCreated = false;
    
    constructor() {
        super();
        
        // Watch for property grid changes without breaking parent
        this._setupScreenVisibilityObserver();
    }
    
    _setupScreenVisibilityObserver() {
        let lastRenderedObject = null;
        let lastTypeName = null;
        
        // Poll for changes to selectedObject and typeName
        setInterval(() => {
            const currentType = this.typeName;
            const currentObj = this.selectedObject;
            
            // Check if context changed - support both Screen and Control settings
            if ((currentType === 'IScreenSettings' || currentType === 'IControlSettings') && currentObj) {
                // Only render if object or type changed
                if (lastRenderedObject !== currentObj || lastTypeName !== currentType) {
                    const isControl = currentType === 'IControlSettings';
                    console.log(`✅ [PropertyGrid] Auto-rendering ${isControl ? 'control' : 'screen'} visibility UI (context changed)`);
                    this._ensureScreenVisibilityPanel();
                    this._renderScreenVisibilityUI(currentObj, isControl);
                    lastRenderedObject = currentObj;
                    lastTypeName = currentType;
                }
            } else {
                // Hide panel if not screen/control settings
                if (this._screenVisibilityPanel && (lastTypeName === 'IScreenSettings' || lastTypeName === 'IControlSettings')) {
                    this._screenVisibilityPanel.style.display = 'none';
                    console.log('⚠️ [PropertyGrid] Hiding visibility panel (not settings)');
                }
                lastRenderedObject = null;
                lastTypeName = currentType;
            }
        }, 200); // Check every 200ms
    }
    
    _ensureVisibilityPanel() {
        if (!this._visibilityPanelCreated) {
            this._visibilityPanel = document.createElement('div');
            this._visibilityPanel.id = 'visibility-panel';
            this._visibilityPanel.style.cssText = 'padding:10px;border-top:2px solid #ccc;background:#fff;';
            this._visibilityPanel.innerHTML = `
                <h3 style="margin:5px 0 10px 0;font-size:13px;font-weight:bold;">🔒 Visibility</h3>
                <div id="visibility-content"></div>
            `;
            
            // Find property grid container and append
            const container = this.shadowRoot || this;
            if (container.querySelector) {
                const target = container.querySelector('.property-grid-container') || container;
                target.appendChild(this._visibilityPanel);
            } else {
                this.appendChild(this._visibilityPanel);
            }
            
            this._visibilityPanelCreated = true;
            console.log('✅ [Visibility] Panel created and appended');
        }
    }
    
    set selectedElements(value) {
        super.selectedElements = value;
        
        // Ensure panel exists
        setTimeout(() => {
            this._ensureVisibilityPanel();
            this._updateVisibilityPanel(value);
        }, 50);
    }
    
    async _updateVisibilityPanel(elements) {
        if (!this._visibilityPanel) {
            return;
        }
        
        if (!elements || elements.length !== 1) {
            this._visibilityPanel.style.display = 'none';
            return;
        }
        
        const element = elements[0].element;
        this._visibilityPanel.style.display = 'block';
        
        const content = this._visibilityPanel.querySelector('#visibility-content');
        content.innerHTML = '';
        
        // Get current config
        const visibilityAttr = element.getAttribute('data-visibility');
        let config = {};
        if (visibilityAttr) {
            try {
                config = JSON.parse(visibilityAttr);
            } catch (err) {}
        }
        
        // Create UI
        const updateConfig = (key, value) => {
            config[key] = value;
            element.setAttribute('data-visibility', JSON.stringify(config));
            console.log('🔒 [Visibility] Updated:', config);
        };
        
        // Enable checkbox
        const enableContainer = document.createElement('label');
        enableContainer.style.cssText = 'display:flex;align-items:center;gap:5px;margin-bottom:10px;cursor:pointer;';
        const enableCheck = document.createElement('input');
        enableCheck.type = 'checkbox';
        enableCheck.checked = config.enabled || false;
        enableCheck.onchange = () => updateConfig('enabled', enableCheck.checked);
        enableContainer.appendChild(enableCheck);
        enableContainer.appendChild(document.createTextNode('Enable Visibility Control'));
        content.appendChild(enableContainer);
        
        // Object ID
        const objContainer = document.createElement('div');
        objContainer.style.cssText = 'margin-bottom:10px;';
        objContainer.innerHTML = '<label style="font-size:11px;font-weight:bold;display:block;margin-bottom:3px;">Object ID:</label>';
        const objInput = document.createElement('input');
        objInput.type = 'text';
        objInput.value = config.objectId || '';
        objInput.placeholder = '0_userdata.0.test';
        objInput.style.cssText = 'width:100%;padding:5px;font-size:11px;';
        objInput.oninput = () => updateConfig('objectId', objInput.value);
        objContainer.appendChild(objInput);
        content.appendChild(objContainer);
        
        // Condition
        const condContainer = document.createElement('div');
        condContainer.style.cssText = 'margin-bottom:10px;';
        condContainer.innerHTML = '<label style="font-size:11px;font-weight:bold;display:block;margin-bottom:3px;">Condition:</label>';
        const condSelect = document.createElement('select');
        condSelect.style.cssText = 'width:100%;padding:5px;font-size:11px;';
        condSelect.innerHTML = '<option>==</option><option>!=</option><option>&gt;</option><option>&lt;</option><option>&gt;=</option><option>&lt;=</option>';
        condSelect.value = config.condition || '==';
        condSelect.onchange = () => updateConfig('condition', condSelect.value);
        condContainer.appendChild(condSelect);
        content.appendChild(condContainer);
        
        // Value
        const valContainer = document.createElement('div');
        valContainer.style.cssText = 'margin-bottom:10px;';
        valContainer.innerHTML = '<label style="font-size:11px;font-weight:bold;display:block;margin-bottom:3px;">Value:</label>';
        const valInput = document.createElement('input');
        valInput.type = 'text';
        valInput.value = config.conditionValue || '';
        valInput.placeholder = '1';
        valInput.style.cssText = 'width:100%;padding:5px;font-size:11px;';
        valInput.oninput = () => updateConfig('conditionValue', valInput.value);
        valContainer.appendChild(valInput);
        content.appendChild(valContainer);
        
        // User Groups
        const groupsContainer = document.createElement('div');
        groupsContainer.style.cssText = 'margin-bottom:10px;';
        groupsContainer.innerHTML = '<label style="font-size:11px;font-weight:bold;display:block;margin-bottom:3px;">Only for groups:</label>';
        const groupsList = document.createElement('div');
        groupsList.style.cssText = 'max-height:100px;overflow-y:auto;border:1px solid #ccc;padding:5px;background:#f9f9f9;';
        
        const userGroups = await iobrokerHandler.getUserGroups();
        const selectedGroups = config.groups || [];
        
        userGroups.forEach(group => {
            const label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;padding:2px;cursor:pointer;';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedGroups.includes(group.id);
            checkbox.onchange = () => {
                let groups = config.groups || [];
                if (checkbox.checked) {
                    if (!groups.includes(group.id)) groups.push(group.id);
                } else {
                    groups = groups.filter(g => g !== group.id);
                }
                updateConfig('groups', groups);
            };
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(group.name));
            groupsList.appendChild(label);
        });
        
        groupsContainer.appendChild(groupsList);
        content.appendChild(groupsContainer);
        
        // Action
        const actionContainer = document.createElement('div');
        actionContainer.innerHTML = '<label style="font-size:11px;font-weight:bold;display:block;margin-bottom:3px;">If not in group:</label>';
        const actionSelect = document.createElement('select');
        actionSelect.style.cssText = 'width:100%;padding:5px;font-size:11px;';
        actionSelect.innerHTML = '<option value="hide">Hide</option><option value="disable">Disable</option>';
        actionSelect.value = config.action || 'hide';
        actionSelect.onchange = () => updateConfig('action', actionSelect.value);
        actionContainer.appendChild(actionSelect);
        content.appendChild(actionContainer);
    }
    
    _ensureScreenVisibilityPanel() {
        if (!this._screenVisibilityPanelCreated) {
            this._screenVisibilityPanel = document.createElement('div');
            this._screenVisibilityPanel.id = 'screen-visibility-panel';
            this._screenVisibilityPanel.style.cssText = `
                padding: 15px;
                border: 3px solid #2196F3;
                background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                margin: 20px 10px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                min-height: 200px;
            `;
            this._screenVisibilityPanel.innerHTML = `
                <h3 id="visibility-panel-title" style="margin:0 0 15px 0;font-size:16px;font-weight:bold;color:#1565C0;text-shadow:1px 1px 2px rgba(255,255,255,0.8);">
                    🔒 Screen Visibility Control
                </h3>
                <div id="screen-visibility-content"></div>
            `;
            
            this._screenVisibilityPanelCreated = true;
            console.log('✅ [Screen Visibility] Panel created with vibrant styling');
        }
    }
    
    // Removed setters - using observer pattern instead to avoid breaking parent PropertyGrid rendering
    
    async _renderScreenVisibilityUI(settings, isControl = false) {
        console.log(`🎨 [PropertyGrid] Rendering UI for ${isControl ? 'control' : 'screen'} settings:`, settings);
        
        if (!this._screenVisibilityPanel) {
            console.warn('⚠️ [PropertyGrid] Panel not created!');
            return;
        }
        
        // Update panel title
        const titleEl = this._screenVisibilityPanel.querySelector('#visibility-panel-title');
        if (titleEl) {
            titleEl.textContent = isControl ? '🔒 Control Visibility Control' : '🔒 Screen Visibility Control';
        }
        
        // STRATEGY: Append to parent Settings dock directly for visibility
        let propertyContainer = null;
        
        // Try to find Settings dock parent
        if (this.parentElement && this.parentElement.id === 'settingsDock') {
            propertyContainer = this.parentElement;
            console.log('📦 [PropertyGrid] Using Settings Dock parent container');
        } else if (this.parentElement) {
            propertyContainer = this.parentElement;
            console.log('📦 [PropertyGrid] Using parentElement');
        } else if (this.shadowRoot) {
            propertyContainer = this.shadowRoot;
            console.log('📦 [PropertyGrid] Using shadow DOM');
        } else {
            propertyContainer = this;
            console.log('📦 [PropertyGrid] Using this element');
        }
        
        console.log('📦 [PropertyGrid] Container:', propertyContainer.tagName || propertyContainer.id);
        
        // Make container scrollable
        if (propertyContainer.style) {
            propertyContainer.style.overflowY = 'auto';
            propertyContainer.style.maxHeight = '100%';
        }
        
        if (!propertyContainer.contains(this._screenVisibilityPanel)) {
            propertyContainer.appendChild(this._screenVisibilityPanel);
            console.log('✅ [PropertyGrid] Panel appended to:', propertyContainer.id || propertyContainer.tagName);
        }
        
        // Force visibility and ensure it's in view
        this._screenVisibilityPanel.style.display = 'block';
        this._screenVisibilityPanel.style.position = 'relative';
        this._screenVisibilityPanel.style.zIndex = '1000';
        this._screenVisibilityPanel.style.width = '100%';
        
        // Scroll into view after a short delay
        setTimeout(() => {
            this._screenVisibilityPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            console.log('📜 [PropertyGrid] Scrolled panel into view');
        }, 300);
        
        const content = this._screenVisibilityPanel.querySelector('#screen-visibility-content');
        content.innerHTML = '';
        
        // Initialize settings if not exist
        if (!settings.visibilityEnabled) settings.visibilityEnabled = false;
        if (!settings.visibilityGroups) settings.visibilityGroups = [];
        if (!settings.visibilityAction) settings.visibilityAction = 'hide';
        if (!settings.visibilityRedirectScreen) settings.visibilityRedirectScreen = '';
        
        const updateSettings = (key, value) => {
            const oldValue = settings[key];
            settings[key] = value;
            
            // Update the actual selectedObject directly
            if (this.selectedObject) {
                this.selectedObject[key] = value;
            }
            
            // Emit property change event
            this.propertyChanged.emit({ property: key, newValue: value, oldValue: oldValue });
            
            console.log('🔒 [Screen Visibility] Updated:', key, '=', value);
            console.log('📝 [Screen Visibility] Current settings:', this.selectedObject);
        };
        
        // BUILD COMPLETE HTML STRUCTURE FIRST - NO innerHTML += !
        content.innerHTML = `
            <!-- Info Tip -->
            <div style="padding:10px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;margin-bottom:15px;font-size:12px;color:#856404;">
                💡 <strong>Tip:</strong> Don't forget to save (Ctrl+S) after changing settings!
            </div>
            
            <!-- Enable Checkbox -->
            <div style="margin-bottom:15px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:500;">
                    <input type="checkbox" id="vis-enable-check" ${settings.visibilityEnabled ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;"/>
                    <span>Enable Screen Visibility Control</span>
                </label>
            </div>
            
            <!-- User Groups -->
            <div style="margin:15px 0;">
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:10px;color:#555;">
                    Only for groups:
                </label>
                <div id="screen-groups-list" style="border:1px solid #ccc;padding:10px;background:#fff;border-radius:4px;max-height:150px;overflow-y:auto;">
                    <p style="font-size:12px;color:#999;">⏳ Loading groups...</p>
                </div>
            </div>
            
            <!-- Action Dropdown -->
            <div style="margin:15px 0;">
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:8px;color:#555;">
                    If user not in group:
                </label>
                <select id="screen-action-select" style="width:100%;padding:8px;font-size:13px;border:1px solid #ccc;border-radius:4px;background:#fff;">
                    <option value="hide" ${settings.visibilityAction === 'hide' ? 'selected' : ''}>Show "Access Denied" message</option>
                    <option value="redirect" ${settings.visibilityAction === 'redirect' ? 'selected' : ''}>Redirect to another screen</option>
                </select>
            </div>
            
            <!-- Redirect Input (conditional) -->
            <div id="screen-redirect-div" style="margin:15px 0;display:${settings.visibilityAction === 'redirect' ? 'block' : 'none'};">
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:8px;color:#555;">
                    Redirect to screen:
                </label>
                <input 
                    type="text" 
                    id="screen-redirect-input"
                    placeholder="Enter screen name" 
                    value="${settings.visibilityRedirectScreen || ''}"
                    style="width:100%;padding:8px;font-size:13px;border:1px solid #ccc;border-radius:4px;background:#fff;"
                />
            </div>
        `;
        
        // NOW attach ALL event listeners
        const enableCheck = content.querySelector('#vis-enable-check');
        if (enableCheck) {
            enableCheck.addEventListener('change', () => {
                updateSettings('visibilityEnabled', enableCheck.checked);
            });
            console.log('✅ [PropertyGrid] Enable checkbox listener attached');
        }
        
        const groupsList = content.querySelector('#screen-groups-list');
        console.log('✅ [PropertyGrid] Groups container ready');
        
        // Load groups async
        try {
            const userGroups = await iobrokerHandler.getUserGroups();
            const selectedGroups = settings.visibilityGroups || [];
            
            console.log('👥 [PropertyGrid] Loaded groups:', userGroups);
            console.log('📋 [PropertyGrid] Groups count:', userGroups.length);
            
            if (!userGroups || userGroups.length === 0) {
                groupsList.innerHTML = '<div style="padding:10px;color:#f44336;">⚠️ No groups found!</div>';
                return;
            }
            
            // Render checkboxes
            let html = '';
            
            userGroups.forEach((group, index) => {
                console.log(`  ✅ [PropertyGrid] Rendering group ${index + 1}:`, group.id, group.name);
                
                const isChecked = selectedGroups.includes(group.id);
                html += `
                    <div style="padding:8px;margin:4px 0;background:#f9f9f9;border-radius:3px;">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
                            <input type="checkbox" ${isChecked ? 'checked' : ''} id="grp-${group.id}" style="width:16px;height:16px;cursor:pointer;"/>
                            <span>${group.name}</span>
                        </label>
                    </div>
                `;
            });
            
            groupsList.innerHTML = html;
            
            console.log('🟢 [PropertyGrid] Groups HTML set, innerHTML length:', html.length);
            console.log('🟢 [PropertyGrid] groupsList children count:', groupsList.children.length);
            
            // Add event listeners - USE querySelector on groupsList (not document!)
            userGroups.forEach(group => {
                const cb = groupsList.querySelector(`#grp-${group.id}`);
                if (cb) {
                    cb.addEventListener('change', (e) => {
                        let groups = settings.visibilityGroups || [];
                        if (e.target.checked) {
                            if (!groups.includes(group.id)) groups.push(group.id);
                        } else {
                            groups = groups.filter(g => g !== group.id);
                        }
                        updateSettings('visibilityGroups', groups);
                        console.log('✏️ [PropertyGrid] Groups updated:', groups);
                    });
                    console.log('🎯 [PropertyGrid] Event listener attached to:', group.id);
                } else {
                    console.error('❌ [PropertyGrid] Checkbox not found for:', group.id);
                }
            });
            
            console.log('✅ [PropertyGrid] All groups rendered, total children:', groupsList.children.length);
            
            // Force re-flow to ensure rendering
            groupsList.style.display = 'none';
            groupsList.offsetHeight; // Trigger reflow
            groupsList.style.display = 'block';
            
            // Scroll the groups list into view
            setTimeout(() => {
                groupsList.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                console.log('📜 [PropertyGrid] Groups list scrolled into view');
            }, 100);
        } catch (err) {
            console.error('❌ [PropertyGrid] Failed to load groups:', err);
            groupsList.innerHTML = '<div style="padding:10px;color:#f44336;">❌ Error loading groups!</div>';
        }
        
        // Attach action dropdown listener
        const actionSelect = content.querySelector('#screen-action-select');
        if (actionSelect) {
            actionSelect.addEventListener('change', () => {
                updateSettings('visibilityAction', actionSelect.value);
                const redirectDiv = content.querySelector('#screen-redirect-div');
                if (redirectDiv) {
                    redirectDiv.style.display = actionSelect.value === 'redirect' ? 'block' : 'none';
                }
            });
            console.log('✅ [PropertyGrid] Action select listener attached');
        }
        
        // Attach redirect input listener
        const redirectInput = content.querySelector('#screen-redirect-input');
        if (redirectInput) {
            redirectInput.addEventListener('input', () => {
                updateSettings('visibilityRedirectScreen', redirectInput.value);
            });
            console.log('✅ [PropertyGrid] Redirect input listener attached');
        }
    }
    
    async executeCommand(command) {
        if (command.type == 'save') {
            this.saveCallback(this.selectedObject);
        }
    }
    canExecuteCommand(command) {
        if (command.type == 'save')
            return this.saveCallback != null;
        return false;
    }
}
customElements.define("iobroker-webui-property-grid", IobrokerWebuiPropertyGrid);
