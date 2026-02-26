# Development & Coding Standards

This document outlines the coding standards, patterns, and learned best practices to be observed when developing the TLA+ Web Editor project. Following these guidelines ensures code consistency, prevents regressions, and maintains compatibility across different deployment environments.

## 1. Path Resolution & URL Constructor Standard

**Context:** The project may be deployed to subdirectories (e.g., GitHub Pages at `https://domain.com/tlaplus-editor/`). Absolute string paths (like `/tree-sitter.wasm`) break when not hosted at the domain root.

**Standard:** 
*   **NEVER** use string literals for absolute paths when fetching assets dynamically in JavaScript or WebAssembly loaders.
*   **ALWAYS** use the native `URL` constructor along with `document.baseURI` (or `import.meta.url`) to guarantee paths resolve robustly relative to the deployment environment.

```typescript
// ❌ BAD
const wasmUrl = '/tree-sitter.wasm';
const jarUrl = '/tla2tools.jar';

// ✅ GOOD
const wasmUrl = new URL('tree-sitter.wasm', document.baseURI).href;
```

## 2. Web Worker Context Isolation

**Context:** Web Workers execute in an isolated global scope from the main browser thread. They inherently lack access to the DOM, which means `document.baseURI` or `window.location` are unavailable or behave differently.

**Standard:**
*   Any environmental context (such as the deployment `baseURI`, UI configuration, or domain structure) required by a worker **MUST** be explicitly passed as properties inside the message payloads sent from the main thread.

```typescript
// ❌ BAD (inside worker)
const selfUrl = window.location.origin; // window is undefined

// ✅ GOOD 
// Main thread sends: { type: 'RUN', baseUrl: document.baseURI }
// Worker handles:
const toolUrl = new URL('tla2tools.jar', req.baseUrl).href;
```

## 3. CheerpJ Virtual Filesystem (`/app`)

**Context:** CheerpJ operates a virtual Linux-like filesystem in the browser. It maps network server resources under a virtual `/app` directory, exactly mirroring the full network URI path. For example, a file hosted at `https://example.com/myapp/tool.jar` is accessible to the JVM at `/app/myapp/tool.jar`, NOT just `/app/tool.jar`.

**Standard:**
*   Calculate the correct CheerpJ path by parsing the base URL's `pathname` instead of hardcoding the `/app/filename` combination.

```typescript
// ❌ BAD
const jarPath = '/app/tla2tools.jar';

// ✅ GOOD
const jarPath = '/app' + new URL('tla2tools.jar', baseUrl).pathname;
```

## 4. UI Layout & Editor Lifecycle (Monaco & Resizing)

**Context:** The Monaco Editor is heavily optimized and does not automatically observe container size changes when hidden, nor does it perfectly track CSS flexbox layout shifts natively.

**Standard:**
*   You **MUST** manually invoke the editor's update cycle by calling `layoutEditors()` (or `.layout()`) whenever:
    1.  The browser window resizes.
    2.  The split-pane drag handle is moved.
    3.  A hidden editor tab is made active and visible.

## 5. Vanilla TypeScript and DOM Querying

**Context:** This project intentionally uses vanilla TypeScript without heavy UI abstraction frameworks like React or Vue. 

**Standard:**
*   **DOM Null Checks:** `document.getElementById` and similar selector queries can return `null`. Always verify that a queried `HTMLElement` exists before attaching event listeners or mutating its properties.
*   **Decoupled Logic:** Prevent fat event listeners by separating UI binding from business logic. Keep parsing, tree-sitter manipulation, and JVM worker orchestration in discrete, modular files (e.g., `outputParser.ts`, `tlcWorker.ts`, `tree-sitter-highlight.ts`).
