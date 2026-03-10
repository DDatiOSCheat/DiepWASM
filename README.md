# Diep.io WASM Patch

Preview:

![Preview](https://github.com/DDatiOSCheat/DiepWASM/blob/main/preview.png)

## About

**Diep.io WASM Patch** is a small project focused on **reverse engineering and patching the Diep.io WebAssembly (WASM)** binary.

The goal is to explore how the game works internally and experiment with modifying client-side behavior such as:

- Field of view (FOV)
- Game logic
- Internal functions
- Other WASM behaviors

This repository is mainly intended for **learning WebAssembly reversing and browser internals**.

## Features

- WASM binary analysis
- Function / opcode patching
- Runtime WASM loading
- Browser-based testing (Tampermonkey)

## Tech

- JavaScript
- WebAssembly (WASM)
- Tampermonkey
- wasm2wat / reverse engineering tools

## Usage

1. Obtain the original `diep.wasm`
2. Apply the patch or modifications
3. Load the patched WASM using a userscript or custom loader
4. Test in browser

## Disclaimer

This project is **not affiliated with Diep.io**.

It is provided **for educational and research purposes only**.

Use it responsibly.

## Author

tinysweet
## License

Educational use only
