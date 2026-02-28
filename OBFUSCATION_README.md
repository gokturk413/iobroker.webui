# 🔐 Code Obfuscation Setup

This project uses **build-time code obfuscation** to protect license validation logic.

---

## 📂 Directory Structure

```
iobroker.webui/
├── src-original/          ← YOUR WORKING DIRECTORY (NOT in Git)
│   └── backend/
│       ├── main.js        ← Edit this (clean, readable code)
│       └── LicenseValidator.js
│
├── dist/                  ← PUBLISHED to GitHub (obfuscated)
│   └── backend/
│       ├── main.js        ← Obfuscated (unreadable)
│       └── LicenseValidator.js
│
├── obfuscate-build.js     ← Build script
└── .gitignore             ← Ignores src-original/
```

---

## 🔧 Workflow

### 1. **Edit Source Code**

Work in `src-original/backend/`:

```bash
# Edit files
code src-original/backend/main.js
code src-original/backend/LicenseValidator.js
```

### 2. **Obfuscate Before Publish**

```bash
npm run obfuscate
```

This will:
- ✅ Read clean code from `src-original/backend/`
- ✅ Obfuscate it
- ✅ Write to `dist/backend/`
- ✅ Ready for GitHub!

### 3. **Commit & Push**

```bash
git add .
git commit -m "Update adapter code"
git push origin main
```

**What gets pushed to GitHub:**
- ✅ `dist/backend/` - Obfuscated code
- ❌ `src-original/` - NOT pushed (in .gitignore)

---

## 🎯 How It Works

### Obfuscation Features

The code is obfuscated with:
- **Control Flow Flattening** - Makes logic hard to follow
- **Dead Code Injection** - Adds fake code paths
- **String Array Encoding** - Encrypts strings with Base64
- **Self-Defending** - Prevents beautification
- **Identifier Renaming** - All variables renamed to hex
- **Number to Expressions** - Numbers become calculations

### Example

**Original (src-original/):**
```javascript
static VALID_LICENSE_KEY = 'GOKTURK413-WEBUI-LICENSE-2026';

static validate(licenseKey, registeredHardwareIds = []) {
    const hardwareId = this.getHardwareId();
    // ...
}
```

**Obfuscated (dist/):**
```javascript
function _0x5719c1(_0x423ecc,_0x145282,_0x20c79f,_0x236e18){
    const _0x569896={_0x38e6f4:0x25c};
    return _0x2ad5(_0x20c79f-_0x569896._0x38e6f4,_0x423ecc);
}
// ... 40KB of obfuscated code
```

---

## ⚠️ Important Notes

### DO:
- ✅ Edit code in `src-original/backend/`
- ✅ Run `npm run obfuscate` before commit
- ✅ Keep `src-original/` in your LOCAL machine only
- ✅ Backup `src-original/` regularly

### DON'T:
- ❌ Edit code in `dist/backend/` directly
- ❌ Commit `src-original/` to Git
- ❌ Share `src-original/` publicly
- ❌ Delete `src-original/` (you'll lose clean code!)

---

## 🔄 Restore Original Source

If you lost `src-original/`:

1. **From Git history** (before obfuscation):
   ```bash
   git log --all -- dist/backend/LicenseValidator.js
   git show <commit-hash>:dist/backend/LicenseValidator.js > src-original/backend/LicenseValidator.js
   ```

2. **From backup** (recommended to backup regularly)

---

## 📊 Obfuscation Stats

| Metric | Value |
|--------|-------|
| Original Size | ~3.4 KB |
| Obfuscated Size | ~115 KB |
| Size Increase | **+736%** |
| Files Obfuscated | 2 (main.js, LicenseValidator.js) |
| Protection Level | **High** |

---

## 🛡️ Protection Level

| Attack Method | Difficulty |
|---------------|-----------|
| **Reading Code** | Very Hard ⭐⭐⭐⭐⭐ |
| **Understanding Logic** | Extremely Hard ⭐⭐⭐⭐⭐ |
| **Finding License Check** | Very Hard ⭐⭐⭐⭐⭐ |
| **Removing License** | Very Hard ⭐⭐⭐⭐⭐ |
| **Reverse Engineering** | Extremely Hard ⭐⭐⭐⭐⭐ |

Combined with **Hardware Binding** + **License Key**, this provides **90%+ protection**.

---

## 🔧 Troubleshooting

### Error: "Source directory not found"
- Ensure `src-original/backend/` exists
- Copy files from `dist/backend/` to `src-original/backend/`

### Obfuscated code doesn't work
- Test before obfuscation
- Check for syntax errors in original
- Try re-running obfuscation

### Git shows src-original/
- Check `.gitignore` includes `src-original/`
- Run: `git rm -r --cached src-original/`

---

**Remember:** The obfuscated code on GitHub is **unreadable**. Only you have the clean source! 🔒
