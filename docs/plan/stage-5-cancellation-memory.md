# Stage 5: Safe Cancellation and Memory Limits

## Description
This milestone ensures the application is stable and robust when dealing with infinite state spaces or highly complex models by implementing safe cancellation and JVM memory constraints.

## What exactly needs to be built
1. Implement the "Stop" button in the UI toolbar.
2. When the "Stop" button is clicked, the main thread should call `.terminate()` on the active TLC Web Worker, instantly killing the process.
3. Ensure the UI resets its state and is immediately ready to spin up a new Web Worker for subsequent runs without needing a page refresh.
4. Add memory heap limit arguments (e.g., `-Xmx1G` or similar, if supported by the CheerpJ implementation) when invoking `cheerpJRunMain` to prevent browser tab crashes from Out OF Memory errors.
5. *(Optional)* Add a basic UI indicator that updates based on model-checking status (e.g., "Running...", "Stopped", "Finished").

## How to check that it was built
1. Write a TLA+ specification that intentionally causes an infinite state space exploration (e.g., continually incrementing a variable without a bound in the invariant or state constraint).
2. Click "Run".
3. Verify the model checker starts outputting states continuously.
4. Click "Stop". Verify the output immediately ceases and the UI indicates the run was cancelled.
5. Click "Run" again. Verify a new run starts cleanly from the beginning without having to refresh the browser page.
