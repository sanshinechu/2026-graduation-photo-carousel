#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const heicRegex = /\.heic$/i;

// 搜索所有 HEIC 文件
function findHeicFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findHeicFiles(filePath, fileList);
    } else if (heicRegex.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// 轉換 HEIC 為 JPG
function convertHeicToJpg(heicPath) {
  const jpgPath = heicPath.replace(/\.heic$/i, '.JPG');

  try {
    console.log(`轉換: ${heicPath} → ${jpgPath}`);

    // 用 FFmpeg 轉換，保持良好品質
    execSync(`ffmpeg -i "${heicPath}" -q:v 2 "${jpgPath}" -y 2>nul`, {
      stdio: 'pipe'
    });

    console.log(`✓ 完成: ${path.basename(jpgPath)}`);
    return jpgPath;
  } catch (error) {
    console.error(`✗ 失敗: ${heicPath}`, error.message);
    return null;
  }
}

// 主程序
const heicFiles = findHeicFiles(rootDir).filter(f => !f.includes('\\.git'));

if (heicFiles.length === 0) {
  console.log('未找到 HEIC 文件');
  process.exit(0);
}

console.log(`找到 ${heicFiles.length} 個 HEIC 文件，開始轉換...\n`);

const convertedFiles = [];
heicFiles.forEach(heicPath => {
  const jpgPath = convertHeicToJpg(heicPath);
  if (jpgPath) {
    convertedFiles.push({
      heicPath: path.relative(rootDir, heicPath),
      jpgPath: path.relative(rootDir, jpgPath)
    });
  }
});

console.log(`\n轉換完成: ${convertedFiles.length}/${heicFiles.length} 成功`);
console.log('\n轉換結果:');
convertedFiles.forEach(item => {
  console.log(`  ${item.heicPath} → ${item.jpgPath}`);
});

if (convertedFiles.length > 0) {
  console.log('\n提示: 需要運行 generate-photos-list.js 來更新 photos.js');
}
