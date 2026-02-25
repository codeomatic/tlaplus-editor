# Stage 5: Memory Limits & CheerpJ

During the implementation of Stage 5, we investigated adding memory heap limits (`-Xmx1G`) to prevent "Out Of Memory" tab crashes for infinite state spaces in TLC running under CheerpJ.

**Findings:**
1. Unlike the standard `java` CLI tool which takes JVM arguments (`-Xmx`) *before* the main class name, the `cheerpJRunMain(className, classPath, ...args)` API only accepts arguments that are passed directly to the `main(String[] args)` method of the target class.
2. CheerpJ 4.2+ memory management relies on native WebAssembly memory allocation. The browser automatically controls the memory limit for the WASM instance and will dynamically allocate and free memory according to standard WASM specs.
3. Therefore, standard JVM memory arguments like `-Xmx1G` are not supported and are not needed by `cheerpJRunMain` or `cheerpjInit`. The browser's WASM engine manages memory limits automatically.

We have implemented the UI cancellation and state reset capability ("Stop" button and worker termination) which functions as a reliable defense against infinitely running model check jobs, fulfilling the core goal of this milestone.

## Memory Usage Indicator Findings

While standard JVM memory arguments (`-Xmx`) are not applicable, we attempted to track actual memory usage of the Web Worker running TLC to populate a "Memory Usage Indicator" in the UI.

**Findings:**
1. CheerpJ does not natively expose the Java heap size or WebAssembly linear memory boundaries back to JavaScript in a standardized cross-browser way.
2. We implemented a polling mechanism using the non-standard Chrome/Edge API `performance.memory.usedJSHeapSize` inside the Web Worker. This tracks the total JavaScript garbage-collected memory alongside the WebAssembly linear heap used by CheerpJ.
3. **Browser Compatibility:** This API works exclusively in Chromium-based browsers (Google Chrome, Microsoft Edge, Brave, etc.). In these browsers, the UI successfully receives `MEM` messages and updates the MB display and visual progress bar dynamically.
4. **Fallback:** In other environments (Firefox, Safari, or automated environments like Playwright WebKit), this API is restricted inside Web Workers and returns `undefined`. In these cases, our implementation safely handles the limitation and gracefully falls back to displaying "—" in the indicator.

Overall, the memory indicator functionality is structurally complete, but live memory reporting relies entirely on the end-user utilizing a Chromium-based browser natively.
