import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const dir = 'dist/_astro';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
let own = 0;
let three = 0;
for (const f of files) {
  const gz = zlib.gzipSync(fs.readFileSync(path.join(dir, f))).length;
  if (/^three\./.test(f)) three += gz;
  else own += gz;
}
const kb = (n) => (n / 1024).toFixed(1);
console.log(`own JS ${kb(own)} KB gz (limit 60), three ${kb(three)} KB gz (limit 170)`);
if (three === 0) {
  console.error('no three chunk found: manualChunks misconfigured');
  process.exit(1);
}
if (own > 60 * 1024 || three > 170 * 1024) process.exit(1);
