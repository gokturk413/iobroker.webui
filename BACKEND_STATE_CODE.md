# Backend State Code

## 📝 src-original/backend/main.js-ə əlavə edin:

### Location: main() metodunda, license validation-dan SONRA

```javascript
async main() {
    this.log.info(`dirName: ` + __dirname);
    
    // ... (license validation code) ...
    
    // ========================================
    // LICENSE STATE FOR FRONTEND - gokturk413
    // ========================================
    
    // Create license state for frontend validation
    try {
        await this.setStateAsync('license.valid', {
            val: validation.valid,
            ack: true
        });
        
        await this.setStateAsync('license.hardwareId', {
            val: validation.hardwareId,
            ack: true
        });
        
        this.log.info('License state created for frontend validation');
    } catch (err) {
        this.log.error('Failed to create license state: ' + err.message);
    }
    
    // ========================================
    
    await this.setState(this._stateNpm, { val: 'idle', ack: true });
    await this.subscribeStatesAsync('*', {});
    this.log.info(`adapter ready`);
}
```

---

## 🔧 Dəqiq əlavə etmə yeri:

### Əvvəl:
```javascript
this.log.info('✅ LICENSE VALIDATED SUCCESSFULLY');
// ...
this.log.info('========================================');
// ========================================

await this.setState(this._stateNpm, { val: 'idle', ack: true });  // ← BURDAN ƏVVƏL
```

### Sonra:
```javascript
this.log.info('========================================');
// ========================================

// STATE YARATMA KOD BURAYA ←
await this.setStateAsync('license.valid', {
    val: validation.valid,
    ack: true
});

await this.setStateAsync('license.hardwareId', {
    val: validation.hardwareId,
    ack: true
});

await this.setState(this._stateNpm, { val: 'idle', ack: true });
```

---

## ⚡ Sonra run edin:

```bash
npm run obfuscate-all
git add .
git commit -m "Add backend license state for frontend validation"
git push
```

---

## 🎯 Bu nə edir?

1. Backend license yoxlayır
2. **State yaradır:**
   - `webui.0.license.valid` = `true` və ya `false`
   - `webui.0.license.hardwareId` = `"abc123..."`
3. Frontend bu state-i oxuyur
4. State `true` olarsa → Editor açılır ✅
5. State `false` olarsa → Editor block olur 🔒
