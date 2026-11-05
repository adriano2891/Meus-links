const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Raw RGBA pixel rows (each row has 1 filter byte (0) + width*4 bytes)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const center = size / 2;
  const radius = size * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded squircle / bookmark-link badge
      // Corner radius ~ 22% of size
      const cornerR = size * 0.22;
      const ax = Math.abs(x - center);
      const ay = Math.abs(y - center);
      const maxDist = size * 0.46;
      
      let inside = false;
      if (ax < maxDist && ay < maxDist) {
        if (ax > maxDist - cornerR && ay > maxDist - cornerR) {
          const cdx = ax - (maxDist - cornerR);
          const cdy = ay - (maxDist - cornerR);
          inside = (cdx * cdx + cdy * cdy) <= (cornerR * cornerR);
        } else {
          inside = true;
        }
      }

      if (inside) {
        // Gradient from bright blue #3B82F6 to rich indigo #6366F1
        const t = (x + y) / (width + height);
        const r = Math.round(59 + (99 - 59) * t);
        const g = Math.round(130 + (102 - 130) * t);
        const b = Math.round(246 + (241 - 246) * t);

        // Center link symbol in white
        const inCenterHole = Math.abs(dx) < size * 0.16 && Math.abs(dy) < size * 0.16;
        const inCenterRing = (dist < size * 0.26) && (dist > size * 0.14);

        if (inCenterRing) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', zlib.deflateSync(rawData));
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

[16, 48, 128].forEach(size => {
  const png = generatePng(size);
  fs.writeFileSync(path.join(__dirname, '..', 'extension', 'icons', `icon${size}.png`), png);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'extension', 'icons', `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
});
