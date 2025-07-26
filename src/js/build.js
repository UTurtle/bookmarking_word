const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Files to include in distribution
const filesToInclude = [
  'manifest.json',
  'src/js/background.js',
  'src/js/content.js',
  'src/css/content.css',
  'src/html/newtab.html',
  'src/js/newtab.js',
  'src/css/newtab.css',
  'src/html/popup.html',
  'src/js/popup.js',
  'src/css/popup.css',
  'src/assets/icons/icon16.png',
  'src/assets/icons/icon128.png',
  'src/assets/icons/icon48.png',
  'README.md',
  'LICENSE'
];

// Create build directory
if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}

// Create ZIP file
const output = fs.createWriteStream('build/vocabulary-bookmarker-v1.1.0.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

output.on('close', () => {
  console.log('✅ Distribution ZIP file created: build/vocabulary-bookmarker-v1.1.0.zip');
  console.log(`📦 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Add files
filesToInclude.forEach(file => {
  if (fs.existsSync(file)) {
    archive.file(file, { name: file });
    console.log(`📁 Added: ${file}`);
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

archive.finalize(); 