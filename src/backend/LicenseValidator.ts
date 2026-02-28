import * as os from 'os';
import * as crypto from 'crypto';

export class LicenseValidator {
    private static readonly VALID_LICENSE_KEY = 'GOKTURK413-WEBUI-LICENSE-2026';
    private static readonly ALLOWED_HARDWARE_IDS = [
        // Sizin server hardware ID-nizi buraya əlavə edəcəyik
        'YOUR_HARDWARE_ID_WILL_BE_HERE'
    ];

    /**
     * Generate unique hardware ID based on system information
     */
    public static getHardwareId(): string {
        try {
            const networkInterfaces = os.networkInterfaces();
            const macs: string[] = [];
            
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
    public static validate(licenseKey?: string): { valid: boolean; hardwareId: string; message: string } {
        const hardwareId = this.getHardwareId();
        
        // Check if license key is provided
        if (!licenseKey || licenseKey.trim() === '') {
            return {
                valid: false,
                hardwareId,
                message: 'License key is required. Please configure license key in adapter settings.'
            };
        }
        
        // Check if license key matches
        if (licenseKey !== this.VALID_LICENSE_KEY) {
            return {
                valid: false,
                hardwareId,
                message: 'Invalid license key. Please contact gokturk413 for a valid license.'
            };
        }
        
        // Check hardware binding
        if (!this.ALLOWED_HARDWARE_IDS.includes(hardwareId)) {
            return {
                valid: false,
                hardwareId,
                message: `This license is not authorized for this hardware. Hardware ID: ${hardwareId}. Please contact gokturk413 to register this hardware.`
            };
        }
        
        return {
            valid: true,
            hardwareId,
            message: 'License validated successfully.'
        };
    }

    /**
     * Display current hardware ID (for initial setup)
     */
    public static displayHardwareId(): string {
        const hardwareId = this.getHardwareId();
        console.log('\n===========================================');
        console.log('YOUR HARDWARE ID:');
        console.log(hardwareId);
        console.log('===========================================\n');
        return hardwareId;
    }
}
