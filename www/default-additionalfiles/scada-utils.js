/**
 * SCADA Utility Functions for ioBroker WebUI
 * Global helper functions for value formatting and processing
 * Version: 1.0.0
 */

// ============================================================================
// VALUE FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format numeric value with SCADA functions
 * @param {number|string} value - Raw value to format
 * @param {object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places (0-10), default: 2
 * @param {string} options.roundMode - Rounding mode: 'round', 'floor', 'ceil', default: 'round'
 * @param {number} options.scale - Scale multiplier, default: 1
 * @param {number} options.offset - Offset to add, default: 0
 * @param {number} options.minLimit - Minimum limit
 * @param {number} options.maxLimit - Maximum limit
 * @param {string} options.prefix - Prefix string
 * @param {string} options.suffix - Suffix string
 * @param {string} options.thousandSep - Thousand separator (e.g., ',')
 * @returns {string} Formatted value
 */
window.scadaFormatValue = function(value, options = {}) {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
        return options.nanText || 'NaN';
    }
    
    let numValue = Number(value);
    
    // Apply scaling
    if (options.scale && options.scale !== 1) {
        numValue = numValue * Number(options.scale);
    }
    
    // Apply offset
    if (options.offset && options.offset !== 0) {
        numValue = numValue + Number(options.offset);
    }
    
    // Apply min/max limits
    if (options.minLimit !== undefined && options.minLimit !== null && options.minLimit !== '') {
        const min = Number(options.minLimit);
        if (numValue < min) numValue = min;
    }
    if (options.maxLimit !== undefined && options.maxLimit !== null && options.maxLimit !== '') {
        const max = Number(options.maxLimit);
        if (numValue > max) numValue = max;
    }
    
    // Apply rounding
    let formattedValue;
    const decimals = options.decimals !== undefined ? Number(options.decimals) : 2;
    
    switch(options.roundMode) {
        case 'floor':
            formattedValue = Math.floor(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
            break;
        case 'ceil':
            formattedValue = Math.ceil(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
            break;
        case 'round':
        default:
            formattedValue = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
            break;
    }
    
    // Format to fixed decimals
    let result = formattedValue.toFixed(decimals);
    
    // Add thousand separator if enabled
    if (options.thousandSep) {
        const parts = result.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, options.thousandSep);
        result = parts.join('.');
    }
    
    // Add prefix/suffix
    if (options.prefix) result = options.prefix + result;
    if (options.suffix) result = result + options.suffix;
    
    return result;
};

// ============================================================================
// UNIT CONVERSION FUNCTIONS
// ============================================================================

/**
 * Temperature conversions
 */
window.scadaTempConvert = {
    celsiusToFahrenheit: (c) => (c * 9/5) + 32,
    fahrenheitToCelsius: (f) => (f - 32) * 5/9,
    celsiusToKelvin: (c) => c + 273.15,
    kelvinToCelsius: (k) => k - 273.15,
    fahrenheitToKelvin: (f) => (f - 32) * 5/9 + 273.15,
    kelvinToFahrenheit: (k) => (k - 273.15) * 9/5 + 32
};

/**
 * Pressure conversions
 */
window.scadaPressureConvert = {
    paToBar: (pa) => pa * 0.00001,
    barToPa: (bar) => bar * 100000,
    paToKpa: (pa) => pa * 0.001,
    kpaToPa: (kpa) => kpa * 1000,
    paToMpa: (pa) => pa * 0.000001,
    mpaToPa: (mpa) => mpa * 1000000,
    barToPsi: (bar) => bar * 14.5038,
    psiToBar: (psi) => psi * 0.0689476,
    paToMmHg: (pa) => pa * 0.00750062,
    mmHgToPa: (mmhg) => mmhg * 133.322
};

/**
 * Flow conversions
 */
window.scadaFlowConvert = {
    m3hToLh: (m3h) => m3h * 1000,
    lhToM3h: (lh) => lh * 0.001,
    m3hToLs: (m3h) => m3h * 0.277778,
    lsToM3h: (ls) => ls * 3.6,
    gpmToLs: (gpm) => gpm * 0.0630902,
    lsToGpm: (ls) => ls * 15.8503
};

// ============================================================================
// VALUE SCALING & NORMALIZATION
// ============================================================================

/**
 * Linear scaling (analog input/output)
 * @param {number} value - Input value
 * @param {number} inMin - Input minimum
 * @param {number} inMax - Input maximum
 * @param {number} outMin - Output minimum
 * @param {number} outMax - Output maximum
 * @returns {number} Scaled value
 */
window.scadaLinearScale = function(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Normalize value to 0-100%
 * @param {number} value - Input value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Percentage (0-100)
 */
window.scadaNormalize = function(value, min, max) {
    return ((value - min) / (max - min)) * 100;
};

/**
 * Denormalize percentage to actual value
 * @param {number} percent - Percentage (0-100)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Actual value
 */
window.scadaDenormalize = function(percent, min, max) {
    return (percent / 100) * (max - min) + min;
};

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Calculate average of array
 * @param {number[]} values - Array of numbers
 * @returns {number} Average
 */
window.scadaAverage = function(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + Number(val), 0);
    return sum / values.length;
};

/**
 * Calculate moving average
 * @param {number[]} values - Array of numbers
 * @param {number} period - Period for moving average
 * @returns {number} Moving average
 */
window.scadaMovingAverage = function(values, period) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const slice = values.slice(-period);
    return window.scadaAverage(slice);
};

/**
 * Calculate min, max, average of values
 * @param {number[]} values - Array of numbers
 * @returns {object} {min, max, avg}
 */
window.scadaStats = function(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return { min: 0, max: 0, avg: 0 };
    }
    const numValues = values.map(v => Number(v));
    return {
        min: Math.min(...numValues),
        max: Math.max(...numValues),
        avg: window.scadaAverage(numValues)
    };
};

// ============================================================================
// LIMIT & ALARM FUNCTIONS
// ============================================================================

/**
 * Check if value is in alarm state
 * @param {number} value - Current value
 * @param {object} limits - Alarm limits
 * @param {number} limits.hihi - High-high alarm
 * @param {number} limits.hi - High alarm
 * @param {number} limits.lo - Low alarm
 * @param {number} limits.lolo - Low-low alarm
 * @returns {string} Alarm state: 'hihi', 'hi', 'lo', 'lolo', 'normal'
 */
window.scadaCheckAlarm = function(value, limits) {
    const val = Number(value);
    if (limits.hihi !== undefined && val >= limits.hihi) return 'hihi';
    if (limits.hi !== undefined && val >= limits.hi) return 'hi';
    if (limits.lolo !== undefined && val <= limits.lolo) return 'lolo';
    if (limits.lo !== undefined && val <= limits.lo) return 'lo';
    return 'normal';
};

/**
 * Get alarm color based on state
 * @param {string} alarmState - Alarm state from scadaCheckAlarm
 * @returns {string} Color code
 */
window.scadaAlarmColor = function(alarmState) {
    const colors = {
        'hihi': '#d63031',    // Red
        'hi': '#ff7675',      // Light red
        'lo': '#fdcb6e',      // Yellow
        'lolo': '#e17055',    // Orange
        'normal': '#00b894'   // Green
    };
    return colors[alarmState] || colors.normal;
};

// ============================================================================
// DEADBAND & HYSTERESIS
// ============================================================================

/**
 * Apply deadband to value changes
 * @param {number} newValue - New value
 * @param {number} oldValue - Previous value
 * @param {number} deadband - Deadband threshold
 * @returns {boolean} True if change exceeds deadband
 */
window.scadaDeadband = function(newValue, oldValue, deadband) {
    return Math.abs(newValue - oldValue) > deadband;
};

/**
 * Hysteresis comparator
 * @param {number} value - Current value
 * @param {number} setpoint - Setpoint
 * @param {number} hysteresis - Hysteresis value
 * @param {boolean} currentState - Current output state
 * @returns {boolean} New output state
 */
window.scadaHysteresis = function(value, setpoint, hysteresis, currentState) {
    if (currentState) {
        return value > (setpoint - hysteresis);
    } else {
        return value > (setpoint + hysteresis);
    }
};

// ============================================================================
// TIME FUNCTIONS
// ============================================================================

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Unix timestamp
 * @param {string} format - Format string (default: 'DD.MM.YYYY HH:mm:ss')
 * @returns {string} Formatted time
 */
window.scadaFormatTime = function(timestamp, format = 'DD.MM.YYYY HH:mm:ss') {
    const date = new Date(timestamp);
    const pad = (n) => String(n).padStart(2, '0');
    
    const replacements = {
        'YYYY': date.getFullYear(),
        'MM': pad(date.getMonth() + 1),
        'DD': pad(date.getDate()),
        'HH': pad(date.getHours()),
        'mm': pad(date.getMinutes()),
        'ss': pad(date.getSeconds())
    };
    
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => replacements[match]);
};

/**
 * Calculate time difference in human readable format
 * @param {number} timestamp - Past timestamp
 * @returns {string} Time difference (e.g., "5 minutes ago")
 */
window.scadaTimeAgo = function(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'just now';
};

// ============================================================================
// BOOLEAN HELPERS
// ============================================================================

/**
 * Convert various values to boolean
 * @param {*} value - Value to convert
 * @returns {boolean}
 */
window.scadaToBoolean = function(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' || lower === 'on' || lower === 'yes';
    }
    return Boolean(value);
};

/**
 * Toggle boolean value
 * @param {boolean} value - Current value
 * @returns {boolean} Toggled value
 */
window.scadaToggle = function(value) {
    return !window.scadaToBoolean(value);
};

// ============================================================================
// Export for ES6 modules (optional)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatValue: window.scadaFormatValue,
        tempConvert: window.scadaTempConvert,
        pressureConvert: window.scadaPressureConvert,
        flowConvert: window.scadaFlowConvert,
        linearScale: window.scadaLinearScale,
        normalize: window.scadaNormalize,
        denormalize: window.scadaDenormalize,
        average: window.scadaAverage,
        movingAverage: window.scadaMovingAverage,
        stats: window.scadaStats,
        checkAlarm: window.scadaCheckAlarm,
        alarmColor: window.scadaAlarmColor,
        deadband: window.scadaDeadband,
        hysteresis: window.scadaHysteresis,
        formatTime: window.scadaFormatTime,
        timeAgo: window.scadaTimeAgo,
        toBoolean: window.scadaToBoolean,
        toggle: window.scadaToggle
    };
}

console.log('✅ SCADA Utility Functions loaded successfully!');
