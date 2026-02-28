/**
 * Build License Inline Script
 * Obfuscates license-check.js and inlines it into index.html
 */

import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LICENSE_CHECK_FILE = path.join(__dirname, 'www', 'license-check.js');
const INDEX_HTML_FILE = path.join(__dirname, 'www', 'index.html');

console.log('🔒 Building inline obfuscated license check...\n');

// Read license-check.js
const licenseCheckCode = fs.readFileSync(LICENSE_CHECK_FILE, 'utf8');

// Obfuscate
const obfuscationResult = JavaScriptObfuscator.obfuscate(licenseCheckCode, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.5,
    debugProtection: false,  // Disabled - causes debugger loop
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
});

const obfuscatedCode = obfuscationResult.getObfuscatedCode();

// Write obfuscated file separately (too large for inline)
const obfuscatedFile = path.join(__dirname, 'www', 'license-check.obf.js');
fs.writeFileSync(obfuscatedFile, obfuscatedCode, 'utf8');

// Read index.html
let indexHtml = fs.readFileSync(INDEX_HTML_FILE, 'utf8');

// Remove any existing license check references
indexHtml = indexHtml.replace(
    /\s*<!-- License validation.*?-->\s*\n\s*<script.*?license-check.*?><\/script>/gs,
    ''
);

// Remove massive inline obfuscated code if exists
indexHtml = indexHtml.replace(
    /\s*<!-- License validation.*?-->\s*\n\s*<script>\s*\(function\(_0x[a-f0-9]+.*?<\/script>/gs,
    ''
);

// Add obfuscated external script reference
const licenseScript = '  <!-- License validation - gokturk413 (obfuscated) -->\n  <script src="./license-check.obf.js"></script>\n\n  ';

indexHtml = indexHtml.replace(
    '<script src="./node_modules/mobile-drag-drop/index.js"></script>',
    licenseScript + '<script src="./node_modules/mobile-drag-drop/index.js"></script>'
);

// Write updated index.html
fs.writeFileSync(INDEX_HTML_FILE, indexHtml, 'utf8');

console.log('✅ License check obfuscated successfully!');
console.log(`   Original size: ${licenseCheckCode.length} bytes`);
console.log(`   Obfuscated size: ${obfuscatedCode.length} bytes`);
console.log(`   Size increase: +${((obfuscatedCode.length - licenseCheckCode.length) / licenseCheckCode.length * 100).toFixed(1)}%\n`);
