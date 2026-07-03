// Generates the .bin test files in ../tickets/ from real ESC/POS byte
// sequences (see ../../escpos-cheatsheet for the command reference).
// Run: node generate.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'tickets');
mkdirSync(OUT_DIR, { recursive: true });

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: Buffer.from([ESC, 0x40]),
  LF: Buffer.from([LF]),
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),
  UNDERLINE_OFF: Buffer.from([ESC, 0x2d, 0x00]),
  UNDERLINE_THIN: Buffer.from([ESC, 0x2d, 0x01]),
  UNDERLINE_THICK: Buffer.from([ESC, 0x2d, 0x02]),
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([ESC, 0x61, 0x02]),
  CUT_FULL: Buffer.from([GS, 0x56, 0x00]),
  CUT_PARTIAL: Buffer.from([GS, 0x56, 0x01]),
  charSize: (widthMult, heightMult) =>
    Buffer.from([GS, 0x21, (((widthMult - 1) & 0x0f) << 4) | ((heightMult - 1) & 0x0f)]),
  feed: (n) => Buffer.from([ESC, 0x64, n]),
};

function text(str) {
  return Buffer.from(str, 'ascii');
}

function build(...parts) {
  return Buffer.concat(parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))));
}

function write(name, buffer) {
  writeFileSync(join(OUT_DIR, name), buffer);
  console.log(`wrote ${name} (${buffer.length} bytes)`);
}

// 1. hello-world.bin — smallest possible real ticket
write(
  'hello-world.bin',
  build(
    CMD.INIT,
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    text('MY STORE'),
    CMD.LF,
    CMD.BOLD_OFF,
    CMD.ALIGN_LEFT,
    text('Item 1              $3.50'),
    CMD.LF,
    text('Item 2              $2.75'),
    CMD.LF,
    CMD.LF,
    text('Total               $6.25'),
    CMD.LF,
    CMD.LF,
    CMD.CUT_PARTIAL,
  ),
);

// 2. text-formatting.bin — bold / underline / alignment matrix
write(
  'text-formatting.bin',
  build(
    CMD.INIT,
    text('Normal text'),
    CMD.LF,
    CMD.BOLD_ON,
    text('Bold text'),
    CMD.LF,
    CMD.BOLD_OFF,
    CMD.UNDERLINE_THIN,
    text('Underline thin'),
    CMD.LF,
    CMD.UNDERLINE_THICK,
    text('Underline thick'),
    CMD.LF,
    CMD.UNDERLINE_OFF,
    CMD.ALIGN_CENTER,
    text('Centered'),
    CMD.LF,
    CMD.ALIGN_RIGHT,
    text('Right-aligned'),
    CMD.LF,
    CMD.ALIGN_LEFT,
    CMD.LF,
    CMD.CUT_PARTIAL,
  ),
);

// 3. character-size.bin — width/height multiplier matrix
write(
  'character-size.bin',
  build(
    CMD.INIT,
    CMD.charSize(1, 1),
    text('Normal size'),
    CMD.LF,
    CMD.charSize(2, 1),
    text('Double width'),
    CMD.LF,
    CMD.charSize(1, 2),
    text('Double height'),
    CMD.LF,
    CMD.charSize(2, 2),
    text('Double both'),
    CMD.LF,
    CMD.charSize(1, 1),
    CMD.LF,
    CMD.CUT_PARTIAL,
  ),
);

// 4. full-cut.bin / partial-cut.bin — isolate cut behavior for debugging
write('full-cut.bin', build(CMD.INIT, text('Full cut test'), CMD.LF, CMD.LF, CMD.CUT_FULL));
write('partial-cut.bin', build(CMD.INIT, text('Partial cut test'), CMD.LF, CMD.LF, CMD.CUT_PARTIAL));

// 5. feed-lines.bin — feed(n) without printing, useful to check dot-to-line math
write(
  'feed-lines.bin',
  build(CMD.INIT, text('Before feed'), CMD.LF, CMD.feed(5), text('After 5-line feed'), CMD.LF, CMD.LF, CMD.CUT_PARTIAL),
);

// 6. long-receipt.bin — stress test buffering/flow control with 60 lines
const items = Array.from({ length: 60 }, (_, i) => text(`Item ${String(i + 1).padStart(2, '0')}              $${(1 + i * 0.25).toFixed(2)}`));
write(
  'long-receipt.bin',
  build(
    CMD.INIT,
    CMD.ALIGN_CENTER,
    CMD.BOLD_ON,
    text('LONG RECEIPT STRESS TEST'),
    CMD.LF,
    CMD.BOLD_OFF,
    CMD.ALIGN_LEFT,
    ...items.flatMap((line) => [line, CMD.LF]),
    CMD.LF,
    CMD.CUT_PARTIAL,
  ),
);

// 7. accented-characters.bin — raw Latin-1 bytes to sanity-check the
// printer's default code page against accented characters (a very common
// real-world failure mode for Spanish/Portuguese/French receipts).
write(
  'accented-characters.bin',
  build(
    CMD.INIT,
    Buffer.from('Cafe con leche - Nino - Pina', 'latin1'),
    CMD.LF,
    Buffer.from('café con leche - niño - piña', 'latin1'),
    CMD.LF,
    CMD.LF,
    text('(second line uses raw Latin-1 accented bytes -'),
    CMD.LF,
    text('garbled output means your printer needs a'),
    CMD.LF,
    text('different code page — see escpos-cheatsheet)'),
    CMD.LF,
    CMD.LF,
    CMD.CUT_PARTIAL,
  ),
);

console.log('\nDone. See ../README.md for how to send these to a real printer.');
