# SCADA Utility Functions - Setup Guide

Bu paket SCADA utility funksiyaları ilə gəlir. Bu funksiyalar WebUI-də global olaraq istifadə edilə bilər.

## ✅ Avtomatik Quraşdırma (Təvsiyə Edilir)

**Heç bir əməliyyat lazım deyil!** 

Adapter install olunduqda (npm və ya GitHub-dan) SCADA funksiyaları avtomatik olaraq quraşdırılır:

```bash
# Adapter install zamanı avtomatik çalışır
npm install iobroker.webui
# və ya
iobroker install gokturk413/iobroker.webui
```

`postinstall` hook avtomatik olaraq SCADA funksiyalarını iobroker-data qovluğuna kopyalayır.

### Manual Quraşdırma (Lazım olduqda)

Əgər avtomatik quraşdırma işləməsə:

**Node.js ilə:**
```bash
npm run setup-scada
```

**Əl ilə kopyalama:**

1. Aşağıdakı faylları tapın:
   - `www/default-additionalfiles/scada-utils.js`
   - `www/default-additionalfiles/SCADA_UTILS_GUIDE_AZ.md`

2. Bu faylları iobroker-data qovluğuna kopyalayın:
   - Məqsəd: `{iobroker-data}/files/webui.0.data/config/additionalfiles/`

3. WebUI-də Settings → Additional Files bölməsinə keçin və faylların göründüyünü yoxlayın.

## 📖 İstifadə

SCADA funksiyaları quraşdırıldıqdan sonra avtomatik olaraq yüklənir və global istifadə edilə bilər:

```javascript
// Custom Control-da
const formatted = scadaFormatValue(temperature, {
    decimals: 1,
    suffix: ' °C'
});

// Formula-da
scadaFormatValue(pressure, {decimals: 2, suffix: ' bar'})
```

Tam təlimatlar üçün `SCADA_UTILS_GUIDE_AZ.md` faylına baxın.

## ✅ Quraşdırmanın Yoxlanması

WebUI runtime-da browser console-da bu əmri icra edin:

```javascript
console.log(typeof scadaFormatValue); // "function" olmalıdır
```

## 🔄 Yeniləmə

Adapter yeniləndikdə SCADA funksiyaları da yenilənir. Dəyişiklikləri görmək üçün browser cache-ni təmizləyin.

## 📝 Qeydlər

- SCADA funksiyaları `window` obyektində global olaraq mövcuddur
- Bütün Custom Control və Screen-lərdə istifadə edilə bilər
- Formula field-lərində də istifadə edilə bilər
- Funksiyalar real-time SCADA tətbiqləri üçün optimize edilmişdir

---

**Suallar üçün: GitHub Issues və ya documentation**
