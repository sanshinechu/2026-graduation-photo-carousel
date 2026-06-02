#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
let processedCount = 0;
let skippedCount = 0;
let failedCount = 0;

function scanPhotos(dir, photoList = []) {
  const entries = fs.readdirSync(dir);
  entries.forEach(entry => {
    const filePath = path.join(dir, entry);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !entry.startsWith('.')) {
      scanPhotos(filePath, photoList);
    } else if (stat.isFile()) {
      const ext = path.extname(entry).toLowerCase();
      if (/^(\.jpg|\.jpeg|\.png)$/.test(ext) && !entry.includes('.thumb')) {
        photoList.push(filePath);
      }
    }
  });
  return photoList;
}

function resizePhoto(photoPath) {
  const ext = path.extname(photoPath);
  const tmpPath = photoPath.replace(ext, `.tmp${ext}`);
  try {
    execSync(
      `ffmpeg -i "${photoPath}" -vf "scale=1024:768:force_original_aspect_ratio=decrease" -q:v 2 -update 1 "${tmpPath}" -y`,
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );
    fs.renameSync(tmpPath, photoPath);
    processedCount++;
    process.stdout.write(`✓ ${path.basename(photoPath)}\n`);
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    failedCount++;
    process.stdout.write(`✗ ${path.basename(photoPath)}: ${err.message.slice(0, 80)}\n`);
  }
}

const photos = scanPhotos(rootDir);
console.log(`找到 ${photos.length} 張照片，開始縮小到最大 1024×768...\n`);

photos.forEach(resizePhoto);

console.log(`\n完成:`);
console.log(`  成功: ${processedCount}`);
console.log(`  失敗: ${failedCount}`);
