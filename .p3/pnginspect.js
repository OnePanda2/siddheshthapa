/* What is ACTUALLY in the PNG? Decode it and report where the non-background
   pixels are and how strong they get — squinting at a downscaled screenshot is
   how the blank-scene bug survived last time.
   usage: node .p3/pnginspect.js <file.png> [xmin] */
const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2];
const XMIN = +(process.argv[3] || 0);
const buf = fs.readFileSync(file);

let p = 8, W = 0, H = 0, bd = 0, ct = 0, idat = [];
while (p < buf.length) {
  const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8);
  if (type === 'IHDR') { W = buf.readUInt32BE(p + 8); H = buf.readUInt32BE(p + 12); bd = buf[p + 16]; ct = buf[p + 17]; }
  if (type === 'IDAT') idat.push(buf.slice(p + 8, p + 8 + len));
  if (type === 'IEND') break;
  p += 12 + len;
}
const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : 0;
if (!ch || bd !== 8) { console.log('unsupported png ct=' + ct + ' bd=' + bd); process.exit(1); }
const raw = zlib.inflateSync(Buffer.concat(idat));
const stride = W * ch;
const px = Buffer.alloc(H * stride);
let o = 0;
for (let y = 0; y < H; y++) {
  const f = raw[o++], line = raw.slice(o, o + stride); o += stride;
  const cur = px.slice(y * stride, (y + 1) * stride);
  const prev = y ? px.slice((y - 1) * stride, y * stride) : Buffer.alloc(stride);
  for (let x = 0; x < stride; x++) {
    const a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
    let v = line[x];
    if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
    else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
                        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
    cur[x] = v & 255;
  }
}
/* background = the most common colour */
const hist = new Map();
for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
  const i = y * stride + x * ch, k = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
  hist.set(k, (hist.get(k) || 0) + 1);
}
let bg = 0, best = 0;
hist.forEach((v, k) => { if (v > best) { best = v; bg = k; } });
const br = bg >> 16 & 255, bgg = bg >> 8 & 255, bb = bg & 255;

let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, maxd = 0, sum = 0;
const buckets = { faint: 0, soft: 0, clear: 0, strong: 0 };
let darkest = null;
for (let y = 0; y < H; y++) for (let x = XMIN; x < W; x++) {
  const i = y * stride + x * ch;
  const d = Math.max(Math.abs(px[i] - br), Math.abs(px[i + 1] - bgg), Math.abs(px[i + 2] - bb));
  if (d < 3) continue;
  n++; sum += d;
  if (d > maxd) { maxd = d; darkest = [x, y, px[i], px[i + 1], px[i + 2]]; }
  if (d < 10) buckets.faint++; else if (d < 26) buckets.soft++;
  else if (d < 70) buckets.clear++; else buckets.strong++;
  if (x < x0) x0 = x; if (x > x1) x1 = x;
  if (y < y0) y0 = y; if (y > y1) y1 = y;
}
console.log(file.split(/[\\/]/).pop() + '  ' + W + 'x' + H + '  bg=rgb(' + br + ',' + bgg + ',' + bb + ')' +
            (XMIN ? '  x>=' + XMIN : ''));
if (!n) { console.log('  NOTHING drawn'); process.exit(0); }
console.log('  ink px      ' + n + '  (' + (100 * n / (W * H)).toFixed(2) + '% of frame)');
console.log('  bbox        x ' + x0 + '..' + x1 + '   y ' + y0 + '..' + y1);
console.log('  strength    faint<10:' + buckets.faint + '  soft<26:' + buckets.soft +
            '  clear<70:' + buckets.clear + '  strong>=70:' + buckets.strong);
console.log('  max deviation ' + maxd + ' at (' + darkest[0] + ',' + darkest[1] + ') rgb(' +
            darkest[2] + ',' + darkest[3] + ',' + darkest[4] + ')   mean ' + (sum / n).toFixed(1));
