const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const brandingDir = path.join(__dirname, '../assets/branding');
const sourcePngPath = path.join(brandingDir, 'shafaq-emblem.png');
const candidatePngPath = path.join(brandingDir, 'shafaq-emblem-white.candidate.png');
const finalWhitePngPath = path.join(brandingDir, 'shafaq-emblem-white.png');

if (!fs.existsSync(sourcePngPath)) {
  console.error('Source shafaq-emblem.png not found!');
  process.exit(1);
}

const buffer = fs.readFileSync(sourcePngPath);
const png = PNG.sync.read(buffer);

console.log(`Processing source PNG: ${png.width}x${png.height}`);

let minAlpha = 255;
let maxAlpha = 0;
let transparentPixels = 0;
let opaquePixels = 0;

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    if (a < minAlpha) minAlpha = a;
    if (a > maxAlpha) maxAlpha = a;

    if (a === 0) {
      transparentPixels++;
    } else {
      opaquePixels++;
      // Convert non-transparent pixels to pure white #FFFFFF while keeping original alpha
      png.data[idx] = 255;     // R
      png.data[idx + 1] = 255; // G
      png.data[idx + 2] = 255; // B
    }
  }
}

console.log(`Candidate Analysis -> Min Alpha: ${minAlpha}, Max Alpha: ${maxAlpha}`);
console.log(`Transparent pixels: ${transparentPixels}, Nontransparent pixels: ${opaquePixels}`);

// Write candidate
const candidateBuffer = PNG.sync.write(png);
fs.writeFileSync(candidatePngPath, candidateBuffer);
console.log(`Candidate white PNG written to ${candidatePngPath}`);

// Verify candidate pixels
const verifiedBuffer = fs.readFileSync(candidatePngPath);
const verifiedPng = PNG.sync.read(verifiedBuffer);
let allWhite = true;
for (let i = 0; i < verifiedPng.data.length; i += 4) {
  const a = verifiedPng.data[i + 3];
  if (a > 0) {
    if (verifiedPng.data[i] !== 255 || verifiedPng.data[i+1] !== 255 || verifiedPng.data[i+2] !== 255) {
      allWhite = false;
      break;
    }
  }
}
console.log(`Verification: All non-transparent pixels are pure white (#FFFFFF)? ${allWhite}`);

if (allWhite) {
  fs.copyFileSync(candidatePngPath, finalWhitePngPath);
  console.log(`Successfully replaced ${finalWhitePngPath} with verified white candidate.`);
  // Clean up candidate
  fs.unlinkSync(candidatePngPath);
} else {
  console.error('Verification failed: candidate contains non-white pixels.');
  process.exit(1);
}
