const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building JavaScript...');

// 确保dist目录存在
const distDir = path.join(__dirname, '..', 'assets', 'js');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const outputFile = path.join(distDir, 'main.min.js');

// 检查是否有新的JS架构
const jsDir = path.join(__dirname, '..', 'assets', 'js');
if (fs.existsSync(jsDir)) {
  // 新架构：使用esbuild打包
  try {
    const esbuild = require('esbuild');

    const result = esbuild.buildSync({
      entryPoints: [path.join(jsDir, 'main.js')],
      bundle: true,
      minify: true,
      outfile: outputFile,
      target: ['es2020'],
      format: 'iife',
      globalName: 'CYYPortfolio',
    });

    console.log(`  ✓ Bundled JS: ${Math.round(fs.statSync(outputFile).size / 1024)}KB`);
  } catch (error) {
    console.error('❌ Error building JS with esbuild:', error);
    // 回退：合并所有JS文件
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();
    let jsContent = '';

    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      jsContent += fs.readFileSync(filePath, 'utf8') + '\n';
      console.log(`  ✓ Added: ${file}`);
    });

    // 简单压缩
    jsContent = jsContent
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/;\s+/g, ';')
      .trim();

    fs.writeFileSync(outputFile, jsContent);
    console.log(`  ✓ Merged JS files: ${Math.round(jsContent.length / 1024)}KB`);
  }
} else {
  // 从现有HTML中提取内联JS
  const htmlFile = path.join(__dirname, '..', 'index.html');
  if (fs.existsSync(htmlFile)) {
    let htmlContent = fs.readFileSync(htmlFile, 'utf8');

    // 提取所有的<script>标签内容（不包括外部引用）
    const scriptRegex = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
    let jsContent = '';
    let match;

    while ((match = scriptRegex.exec(htmlContent)) !== null) {
      // 跳过有src属性的外部脚本
      if (!match[0].includes('src=')) {
        jsContent += match[1] + '\n';
      }
    }

    if (jsContent.trim()) {
      // 简单压缩
      jsContent = jsContent
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/;\s+/g, ';')
        .trim();

      fs.writeFileSync(outputFile, jsContent);
      console.log(`  ✓ Extracted inline JS: ${Math.round(jsContent.length / 1024)}KB`);
    } else {
      console.log('  ⚠️ No inline JS found, creating empty file');
      fs.writeFileSync(outputFile, '// JavaScript will be bundled here');
    }
  }
}

console.log('✅ JavaScript build complete!');