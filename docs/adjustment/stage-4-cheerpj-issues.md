# Stage 4 Adjustments: CheerpJ Web Worker Issues and Solutions

During the implementation of Stage 4 (running `tla2tools.jar` via CheerpJ in a Web Worker), several significant technical hurdles were discovered. This document outlines the problems and the applied solutions.

## 1. Web Worker `importScripts` Network Error

**Problem:** 
The initial implementation used `{ type: 'module' }` when instantiating the Web Worker in `main.ts` because it's a modern standard. However, the CheerpJ loader (`loader.js`) relies on the classical `importScripts()` function to dynamically load its components. Using `importScripts()` inside an ES module worker throws an error in browsers: `TypeError: Module scripts don't support importScripts()`.

**Solution:**
We switched the worker instantiation back to a classic Web Worker by removing the `{ type: 'module' }` argument. Vite natively supports bundling classic workers via the `new Worker(new URL(..., import.meta.url))` syntax, which correctly resolves the TypeScript file into a bundled JS file while preserving the ability to use `importScripts('https://cjrtnc.leaningtech.com/4.2/loader.js')`.

## 2. Cross-Origin HTTP Headers for SharedArrayBuffer

**Problem:**
Modern versions of CheerpJ heavily rely on WebAssembly multi-threading features built on top of `SharedArrayBuffer` to provide high performance and Java thread compatibility. Browsers block the use of `SharedArrayBuffer` unless the serving page opts into a strict Cross-Origin Isolation policy. Without these headers, the browser blocked the Web Worker from communicating with the CheerpJ CDN, throwing a `net::ERR_BLOCKED_BY_RESPONSE` exception.

**Solution:**
We updated `vite.config.ts` to explicitly provide the necessary security headers during local development:
```javascript
server: {
    headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
    }
}
```

## 3. Java Version Compatibility

**Problem:**
When the JVM finally booted, CheerpJ threw a `Unsupported class` exception when attempting to parse `tlc2.TLC`:
`Required Java version 11, but CheerpJ is currently in Java 8 mode.`
Older versions of CheerpJ provided a Java 8 environment by default, but the `tla2tools.jar` (version 1.8.0 release) requires at least Java 11.

**Solution:**
We updated the CheerpJ loader to the latest `4.2` release and passed the `{ version: 11 }` argument into the `cheerpjInit` call inside `tlcWorker.ts`, successfully instructing the runtime to boot a Java 11 WebAssembly environment.

## 4. Virtual Filesystem Write Permissions

**Problem:**
TLC naturally needs to write state definitions, trace outputs, and metadata into a directory (usually called `states`). By default, CheerpJ exposes a `/str/` virtual filesystem hook strictly for read-only string variables (used to pass our models to TLC) and a standard `/tmp/` directory. However, TLC failed and exited because of an inability to create directories deeper inside these read-only areas (`util.Assert$TLCRuntimeException: TLC could not make a directory`).

**Solution:**
CheerpJ provides a writable virtual filesystem backed by the browser's persistent IndexedDB storage, mounted at `/files/`. We appended `-metadir /files/states` to the arguments passed to `cheerpjRunMain`. This allows TLC to cleanly write state data into the browser's persistent storage without fatal filesystem IO errors.

## 5. TLA+ Module Naming Requirement

**Problem:**
Initially, the worker hardcoded the virtual filename as `/str/Spec.tla`. However, the TLA+ parser explicitly requires that the filename must exactly match the module name declared inside the file (e.g., `---- MODULE Hello ----` must exist in `Hello.tla`). Running the `Hello` module out of a virtual `Spec.tla` file immediately caused parse failures.

**Solution:**
We added regex logic to `tlcWorker.ts` to dynamically parse the module name from the editor's text content. The worker now dynamically constructs the paths (e.g., `/str/Hello.tla` and `/str/Hello.cfg`) and correctly passes these matching virtual filenames into the `cheerpRunMain` call.
