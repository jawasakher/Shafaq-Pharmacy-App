const fs = require('fs');
const path = require('path');

const brandingDir = path.join(__dirname, '../assets/branding');
const files = fs.readdirSync(brandingDir);

console.log('=== BRANDING ASSETS AUDIT ===');
for (const file of files) {
  const filePath = path.join(brandingDir, file);
  const stats = fs.statSync(filePath);
  const ext = path.extname(file).toLowerCase();

  let details = `Size: ${(stats.size / 1024).toFixed(2)} KB`;
  if (ext === '.png') {
    // Read PNG header for width/height (bytes 16-23)
    const buffer = fs.readFileSync(filePath);
    if (buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      const colorType = buffer.readUInt8(25);
      details += `, Dimensions: ${width}x${height}, ColorType: ${colorType} (Alpha/Truecolor)`;
    }
  }
  console.log(`- ${file}: ${details}`);
}

const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const expo = appJson.expo;

console.log('\n=== APP.JSON PATH VERIFICATION ===');
const pathsToCheck = [
  expo.icon,
  expo.ios && expo.ios.icon,
  expo.android && expo.android.adaptiveIcon && expo.android.adaptiveIcon.foregroundImage,
  expo.android && expo.android.adaptiveIcon && expo.android.adaptiveIcon.monochromeImage,
  expo.plugins && expo.plugins.find(p => Array.isArray(p) && p[0] === 'expo-splash-screen')?.[1]?.image
].filter(Boolean);

for (const p of pathsToCheck) {
  const resolved = path.resolve(path.dirname(appJsonPath), p);
  const exists = fs.existsSync(resolved);
  console.log(`Path: ${p} -> Resolved: ${resolved} -> Exists: ${exists}`);
}
