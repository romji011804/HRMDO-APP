import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Install png-to-ico if not present
try {
  createRequire(import.meta.url)('png-to-ico');
} catch {
  console.log('Installing png-to-ico...');
  execSync('npm install --no-save png-to-ico', { stdio: 'inherit' });
}

const pngToIco = createRequire(import.meta.url)('png-to-ico');

const pngPath = "C:\\Users\\Windows 10\\Downloads\\appicon\\appicon.png";
const outPath = "build\\icon.ico";

console.log('Converting PNG → ICO...');
pngToIco([pngPath])
  .then(buf => {
    writeFileSync(outPath, buf);
    console.log(`✓ Saved proper ICO to ${outPath}`);
  })
  .catch(err => {
    console.error('Conversion failed:', err);
    process.exit(1);
  });
