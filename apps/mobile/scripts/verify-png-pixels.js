const fs = require('fs');
const path = require('path');

const brandingDir = path.join(__dirname, '../assets/branding');
const files = fs.readdirSync(brandingDir).filter(f => f.endsWith('.png'));

console.log('=== PNG PIXEL & CHUNK ANALYSIS ===');
for (const file of files) {
  const filePath = path.join(brandingDir, file);
  const buffer = fs.readFileSync(filePath);

  if (buffer.length > 8 && buffer.toString('ascii', 1, 4) === 'PNG') {
    let offset = 8;
    let chunks = [];
    while (offset < buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const type = buffer.toString('ascii', offset + 4, offset + 8);
      chunks.push({ type, length });
      offset += 12 + length;
    }
    console.log(`- ${file}: Size=${(buffer.length/1024).toFixed(2)}KB, Chunks=`, chunks.map(c => c.type).join(', '));
  }
}
