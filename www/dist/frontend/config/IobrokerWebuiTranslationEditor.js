import { iobrokerHandler } from "../common/IobrokerHandler.js";

export class IobrokerWebuiTranslationEditor extends HTMLElement {
    static is = 'iobroker-webui-translation-editor';

    /** @type {Record<string, Record<string, any>>} */
    _data = {};
    /** @type {string[]} */
    _languages = [];
    /** @type {string | null} */
    _selectedLang = null;
    /** collapsed group names */
    _collapsed = new Set();

    connectedCallback() {
        this.style.display = 'flex';
        this.style.flexDirection = 'column';
        this.style.height = '100%';
        this.style.overflow = 'hidden';
        this.style.fontFamily = 'sans-serif';
        this.style.fontSize = '13px';

        // iobrokerHandler.init() async işləyir - ready olana qədər gözlə
        iobrokerHandler.waitForReady().then(() => {
            this._loadFromHandler();
            this._render();
        });

        // xaricdən translations dəyişsə (məs. başqa tab-da save) - yenilə
        this._translationsChangedHandler = iobrokerHandler.translationsChanged.on(() => {
            this._loadFromHandler();
            this._render();
        });
    }

    disconnectedCallback() {
        this._translationsChangedHandler?.dispose();
    }

    _loadFromHandler() {
        this._data = JSON.parse(JSON.stringify(iobrokerHandler.translations ?? {}));
        this._languages = Object.keys(this._data);
        // yeni yükləmədə bütün qrupları bağlı başlat
        this._collapsed = new Set(this._getTopLevelGroups());
    }

    _getTopLevelGroups() {
        const groups = new Set();
        for (const lang of this._languages) {
            const dict = this._data[lang] ?? {};
            for (const key of Object.keys(dict)) {
                if (dict[key] && typeof dict[key] === 'object') {
                    groups.add(key);
                }
            }
        }
        return [...groups];
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** Flatten nested translation object into [{path, values}] rows */
    _flattenKeys(obj, prefix = []) {
        let rows = [];
        if (!obj || typeof obj !== 'object') return rows;
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (val && typeof val === 'object') {
                rows = rows.concat(this._flattenKeys(val, [...prefix, key]));
            } else {
                rows.push([...prefix, key]);
            }
        }
        return rows;
    }

    /** Get value from nested obj by path array */
    _get(obj, path) {
        let v = obj;
        for (const p of path) v = v?.[p];
        return typeof v === 'string' ? v : '';
    }

    /** Set value in nested obj by path array */
    _set(obj, path, value) {
        let v = obj;
        for (let i = 0; i < path.length - 1; i++) {
            if (!v[path[i]] || typeof v[path[i]] !== 'object') v[path[i]] = {};
            v = v[path[i]];
        }
        v[path[path.length - 1]] = value;
    }

    /** Delete key from nested obj by path array, clean up empty parents */
    _delete(obj, path) {
        const parents = [obj];
        let v = obj;
        for (let i = 0; i < path.length - 1; i++) {
            v = v?.[path[i]];
            parents.push(v);
        }
        delete v?.[path[path.length - 1]];
        // clean up empty parent objects
        for (let i = path.length - 2; i >= 0; i--) {
            if (parents[i] && typeof parents[i][path[i]] === 'object' && Object.keys(parents[i][path[i]]).length === 0) {
                delete parents[i][path[i]];
            } else break;
        }
    }

    /** Collect all unique key paths across all languages */
    _getAllPaths() {
        const set = new Set();
        for (const lang of this._languages) {
            for (const path of this._flattenKeys(this._data[lang] ?? {})) {
                set.add(path.join('.'));
            }
        }
        return [...set].sort().map(s => s.split('.'));
    }

    // ── render ───────────────────────────────────────────────────────────────

    _render() {
        this.innerHTML = '';

        // ── Toolbar ──
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px;background:#1e1e1e;border-bottom:1px solid #333;flex-shrink:0;';

        const title = document.createElement('span');
        title.textContent = 'Translations';
        title.style.cssText = 'color:#ccc;font-weight:bold;flex:1;';
        toolbar.appendChild(title);

        // Language selector
        const langLabel = document.createElement('span');
        langLabel.textContent = 'Lang:';
        langLabel.style.color = '#aaa';
        toolbar.appendChild(langLabel);

        const langSel = document.createElement('select');
        langSel.style.cssText = 'background:#2d2d2d;color:#eee;border:1px solid #555;padding:2px 4px;border-radius:3px;';
        for (const l of this._languages) {
            const opt = document.createElement('option');
            opt.value = l;
            opt.textContent = l.toUpperCase();
            if (l === (this._selectedLang ?? this._languages[0])) opt.selected = true;
            langSel.appendChild(opt);
        }
        if (this._languages.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = '— none —';
            langSel.appendChild(opt);
        }
        langSel.onchange = () => { this._selectedLang = langSel.value; };
        toolbar.appendChild(langSel);

        // Add language button
        const btnAddLang = this._makeBtn('+ Lang', '#4caf50', async () => {
            const lang = (prompt('New language code (e.g. az, de, ru):') ?? '').trim().toLowerCase();
            if (!lang) return;
            if (this._languages.includes(lang)) { alert('Already exists'); return; }
            this._languages.push(lang);
            if (!this._data[lang]) this._data[lang] = {};
            this._selectedLang = lang;
            this._render();
        });
        toolbar.appendChild(btnAddLang);

        // Remove language button
        const btnDelLang = this._makeBtn('- Lang', '#f44336', async () => {
            const lang = langSel.value;
            if (!lang) return;
            if (!confirm(`Delete language "${lang}"?`)) return;
            delete this._data[lang];
            this._languages = this._languages.filter(l => l !== lang);
            if (this._selectedLang === lang) this._selectedLang = this._languages[0] ?? null;
            this._render();
        });
        toolbar.appendChild(btnDelLang);

        // Save button
        const btnSave = this._makeBtn('💾 Save', '#2196f3', async () => {
            iobrokerHandler.translations = JSON.parse(JSON.stringify(this._data));
            await iobrokerHandler.saveTranslations();
            btnSave.textContent = '✓ Saved';
            btnSave.style.background = '#4caf50';
            setTimeout(() => { btnSave.textContent = '💾 Save'; btnSave.style.background = '#2196f3'; }, 1500);
        });
        toolbar.appendChild(btnSave);

        this.appendChild(toolbar);

        // ── Add key toolbar ──
        const keyToolbar = document.createElement('div');
        keyToolbar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 8px;background:#252526;border-bottom:1px solid #333;flex-shrink:0;';

        const keyInput = document.createElement('input');
        keyInput.placeholder = 'pid.op  or  valve.open';
        keyInput.style.cssText = 'flex:1;background:#3c3c3c;color:#eee;border:1px solid #555;padding:3px 6px;border-radius:3px;font-size:12px;';
        keyToolbar.appendChild(keyInput);

        const btnAddKey = this._makeBtn('+ Key', '#4caf50', () => {
            const key = keyInput.value.trim();
            if (!key) return;
            if (!/^[a-zA-Z0-9_.]+$/.test(key)) { alert('Only letters, numbers, _ and . allowed'); return; }
            const path = key.split('.');
            for (const lang of this._languages) {
                if (!this._data[lang]) this._data[lang] = {};
                if (this._get(this._data[lang], path) === '') {
                    this._set(this._data[lang], path, '');
                }
            }
            keyInput.value = '';
            this._renderTable(tableWrap);
        });
        keyToolbar.appendChild(btnAddKey);

        const btnDelKey = this._makeBtn('- Key', '#f44336', () => {
            const key = keyInput.value.trim();
            if (!key) return;
            if (!confirm(`Delete key "${key}" from ALL languages?`)) return;
            const path = key.split('.');
            for (const lang of this._languages) {
                this._delete(this._data[lang] ?? {}, path);
            }
            keyInput.value = '';
            this._renderTable(tableWrap);
        });
        keyToolbar.appendChild(btnDelKey);

        // Runtime language switcher
        const rtLabel = document.createElement('span');
        rtLabel.textContent = '|  Runtime:';
        rtLabel.style.cssText = 'color:#888;margin-left:8px;';
        keyToolbar.appendChild(rtLabel);

        const rtSel = document.createElement('select');
        rtSel.style.cssText = 'background:#2d2d2d;color:#eee;border:1px solid #555;padding:2px 4px;border-radius:3px;';
        const buildRtOptions = () => {
            rtSel.innerHTML = '';
            for (const l of this._languages) {
                const opt = document.createElement('option');
                opt.value = l;
                opt.textContent = l.toUpperCase();
                if (l === iobrokerHandler.language) opt.selected = true;
                rtSel.appendChild(opt);
            }
        };
        buildRtOptions();
        rtSel.onchange = () => {
            iobrokerHandler.setLanguage(rtSel.value);
        };
        keyToolbar.appendChild(rtSel);

        this.appendChild(keyToolbar);

        // ── Table wrapper ──
        const tableWrap = document.createElement('div');
        tableWrap.style.cssText = 'flex:1;overflow:auto;background:#1e1e1e;';
        this.appendChild(tableWrap);

        this._renderTable(tableWrap);
    }

    _renderTable(container) {
        container.innerHTML = '';

        const paths = this._getAllPaths();

        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;background:#1e1e1e;';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.cssText = 'background:#2d2d2d;position:sticky;top:0;z-index:1;';

        const thKey = document.createElement('th');
        thKey.textContent = 'Key';
        thKey.style.cssText = 'text-align:left;padding:5px 8px;color:#ccc;border-bottom:1px solid #444;min-width:180px;font-weight:normal;';
        headerRow.appendChild(thKey);

        for (const lang of this._languages) {
            const th = document.createElement('th');
            th.textContent = lang.toUpperCase();
            th.style.cssText = 'text-align:left;padding:5px 8px;color:#ccc;border-bottom:1px solid #444;min-width:120px;font-weight:normal;';
            headerRow.appendChild(th);
        }

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        let prevGroup = null;

        for (const path of paths) {
            const group = path.length > 1 ? path[0] : null;

            // Group separator row
            if (group && group !== prevGroup) {
                const isCollapsed = this._collapsed.has(group);
                const groupRow = document.createElement('tr');
                groupRow.style.cssText = 'background:#1a1a2e;cursor:pointer;user-select:none;';
                groupRow.onmouseenter = () => groupRow.style.background = '#1e2a3a';
                groupRow.onmouseleave = () => groupRow.style.background = '#1a1a2e';
                const groupCell = document.createElement('td');
                groupCell.colSpan = this._languages.length + 1;
                groupCell.textContent = (isCollapsed ? '▸ ' : '▾ ') + group;
                groupCell.style.cssText = 'padding:4px 8px;color:#7c9cbf;font-weight:bold;font-size:12px;letter-spacing:0.5px;';
                groupRow.appendChild(groupCell);
                groupRow.onclick = () => {
                    if (this._collapsed.has(group)) this._collapsed.delete(group);
                    else this._collapsed.add(group);
                    this._renderTable(container);
                };
                tbody.appendChild(groupRow);
                prevGroup = group;
            }

            // skip collapsed group rows
            if (group && this._collapsed.has(group)) continue;

            const row = document.createElement('tr');
            row.style.cssText = 'border-bottom:1px solid #2a2a2a;background:#1e1e1e;';
            row.onmouseenter = () => row.style.background = '#2a2a3a';
            row.onmouseleave = () => row.style.background = '#1e1e1e';

            // Key cell
            const keyCell = document.createElement('td');
            const displayKey = path.length > 1 ? '  · ' + path.slice(1).join('.') : path[0];
            keyCell.textContent = displayKey;
            keyCell.title = path.join('.');
            keyCell.style.cssText = 'padding:3px 8px;color:#d4d4d4;font-family:monospace;font-size:12px;white-space:nowrap;';
            row.appendChild(keyCell);

            // Value cells per language
            for (const lang of this._languages) {
                const td = document.createElement('td');
                td.style.cssText = 'padding:2px 4px;';

                const input = document.createElement('input');
                input.type = 'text';
                input.value = this._get(this._data[lang] ?? {}, path);
                input.style.cssText = 'width:100%;box-sizing:border-box;background:#3c3c3c;color:#eee;border:1px solid transparent;padding:2px 5px;border-radius:2px;font-size:12px;outline:none;';
                input.onfocus = () => input.style.borderColor = '#2196f3';
                input.onblur = () => {
                    input.style.borderColor = 'transparent';
                    if (!this._data[lang]) this._data[lang] = {};
                    this._set(this._data[lang], path, input.value);
                };
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') input.blur();
                };

                td.appendChild(input);
                row.appendChild(td);
            }

            tbody.appendChild(row);
        }

        if (paths.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = this._languages.length + 1;
            emptyCell.textContent = 'No translations yet. Add a language and keys above.';
            emptyCell.style.cssText = 'padding:20px;text-align:center;color:#666;font-style:italic;background:#1e1e1e;';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
        }

        table.appendChild(tbody);
        container.appendChild(table);
    }

    _makeBtn(text, color, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `background:${color};color:#fff;border:none;padding:3px 10px;border-radius:3px;cursor:pointer;font-size:12px;`;
        btn.onmouseenter = () => btn.style.opacity = '0.85';
        btn.onmouseleave = () => btn.style.opacity = '1';
        btn.onclick = onClick;
        return btn;
    }
}

customElements.define(IobrokerWebuiTranslationEditor.is, IobrokerWebuiTranslationEditor);
