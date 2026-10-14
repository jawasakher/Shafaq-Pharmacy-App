const fs = require('fs');
const path = require('path');

const brandingDir = path.join(__dirname, '../assets/branding');
const files = fs.readdirSync(brandingDir);

console.log('=== DETAILED ASSET AUDIT ===');
for (const file of files) {
  const filePath = path.join(brandingDir, file);
  const stats = fs.statSync(filePath);
  const ext = path.extname(file).toLowerCase();

  let info = `Size: ${(stats.size / 1024).toFixed(2)} KB`;
  if (ext === '.png') {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      const bitDepth = buffer.readUInt8(24);
      const colorType = buffer.readUInt8(25);
      info += ` | Dim: ${width}x${height} | BitDepth: ${bitDepth} | ColorType: ${colorType} (Alpha channel present if type 4 or 6)`;
    }
  } else if (ext === '.svg') {
    info += ` | Format: SVG Vector`;
  }
  console.log(`- ${file}: ${info}`);
}
