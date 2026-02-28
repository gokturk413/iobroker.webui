import * as os from 'os';
import * as crypto from 'crypto';

export class LicenseValidator {
    static VALID_LICENSE_KEY = 'GOKTURK413-WEBUI-LICENSE-2026';
    static ALLOWED_HARDWARE_IDS = [
        // Your hardware ID will be added here after first run
        'REPLACE_WITH_YOUR_HARDWARE_ID',
        // IMPORTANT: After first run, copy the Hardware ID from logs and paste it here
        // Example: 'a7b3c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6'
    ];

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
     */
    static validate(licenseKey) {
        const hardwareId = this.getHardwareId();
        
        // Check if license key is provided
        if (!licenseKey || licenseKey.trim() === '') {
            return {
                valid: false,
                hardwareId,
                message: '⚠️  License key is required. Configure it in adapter settings.'
            };
        }
        
        // Check if license key matches
        if (licenseKey !== this.VALID_LICENSE_KEY) {
            return {
                valid: false,
                hardwareId,
                message: '❌ Invalid license key. Contact gokturk413 for a valid license.'
            };
        }
        
        // Check hardware binding
        if (!this.ALLOWED_HARDWARE_IDS.includes(hardwareId)) {
            return {
                valid: false,
                hardwareId,
                message: `❌ License not authorized for this hardware.\n   Hardware ID: ${hardwareId}\n   Contact gokturk413 to register this hardware.`
            };
        }
        
        return {
            valid: true,
            hardwareId,
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
