import { __decorate } from "tslib";
import { BaseCustomWebComponentConstructorAppend, DomHelper, css, customElement } from "@node-projects/base-custom-webcomponent";
import { iobrokerHandler } from "../common/IobrokerHandler.js";
let TranslateableText = class TranslateableText extends BaseCustomWebComponentConstructorAppend {
    static style = css `
        :host {
            display: inline;
        }

        *[node-projects-hide-at-run-time] {
            display: none !important;
        }`;
    _languageChangedHandler;
    _translationsChangedHandler;
    constructor() {
        super();
        this._restoreCachedInititalValues();
    }
    connectedCallback() {
        this._languageChangedHandler = iobrokerHandler.languageChanged.on(() => this._translate());
        this._translationsChangedHandler = iobrokerHandler.translationsChanged.on(() => this._translate());
        this._translate();
    }
    disconnectedCallback() {
        this._languageChangedHandler.dispose();
        this._translationsChangedHandler.dispose();
    }
    _resolveKey(key, lang) {
        const dict = iobrokerHandler.translations?.[lang];
        if (!dict) return undefined;
        const parts = key.split('.');
        let val = dict;
        for (const part of parts) {
            val = val?.[part];
            if (val === undefined) return undefined;
        }
        return typeof val === 'string' ? val : undefined;
    }
    _translate() {
        const key = (this.textContent ?? '').trim();
        if (!key) return;

        const lang = iobrokerHandler.language || 'en';
        let text = this._resolveKey(key, lang);

        // fallback 1: English
        if (text === undefined && lang !== 'en') {
            text = this._resolveKey(key, 'en');
        }

        // fallback 2: mövcud hər hansı dil
        if (text === undefined) {
            const translations = iobrokerHandler.translations ?? {};
            for (const availLang of Object.keys(translations)) {
                if (availLang === lang || availLang === 'en') continue;
                text = this._resolveKey(key, availLang);
                if (text !== undefined) break;
            }
        }

        // fallback 3: key özü
        if (text === undefined) {
            text = key;
        }

        DomHelper.removeAllChildnodes(this.shadowRoot);
        this.shadowRoot.appendChild(document.createTextNode(text));
    }
};
TranslateableText = __decorate([
    customElement("t-t")
], TranslateableText);
export { TranslateableText };
