# Thermal Printer Test Files

> Ready-made `.bin` files with real ESC/POS byte sequences, for testing thermal printers, printer drivers, and parsers — no need to hand-build test data yourself.

Part of the [PortixOne](https://github.com/PortixOne/portixone) knowledge network. Commands match [escpos-cheatsheet](https://github.com/PortixOne/escpos-cheatsheet) exactly — see [`scripts/generate.mjs`](scripts/generate.mjs) for how every file was built.

## Files

| File | Tests |
|---|---|
| [`tickets/hello-world.bin`](tickets/hello-world.bin) | Smallest real ticket — init, bold, align, cut |
| [`tickets/text-formatting.bin`](tickets/text-formatting.bin) | Bold, underline (thin/thick), left/center/right alignment |
| [`tickets/character-size.bin`](tickets/character-size.bin) | Normal / double-width / double-height / double-both text sizes |
| [`tickets/full-cut.bin`](tickets/full-cut.bin) | Isolated full-cut command |
| [`tickets/partial-cut.bin`](tickets/partial-cut.bin) | Isolated partial-cut command |
| [`tickets/feed-lines.bin`](tickets/feed-lines.bin) | `ESC d n` feed-without-printing behavior |
| [`tickets/long-receipt.bin`](tickets/long-receipt.bin) | 60-line receipt — buffering / flow-control stress test |
| [`tickets/accented-characters.bin`](tickets/accented-characters.bin) | Raw Latin-1 accented characters (é, ñ, ü) — common code-page failure mode for Spanish/Portuguese/French tickets |

Not included yet: barcode and QR code test files. The byte-level parameters for `GS ( k` (2D barcodes) vary enough by vendor that a wrong hand-built test file would be actively misleading — see [Contributing](#contributing) if you can verify one against real hardware.

## How to use these

**Windows, raw port (e.g. USB printer shared as a printer share or LPT):**
```powershell
Copy-Item -Path tickets\hello-world.bin -Destination \\.\LPT1
# or, for a shared printer:
copy /b tickets\hello-world.bin \\localhost\YourPrinterShareName
```

**Linux / macOS, raw USB or parallel device:**
```bash
cat tickets/hello-world.bin > /dev/usb/lp0
```

**Network printer (raw port 9100, most Epson/Star/Bixolon network printers):**
```bash
nc <printer-ip> 9100 < tickets/hello-world.bin
```

**Testing a parser instead of a real printer:** read the file as bytes and feed it to whatever ESC/POS parser/emulator you're building or testing — the sequences are documented byte-for-byte in [escpos-cheatsheet](https://github.com/PortixOne/escpos-cheatsheet), so you can assert on exact expected output.

## Regenerating / adding files

```bash
node scripts/generate.mjs
```

Everything is built from a small set of named byte constants in `generate.mjs` — add a new `write(name, build(...))` call to add a file.

## Contributing

Verified barcode/QR test files (with the printer model you tested against) are especially welcome — open a PR.

## License

MIT
