# Stage 1: Project Initialization and Basic UI Shell

## Description
This milestone focuses on scaffolding the core web application using the chosen technology stack and building the basic structural layout for the TLA+ web editor. It ensures the development environment is correctly set up for a Vanilla TypeScript and Vite project without unnecessary UI frameworks.

## What exactly needs to be built
1. Initialize a new Vite project using the Vanilla TypeScript template.
2. Clean up the default Vite boilerplate (styles, logos, main script).
3. Create the basic HTML layout structure in `index.html`. This should include:
   - A header/toolbar area with a "Run" button and a placeholder for a "Stop" button or memory indicator.
   - A main content area split into two horizontal or vertical panes.
   - The left pane should have containers for the TLA+ code editor and the CFG configuration editor (e.g., tabs or split view).
   - The right/bottom pane should have a container to display the console output or interactive traces.
4. Add basic structural CSS to ensure the layout takes up the full browser window and panes are correctly sized.

## How to check that it was built
1. Run `npm install` and `npm run dev` (or equivalent package manager commands).
2. Open the provided localhost URL in the browser.
3. Verify that the UI layout is visible, responsive to window resizing, and contains all the specified structural elements (editor placeholders, output placeholder, run button).
4. Verify there are no console errors in the browser developer tools.
