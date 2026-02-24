import * as monaco from 'monaco-editor';

// ──────────────────────────────────────────────
// Monaco worker environment
// ──────────────────────────────────────────────

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
    getWorker: () => new editorWorker(),
};

// ──────────────────────────────────────────────
// Default boilerplate content
// ──────────────────────────────────────────────

const DEFAULT_TLA_CONTENT = `---- MODULE Hello ----
EXTENDS Naturals

VARIABLE x

Init == x = 0

Next == x' = x + 1

Spec == Init /\\ [][Next]_x
====`;

const DEFAULT_CFG_CONTENT = `SPECIFICATION Spec
INVARIANT x < 10`;

// ──────────────────────────────────────────────
// Custom dark theme matching the existing UI
// ──────────────────────────────────────────────

const THEME_NAME = 'tlaplus-dark';

monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
        'editor.background': '#1c2333',
        'editor.foreground': '#e6edf3',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#8b949e',
        'editor.selectionBackground': '#263045',
        'editor.lineHighlightBackground': '#21283b',
        'editorCursor.foreground': '#58a6ff',
        'editorWidget.background': '#161b22',
        'editorWidget.border': '#30363d',
        'editorSuggestWidget.background': '#161b22',
        'editorSuggestWidget.border': '#30363d',
        'input.background': '#0d1117',
        'input.border': '#30363d',
        'scrollbarSlider.background': '#30363d80',
        'scrollbarSlider.hoverBackground': '#484f5880',
        'scrollbarSlider.activeBackground': '#8b949e80',
    },
});

// ──────────────────────────────────────────────
// Shared editor options
// ──────────────────────────────────────────────

const SHARED_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
    theme: THEME_NAME,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 14,
    lineHeight: 24,
    lineNumbers: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: false, // we handle layout manually for tab switching
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    bracketPairColorization: { enabled: true },
    guides: { indentation: true },
    wordWrap: 'off',
    tabSize: 4,
    insertSpaces: true,
};

// ──────────────────────────────────────────────
// Editor instances
// ──────────────────────────────────────────────

let tlaEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let cfgEditor: monaco.editor.IStandaloneCodeEditor | null = null;

/**
 * Initialize both Monaco editor instances into their containers.
 * Should be called once after DOM is ready.
 */
export function initEditors(): void {
    const tlaContainer = document.getElementById('tla-editor-container');
    const cfgContainer = document.getElementById('cfg-editor-container');

    if (!tlaContainer || !cfgContainer) {
        console.error('[editor] Could not find editor container elements.');
        return;
    }

    tlaEditor = monaco.editor.create(tlaContainer, {
        ...SHARED_OPTIONS,
        value: DEFAULT_TLA_CONTENT,
        language: 'plaintext',
    });

    cfgEditor = monaco.editor.create(cfgContainer, {
        ...SHARED_OPTIONS,
        value: DEFAULT_CFG_CONTENT,
        language: 'plaintext',
    });

    // Initial layout for the visible editor
    tlaEditor.layout();
}

/**
 * Re-layout all editor instances. Call after container resize or tab switch.
 */
export function layoutEditors(): void {
    tlaEditor?.layout();
    cfgEditor?.layout();
}

/**
 * Get the TLA+ editor content.
 */
export function getTlaContent(): string {
    return tlaEditor?.getValue() ?? '';
}

/**
 * Get the CFG editor content.
 */
export function getCfgContent(): string {
    return cfgEditor?.getValue() ?? '';
}
