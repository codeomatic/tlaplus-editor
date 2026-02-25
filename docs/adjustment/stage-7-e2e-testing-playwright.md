# Stage 7: E2E Testing with Playwright - Adjustment

## The Approach
We initially decided to use Playwright for End-to-End (E2E) testing of the TLA+ Web Editor to verify the features implemented from Stage 1 through Stage 6. Playwright was chosen because it provides a real browser environment, which was considered necessary for testing Web Workers, CheerpJ (for running TLC in the browser), and the Monaco Editor with its Tree-sitter integration.

## What Was Tried
1. Configured Playwright to automatically start the Vite dev server (`npm run dev`) and run tests against `http://localhost:5173`.
2. Created a test suite (`tests/editor.spec.ts`) covering:
   - Initial UI loading and Monaco editor initialization (smoke tests).
   - Tree-sitter syntax highlighting (checking for specific DOM classes).
   - TLC execution, including verifying the standard output stream, running state, and safe cancellation via the "Stop" button.
   - Real-time syntax error diagnostics (typing bad syntax and checking for Monaco's error squigglies).
   - TLC output parsing and semantic error diagnostics.
3. Attempted multiple methods to inject TLA+ specifications into the Monaco editor for testing:
   - Playwright's native `page.keyboard.type()` (too slow and flaky).
   - The Clipboard API via `navigator.clipboard.writeText()` (blocked by browser security policies in test environments).
   - Evaluating javascript directly on the page to access `window.monaco` (failed due to Vite's module isolation and timing issues).
   - Simulating user input using Playwright's `locator.fill()` on Monaco's hidden textarea (failed due to Monaco's event handling and DOM structure).
   - Exposing a dedicated testing hook (`window.__E2E_SET_TLA_CONTENT__`) from the application code to bypass UI interactions.

## What Was Achieved
- We successfully set up the Playwright testing harness and integrated it with the Vite build process.
- Basic smoke tests and tests for simple interactions (like clicking the "Run" and "Stop" buttons) succeeded.
- We confirmed the ability of Playwright to read DOM updates from the application, such as layout changes and button states.

## Lessons Learned
1. **Monaco Editor is Hostile to E2E Input:** The Monaco editor's complex DOM structure (using hidden textareas, absolute positioning, and custom event handling) makes it extremely difficult to reliably simulate user typing or directly inject text using standard E2E testing tools like Playwright.
2. **Timing and Asynchrony:** The application relies heavily on asynchronous initialization (Monaco engine, Tree-sitter WASM, CheerpJ JVM). Playwright's implicit waits often timed out because the exact moment these systems became ready was hard to observe from the DOM alone.
3. **CheerpJ Overhead:** Starting the CheerpJ JVM within the Web Worker takes a significant, variable amount of time (sometimes over 30-60 seconds in the test environment). This caused test timeouts when waiting for TLC results, leading to flaky tests.
4. **Brittle Selectors:** Relying on specific DOM classes (like `.mtk9` or `.view-lines span` for Monaco, or `.squiggly-error`) proved brittle. Monaco dynamically generates these class names depending on the theme and content, causing tests to break easily.
5. **High Maintenance Cost:** The effort required to work around these E2E limitations (e.g., adding test-specific hooks to production code) outweighed the benefits of having E2E tests at this stage, leading to a slow and frustrating development loop.

## Proposed Alternative Approach

Instead of relying strictly on full-browser E2E testing, we should adopt a **"Subcutaneous Testing" and Unit Testing** approach. This involves testing the core logic of the application just below the UI layer, combined with component-level tests.

1. **Unit Testing Core Logic (Vitest/Jest):**
   - **Output Parser:** We can unit test `src/outputParser.ts` comprehensively by feeding it various raw string outputs from TLC (success, syntax errors, semantic errors, deadlocks) and asserting that the correct diagnostic objects (line numbers, messages) are produced. This requires zero browser overhead.
   - **TLC Worker Logic:** We can mock the CheerpJ interface and test the `tlcWorker.ts` message handling (RUN, STOP, EXIT, STDOUT parsing) in isolation.

2. **Component/Integration Testing (Vitest + DOM Environment like jsdom/happy-dom):**
   - Test UI updates by asserting on state changes rather than fighting Monaco. For instance, we can test that clicking the "Run" button updates the application's internal state (e.g., disabling the button, setting the status to "Running..."), by mocking `getTlaContent()`.

3. **Manual / Semi-Automated UI Verification:**
   - Keep the complex integration (Monaco + Tree-sitter + CheerpJ) verified through manual testing or a much simpler, highly constrained Playwright smoke test that merely checks if the page loads without console errors, rather than trying to simulate full user workflows.

This alternative approach will be significantly faster to execute, vastly less flaky, and will pinpoint errors in the logic directly without being obfuscated by UI rendering quirks or CheerpJ startup times.
