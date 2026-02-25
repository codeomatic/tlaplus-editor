import * as monaco from 'monaco-editor';

/**
 * Parses TLC text output to extract syntax and semantic errors
 * and convert them into Monaco Editor markers.
 */
export function parseTlcOutput(output: string): monaco.editor.IMarkerData[] {
    const markers: monaco.editor.IMarkerData[] = [];
    const lines = output.split('\n');

    // State machine flags
    let isParsingSyntaxError = false;
    let isParsingSemanticError = false;

    // Temporary storage for multi-line error messages
    let currentMarker: Partial<monaco.editor.IMarkerData> | null = null;
    let errorMessageLines: string[] = [];

    // Regex for matching TLC's syntax error location line:
    // "Encountered "x" at line 4, column 10 and token "="
    const syntaxRegex = /Encountered ".*?" at line (\d+), column (\d+)/;

    // Regex for matching TLC's semantic error location line:
    // "line 5, col 14 to line 5, col 14 of module Hello"
    const semanticRegex = /line (\d+), col (\d+) to line (\d+), col (\d+)/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 1. Check for Syntax Errors
        if (line.includes('***Parse Error***')) {
            isParsingSyntaxError = true;
            isParsingSemanticError = false;
            errorMessageLines = [];
            continue;
        }

        if (isParsingSyntaxError) {
            const syntaxMatch = line.match(syntaxRegex);
            if (syntaxMatch) {
                const lineNum = parseInt(syntaxMatch[1], 10);
                const colNum = parseInt(syntaxMatch[2], 10);

                // Usually the line before the "Encountered..." has the actual error reason
                const reason = i > 0 ? lines[i - 1].trim() : 'Syntax Error';

                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: reason,
                    startLineNumber: lineNum,
                    startColumn: colNum,
                    endLineNumber: lineNum,
                    endColumn: colNum + 1, // Minimum width of 1 char highlighted
                });
                isParsingSyntaxError = false;
            }
        }

        // 2. Check for Semantic Errors
        if (line.includes('Semantic errors:')) {
            isParsingSemanticError = true;
            isParsingSyntaxError = false;
            continue;
        }

        if (isParsingSemanticError) {
            // If we're already building a semantic error message, append lines
            if (currentMarker && !line.includes('====') && !line.includes('Linting of')) {
                // If it's a blank line and we haven't started collecting the message, ignore
                if (line.trim() !== '') {
                    errorMessageLines.push(line.trim());
                }

                // Peak ahead to see if next line is empty, indicating end of this error block
                if (i + 1 >= lines.length || (lines[i + 1].trim() === '' && errorMessageLines.length > 0)) {
                    currentMarker.message = errorMessageLines.join('\n');
                    markers.push(currentMarker as monaco.editor.IMarkerData);
                    currentMarker = null;
                    errorMessageLines = [];
                }
                continue;
            }

            // Look for the semantic location line
            const semanticMatch = line.match(semanticRegex);
            if (semanticMatch) {
                currentMarker = {
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: parseInt(semanticMatch[1], 10),
                    startColumn: parseInt(semanticMatch[2], 10),
                    endLineNumber: parseInt(semanticMatch[3], 10),
                    endColumn: parseInt(semanticMatch[4], 10) + 1, // Include the last char
                };
            }
        }
    }

    return markers;
}
