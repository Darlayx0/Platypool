import fs from 'fs';
import path from 'path';

const distDir = path.resolve('.');
const distIndex = fs.readFileSync(path.join(distDir, 'dist', 'index.html'), 'utf-8');

const cssMatch = distIndex.match(/href="\.\/assets\/([^"]+\.css)"/);
const jsMatch = distIndex.match(/src="\.\/assets\/([^"]+\.js)"/);

if (!cssMatch || !jsMatch) {
  console.error('Asset paths not found in dist/index.html');
  process.exit(1);
}

const cssContent = fs.readFileSync(path.join(distDir, 'dist', 'assets', cssMatch[1]), 'utf-8');
const jsContent = fs.readFileSync(path.join(distDir, 'dist', 'assets', jsMatch[1]), 'utf-8');

// Strip any file-protocol redirect script from standalone play.html
let cleanHtml = distIndex.replace(/<script>[\s\S]*?window\.location\.replace[\s\S]*?<\/script>/i, '');

// Clean any modulepreload links or scripts from head
cleanHtml = cleanHtml.replace(/<link rel="stylesheet"[^>]+>/, `<style>\n${cssContent}\n</style>`);
cleanHtml = cleanHtml.replace(/<script type="module"[^>]+><\/script>/, '');

// Insert standalone inline JS before closing body tag so all DOM elements exist
const standalone = cleanHtml.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`);

fs.writeFileSync(path.join(distDir, 'play.html'), standalone, 'utf-8');
fs.writeFileSync(path.join(distDir, 'dist', 'play.html'), standalone, 'utf-8');
console.log(`Standalone play.html created successfully (${(standalone.length / 1024).toFixed(1)} KB)!`);

