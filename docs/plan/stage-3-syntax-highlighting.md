# Stage 3: Advanced TLA+ Syntax Highlighting

## Description
This milestone implements accurate, semantic syntax highlighting for TLA+ by integrating Tree-sitter. This moves beyond simple regex-based highlighting to provide deep understanding of the language grammar within the browser.

## What exactly needs to be built
- [x] Add dependencies for `web-tree-sitter`.
- [x] Obtain or compile the `tree-sitter-tlaplus` WASM file and serve it as a static asset in the Vite project.
- [x] Integrate `monaco-tree-sitter` (or write a custom bridge script) to connect the Tree-sitter parsed AST with Monaco Editor's semantic token provider.
- [x] Map the TLA+ AST nodes (e.g., operators, keywords, variables, state transitions) to Monaco Editor color themes.
- [x] Ensure the Tree-sitter WASM is initialized properly via JavaScript before the Monaco editor attempts to highlight the code.

## How to check that it was built
1. Paste a moderately complex TLA+ specification into the `.tla` editor.
2. Verify that the code is highlighted with distinct colors for keywords (e.g., `MODULE`, `VARIABLES`, `EXTENDS`), operators (e.g., `/\`, `\/`, `=>`), identifiers, and comments.
3. Verify that the highlighting remains accurate even for multi-line comments or complex nested expressions, which regex parsers typically fail to handle.
4. Check the browser console to ensure there are no errors related to loading the WASM file or initializing Tree-sitter.
