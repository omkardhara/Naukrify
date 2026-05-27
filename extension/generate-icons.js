// Generates icon16.png, icon48.png, icon128.png for Chrome Web Store
// Run once: node generate-icons.js
// Requires: npm install sharp  (run this in the extension/ folder first)

const sharp = require('sharp')
const path  = require('path')

// SVG source — bold "N" on indigo square, crisp at all sizes
function makeSvg(size) {
  const radius  = Math.round(size * 0.18)
  const fontSize = Math.round(size * 0.65)
  const baseline = Math.round(size * 0.72)
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${radius}" fill="#4f46e5"/>
      <text x="${size / 2}" y="${baseline}"
        font-family="Arial Black, Arial, sans-serif"
        font-size="${fontSize}" font-weight="900"
        fill="white" text-anchor="middle">${'N'}</text>
    </svg>`
  )
}

;[16, 48, 128].forEach((size) => {
  sharp(makeSvg(size))
    .png()
    .toFile(path.join(__dirname, `icon${size}.png`))
    .then(() => console.log(`✓ icon${size}.png`))
    .catch((err) => console.error(`✗ icon${size}.png: ${err.message}`))
})
