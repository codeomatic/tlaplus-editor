# TLA+ Web Editor

A fully client-side, browser-based TLA+ editor and model checker.

Traditional TLA+ environments require installing Java, downloading the Toolbox, or managing command-line tools. This project eliminates that friction by allowing users to write TLA+ specifications and run the TLC model checker directly in their web browser, without requiring a backend server or any local installations.

## Features (In Progress)

- **Client-Side Model Checking:** Runs `tla2tools.jar` via CheerpJ right in the browser.
- **Modern Editing:** Provides a robust code editing experience powered by Monaco Editor.
- **Zero-Setup:** Opens and works without downloading JVMs or toolchains.

## Technology Stack

- **Vanilla TypeScript** to keep a minimal footprint and maximum performance.
- **Vite** for fast module bundling, dev server, and web worker setups.
- **Monaco Editor** for a VS Code-like editing experience directly in the browser.

## Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) (version 18+ recommended) and `npm` installed.

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

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
