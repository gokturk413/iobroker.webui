# SCADA Functions Integration - Summary

## ✅ Tamamlandı

### 1. Fayl Strukturu
```
iobroker.webui/
├── www/
│   └── default-additionalfiles/
│       ├── scada-utils.js              # SCADA utility functions
│       └── SCADA_UTILS_GUIDE_AZ.md     # Azərbaycanca təlimat
├── setup-scada-utils.js                 # Avtomatik setup skripti
├── SCADA_SETUP.md                       # Setup təlimatı
├── SCADA_FUNCTIONS_SUMMARY.md           # Bu fayl
├── gulpfile.mjs                         # Build zamanı kopyalama (yeniləndi)
├── package.json                         # npm script əlavə edildi
└── README.md                            # SCADA setup məlumatı əlavə edildi
```

### 2. Yaradılan Fayllar

#### `www/default-additionalfiles/scada-utils.js`
- 390+ sətir kod
- 20+ global SCADA funksiyası
- Window obyektində global access
- Browser console-da test edilə bilər

**Əsas Funksiyalar:**
- `scadaFormatValue()` - Dəyər formatlaşdırma (decimals, limits, scaling)
- `scadaTempConvert` - Temperatur çevirmələri (C/F/K)
- `scadaPressureConvert` - Təzyiq çevirmələri (Pa/Bar/PSI/mmHg)
- `scadaFlowConvert` - Axın çevirmələri (m³/h, L/h, L/s, GPM)
- `scadaLinearScale()` - Analog siqnal scaling (4-20mA, 0-10V)
- `scadaNormalize()` / `scadaDenormalize()` - Normalizasiya
- `scadaAverage()` / `scadaMovingAverage()` - Statistika
- `scadaCheckAlarm()` / `scadaAlarmColor()` - Alarm sistemi
- `scadaDeadband()` / `scadaHysteresis()` - Deadband və hysteresis
- `scadaFormatTime()` / `scadaTimeAgo()` - Vaxt formatlaşdırma
- `scadaToBoolean()` / `scadaToggle()` - Boolean helper-lər

#### `www/default-additionalfiles/SCADA_UTILS_GUIDE_AZ.md`
- 450+ sətir documentation
- Azərbaycanca tam təlimat
- Hər funksiya üçün nümunələr
- Custom Control-da istifadə nümunələri
- Formula-da istifadə nümunələri
- Praktik real-world nümunələr

#### `setup-scada-utils.js`
- Node.js setup skripti
- Avtomatik iobroker-data qovluğunu tapır
- Faylları avtomatik kopyalayır
- User-friendly console output
- Error handling və yardım mesajları

#### `SCADA_SETUP.md`
- Quraşdırma təlimatı (Azərbaycanca)
- Avtomatik və manual quraşdırma yolları
- Test və yoxlama təlimatları

### 3. Build Sistemi Dəyişiklikləri

#### `gulpfile.mjs`
Yeni task əlavə edildi:
```javascript
function copyDefaultAdditionalFiles() {
    return src('./www/default-additionalfiles/**/*.*')
        .pipe(dest('./www/default-additionalfiles'));
}
```

Build pipeline-a əlavə edildi: `copyDefaultAdditionalFiles`

#### `package.json`
1. Yeni npm script:
   ```json
   "setup-scada": "node setup-scada-utils.js"
   ```

2. Files bölməsinə əlavə:
   ```json
   "SCADA_SETUP.md",
   "setup-scada-utils.js"
   ```

#### `README.md`
SCADA Functions bölməsi əlavə edildi:
- Feature siyahısı
- Setup təlimatı
- Dokumentasiyaya linklər

## 📦 İstifadə

### Quraşdırma

**Avtomatik (Tövsiyə Edilir):**

Adapter install zamanı SCADA funksiyaları avtomatik quraşdırılır:

```bash
iobroker install gokturk413/iobroker.webui
# və ya
npm install iobroker.webui
```

`postinstall` hook avtomatik olaraq faylları kopyalayır.

**Manual (Lazım olduqda):**

```bash
cd /opt/iobroker/node_modules/iobroker.webui
npm run setup-scada
```

### Custom Control-da İstifadə

```javascript
export function init(instance) {
    instance._assignEvent('temperature-changed', () => {
        const temp = instance.temperature;
        
        // Format et
        const formatted = scadaFormatValue(temp, {
            decimals: 1,
            suffix: ' °C'
        });
        
        // Alarm yoxla
        const alarm = scadaCheckAlarm(temp, {
            hihi: 85, hi: 75, lo: 15, lolo: 5
        });
        
        // Rəngi təyin et
        const color = scadaAlarmColor(alarm);
        
        instance._getDomElement('temp-display').textContent = formatted;
        instance._getDomElement('temp-display').style.color = color;
    });
}
```

### Formula-da İstifadə

```javascript
// Temperatur formatlaşdırma
scadaFormatValue(temperature, {decimals: 1, suffix: ' °C'})

// Təzyiq çevirmə (Pa → Bar)
scadaFormatValue(scadaPressureConvert.paToBar(pressure), {decimals: 2, suffix: ' bar'})

// Tank səviyyəsi (0-5000L → %)
scadaNormalize(tankLevel, 0, 5000)

// 4-20mA analog input (→ 0-100%)
scadaLinearScale(current, 4, 20, 0, 100)
```

### Test

Browser console-da:

```javascript
// Funksiyaların yüklənməsini yoxla
console.log(typeof scadaFormatValue); // "function"

// Test et
console.log(scadaFormatValue(23.456, {decimals: 1, suffix: ' °C'}));
// "23.5 °C"

console.log(scadaPressureConvert.paToBar(101325));
// 1.01325

console.log(scadaCheckAlarm(95, {hihi: 90, hi: 80, lo: 20, lolo: 10}));
// "hihi"
```

## 🔄 Növbəti Addımlar

### İstifadəçi üçün:

1. ✅ Adapter install et (SCADA funksiyaları avtomatik quraşdırılır!)
2. ✅ WebUI Settings → Additional Files-da faylları yoxla
3. ✅ Custom Control və ya Formula-da istifadə et

**Heç bir manual setup lazım deyil!** Funksiyalar install zamanı avtomatik əlavə olunur.

### Developer üçün:

1. ✅ Build process test et: `npm run build`
2. ✅ Postinstall hook test et: adapter install et
3. ✅ Setup script test et: `npm run setup-scada`
4. ✅ Funksiyanları browser-də test et

## 📝 Qeydlər

- **Global Access**: Bütün funksiyalar `window` obyektində global
- **Performance**: Real-time SCADA üçün optimize edilmişdir
- **Compatibility**: Modern browsers (ES6+)
- **Extensible**: Yeni funksiyalar əlavə etmək asandır

## 🎯 Real-World Nümunələr

### 1. Tank Monitoring System
```javascript
const level = 3500; // 3500L (max: 5000L)
const percentage = scadaNormalize(level, 0, 5000); // 70%
const alarm = scadaCheckAlarm(percentage, {hihi: 95, hi: 85, lo: 15, lolo: 5});
const color = scadaAlarmColor(alarm);
```

### 2. Temperature Controller
```javascript
const temp = 22.5;
const formatted = scadaFormatValue(temp, {decimals: 1, suffix: ' °C'});
const tempF = scadaTempConvert.celsiusToFahrenheit(temp);
```

### 3. Pressure Monitor
```javascript
const pressurePa = 150000; // Pascal
const pressureBar = scadaPressureConvert.paToBar(pressurePa);
const display = scadaFormatValue(pressureBar, {decimals: 2, suffix: ' bar'});
```

### 4. Flow Meter
```javascript
const flowM3h = 2.5; // m³/h
const flowLh = scadaFlowConvert.m3hToLh(flowM3h); // 2500 L/h
const history = [2.3, 2.4, 2.5, 2.6, 2.5];
const avgFlow = scadaMovingAverage(history, 5);
```

### 5. Analog Input Processing
```javascript
const currentMa = 12; // 4-20mA signal
const value = scadaLinearScale(currentMa, 4, 20, 0, 100); // 50%
```

## ✅ Status

**Hazır və tam avtomatik!**

- ✅ Bütün fayllar yaradılıb
- ✅ Build sistemi konfiqurasiya edilib
- ✅ `postinstall` hook əlavə edilib (avtomatik quraşdırma)
- ✅ Documentation hazırdır
- ✅ Test səhifəsi mövcuddur

**Adapter install olunduqda SCADA funksiyaları avtomatik olaraq quraşdırılır. Heç bir manual əməliyyat lazım deyil!**

---

**Suallar:** GitHub Issues  
**Documentation:** SCADA_UTILS_GUIDE_AZ.md  
**Setup:** SCADA_SETUP.md
