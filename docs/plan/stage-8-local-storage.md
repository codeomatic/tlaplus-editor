# Stage 8: File Management & Virtual Projects

## Description
This milestone ensures users do not lose their work if they accidentally refresh the page or close the browser. It implements client-side persistence for the TLA+ code and configuration.

## What exactly needs to be built
1. Integrate browser `IndexedDB` (using a wrapper like `idb-keyval` or `localforage` for simplicity) or simply use `localStorage` if the data footprint remains small.
2. Implement an auto-save mechanism that periodically saves the contents of both the Monaco editors (`.tla` and `.cfg` files) to local storage. Alternatively, save whenever changes pause for a few seconds (debouncing).
3. On application startup, check local storage for existing project data. Process and load it into the editors if it exists instead of the defaults.
4. If no data exists, load the default boilerplate specifications.
5. *(Optional)* Add a simple UI indicator showing when the file was last "Saved locally".

## How to check that it was built
1. Open the application and delete the default boilerplate code.
2. Write a custom, unique TLA+ specification.
3. Wait for the auto-save to trigger.
4. Refresh the browser page.
5. Verify that your custom code is perfectly restored in the editors and was not reset to the default boilerplate.
