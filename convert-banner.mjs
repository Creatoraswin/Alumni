import sharp from 'sharp';
import fs from 'fs';

async function convertBanner() {
  try {
    const inputBuffer = fs.readFileSync('./public/Alumni_banner.svg');
    await sharp(inputBuffer)
      .webp({ quality: 80 })
      .toFile('./public/Alumni_banner.webp');
    console.log('Converted Alumni_banner.svg to Alumni_banner.webp');
  } catch (error) {
    console.error('Failed to convert banner:', error);
  }
}

convertBanner();
