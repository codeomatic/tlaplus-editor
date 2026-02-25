import * as monaco from 'monaco-editor';
import { Parser, Language, Node as TSNode } from 'web-tree-sitter';
import { TLAPLUS_LANGUAGE_ID } from './tlaplus-language';

// ──────────────────────────────────────────────
// Semantic token type legend
// ──────────────────────────────────────────────

const TOKEN_TYPES = [
    'keyword',    // 0 — MODULE, EXTENDS, VARIABLE, IF, THEN, etc.
    'operator',   // 1 — ==, /\, \/, =>, etc.
    'string',     // 2 — "hello"
    'number',     // 3 — 42, 0xFF, etc.
    'comment',    // 4 — \* line comments, (* block comments *)
    'function',   // 5 — operator definition names
    'variable',   // 6 — identifier references
    'type',       // 7 — Nat, Int, Real, BOOLEAN, STRING sets
    'namespace',  // 8 — header/footer lines (----, ====)
];

const TOKEN_MODIFIERS: string[] = [];

const LEGEND: monaco.languages.SemanticTokensLegend = {
    tokenTypes: TOKEN_TYPES,
    tokenModifiers: TOKEN_MODIFIERS,
};

// Token type indices
const T_KEYWORD = 0;
const T_OPERATOR = 1;
const T_STRING = 2;
const T_NUMBER = 3;
const T_COMMENT = 4;
const T_FUNCTION = 5;
const T_VARIABLE = 6;
const T_TYPE = 7;
const T_NAMESPACE = 8;

// ──────────────────────────────────────────────
// Tree-sitter node type → token type mapping
// ──────────────────────────────────────────────

// Keywords (anonymous nodes — literal strings in grammar)
const KEYWORD_TEXTS = new Set([
    'EXTENDS', 'MODULE', 'VARIABLE', 'VARIABLES', 'CONSTANT', 'CONSTANTS',
    'IF', 'THEN', 'ELSE', 'LET', 'IN', 'CASE', 'OTHER',
    'CHOOSE', 'INSTANCE', 'ASSUME', 'ASSUMPTION', 'AXIOM',
    'THEOREM', 'LEMMA', 'PROPOSITION', 'COROLLARY',
    'LOCAL', 'LAMBDA', 'EXCEPT', 'WITH',
    'ENABLED', 'UNCHANGED', 'DOMAIN', 'SUBSET', 'UNION',
    'SF_', 'WF_',
    'PROOF', 'OBVIOUS', 'OMITTED', 'BY', 'QED',
    'HAVE', 'TAKE', 'SUFFICES', 'PICK', 'WITNESS', 'USE', 'HIDE', 'DEFINE',
    'NEW', 'STATE', 'ACTION', 'TEMPORAL',
    'TRUE', 'FALSE',
]);

// Named node types that map to specific token types
const NAMED_NODE_TOKEN_MAP: Record<string, number> = {
    // Comments
    'comment': T_COMMENT,
    'block_comment': T_COMMENT,

    // Strings
    'string': T_STRING,

    // Numbers
    'nat_number': T_NUMBER,
    'real_number': T_NUMBER,
    'binary_number': T_NUMBER,
    'hex_number': T_NUMBER,
    'octal_number': T_NUMBER,

    // Booleans
    'boolean': T_KEYWORD,

    // Built-in sets (type-like)
    'nat_number_set': T_TYPE,
    'int_number_set': T_TYPE,
    'real_number_set': T_TYPE,
    'boolean_set': T_TYPE,
    'string_set': T_TYPE,

    // Structure lines
    'header_line': T_NAMESPACE,
    'double_line': T_NAMESPACE,

    // Operators / symbols
    'def_eq': T_OPERATOR,
    'set_in': T_OPERATOR,
    'gets': T_OPERATOR,
    'all_map_to': T_OPERATOR,
    'maps_to': T_OPERATOR,
    'langle_bracket': T_OPERATOR,
    'rangle_bracket': T_OPERATOR,
    'prev_func_val': T_OPERATOR,

    // Identifiers (default)
    'identifier_ref': T_VARIABLE,
};

// Operator symbol node types
const OPERATOR_NODE_TYPES = new Set([
    'infix_op_symbol',
    'prefix_op_symbol',
    'postfix_op_symbol',
    'bound_infix_op',
    'bound_prefix_op',
    'bound_postfix_op',
    'bound_nonfix_op',
]);

// Operator literal symbols
const OPERATOR_SYMBOLS = new Set([
    '/\\', '\\/', '~', '\\lnot', '\\land', '\\lor', '\\neg',
    '=>', '<=>', '\\equiv', '\\implies',
    '=', '#', '/=', '\\in', '\\notin',
    '<', '>', '<=', '>=', '\\leq', '\\geq',
    '\\prec', '\\succ', '\\preceq', '\\succeq',
    '\\ll', '\\gg',
    '\\subset', '\\supset', '\\subseteq', '\\supseteq',
    '\\sqsubset', '\\sqsupset', '\\sqsubseteq', '\\sqsupseteq',
    '\\cup', '\\cap', '\\union', '\\intersect', '\\setminus',
    '+', '-', '*', '/', '%', '\\div', '\\mod',
    '^', '..', '\\X', '\\times',
    '\\o', '\\circ', '\\cdot',
    '@@', '==', '|->', '[]', '<>', '~>',
    '-+->', "'", '<<', '>>', ':>', '::', '|',
]);

// ──────────────────────────────────────────────
// Parser singleton
// ──────────────────────────────────────────────

let parser: Parser | null = null;

/**
 * Initialize web-tree-sitter and load the TLA+ grammar.
 */
export async function initTreeSitter(): Promise<void> {
    await Parser.init({
        locateFile: (scriptName: string) => {
            if (scriptName.includes('tree-sitter')) {
                return `/tree-sitter.wasm`;
            }
            return scriptName;
        },
    });

    parser = new Parser();

    const tlaLang = await Language.load('/tree-sitter-tlaplus.wasm');
    parser.setLanguage(tlaLang);

    // Register semantic tokens provider
    monaco.languages.registerDocumentSemanticTokensProvider(
        TLAPLUS_LANGUAGE_ID,
        new TLAPlusSemanticTokensProvider(),
    );
}

// ──────────────────────────────────────────────
// Semantic Tokens Provider
// ──────────────────────────────────────────────

interface TokenData {
    line: number;
    char: number;
    length: number;
    tokenType: number;
}

class TLAPlusSemanticTokensProvider
    implements monaco.languages.DocumentSemanticTokensProvider {
    onDidChange?: monaco.IEvent<void>;

    getLegend(): monaco.languages.SemanticTokensLegend {
        return LEGEND;
    }

    provideDocumentSemanticTokens(
        model: monaco.editor.ITextModel,
        _lastResultId: string | null,
        _token: monaco.CancellationToken,
    ): monaco.languages.SemanticTokens | null {
        if (!parser) return null;

        const text = model.getValue();
        const tree = parser.parse(text);
        if (!tree) return null;

        const tokens: TokenData[] = [];
        const errorMarkers: monaco.editor.IMarkerData[] = [];
        walkTree(tree.rootNode, tokens, errorMarkers);
        tree.delete();

        // Broadcast markers on-the-fly for real-time syntax error checking
        monaco.editor.setModelMarkers(model, 'tree-sitter', errorMarkers);

        // Sort tokens by position
        tokens.sort((a, b) => a.line - b.line || a.char - b.char);

        // Encode as delta-encoded uint32 array
        const data: number[] = [];
        let prevLine = 0;
        let prevChar = 0;

        for (const token of tokens) {
            const deltaLine = token.line - prevLine;
            const deltaChar = deltaLine === 0 ? token.char - prevChar : token.char;

            data.push(deltaLine, deltaChar, token.length, token.tokenType, 0);

            prevLine = token.line;
            prevChar = token.char;
        }

        return { data: new Uint32Array(data) };
    }

    releaseDocumentSemanticTokens(): void {
        // Nothing to release
    }
}

// ──────────────────────────────────────────────
// AST walker
// ──────────────────────────────────────────────

function walkTree(node: TSNode, tokens: TokenData[], errorMarkers: monaco.editor.IMarkerData[]): void {
    if (node.type === 'ERROR' || node.isMissing) {
        errorMarkers.push({
            severity: monaco.MarkerSeverity.Error,
            message: node.isMissing ? `Syntax Error: Missing expected ${node.type}` : 'Syntax Error: Unexpected code',
            startLineNumber: node.startPosition.row + 1,
            startColumn: node.startPosition.column + 1,
            endLineNumber: node.endPosition.row + 1,
            // Ensure width is at least 1 column so the red squiggly is visible
            endColumn: Math.max(node.startPosition.column + 2, node.endPosition.column + 1)
        });
    }

    const tokenType = getTokenType(node);

    if (tokenType !== null) {
        const startPos = node.startPosition;
        const endPos = node.endPosition;

        if (startPos.row === endPos.row) {
            tokens.push({
                line: startPos.row,
                char: startPos.column,
                length: endPos.column - startPos.column,
                tokenType,
            });
        } else {
            // Multi-line token (e.g., block comments): emit one token per line
            const text = node.text;
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.length === 0) continue;
                tokens.push({
                    line: startPos.row + i,
                    char: i === 0 ? startPos.column : 0,
                    length: line.length,
                    tokenType,
                });
            }
        }

        // Don't recurse into children of fully-tokenized leaf nodes
        return;
    }

    // Check for operator definition — highlight the name child
    if (
        node.type === 'operator_definition' ||
        node.type === 'function_definition' ||
        node.type === 'recursive_declaration'
    ) {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
            tokens.push({
                line: nameNode.startPosition.row,
                char: nameNode.startPosition.column,
                length: nameNode.endPosition.column - nameNode.startPosition.column,
                tokenType: T_FUNCTION,
            });
        }
    }

    // Recurse into children
    for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
            walkTree(child, tokens, errorMarkers);
        }
    }
}

function getTokenType(node: TSNode): number | null {
    const nodeType = node.type;

    // Named nodes
    if (node.isNamed) {
        const mapped = NAMED_NODE_TOKEN_MAP[nodeType];
        if (mapped !== undefined) return mapped;

        if (OPERATOR_NODE_TYPES.has(nodeType)) return T_OPERATOR;

        return null;
    }

    // Anonymous (literal) nodes — keywords and operators
    if (KEYWORD_TEXTS.has(nodeType)) return T_KEYWORD;
    if (OPERATOR_SYMBOLS.has(nodeType)) return T_OPERATOR;

    return null;
}
