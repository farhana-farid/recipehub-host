/* Generates the PWA icons (rounded terracotta tile + white plate) as real PNGs
   without any image library: raw RGBA pixel buffer -> zlib -> PNG chunks. */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size, draw) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x / (size - 1), y / (size - 1));
      const o = (y * size + x) * 4;
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = a;
    }
  }
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const inRing = (x, y, cx, cy, rOuter, rInner) =>
  inCircle(x, y, cx, cy, rOuter) && !inCircle(x, y, cx, cy, rInner);
const inRounded = (x, y, size, radius) => {
  const r = radius / size;
  const nx = Math.max(r - x, x - (1 - r), 0);
  const ny = Math.max(r - y, y - (1 - r), 0);
  return nx * nx + ny * ny <= r * r;
};

// Palette
const TERRA = [237, 125, 43, 255];
const TERRA_DEEP = [230, 81, 0, 255];
const WHITE = [255, 252, 247, 255];
const CLEAR = [0, 0, 0, 0];

function drawIcon(x, y) {
  if (!inRounded(x, y, 1, 0.22)) return CLEAR;
  // plate
  if (inCircle(x, y, 0.5, 0.52, 0.30)) {
    // inner terracotta bowl
    if (inCircle(x, y, 0.5, 0.52, 0.155)) return TERRA_DEEP;
    // steam curls: two small white cutouts above bowl
    if (inRing(x, y, 0.445, 0.30, 0.035, 0.018) && y < 0.36) return TERRA;
    if (inRing(x, y, 0.555, 0.30, 0.035, 0.018) && y < 0.36) return TERRA;
    return WHITE;
  }
  // highlight dot top-left
  if (inCircle(x, y, 0.30, 0.26, 0.035)) return TERRA_DEEP;
  return TERRA;
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png(size, drawIcon));
  console.log(`icon-${size}.png written`);
}
// Maskable: same art on a full-bleed square (safe zone is generous)
fs.writeFileSync(
  path.join(outDir, "icon-maskable-512.png"),
  png(512, (x, y) => {
    if (!inRounded(x, y, 1, 0.02)) return CLEAR;
    return drawIcon(x, y);
  })
);
console.log("icon-maskable-512.png written");
