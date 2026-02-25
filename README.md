# TLA+ Web Editor

A fully client-side, browser-based TLA+ editor and model checker.

Traditional TLA+ environments require installing Java, downloading the Toolbox, or managing command-line tools. This project eliminates that friction by allowing users to write TLA+ specifications and run the TLC model checker directly in their web browser, without requiring a backend server or any local installations.

## Features (In Progress)

- **Client-Side Model Checking:** Runs `tla2tools.jar` via CheerpJ right in the browser.
- **Modern Editing:** Provides a robust code editing experience powered by Monaco Editor.
- **Semantic Highlighting:** Accurate TLA+ syntax highlighting using Tree-sitter AST parsing.
- **Safe Cancellation:** Supports stopping the model checker mid-run securely by discarding the isolated Web Worker thread.
- **Memory Monitoring:** Real-time visibility into the memory usage of the running TLC process (Chromium-based browsers only).
- **Zero-Setup:** Opens and works without downloading JVMs or toolchains.

## Technology Stack

- **Vanilla TypeScript** to keep a minimal footprint and maximum performance.
- **Vite** for fast module bundling, dev server, and web worker setups.
- **Monaco Editor** for a VS Code-like editing experience directly in the browser.
- **Tree-sitter** (`web-tree-sitter`) for fast, robust parsing of TLA+ grammar.
- **CheerpJ 4.2** to run the Java-based TLC model checker directly in the browser.

## Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) (version 18+ recommended) and `npm` installed.

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

> **Note on WASM assets**: 
> - The `public/tree-sitter.wasm` file is omitted from version control. It is automatically copied from the `web-tree-sitter` npm module into the `public/` directory via a `postinstall` script.
> - The `public/tree-sitter-tlaplus.wasm` file *is* committed to the repository to keep the developer experience frictionless (avoiding cross-platform build issues or requiring developers to install Emscripten/C compilers). It was downloaded from the official [tree-sitter-tlaplus GitHub releases](https://github.com/tlaplus-community/tree-sitter-tlaplus/releases).

### Running Locally

To start the development server:

```bash
npm run dev
```

Then open `http://localhost:5173/` in your browser.

### Building for Production

To build the static HTML/CSS/JS files for production deployment:

```bash
npm run build
```

The output will be generated in the `dist` directory, which can be deployed to any static static hosting service (e.g., GitHub Pages, Vercel, Netlify).

### Preview Production Build

To preview the built production files locally:

```bash
npm run preview
```
