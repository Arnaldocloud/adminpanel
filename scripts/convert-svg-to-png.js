const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Convertido ${inputPath} a ${outputPath} (${size}x${size}px)`);
  } catch (error) {
    console.error('Error al convertir la imagen:', error);
    process.exit(1);
  }
}

// Rutas de los archivos
const inputSvg = path.join(__dirname, '../public/icon-192x192.svg');
const outputPng = path.join(__dirname, '../public/icon-192x192.png');

// Convertir SVG a PNG (192x192)
convertSvgToPng(inputSvg, outputPng, 192);
