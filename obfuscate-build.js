/**
 * Build-time Code Obfuscation Script
 * Obfuscates backend code for GitHub distribution
 * Original source remains in src-original/ directory
 */

import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const SOURCE_DIR = path.join(__dirname, 'src-original', 'backend');
const TARGET_DIR = path.join(__dirname, 'dist', 'backend');

// Files to obfuscate
const FILES_TO_OBFUSCATE = [
    'LicenseValidator.js',
    'main.js'
];

// Obfuscation options
const OBFUSCATION_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.75,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

console.log('🔒 Starting code obfuscation...\n');

// Ensure source directory exists
if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ Source directory not found:', SOURCE_DIR);
    console.error('Please ensure src-original/backend/ directory exists with original source files.');
    process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

let successCount = 0;
let errorCount = 0;

FILES_TO_OBFUSCATE.forEach(filename => {
    const sourcePath = path.join(SOURCE_DIR, filename);
    const targetPath = path.join(TARGET_DIR, filename);
    
    try {
        // Check if source file exists
        if (!fs.existsSync(sourcePath)) {
            console.warn(`⚠️  Skipping ${filename} - not found in source directory`);
            return;
        }
        
        console.log(`📝 Obfuscating: ${filename}`);
        
        // Read source code
        const sourceCode = fs.readFileSync(sourcePath, 'utf8');
        
        // Obfuscate
        const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, OBFUSCATION_OPTIONS);
        const obfuscatedCode = obfuscationResult.getObfuscatedCode();
        
        // Write obfuscated code to target
        fs.writeFileSync(targetPath, obfuscatedCode, 'utf8');
        
        // Calculate size reduction/increase
        const originalSize = sourceCode.length;
        const obfuscatedSize = obfuscatedCode.length;
        const sizeChange = ((obfuscatedSize - originalSize) / originalSize * 100).toFixed(1);
        const sizeChangeSign = sizeChange > 0 ? '+' : '';
        
        console.log(`   ✅ Success! Size: ${originalSize} → ${obfuscatedSize} bytes (${sizeChangeSign}${sizeChange}%)\n`);
        successCount++;
        
    } catch (error) {
        console.error(`   ❌ Error obfuscating ${filename}:`, error.message);
        errorCount++;
    }
});

console.log('\n========================================');
console.log('📊 Obfuscation Summary:');
console.log(`   ✅ Success: ${successCount} files`);
console.log(`   ❌ Errors:  ${errorCount} files`);
console.log('========================================\n');

if (errorCount > 0) {
    console.error('⚠️  Some files failed to obfuscate. Please check errors above.');
    process.exit(1);
}

console.log('✅ All files obfuscated successfully!');
console.log('\n📝 Next steps:');
console.log('   1. Review obfuscated files in dist/backend/');
console.log('   2. Test the adapter');
console.log('   3. Commit and push to GitHub');
console.log('\n⚠️  Remember: Keep src-original/ directory LOCAL ONLY (not in Git)\n');
