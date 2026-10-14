const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const brandingDir = path.join(__dirname, '../assets/branding');
const imagesDir = path.join(__dirname, '../assets/images');

if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

const mappings = [
  { from: 'icon.png', to: 'shafaq-icon-1024.png' },
  { from: 'android-icon-foreground.png', to: 'shafaq-emblem.png' },
  { from: 'android-icon-monochrome.png', to: 'shafaq-emblem-monochrome.png' },
  { from: 'splash-icon.png', to: 'shafaq-splash-logo.png' },
];

for (const m of mappings) {
  const src = path.join(imagesDir, m.from);
  const dest = path.join(brandingDir, m.to);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${m.from} -> ${m.to}`);
  } else {
    console.warn(`Source not found: ${src}`);
  }
}

// Generate shafaq-emblem-white.png reproducibly from shafaq-emblem.png
const emblemPath = path.join(brandingDir, 'shafaq-emblem.png');
const whitePath = path.join(brandingDir, 'shafaq-emblem-white.png');

if (fs.existsSync(emblemPath)) {
  const buffer = fs.readFileSync(emblemPath);
  const png = PNG.sync.read(buffer);
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] > 0) {
      png.data[i] = 255;
      png.data[i + 1] = 255;
      png.data[i + 2] = 255;
    }
  }
  fs.writeFileSync(whitePath, PNG.sync.write(png));
  console.log('Generated verified white emblem asset: shafaq-emblem-white.png');
}

console.log('Brand assets preparation and verification completed.');
