# SCADA Utility Functions - İstifadə Təlimatı

## 🔧 Quraşdırma

### 1. WebUI-də Additional Files əlavə edin

ioBroker WebUI → Settings → Additional Files → scada-utils.js faylını əlavə edin

### 2. Project-də İstinad Edin

WebUI-nin HTML head bölməsinə və ya hər hansı screen-də:

```html
<script src="/webui.0/scada-utils.js"></script>
```

Və ya WebUI config.json-da global olaraq əlavə edin.

---

## 📊 Əsas Funksiyalar

### 1. scadaFormatValue() - Dəyər Formatlaşdırma

**Sintaksis:**
```javascript
scadaFormatValue(value, options)
```

**Parametrlər:**
- `decimals` - Onluq nöqtə (0-10)
- `roundMode` - 'round', 'floor', 'ceil'
- `scale` - Miqyas əmsalı
- `offset` - Əlavə dəyər
- `minLimit` - Minimum limit
- `maxLimit` - Maksimum limit
- `prefix` - Önə əlavə
- `suffix` - Sona əlavə
- `thousandSep` - Minlik ayırıcı

**Nümunələr:**

```javascript
// Temperatur göstərişi
scadaFormatValue(23.456, {
    decimals: 1,
    suffix: ' °C'
})
// Nəticə: "23.5 °C"

// Təzyiq (Pa-dan Bar-a)
scadaFormatValue(101325, {
    scale: 0.00001,
    decimals: 3,
    suffix: ' bar'
})
// Nəticə: "1.013 bar"

// Pul formatı
scadaFormatValue(1234567.89, {
    decimals: 2,
    prefix: '$',
    thousandSep: ','
})
// Nəticə: "$1,234,567.89"

// Faiz (limitli)
scadaFormatValue(125, {
    maxLimit: 100,
    decimals: 0,
    suffix: '%'
})
// Nəticə: "100%"

// Floor yuvarlaqlaşdırma
scadaFormatValue(99.99, {
    roundMode: 'floor',
    decimals: 1
})
// Nəticə: "99.9"
```

---

### 2. Temperatur Çevirmələri

```javascript
// Celsius → Fahrenheit
scadaTempConvert.celsiusToFahrenheit(25)  // 77

// Fahrenheit → Celsius
scadaTempConvert.fahrenheitToCelsius(77)  // 25

// Celsius → Kelvin
scadaTempConvert.celsiusToKelvin(25)  // 298.15

// Kelvin → Celsius
scadaTempConvert.kelvinToCelsius(298.15)  // 25

// Fahrenheit → Kelvin
scadaTempConvert.fahrenheitToKelvin(77)  // 298.15

// Kelvin → Fahrenheit
scadaTempConvert.kelvinToFahrenheit(298.15)  // 77
```

---

### 3. Təzyiq Çevirmələri

```javascript
// Pascal → Bar
scadaPressureConvert.paToBar(100000)  // 1

// Bar → Pascal
scadaPressureConvert.barToPa(1)  // 100000

// Pascal → kPa
scadaPressureConvert.paToKpa(100000)  // 100

// kPa → Pascal
scadaPressureConvert.kpaToPa(100)  // 100000

// Bar → PSI
scadaPressureConvert.barToPsi(1)  // 14.5038

// PSI → Bar
scadaPressureConvert.psiToBar(14.5038)  // 1

// Pascal → mm Hg
scadaPressureConvert.paToMmHg(101325)  // 760

// mm Hg → Pascal
scadaPressureConvert.mmHgToPa(760)  // 101325
```

---

### 4. Axın Çevirmələri

```javascript
// m³/h → L/h
scadaFlowConvert.m3hToLh(1)  // 1000

// L/h → m³/h
scadaFlowConvert.lhToM3h(1000)  // 1

// m³/h → L/s
scadaFlowConvert.m3hToLs(3.6)  // 1

// GPM → L/s
scadaFlowConvert.gpmToLs(15.8503)  // 1
```

---

### 5. Linear Scaling (Analog Siqnallar)

```javascript
// 4-20mA siqnalı 0-100% çevirmək
scadaLinearScale(12, 4, 20, 0, 100)  // 50%

// 0-10V siqnalı 0-1000 L/h çevirmək
scadaLinearScale(5, 0, 10, 0, 1000)  // 500 L/h

// RTD 0-100°C çevirmək (100-200Ω)
scadaLinearScale(150, 100, 200, 0, 100)  // 50°C
```

---

### 6. Normalize / Denormalize

```javascript
// Dəyəri 0-100% normalize etmək
scadaNormalize(50, 0, 100)  // 50%
scadaNormalize(75, 0, 150)  // 50%

// Faizi dəyərə çevirmək
scadaDenormalize(50, 0, 100)  // 50
scadaDenormalize(50, 0, 200)  // 100
```

---

### 7. Statistik Funksiyalar

```javascript
// Ortalama
scadaAverage([10, 20, 30, 40, 50])  // 30

// Hərəkətli ortalama (son 5 dəyər)
const values = [10, 15, 20, 25, 30, 35, 40];
scadaMovingAverage(values, 5)  // 32 (30+35+40+25+20)/5

// Min, Max, Average
scadaStats([10, 20, 30, 40, 50])
// { min: 10, max: 50, avg: 30 }
```

---

### 8. Alarm Yoxlaması

```javascript
// Alarm limitləri
const limits = {
    hihi: 90,    // Çox yüksək alarm
    hi: 80,      // Yüksək alarm
    lo: 20,      // Aşağı alarm
    lolo: 10     // Çox aşağı alarm
};

// Dəyər yoxlanışı
scadaCheckAlarm(95, limits)   // 'hihi'
scadaCheckAlarm(85, limits)   // 'hi'
scadaCheckAlarm(50, limits)   // 'normal'
scadaCheckAlarm(15, limits)   // 'lo'
scadaCheckAlarm(5, limits)    // 'lolo'

// Alarm rəngi
scadaAlarmColor('hihi')    // '#d63031' (qırmızı)
scadaAlarmColor('hi')      // '#ff7675' (açıq qırmızı)
scadaAlarmColor('normal')  // '#00b894' (yaşıl)
scadaAlarmColor('lo')      // '#fdcb6e' (sarı)
scadaAlarmColor('lolo')    // '#e17055' (narıncı)
```

---

### 9. Deadband & Hysteresis

```javascript
// Deadband - kiçik dəyişiklikləri bloklamaq
scadaDeadband(50.1, 50, 0.5)  // false (dəyişiklik 0.5-dən kiçik)
scadaDeadband(51, 50, 0.5)    // true (dəyişiklik 0.5-dən böyük)

// Hysteresis - relə idarəetməsi
let heaterOn = false;
let temp = 22;
let setpoint = 20;
let hysteresis = 2;

heaterOn = scadaHysteresis(temp, setpoint, hysteresis, heaterOn);
// temp=22, heaterOn açılacaq (22 > 20+2)
```

---

### 10. Vaxt Funksiyaları

```javascript
// Timestamp formatlaşdırma
scadaFormatTime(Date.now())
// "07.03.2026 09:48:44"

scadaFormatTime(Date.now(), 'DD/MM/YYYY')
// "07/03/2026"

scadaFormatTime(Date.now(), 'HH:mm:ss')
// "09:48:44"

// Neçə vaxt əvvəl
scadaTimeAgo(Date.now() - 300000)  // "5 minutes ago"
scadaTimeAgo(Date.now() - 3600000) // "1 hour ago"
scadaTimeAgo(Date.now() - 86400000) // "1 day ago"
```

---

### 11. Boolean Helper-lər

```javascript
// Müxtəlif tipləri boolean-a çevirmək
scadaToBoolean(1)        // true
scadaToBoolean(0)        // false
scadaToBoolean('true')   // true
scadaToBoolean('false')  // false
scadaToBoolean('on')     // true
scadaToBoolean('off')    // false
scadaToBoolean(5)        // true

// Toggle
scadaToggle(true)   // false
scadaToggle(false)  // true
scadaToggle('on')   // false
```

---

## 🎨 Custom Control-da İstifadə

### Nümunə 1: Temperature Display

```javascript
export function init(instance) {
    instance._assignEvent('temperature-changed', () => {
        const tempEl = instance._getDomElement('temp-display');
        const rawTemp = instance.temperature;
        
        // Format with SCADA functions
        const formatted = scadaFormatValue(rawTemp, {
            decimals: 1,
            suffix: ' °C',
            roundMode: 'round'
        });
        
        tempEl.textContent = formatted;
        
        // Check alarm
        const alarmState = scadaCheckAlarm(rawTemp, {
            hihi: 85,
            hi: 75,
            lo: 15,
            lolo: 5
        });
        
        // Set color
        tempEl.style.color = scadaAlarmColor(alarmState);
    });
}
```

### Nümunə 2: Pressure with Unit Conversion

```javascript
export function init(instance) {
    instance._assignEvent('pressure-changed', () => {
        const pressureEl = instance._getDomElement('pressure-display');
        const pressurePa = instance.pressure; // Pascal-da gəlir
        
        // Bar-a çevir və format et
        const pressureBar = scadaPressureConvert.paToBar(pressurePa);
        
        const formatted = scadaFormatValue(pressureBar, {
            decimals: 3,
            suffix: ' bar'
        });
        
        pressureEl.textContent = formatted;
    });
}
```

### Nümunə 3: Flow with Moving Average

```javascript
let flowHistory = [];

export function init(instance) {
    instance._assignEvent('flow-changed', () => {
        const flowEl = instance._getDomElement('flow-display');
        const avgFlowEl = instance._getDomElement('avg-flow-display');
        const currentFlow = instance.flow;
        
        // Add to history
        flowHistory.push(currentFlow);
        if (flowHistory.length > 10) flowHistory.shift(); // Keep last 10
        
        // Display current
        flowEl.textContent = scadaFormatValue(currentFlow, {
            decimals: 2,
            suffix: ' m³/h'
        });
        
        // Display moving average
        const avgFlow = scadaMovingAverage(flowHistory, 5);
        avgFlowEl.textContent = scadaFormatValue(avgFlow, {
            decimals: 2,
            suffix: ' m³/h',
            prefix: 'Avg: '
        });
    });
}
```

---

## 📝 Formula-da İstifadə

WebUI formula field-lərində birbaşa istifadə edə bilərsiniz:

```javascript
// Temperatur formatlaşdırma
scadaFormatValue(temperature, {decimals: 1, suffix: ' °C'})

// Təzyiq çevirmə
scadaFormatValue(scadaPressureConvert.paToBar(pressure), {decimals: 2, suffix: ' bar'})

// Alarm rəngi
scadaAlarmColor(scadaCheckAlarm(temperature, {hi: 80, lo: 20}))

// Normalize
scadaNormalize(tankLevel, 0, 5000)
```

---

## 🎯 Praktik Nümunələr

### Tank Level Display

```javascript
const tankHeight = 5; // meters
const levelSensor = 2.5; // meters (0-5m)

const percentage = scadaNormalize(levelSensor, 0, tankHeight);
const formatted = scadaFormatValue(percentage, {
    decimals: 1,
    suffix: '%'
});
// "50.0%"
```

### Analog Input Scaling (4-20mA)

```javascript
const currentMa = 12; // 4-20mA siqnal
const scaledValue = scadaLinearScale(currentMa, 4, 20, 0, 100);
// 50 (50% və ya istənilən vahid)
```

### Energy Consumption

```javascript
const powerKw = 1234.567;
const formatted = scadaFormatValue(powerKw, {
    decimals: 2,
    thousandSep: ',',
    suffix: ' kW'
});
// "1,234.57 kW"
```

---

## ⚙️ Qeydlər

1. **Global Access**: Bütün funksiyalar `window` obyektində mövcuddur
2. **Performance**: Funksiyalar optimize edilmişdir və real-time istifadə üçün uyğundur
3. **Compatibility**: Modern brauzerlərlə (ES6+) uyğundur
4. **Error Handling**: NaN və null dəyərlər düzgün idarə edilir

---

## 🚀 Tövsiyələr

1. **Custom Control-larda** formatValue funksiyasını istifadə edin
2. **Formula field-lərində** çevirmə funksiyalarını istifadə edin
3. **Alarm sistemləri** üçün checkAlarm və alarmColor istifadə edin
4. **Trend analysis** üçün movingAverage və stats istifadə edin
5. **Unit conversion** üçün hazır çevirmə funksiyalarını istifadə edin

---

**Suallarınız olarsa bildirin! 🎉**
