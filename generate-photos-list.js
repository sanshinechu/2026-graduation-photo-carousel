#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function scanPhotos(dir, folderName = '', photoList = []) {
  const entries = fs.readdirSync(dir);

  entries.forEach(entry => {
    const filePath = path.join(dir, entry);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !entry.startsWith('.')) {
      scanPhotos(filePath, entry, photoList);
    } else if (stat.isFile()) {
      const ext = path.extname(entry).toLowerCase();
      if (/^(\.jpg|\.jpeg|\.png)$/.test(ext) && !entry.includes('.thumb')) {
        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        const thumbDir = path.dirname(filePath);
        const basename = path.basename(filePath, ext);
        const thumbPath = path.join(thumbDir, `${basename}.thumb${ext}`).replace(/\\/g, '/');
        const thumbRelativePath = path.relative(rootDir, thumbPath).replace(/\\/g, '/');

        photoList.push({
          path: relativePath,
          thumb: thumbRelativePath,
          folder: folderName || '其他',
          name: entry,
          size: stat.size
        });
      }
    }
  });

  return photoList;
}

const photos = scanPhotos(rootDir)
  .sort((a, b) => {
    if (a.folder !== b.folder) {
      return a.folder.localeCompare(b.folder, 'zh-Hant');
    }
    return a.name.localeCompare(b.name, 'zh-Hant');
  });

const jsContent = `window.GRADUATION_PHOTOS = ${JSON.stringify(photos, null, 4)};`;

const photosJsPath = path.join(rootDir, 'photos.js');
fs.writeFileSync(photosJsPath, jsContent);

console.log(`✓ photos.js 已更新`);
console.log(`  總照片數: ${photos.length}`);
console.log(`  資料夾數: ${new Set(photos.map(p => p.folder)).size}`);
console.log(`  檔案大小: ${(fs.statSync(photosJsPath).size / 1024).toFixed(2)} KB`);
