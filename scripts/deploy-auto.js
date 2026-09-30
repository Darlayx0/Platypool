import { execSync } from 'child_process';
import { existsSync } from 'fs';

const REPO_ACTIONS_URL = 'https://github.com/Darlayx0/Platypool/actions';
const PAGES_URL = 'https://darlayx0.github.io/Platypool/';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('🚀 [1/4] Memeriksa & menjalankan build proyek...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build gagal. Deployment dibatalkan.');
  process.exit(1);
}

console.log('\n📦 [2/4] Menambahkan perubahan ke Git...');
execSync('git add .', { stdio: 'inherit' });

const status = execSync('git status --porcelain').toString().trim();
if (status) {
  const commitMsg = process.argv.slice(2).join(' ') || `chore: automated deploy ${new Date().toISOString()}`;
  console.log(`\n💾 Melakukan commit: "${commitMsg}"...`);
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
} else {
  console.log('ℹ️ Tidak ada perubahan file baru untuk di-commit.');
}

console.log('\n⬆️ [3/4] Melakukan push ke origin main...');
try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Berhasil push ke GitHub main branch!');
} catch (error) {
  console.error('❌ Gagal melakukan git push.');
  process.exit(1);
}

console.log('\n🌐 [4/4] Menjalankan automasi Chrome untuk memantau deployment...');
try {
  if (existsSync(CHROME_PATH)) {
    execSync(`start "" "${CHROME_PATH}" "${REPO_ACTIONS_URL}" "${PAGES_URL}"`, { shell: 'cmd.exe' });
  } else {
    execSync(`start "" "${REPO_ACTIONS_URL}"`, { shell: 'cmd.exe' });
    execSync(`start "" "${PAGES_URL}"`, { shell: 'cmd.exe' });
  }
  console.log('✨ Chrome berhasil dibuka secara otomatis!');
  console.log(`- GitHub Actions: ${REPO_ACTIONS_URL}`);
  console.log(`- Live Site: ${PAGES_URL}`);
} catch (err) {
  console.warn('⚠️ Tidak dapat membuka Chrome secara otomatis:', err.message);
}
