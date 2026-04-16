const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building CSS...');

// 确保dist目录存在
const distDir = path.join(__dirname, '..', 'assets', 'css');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 读取现有的CSS文件
const cssDir = path.join(__dirname, '..', 'src', 'css');
const outputFile = path.join(distDir, 'main.min.css');

// 检查是否有新的CSS架构
if (fs.existsSync(cssDir)) {
  // 新架构：合并所有CSS文件
  const cssFiles = [
    'base/variables.css',
    'base/reset.css',
    'base/typography.css',
    'layouts/grid.css',
    'components/sidebar.css',
    'components/timeline.css',
    'components/projects.css',
    'components/skills.css',
    'utilities/animations.css',
    'themes/light-dark.css'
  ];

  let cssContent = '';
  cssFiles.forEach(file => {
    const filePath = path.join(cssDir, file);
    if (fs.existsSync(filePath)) {
      cssContent += fs.readFileSync(filePath, 'utf8') + '\n';
      console.log(`  ✓ Added: ${file}`);
    }
  });

  // 使用esbuild压缩CSS
  const esbuild = require('esbuild');
  esbuild.transformSync(cssContent, {
    loader: 'css',
    minify: true,
  }, (error, result) => {
    if (error) {
      console.error('❌ Error minifying CSS:', error);
      // 如果esbuild失败，至少保存未压缩版本
      fs.writeFileSync(outputFile, cssContent);
    } else {
      fs.writeFileSync(outputFile, result.code);
      console.log(`  ✓ Minified CSS: ${Math.round(result.code.length / 1024)}KB`);
    }
  });
} else {
  // 回退：使用现有的CSS文件
  const existingCss = path.join(__dirname, '..', 'assets', 'css', 'main.css');
  if (fs.existsSync(existingCss)) {
    let cssContent = fs.readFileSync(existingCss, 'utf8');

    // 简单的压缩（移除注释和空白）
    cssContent = cssContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除注释
      .replace(/\s+/g, ' ') // 压缩空白
      .replace(/;\s+/g, ';')
      .replace(/:\s+/g, ':')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .trim();

    fs.writeFileSync(outputFile, cssContent);
    console.log(`  ✓ Compressed existing CSS: ${Math.round(cssContent.length / 1024)}KB`);
  } else {
    console.error('❌ No CSS files found!');
    // 创建空的CSS文件
    fs.writeFileSync(outputFile, '/* CSS will be built here */');
  }
}

console.log('✅ CSS build complete!');