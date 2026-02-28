import * as os from 'os';
import * as crypto from 'crypto';

export class LicenseValidator {
    static VALID_LICENSE_KEY = 'GOKTURK413-WEBUI-LICENSE-2026';

    /**
     * Generate unique hardware ID based on system information
     */
    static getHardwareId() {
        try {
            const networkInterfaces = os.networkInterfaces();
            const macs = [];
            
            // Get all MAC addresses
            for (const interfaceName in networkInterfaces) {
                const interfaces = networkInterfaces[interfaceName];
                if (interfaces) {
                    for (const iface of interfaces) {
                        if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                            macs.push(iface.mac);
                        }
                    }
                }
            }
            
            // Combine with hostname for uniqueness
            const hostname = os.hostname();
            const platform = os.platform();
            const cpuModel = os.cpus()[0]?.model || 'unknown';
            
            const uniqueString = `${macs.join('-')}-${hostname}-${platform}-${cpuModel}`;
            
            // Generate SHA256 hash
            return crypto.createHash('sha256').update(uniqueString).digest('hex');
        } catch (error) {
            console.error('Error generating hardware ID:', error);
            return 'UNKNOWN_HARDWARE';
        }
    }

    /**
     * Validate license and hardware binding
     * @param {string} licenseKey - License key from config
     * @param {Array<string>} registeredHardwareIds - Array of registered hardware IDs from config
     */
    static validate(licenseKey, registeredHardwareIds = []) {
        const hardwareId = this.getHardwareId();
        
        // Check if license key is provided
        if (!licenseKey || licenseKey.trim() === '') {
            return {
                valid: false,
                hardwareId,
                autoRegister: false,
                message: '⚠️  License key is required. Configure it in adapter settings.'
            };
        }
        
        // Check if license key matches
        if (licenseKey !== this.VALID_LICENSE_KEY) {
            return {
                valid: false,
                hardwareId,
                autoRegister: false,
                message: '❌ Invalid license key. Contact gokturk413 for a valid license.'
            };
        }
        
        // Check hardware binding
        const isRegistered = registeredHardwareIds && registeredHardwareIds.includes(hardwareId);
        
        if (!isRegistered) {
            return {
                valid: false,
                hardwareId,
                autoRegister: true, // Signal to auto-register this hardware
                message: `⚠️  This hardware is not registered yet.\n   Hardware ID: ${hardwareId}\n   It will be auto-registered now...`
            };
        }
        
        return {
            valid: true,
            hardwareId,
            autoRegister: false,
            message: '✅ License validated successfully.'
        };
    }

    /**
     * Display current hardware ID (for initial setup)
     */
    static displayHardwareId() {
        const hardwareId = this.getHardwareId();
        console.log('\n===========================================');
        console.log('📌 YOUR HARDWARE ID:');
        console.log(hardwareId);
        console.log('===========================================\n');
        return hardwareId;
    }
}
