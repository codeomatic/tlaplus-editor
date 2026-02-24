import './style.css';
import { initEditors, layoutEditors, getTlaContent, getCfgContent } from './editor';
import { registerLanguages } from './tlaplus-language';
import { initTreeSitter } from './tree-sitter-highlight';

import type { TLCWorkerRequest, TLCWorkerResponse } from './tlcWorker';

// ──────────────────────────────────────────────
// Tab switching for editor pane
// ──────────────────────────────────────────────

function setupTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('#editor-pane .tab');
  const containers: Record<string, HTMLElement | null> = {
    tla: document.getElementById('tla-editor-container'),
    cfg: document.getElementById('cfg-editor-container'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      if (!targetTab) return;

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Show matching container, hide others
      Object.entries(containers).forEach(([key, el]) => {
        el?.classList.toggle('active', key === targetTab);
      });

      // Monaco needs a layout call when its container becomes visible
      layoutEditors();
    });
  });
}

// ──────────────────────────────────────────────
// Resize handle for pane splitting
// ──────────────────────────────────────────────

function setupResizeHandle(): void {
  const handle = document.getElementById('resize-handle');
  const editorPane = document.getElementById('editor-pane');
  const outputPane = document.getElementById('output-pane');
  const workspace = document.getElementById('workspace');

  if (!handle || !editorPane || !outputPane || !workspace) return;

  let isDragging = false;

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;

    const workspaceRect = workspace.getBoundingClientRect();
    const offset = e.clientX - workspaceRect.left;
    const totalWidth = workspaceRect.width;
    const handleWidth = handle.offsetWidth;

    // Clamp between 20% and 80%
    const minPx = totalWidth * 0.2;
    const maxPx = totalWidth * 0.8;
    const clampedOffset = Math.max(minPx, Math.min(maxPx, offset));

    editorPane.style.flex = 'none';
    editorPane.style.width = `${clampedOffset - handleWidth / 2}px`;

    outputPane.style.flex = 'none';
    outputPane.style.width = `${totalWidth - clampedOffset - handleWidth / 2}px`;

    // Re-layout editors as pane resizes
    layoutEditors();
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

// ──────────────────────────────────────────────
// Run button handler & Web Worker management
// ──────────────────────────────────────────────

let tlcWorker: Worker | null = null;

function setupRunButton(): void {
  const btnRun = document.getElementById('btn-run') as HTMLButtonElement | null;
  const btnStop = document.getElementById('btn-stop') as HTMLButtonElement | null;
  const outputContent = document.getElementById('output-content');
  const emptyState = document.getElementById('output-empty-state');
  const outputPane = document.getElementById('output-pane');

  if (!btnRun || !btnStop || !outputContent || !emptyState || !outputPane) return;

  btnRun.addEventListener('click', () => {
    const tlaContent = getTlaContent();
    const cfgContent = getCfgContent();

    if (!tlaContent.trim()) {
      alert('TLA+ specification is empty.');
      return;
    }

    // Hide empty state, show content area, and clear previous output
    emptyState.style.display = 'none';
    outputContent.style.display = 'block';
    outputContent.textContent = 'Starting TLC Worker...\n';

    // Update button states
    btnRun.disabled = true;
    btnStop.disabled = false;

    // Terminate existing worker if any
    if (tlcWorker) {
      tlcWorker.terminate();
    }

    // Spawn new classic worker (to support importScripts for CheerpJ)
    tlcWorker = new Worker(new URL('./tlcWorker.ts', import.meta.url));

    tlcWorker.onmessage = (e: MessageEvent<TLCWorkerResponse>) => {
      const res = e.data;
      if (res.type === 'STDOUT' || res.type === 'STDERR') {
        if (res.data) {
          outputContent.textContent += res.data;
          // Auto-scroll to bottom
          outputPane.scrollTop = outputPane.scrollHeight;
        }
      } else if (res.type === 'EXIT') {
        btnRun.disabled = false;
        btnStop.disabled = true;
        tlcWorker?.terminate();
        tlcWorker = null;
      }
    };

    tlcWorker.onerror = (err) => {
      outputContent.textContent += `\n[Worker Error] ${err.message}\n`;
      btnRun.disabled = false;
      btnStop.disabled = true;
      tlcWorker?.terminate();
      tlcWorker = null;
    };

    // Send the RUN command with the code
    const req: TLCWorkerRequest = {
      type: 'RUN',
      tlaContent,
      cfgContent,
    };
    tlcWorker.postMessage(req);
  });

  btnStop.addEventListener('click', () => {
    if (tlcWorker) {
      tlcWorker.terminate();
      tlcWorker = null;
      outputContent.textContent += '\n\n[TLC Execution Cancelled by User]\n';
    }
    btnRun.disabled = false;
    btnStop.disabled = true;
  });
}

// ──────────────────────────────────────────────
// Window resize handler
// ──────────────────────────────────────────────

function setupWindowResize(): void {
  window.addEventListener('resize', () => {
    layoutEditors();
  });
}

// ──────────────────────────────────────────────
// Initialize
// ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupResizeHandle();
  setupRunButton();
  setupWindowResize();

  // Register TLA+ and CFG languages before creating editors
  registerLanguages();

  // Initialize Tree-sitter highlighting (non-fatal if WASM fails to load)
  try {
    await initTreeSitter();
  } catch (err) {
    console.warn('[tree-sitter] Failed to initialize syntax highlighting:', err);
  }

  initEditors();
});
