# Stage 2: Monaco Editor Integration

## Description
This milestone integrates the Monaco Editor into the web layout to provide a robust code editing experience for both TLA+ specifications and their associated configuration files.

## What exactly needs to be built
1. Install the `monaco-editor` npm package.
2. Configure Vite to correctly bundle Monaco Editor workers.
3. Instantiate two Monaco Editor instances in the UI shell created in Stage 1:
   - One for the main `.tla` specification.
   - One for the `.cfg` model configuration.
4. Implement basic setup for both editors (e.g., applying a theme, setting font size, enabling line numbers).
5. For the MVP, default the editors to standard plaintext or generic code highlighting, as advanced TLA+ highlighting will be handled in the next stage.
6. Provide default boilerplate text for both editors (e.g., a simple `Hello World` TLA+ spec and a basic `.cfg` referencing the spec).
7. Implement basic resize handling so the editors adjust when the browser window is resized.

## How to check that it was built
1. Run the development server and open the application.
2. Verify that two distinct Monaco editors are functional (one for TLA+, one for CFG).
3. Try typing text, copying, pasting, and using standard shortcuts (like undo/redo) in both editors.
4. Verify the default boilerplate text is present upon load.
5. Resize the browser window and confirm the editors resize appropriately without breaking the layout.
