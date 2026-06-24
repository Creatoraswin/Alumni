import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const DIRS_TO_PROCESS = [
  './Uploads',
  './public/Uploads'
];

async function processDirectory(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
          await convertToWebp(fullPath);
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error reading directory ${dir}:`, err);
    }
  }
}

async function convertToWebp(filePath) {
  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const webpPath = path.join(dir, `${baseName}.webp`);

    // Check if webp already exists
    try {
      await fs.access(webpPath);
      console.log(`Skipping: ${webpPath} already exists.`);
      return;
    } catch {
      // file doesn't exist, proceed
    }

    console.log(`Converting: ${filePath} -> ${webpPath}`);
    await sharp(filePath)
      .webp({ quality: 80 })
      .toFile(webpPath);

    // Optional: Log size reduction
    const oldStat = await fs.stat(filePath);
    const newStat = await fs.stat(webpPath);
    const saved = ((oldStat.size - newStat.size) / 1024 / 1024).toFixed(2);
    console.log(`  Saved ${saved} MB (${(newStat.size / oldStat.size * 100).toFixed(1)}% of original)`);
  } catch (err) {
    console.error(`Failed to convert ${filePath}:`, err);
  }
}

async function main() {
  console.log('Starting image conversion to WebP...');
  for (const dir of DIRS_TO_PROCESS) {
    console.log(`Scanning directory: ${dir}`);
    await processDirectory(dir);
  }
  console.log('Image conversion complete!');
}

main().catch(console.error);
