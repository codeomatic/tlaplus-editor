# GitHub Pages Path Resolution Adjustment

## The Problem
The project was deployed to GitHub Pages under a subpath (`https://codeomatic.github.io/tlaplus-editor/`). However, some static assets were loaded dynamically from JavaScript using hardcoded absolute paths starting with `/` (e.g., `/tree-sitter.wasm`, `/tree-sitter-tlaplus.wasm`, and `/app/tla2tools.jar`).

Because GitHub pages hosts the project under the `/tlaplus-editor/` subpath instead of the domain root, requests to `/tree-sitter.wasm` resulted in `404 Not Found`. 

This caused two secondary issues:
1. Tree-Sitter failed to initialize, resulting in broken syntax highlighting.
2. The `tla2tools.jar` file could not be found by the JVM, which threw a `java.lang.ClassNotFoundException: tlc2.TLC` exception when the user pressed "Run".

## Solutions and Exploration

### Failed Approaches/Issues Discovered
*   **Web Worker Context Loss:** Web workers do not have access to the DOM (`document.baseURI` is undefined), which meant the worker couldn't independently figure out what the base directory path was to resolve the location of the `.jar` file.
*   **CheerpJ Virtual Filesystem (`/app`):** CheerpJ automatically mounts the server's root HTTP domain to `/app`. For example, `https://example.com/subpath/tla2tools.jar` gets mounted to `/app/subpath/tla2tools.jar`. Hardcoding `/app/tla2tools.jar` assumed the file was always at the root of the domain.
*   **Vite Base Path limitations:** While Vite's `base: './'` in `vite.config.ts` handles asset imports processed by the bundler, it cannot automatically fix raw string paths used inside dynamically executed JS logic.

### What Worked
1.  **Main Thread:** Instead of fetching `/tree-sitter.wasm`, we utilize the `URL` constructor with `document.baseURI` to robustly determine the correct runtime absolute URL:
    ```typescript
    new URL('tree-sitter.wasm', document.baseURI).href
    ```
2.  **Worker Communication:** We passed `document.baseURI` as a new `baseUrl` parameter in the `RUN` payload sent from the main thread to the TLC Web Worker.
3.  **CheerpJ Path Transformation:** Inside the worker, we used the `baseUrl` to calculate the exact `pathname` of the JAR file relative to the URL, and appended it to `/app`:
    ```typescript
    const jarPath = '/app' + new URL('tla2tools.jar', baseUrl).pathname;
    // yields: /app/tlaplus-editor/tla2tools.jar
    ```

## Lessons Learned
1.  **Deployments to Subpaths Break Absolute Paths:** Never assume the application will always be hosted at the root of a domain. Absolute paths like `/file.ext` will break when hosted at `/my-app/file.ext`.
2.  **Pass Context to Workers:** Web workers operate in an isolated scope. Environment context from the window/document must be explicitly passed down.
3.  **How CheerpJ Mounts Network Files:** We discovered how CheerpJ resolves the `/app` mounting logic; it maps to the exact URI pathname on the server, requiring us to dynamically insert the subpath prefix when resolving local `.jar` files.

## How to Prevent in the Future
*   **Test on a Subpath Locally:** During development, routinely verify path-resolution logic by configuring the Vite local dev server to serve the app from a subpath (e.g. `vite --base=/test-path/`). This would have caught the `404` errors before they reached production.
*   **URL Constructor Standard:** Adopt the use of `new URL('file', base).href` instead of string concatenation when resolving paths for manual `fetch()` requests or WebAssembly/JAR loading, as it reliably handles trailing and leading slashes.
