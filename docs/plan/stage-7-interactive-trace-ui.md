# Stage 7: Interactive Error Trace UI

## Description
When TLC finds a violation (like an invariant failure), it prints an "Error Trace" detailing the sequence of states that led to the error. This milestone replaces the raw text dump of this trace with a structured, interactive UI component.

## What exactly needs to be built
1. Extend the TLC output parser to detect the start and end of an "Error Trace" in the console output.
2. Parse each state block within the trace into a structured JSON/JavaScript object, extracting state numbers, action names, and the values of all variables at that state.
3. Build a UI component (e.g., a data table, an expandable tree view, or a step-by-step list) in the right/bottom pane to display the parsed error trace.
4. Ensure the UI clearly shows how variables change from one state to the next.
5. Hide or deprioritize the raw text console when an Error Trace is successfully parsed and displayed.

## How to check that it was built
1. Write a TLA+ specification with an invariant that will eventually be violated (e.g., `x < 5` where `Next == x' = x + 1`).
2. Click "Run".
3. Verify that TLC finds the error.
4. Verify that instead of just reading raw text, you see a clean UI component listing State 1, State 2, State 3, etc., up to the failure point, along with the variable values precisely isolated for each step.
