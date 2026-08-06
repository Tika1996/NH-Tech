import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const inputPng = path.join(projectRoot, 'public', 'logo.png');
const buildDir = path.join(projectRoot, 'build');
const outputIco = path.join(buildDir, 'icon.ico');

if (!fs.existsSync(inputPng)) {
  console.error(`[generate-icon] Missing input: ${inputPng}`);
  process.exit(1);
}

fs.mkdirSync(buildDir, { recursive: true });

try {
  const buf = await pngToIco(inputPng);
  fs.writeFileSync(outputIco, buf);
  console.log(`[generate-icon] Wrote: ${outputIco}`);
} catch (e) {
  console.error('[generate-icon] Failed to generate .ico', e);
  process.exit(1);
}
