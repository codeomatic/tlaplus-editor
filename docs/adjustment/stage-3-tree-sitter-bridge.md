# Adjustment: Tree-sitter Monaco Bridge

## Problem Explanation

In the original stage 3 plan and `arch.md` proposal, the `monaco-tree-sitter` npm package was suggested as the bridge to connect the Tree-sitter parsed AST directly to the Monaco editor's highlighting system. 

However, during implementation, it became clear that `monaco-tree-sitter` has several significant drawbacks for this project:
1. **Webpack Centric**: The package is heavily tailored towards Webpack configurations. Our project uses Vite, and attempting to coerce `monaco-tree-sitter` into Vite's WASM loading flow would introduce unnecessary hacks and complexity.
2. **Missing TLA+ Grammar**: The package does not natively include or easily support the `tree-sitter-tlaplus` grammar without heavy configuration overrides.
3. **Maintenance**: The package is loosely maintained and introduces an unnecessary abstraction layer.

## Applied Solution

Instead of using the `monaco-tree-sitter` third-party wrapper, we wrote a **custom lightweight semantic token provider bridge** directly in `src/tree-sitter-highlight.ts`. 

- We used the official `web-tree-sitter` module (supported effectively by Vite).
- We loaded the official `tree-sitter-tlaplus.wasm` grammar.
- We implemented Monaco's native `monaco.languages.DocumentSemanticTokensProvider` interface. 
- The custom bridge parses the TLA+ code into an AST and manually walks the tree on every change, mapping explicit TLA+ grammar nodes (like `operator_definition`, `bound_infix_op`, and specific keyword symbols) exactly to our custom semantic tokens (keyword, operator, type, function).

This approach resulted in a clean, dependency-minimal solution (~150 lines of code) that perfectly fits our Vite architecture and provides complete control over the semantic token mapping for the intricate TLA+ syntax.
