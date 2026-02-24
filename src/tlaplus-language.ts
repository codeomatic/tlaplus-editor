import * as monaco from 'monaco-editor';

// ──────────────────────────────────────────────
// Register TLA+ language with Monaco
// ──────────────────────────────────────────────

export const TLAPLUS_LANGUAGE_ID = 'tlaplus';
export const CFG_LANGUAGE_ID = 'cfg';

export function registerLanguages(): void {
    // Register TLA+ language
    monaco.languages.register({
        id: TLAPLUS_LANGUAGE_ID,
        extensions: ['.tla'],
        aliases: ['TLA+', 'tlaplus', 'TLA'],
    });

    monaco.languages.setLanguageConfiguration(TLAPLUS_LANGUAGE_ID, {
        comments: {
            lineComment: '\\*',
            blockComment: ['(*', '*)'],
        },
        brackets: [
            ['(', ')'],
            ['[', ']'],
            ['{', '}'],
            ['<<', '>>'],
        ],
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '<<', close: '>>' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: '(*', close: '*)' },
        ],
        surroundingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' },
        ],
    });

    // Register CFG language
    monaco.languages.register({
        id: CFG_LANGUAGE_ID,
        extensions: ['.cfg'],
        aliases: ['TLA+ Config', 'cfg'],
    });

    monaco.languages.setLanguageConfiguration(CFG_LANGUAGE_ID, {
        comments: {
            lineComment: '\\*',
            blockComment: ['(*', '*)'],
        },
        brackets: [
            ['(', ')'],
            ['[', ']'],
            ['{', '}'],
        ],
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"', notIn: ['string'] },
        ],
    });
}
