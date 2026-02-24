# Stage 2: Monaco Editor Integration

**Status: Completed**

## Description
This milestone integrates the Monaco Editor into the web layout to provide a robust code editing experience for both TLA+ specifications and their associated configuration files.

## What exactly needs to be built
- [x] 1. Install the `monaco-editor` npm package.
- [x] 2. Configure Vite to correctly bundle Monaco Editor workers.
- [x] 3. Instantiate two Monaco Editor instances in the UI shell created in Stage 1:
   - One for the main `.tla` specification.
   - One for the `.cfg` model configuration.
- [x] 4. Implement basic setup for both editors (e.g., applying a theme, setting font size, enabling line numbers).
- [x] 5. For the MVP, default the editors to standard plaintext or generic code highlighting, as advanced TLA+ highlighting will be handled in the next stage.
- [x] 6. Provide default boilerplate text for both editors (e.g., a simple `Hello World` TLA+ spec and a basic `.cfg` referencing the spec).
- [x] 7. Implement basic resize handling so the editors adjust when the browser window is resized.

## How to check that it was built
- [x] 1. Run the development server and open the application.
- [x] 2. Verify that two distinct Monaco editors are functional (one for TLA+, one for CFG).
- [x] 3. Try typing text, copying, pasting, and using standard shortcuts (like undo/redo) in both editors.
- [x] 4. Verify the default boilerplate text is present upon load.
- [x] 5. Resize the browser window and confirm the editors resize appropriately without breaking the layout.
