# TLA+ Web Editor: Project Overview & Goals

**Project Goal:** Build a fully client-side, browser-based TLA+ editor and model checker. 

Traditional TLA+ environments require installing Java, downloading the Toolbox, or managing command-line tools. This project aims to eliminate that friction by allowing users to write TLA+ specifications and run the TLC model checker directly in their web browser, without requiring a backend server or any local installations. By leveraging WebAssembly and running the JVM in the browser, we lower the barrier to entry for learning and using TLA+ through a zero-setup, accessible, and intuitive environment.

## Core Capabilities

- [x] **Client-Side Model Checking:** Run `tla2tools.jar` (which contains the TLC model checker) entirely in the browser using CheerpJ 4.2 (Java 11).
- [ ] **Modern Editing Experience:** Provide a robust, feature-rich code editor for writing TLA+ specifications.
- [ ] **Advanced Syntax Highlighting:** Deliver accurate, semantic syntax highlighting for TLA+ code using sophisticated AST-based parsing.
- [ ] **Interactive Outputs & Diagnostics:** Parse the output of the TLC model checker to show states, values, and error traces in a structured UI, and map errors directly back to the code editor.

---

# Technical Stack & Implementation Strategy

## Running Java in the Browser
We will execute `tla2tools.jar` directly in the browser using **CheerpJ 4.2+**. 
Unlike older versions, the latest CheerpJ architecture does not require statically "compiling" the JAR into WebAssembly ahead of time. Instead, it provides a WebAssembly-based JVM (Java 11) that executes unmodified `.jar` files in the browser using a JIT (Just-In-Time) compiler.

### Proof-of-Concept Usage
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cjrtnc.leaningtech.com/4.2/loader.js"></script>
</head>
<body>
    <button onclick="runTLC()">Run Model Checker</button>
    <pre id="console-output"></pre>

    <script>
        async function runTLC() {
            // 1. Initialize the JVM
            await cheerpjInit();

            // 2. Prepare your TLA+ Spec
            // Note: The backslash in the AND operator (/\) must be escaped in JS strings.
            const specContent = `
                ---- MODULE Hello ----
                EXTENDS Naturals
                VARIABLE x
                Init == x = 0
                Next == x' = x + 1
                Spec == Init /\\ [][Next]_x
                ====`;
            
            // Create a virtual file in the CheerpJ filesystem
            cheerpOSAddStringFile("/str/Hello.tla", specContent);
            
            // Create a basic config file
            cheerpOSAddStringFile("/str/Hello.cfg", "SPECIFICATION Spec\nINVARIANT x < 10");

            // 3. Redirect Java System.out/err to your HTML element (if desired)
            
            // 4. Run the JAR
            await cheerpjRunMain(
                "tlc2.TLC", 
                "/app/tla2tools.jar", // Path to your hosted jar
                "-config", "/str/Hello.cfg", 
                "/str/Hello.tla"
            );
        }
    </script>
</body>
</html>
```

## Editor Interface
We will build the core code editing experience using **[Monaco Editor](https://github.com/microsoft/monaco-editor)**, the industry-standard component powering VS Code. It offers a highly extensible, robust text manipulation environment inside the browser.

## TLA+ Syntax Highlighting
While Monaco natively relies on regex-based highlighting (via Monarch), TLA+ syntax is notoriously complex. For accurate parsing, we need an Abstract Syntax Tree (AST)-based approach. 

We will use **Tree-sitter**, which excels in a client-only browser setup by compiling parsers to WebAssembly:
- **[web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web)**: Runs the tree-sitter engine in the browser.
- **[tree-sitter-tlaplus](https://github.com/tlaplus/tree-sitter-tlaplus)**: The compiled TLA+ grammar parser (`.wasm`).
- **[monaco-tree-sitter](https://github.com/neeksandhes/monaco-tree-sitter)** (or a custom bridge): Integrates the Tree-sitter AST with the Monaco Editor for semantic tokenization.

## Parsing & Displaying TLC Output
Instead of dumping raw terminal text to the screen, we will explicitly parse the TLC text output to extract runtime states, variable value changes, error traces, and syntax errors. 

This parsed data will drive:
1. **Interactive Results UI**: A structured viewer (such as an error-state tree or step-by-step table) for traces, similar to the TLA+ VS Code extension.
2. **Editor Diagnostics**: Syntax and runtime errors will be mapped back to Monaco Editor markers, providing standard "red squiggly lines" at the exact line and column where the error occurred.

## Standard Library Support
TLA+ specifications frequently rely on standard modules (e.g., `Naturals`, `Sequences`, `TLC`). Since `tla2tools.jar` natively bundles these libraries, the CheerpJ JVM will naturally resolve them during the model checking phase without requiring extra network requests or manual file creation.

## File Management & Storage
Initially, the focus will be on isolated "virtual projects" stored safely in the browser's persistent storage (e.g., using `IndexedDB`). 
In later iterations, we can introduce local file system integration (using the File System Access API), allowing users to read and save files directly to their local disk without sending data to a backend server.

## Model Configuration (`.cfg`)
For the MVP, we will stick to a text-based configuration. Users will manually write `.cfg` code within a dedicated Monaco editor tab. The application will parse and pass this configuration text alongside the `.tla` code when invoking the model checker.

## Core Tech Stack
- [x] **Language:** **Vanilla TypeScript** to avoid heavy UI frameworks like React/Vue for the core layer. This keeps the footprint minimal and performance high, given much of the UI is canvas/editor driven.
- [x] **Build Tool:** **Vite**, offering exceptionally fast reloading and native-like support for WebAssembly and Web Worker setups.
- [x] **Editor:** **Monaco Editor**, offering a highly extensible and robust text manipulation environment inside the browser.
- [x] **Syntax Highlighting:** **Tree-sitter** (`web-tree-sitter` + `tree-sitter-tlaplus`) for AST-based semantic highlighting in Monaco.
- [x] **Model Checker Runtime:** **CheerpJ 4.2**, running the TLC `tla2tools.jar` in a WebWorker on Java 11 mode directly in the browser without a backend.

## Offline Support (Progressive Web App)
For the MVP, the editor will require an active internet connection to download the CheerpJ runtime and the `tla2tools.jar`. However, the architecture will be designed with Progressive Web App (PWA) patterns in mind. Eventually, Service Workers will cache all assets, allowing users to write and check models while completely disconnected from the internet.

---

# Architecture & Stability Considerations

## Non-Blocking Web Workers
TLC Model Checking is an intensely CPU- and memory-heavy process. To prevent the main browser UI (including the Monaco editor) from freezing, `tla2tools.jar` and the CheerpJ runtime will be executed inside a dedicated **Web Worker**. The main thread will communicate with the worker strictly via asynchronous message passing, ensuring a smooth typing experience even during long checks.

## Catching Infinite Runs (Safe Cancellation)
Model checks can theoretically run indefinitely or trigger state-space explosions. We must provide an immediate, reliable "Stop" function. Because TLC runs within an isolated Web Worker, cancellation is straightforward and safe: we simply call `worker.terminate()` to discard the thread and spin up a fresh Web Worker for the next execution. **[Implemented]**

## Memory Limits & Monitoring
Modern browsers impose strict memory limits on WebAssembly instances (typically around 2GB to 4GB depending on the browser/system architecture). 
To prevent the tab from silently crashing with an "Out of Memory" (OOM) error, we investigated configuring TLC with strict heap limits (via `-Xmx` or equivalent parameters). It was determined that CheerpJ leverages native WebAssembly memory allocation dynamically; thus, standard JVM memory formatting (`-Xmx`) is neither supported nor required for the `cheerpJRunMain` invocation. **[Implemented/Adjusted]**
Additionally, the UI should feature a **Memory Usage Indicator** to give users real-time feedback on how much memory their model is consuming.
