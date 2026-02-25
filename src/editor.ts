import * as monaco from 'monaco-editor';
import { TLAPLUS_LANGUAGE_ID, CFG_LANGUAGE_ID } from './tlaplus-language';

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
    rules: [
        // Semantic token rules for Tree-sitter highlighting
        { token: 'keyword', foreground: '#ff7b72', fontStyle: 'bold' },
        { token: 'operator', foreground: '#ff7b72' },
        { token: 'string', foreground: '#a5d6ff' },
        { token: 'number', foreground: '#79c0ff' },
        { token: 'comment', foreground: '#8b949e', fontStyle: 'italic' },
        { token: 'function', foreground: '#d2a8ff' },
        { token: 'variable', foreground: '#ffa657' },
        { token: 'type', foreground: '#7ee787' },
        { token: 'namespace', foreground: '#58a6ff' },
    ],
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
    'semanticHighlighting.enabled': true,
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
        language: TLAPLUS_LANGUAGE_ID,
    });

    cfgEditor = monaco.editor.create(cfgContainer, {
        ...SHARED_OPTIONS,
        value: DEFAULT_CFG_CONTENT,
        language: CFG_LANGUAGE_ID,
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
 * Get the TLA+ editor model.
 */
export function getTlaModel(): monaco.editor.ITextModel | null {
    return tlaEditor?.getModel() ?? null;
}

/**
 * Get the CFG editor content.
 */
export function getCfgContent(): string {
    return cfgEditor?.getValue() ?? '';
}
