// Run this script to generate all favicon files
// Install required package: npm install sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'client', 'public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVG content for the logo
const logoSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="16" fill="#2563EB"/>
  <rect x="4" y="4" width="24" height="24" rx="12" fill="white"/>
  <rect x="6" y="6" width="20" height="20" rx="10" fill="#2563EB"/>
  <rect x="10" y="10" width="12" height="12" rx="6" fill="white"/>
  <rect x="14" y="14" width="4" height="4" rx="2" fill="#2563EB"/>
</svg>
`;

// Generate favicon.ico
async function generateFavicon() {
  try {
    const pngBuffer = await sharp(Buffer.from(logoSvg))
      .resize(32, 32)
      .toBuffer();
    
    await sharp(pngBuffer)
      .toFile(path.join(outputDir, 'favicon.ico'));
    
    console.log('Generated favicon.ico');
  } catch (error) {
    console.error('Error generating favicon.ico:', error);
  }
}

// Generate apple-touch-icon.png
async function generateAppleTouchIcon() {
  try {
    await sharp(Buffer.from(logoSvg))
      .resize(180, 180)
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    
    console.log('Generated apple-touch-icon.png');
  } catch (error) {
    console.error('Error generating apple-touch-icon.png:', error);
  }
}

// Generate favicon-32x32.png
async function generateFavicon32() {
  try {
    await sharp(Buffer.from(logoSvg))
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    
    console.log('Generated favicon-32x32.png');
  } catch (error) {
    console.error('Error generating favicon-32x32.png:', error);
  }
}

// Generate favicon-16x16.png
async function generateFavicon16() {
  try {
    await sharp(Buffer.from(logoSvg))
      .resize(16, 16)
      .toFile(path.join(outputDir, 'favicon-16x16.png'));
    
    console.log('Generated favicon-16x16.png');
  } catch (error) {
    console.error('Error generating favicon-16x16.png:', error);
  }
}

// Generate site.webmanifest
function generateWebManifest() {
  const manifest = {
    name: 'AegisOS',
    short_name: 'AegisOS',
    icons: [
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    theme_color: '#2563EB',
    background_color: '#ffffff',
    display: 'standalone'
  };

  fs.writeFileSync(
    path.join(outputDir, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('Generated site.webmanifest');
}

// Generate all favicon files
async function generateAll() {
  await generateFavicon();
  await generateAppleTouchIcon();
  await generateFavicon32();
  await generateFavicon16();
  generateWebManifest();
  
  console.log('\nFavicon generation complete!');
  console.log('Add the following to your HTML head:');
  console.log(`
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="#2563EB" />
  `);
}

generateAll().catch(console.error);
