import { PropertyType } from "@node-projects/web-component-designer";
import { iobrokerHandler } from "../common/IobrokerHandler.js";

/**
 * Visibility Properties Service - Adds visibility configuration to all elements
 */
export class IobrokerWebuiVisibilityPropertiesService {
    
    isHandledElement(designItem) {
        // Handle all HTML elements
        return designItem.element instanceof HTMLElement;
    }
    
    async getProperties(designItem) {
        if (!this.isHandledElement(designItem))
            return null;
        
        // Get current visibility config from element
        const visibilityAttr = designItem.element.getAttribute('data-visibility');
        let visibilityConfig = {};
        
        if (visibilityAttr) {
            try {
                visibilityConfig = JSON.parse(visibilityAttr);
            }
            catch (err) {
                console.warn('Failed to parse visibility config:', err);
            }
        }
        
        // Load user groups
        const userGroups = await iobrokerHandler.getUserGroups();
        
        // Simple test property first
        const properties = [
            {
                name: 'data-visibility',
                type: 'string',
                service: this,
                propertyType: PropertyType.propertyAndAttribute
            }
        ];
        
        return properties;
        
        /* DISABLED FOR NOW - TESTING
        const properties_complex = [
            {
                name: '_visibility_section',
                type: 'section',
                service: this,
                propertyType: PropertyType.complex,
                createEditor: () => {
                    const header = document.createElement('h3');
                    header.style.cssText = 'margin:5px 0;font-size:12px;font-weight:bold;border-bottom:1px solid #ccc;padding-bottom:3px;';
                    header.textContent = '🔒 Visibility Control';
                    return header;
                }
            },
            {
                name: 'visibility_enabled',
                type: 'boolean',
                service: this,
                propertyType: PropertyType.complex,
                createEditor: () => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = visibilityConfig.enabled || false;
                    checkbox.style.cssText = 'margin:0';
                    
                    const label = document.createElement('label');
                    label.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;cursor:pointer;';
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode('Enable Visibility Control'));
                    
                    checkbox.onchange = () => {
                        this._updateVisibilityConfig(designItem, 'enabled', checkbox.checked);
                    };
                    
                    return label;
                }
            },
            {
                name: 'visibility_objectId',
                type: 'string',
                service: this,
                propertyType: PropertyType.complex,
                createEditor: () => {
                    const container = document.createElement('div');
                    container.style.cssText = 'display:grid;grid-template-columns:80px 1fr 30px;gap:5px;align-items:center;margin:5px 0;';
                    
                    const label = document.createElement('label');
                    label.textContent = 'Object ID:';
                    label.style.cssText = 'font-size:10px;';
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = visibilityConfig.objectId || '';
                    input.placeholder = '0_userdata.0.test';
                    input.style.cssText = 'font-size:10px;padding:3px;';
                    input.oninput = () => {
                        this._updateVisibilityConfig(designItem, 'objectId', input.value);
                    };
                    
                    const selectBtn = document.createElement('button');
                    selectBtn.textContent = '...';
                    selectBtn.style.cssText = 'padding:3px;font-size:10px;';
                    selectBtn.onclick = async () => {
                        const { openSelectIdDialog } = await import('../../../node_modules/@iobroker/webcomponent-selectid-dialog/dist/selectIdHelper.js');
                        const selectedId = await openSelectIdDialog({
                            host: iobrokerHandler.host || window.location.hostname,
                            port: parseInt(window.location.port) || 8082,
                            protocol: window.location.protocol,
                            language: iobrokerHandler.language || 'en',
                            selected: visibilityConfig.objectId || '',
                            token: iobrokerHandler.connection?.acl?._token || ''
                        });
                        if (selectedId) {
                            input.value = selectedId;
                            this._updateVisibilityConfig(designItem, 'objectId', selectedId);
                        }
                    };
                    
                    container.appendChild(label);
                    container.appendChild(input);
                    container.appendChild(selectBtn);
                    return container;
                }
            },
            {
                name: 'visibility_condition',
                type: 'string',
                service: this,
                propertyType: PropertyType.complex,
                createEditor: () => {
                    const container = document.createElement('div');
                    container.style.cssText = 'display:grid;grid-template-columns:80px 1fr;gap:5px;align-items:center;margin:5px 0;';
                    
                    const label = document.createElement('label');
                    label.textContent = 'Condition:';
                    label.style.cssText = 'font-size:10px;';
                    
                    const select = document.createElement('select');
                    select.style.cssText = 'font-size:10px;padding:3px;';
                    select.innerHTML = `
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                    `;
                    select.value = visibilityConfig.condition || '==';
                    select.onchange = () => {
                        this._updateVisibilityConfig(designItem, 'condition', select.value);
                    };
                    
                    container.appendChild(label);
                    container.appendChild(select);
                    return container;
                }
            },
            {
                name: 'visibility_conditionValue',
                type: 'string',
                service: this,
                propertyType: PropertyType.complex,
                createEditor: () => {
                    const container = document.createElement('div');
                    container.style.cssText = 'display:grid;grid-template-columns:80px 1fr;gap:5px;align-items:center;margin:5px 0;';
                    
                    const label = document.createElement('label');
                    label.textContent = 'Value:';
                    label.style.cssText = 'font-size:10px;';
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = visibilityConfig.conditionValue || '';
                    input.placeholder = '1';
                    input.style.cssText = 'font-size:10px;padding:3px;';
                    input.oninput = () => {
                        this._updateVisibilityConfig(designItem, 'conditionValue', input.value);
                    };
                    
                    container.appendChild(label);
                    container.appendChild(input);
                    return container;
                }
            },
            {
                name: 'visibility_groups',
                type: 'array',
                service: this,
                propertyType: PropertyType.complex,
                createEditor: () => {
                    const container = document.createElement('div');
                    container.style.cssText = 'margin:5px 0;';
                    
                    const header = document.createElement('div');
                    header.textContent = 'Only for groups:';
                    header.style.cssText = 'font-size:10px;font-weight:bold;margin-bottom:3px;';
                    container.appendChild(header);
                    
                    const groupsList = document.createElement('div');
                    groupsList.style.cssText = 'max-height:120px;overflow-y:auto;border:1px solid #ccc;padding:3px;background:#f9f9f9;';
                    
                    const selectedGroups = visibilityConfig.groups || [];
                    
                    userGroups.forEach(group => {
                        const checkboxContainer = document.createElement('label');
                        checkboxContainer.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:10px;padding:2px;cursor:pointer;';
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.checked = selectedGroups.includes(group.id);
                        checkbox.value = group.id;
                        checkbox.style.cssText = 'margin:0;';
                        checkbox.onchange = () => {
                            const currentGroups = this._getCurrentGroups(designItem);
                            if (checkbox.checked) {
                                if (!currentGroups.includes(group.id)) {
                                    currentGroups.push(group.id);
                                }
                            } else {
                                const index = currentGroups.indexOf(group.id);
                                if (index > -1) {
                                    currentGroups.splice(index, 1);
                                }
                            }
                            this._updateVisibilityConfig(designItem, 'groups', currentGroups);
                        };
                        
                        checkboxContainer.appendChild(checkbox);
                        checkboxContainer.appendChild(document.createTextNode(group.name));
                        groupsList.appendChild(checkboxContainer);
                    });
                    
                    container.appendChild(groupsList);
                    return container;
                }
            },
            {
                name: 'visibility_action',
                type: 'string',
                service: this,
                propertyType: PropertyType.complex,
                createEditor: () => {
                    const container = document.createElement('div');
                    container.style.cssText = 'display:grid;grid-template-columns:80px 1fr;gap:5px;align-items:center;margin:5px 0;';
                    
                    const label = document.createElement('label');
                    label.textContent = 'If not in group:';
                    label.style.cssText = 'font-size:10px;';
                    
                    const select = document.createElement('select');
                    select.style.cssText = 'font-size:10px;padding:3px;';
                    select.innerHTML = `
                        <option value="hide">Hide</option>
                        <option value="disable">Disable</option>
                    `;
                    select.value = visibilityConfig.action || 'hide';
                    select.onchange = () => {
                        this._updateVisibilityConfig(designItem, 'action', select.value);
                    };
                    
                    container.appendChild(label);
                    container.appendChild(select);
                    return container;
                }
            }
        ];
        */
        
        // return properties;
    }
    
    _getCurrentGroups(designItem) {
        const visibilityAttr = designItem.element.getAttribute('data-visibility');
        if (visibilityAttr) {
            try {
                const config = JSON.parse(visibilityAttr);
                return config.groups || [];
            }
            catch (err) {
                return [];
            }
        }
        return [];
    }
    
    _updateVisibilityConfig(designItem, key, value) {
        let config = {};
        const visibilityAttr = designItem.element.getAttribute('data-visibility');
        
        if (visibilityAttr) {
            try {
                config = JSON.parse(visibilityAttr);
            }
            catch (err) {
                console.warn('Failed to parse visibility config:', err);
            }
        }
        
        config[key] = value;
        
        designItem.element.setAttribute('data-visibility', JSON.stringify(config));
        console.log('🔒 [Visibility] Updated config:', config);
    }
    
    async setValue(designItems, property, value) {
        // Not used - we handle changes directly in createEditor
    }
    
    async isSet(designItems, property) {
        return false;
    }
    
    async getValue(designItems, property) {
        return null;
    }
    
    getRefreshMode(designItems, property) {
        return 'none';
    }
}
