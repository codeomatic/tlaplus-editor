# Stage 6: TLC Output Parsing and Editor Diagnostics

## Description
This milestone improves the developer experience by moving away from raw text logs for errors. It parses the TLC output to identify syntax and runtime errors and visually maps them back into the Monaco Editor.

## What exactly needs to be built
1. Write a parsing module that intercepts the text stream from the TLC Web Worker.
2. Identify specific error patterns in the TLC output (e.g., "Syntax error at line X, column Y" or other standard TLC error structures).
3. Extract the line number, column number, and error message from the parsed text.
4. Use the Monaco Editor API (`monaco.editor.setModelMarkers`) to create error markers based on the extracted coordinates.
5. Ensure these markers show up as red squiggly lines in the `.tla` editor, and hovering over them displays the extracted TLC error message.
6. Make sure to clear previous markers whenever a new run is initiated.

## How to check that it was built
1. Introduce a deliberate syntax error in the `.tla` editor (e.g., a misspelled keyword or missing operator).
2. Click "Run".
3. Once TLC fails and outputs the syntax error, verify that a red squiggly line appears at the exact line and position of the error in the editor.
4. Hover over the squiggly line and verify the popup shows the correct error message from TLC.
