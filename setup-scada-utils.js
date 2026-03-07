#!/usr/bin/env node

/**
 * SCADA Utility Functions Setup Script
 * 
 * This script copies default SCADA utility files to the ioBroker data directory
 * Runs automatically on npm install (postinstall hook)
 * Can also be run manually: npm run setup-scada
 */

const fs = require('fs');
const path = require('path');

// Check if running in silent mode (from postinstall)
const silent = process.argv.includes('--silent') || process.env.npm_lifecycle_event === 'postinstall';

function log(message) {
    if (!silent) console.log(message);
}

log('🔧 SCADA Utility Functions Setup\n');

// Find iobroker-data directory
function findIobrokerDataPath() {
    // Try common locations
    const possiblePaths = [
        // Standard installation
        path.resolve(__dirname, '../../iobroker-data'),
        path.resolve(__dirname, '../../../iobroker-data'),
        // Docker installation
        path.resolve('/opt/iobroker/iobroker-data'),
        // Custom installation
        process.env.IOB_DATA_PATH
    ];

    for (const p of possiblePaths) {
        if (p && fs.existsSync(p)) {
            log(`✓ Found iobroker-data at: ${p}`);
            return p;
        }
    }

    return null;
}

// Copy files
function copyFiles(sourcePath, destPath) {
    if (!fs.existsSync(sourcePath)) {
        if (!silent) console.error(`✗ Source path not found: ${sourcePath}`);
        return false;
    }

    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
        log(`✓ Created directory: ${destPath}`);
    }

    // Get all files from source
    const files = fs.readdirSync(sourcePath);
    let copiedCount = 0;

    files.forEach(file => {
        const sourceFile = path.join(sourcePath, file);
        const destFile = path.join(destPath, file);

        if (fs.statSync(sourceFile).isFile()) {
            fs.copyFileSync(sourceFile, destFile);
            log(`✓ Copied: ${file}`);
            copiedCount++;
        }
    });

    return copiedCount > 0;
}

// Main setup
function main() {
    // Source files
    const sourceDir = path.join(__dirname, 'www', 'default-additionalfiles');

    if (!fs.existsSync(sourceDir)) {
        if (!silent) {
            console.error('✗ Source directory not found: www/default-additionalfiles');
            console.error('  Please make sure you are running this from the adapter directory.');
        }
        process.exit(silent ? 0 : 1); // Exit gracefully in silent mode
    }

    // Find iobroker-data
    const iobrokerData = findIobrokerDataPath();

    if (!iobrokerData) {
        if (!silent) {
            console.error('\n✗ Could not find iobroker-data directory automatically.');
            console.error('  SCADA functions will be available in www/default-additionalfiles/');
            console.error('  They will be copied on first adapter start.\n');
            console.error('  Or run manually: npm run setup-scada\n');
        }
        process.exit(0); // Exit gracefully - files will be copied on adapter start
    }

    // Destination directory
    const destDir = path.join(iobrokerData, 'files', 'webui.0.data', 'config', 'additionalfiles');

    log('\nCopying SCADA utility files...\n');

    if (copyFiles(sourceDir, destDir)) {
        log('\n✅ SCADA utility functions installed successfully!\n');
        if (!silent) {
            console.log('📖 Usage Guide:');
            console.log('   - Open WebUI Settings → Additional Files');
            console.log('   - You should see scada-utils.js and SCADA_UTILS_GUIDE_AZ.md');
            console.log('   - Functions are now globally available in all Custom Controls and Formulas\n');
            console.log('🧪 Test in browser console:');
            console.log('   console.log(typeof scadaFormatValue); // should return "function"\n');
        }
    } else {
        if (!silent) {
            console.error('\n✗ Setup failed. Files will be copied on adapter start.\n');
        }
        process.exit(0); // Exit gracefully
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { findIobrokerDataPath, copyFiles };
