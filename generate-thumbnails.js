#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
let processedCount = 0;
let skippedCount = 0;

function generateThumbnail(photoPath) {
  const dir = path.dirname(photoPath);
  const ext = path.extname(photoPath);
  const basename = path.basename(photoPath, ext);
  const thumbPath = path.join(dir, `${basename}.thumb${ext}`);

  // 如果縮圖已存在，跳過
  if (fs.existsSync(thumbPath)) {
    skippedCount++;
    return thumbPath;
  }

  try {
    console.log(`生成縮圖: ${path.basename(photoPath)}`);

    // 用 FFmpeg 生成縮圖：寬度 480px，品質 85%
    execSync(
      `ffmpeg -i "${photoPath}" -vf "scale=480:-1" -q:v 4 "${thumbPath}" -y 2>nul`,
      { stdio: 'pipe' }
    );

    console.log(`✓ 完成: ${path.basename(thumbPath)}`);
    processedCount++;
    return thumbPath;
  } catch (error) {
    console.error(`✗ 失敗: ${photoPath}`);
    console.error(error.message);
    return null;
  }
}

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

const photos = scanPhotos(rootDir);

if (photos.length === 0) {
  console.log('未找到照片');
  process.exit(0);
}

console.log(`找到 ${photos.length} 張照片，開始生成縮圖...\n`);

photos.forEach(photo => {
  generateThumbnail(photo);
});

console.log(`\n縮圖生成完成:`);
console.log(`  新增: ${processedCount}`);
console.log(`  已存在: ${skippedCount}`);
console.log(`  總數: ${photos.length}`);
