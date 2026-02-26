/// <reference lib="webworker" />
/// <reference path="./cheerpj.d.ts" />

// Let TypeScript know we are in a Web Worker context
const ctx: Worker = self as any;

/**
 * Type definition for messages sent from UI to Worker
 */
export interface TLCWorkerRequest {
    type: 'RUN';
    tlaContent: string;
    cfgContent: string;
    baseUrl: string;
}

/**
 * Type definition for messages sent from Worker to UI
 */
export interface TLCWorkerResponse {
    type: 'STDOUT' | 'STDERR' | 'EXIT' | 'MEM';
    data?: string;
    exitCode?: number;
    memory?: number;
}

// Ensure init happens only once
let isCheerpJInitialized = false;

// We need to keep a buffer of stdout/stderr since CheerpJ console.log hooks
// are invoked whenever the JVM prints anything.
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Intercept console.log to capture TLC output
// Note: CheerpJ routes Java System.out to console.log by default.
console.log = function (...args: any[]) {
    // Send to main thread
    const message = args.map((a) => String(a)).join(' ');
    ctx.postMessage({ type: 'STDOUT', data: message });
    // Still log it for debugging
    originalConsoleLog.apply(console, args);
};

console.error = function (...args: any[]) {
    const message = args.map((a) => String(a)).join(' ');
    ctx.postMessage({ type: 'STDERR', data: message });
    originalConsoleError.apply(console, args);
};

console.warn = function (...args: any[]) {
    const message = args.map((a) => String(a)).join(' ');
    ctx.postMessage({ type: 'STDERR', data: message });
    originalConsoleWarn.apply(console, args);
};

// Listen for commands from the main thread
ctx.addEventListener('message', async (event: MessageEvent<TLCWorkerRequest>) => {
    const req = event.data;

    if (req.type === 'RUN') {
        try {
            await runTLC(req.tlaContent, req.cfgContent, req.baseUrl);
        } catch (error) {
            ctx.postMessage({ type: 'STDERR', data: `Worker error: ${error}` });
            ctx.postMessage({ type: 'EXIT', exitCode: 1 });
        }
    }
});

async function runTLC(tlaContent: string, cfgContent: string, baseUrl: string) {
    if (!isCheerpJInitialized) {
        ctx.postMessage({ type: 'STDOUT', data: 'Initializing CheerpJ JVM environment...\n' });

        // Import CheerpJ loader script synchronously into the worker
        // The path must be absolute or relative to the worker script's location (which in Vite is root level)
        importScripts('https://cjrtnc.leaningtech.com/4.2/loader.js');

        await cheerpjInit({
            // Hide the default progress bar
            enablePreciseTimeWorkaround: true,
            version: 11
        });
        isCheerpJInitialized = true;
    }

    // Extract module name from TLA content (e.g., "---- MODULE Hello ----")
    const match = tlaContent.match(/----\s*MODULE\s+(\w+)\s*----/);
    const moduleName = match ? match[1] : 'Spec';

    ctx.postMessage({ type: 'STDOUT', data: `Writing model specifications for module ${moduleName}...\n` });

    // Write TLA and CFG to CheerpJ's virtual in-memory filesystem
    cheerpOSAddStringFile(`/str/${moduleName}.tla`, tlaContent);
    cheerpOSAddStringFile(`/str/${moduleName}.cfg`, cfgContent);

    ctx.postMessage({ type: 'STDOUT', data: '\n==== Starting TLC ====\n\n' });

    let memInterval: number | undefined;
    memInterval = setInterval(() => {
        // Use non-standard performance.memory if available (Chrome/Edge)
        if ((performance as any).memory) {
            const usedMB = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
            ctx.postMessage({ type: 'MEM', memory: usedMB });
        }
    }, 1000);

    // Use CheerpJ's /app mount with the actual correct pathname derived from the base URL
    const jarPath = '/app' + new URL('tla2tools.jar', baseUrl).pathname;

    // Run the TLC jar
    const exitCode = await cheerpjRunMain(
        'tlc2.TLC',
        jarPath, // Virtual mount of our local public/tla2tools.jar
        '-metadir', '/files/states', // Use CheerpJ's writable IndexedDB filesystem for TLC metadata
        '-config', `/str/${moduleName}.cfg`,
        `/str/${moduleName}.tla`
    );

    if (memInterval) clearInterval(memInterval);

    ctx.postMessage({ type: 'STDOUT', data: `\n==== TLC Exited with code ${exitCode} ====\n` });
    ctx.postMessage({ type: 'EXIT', exitCode });
}
