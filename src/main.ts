import './style.css';
import { initEditors, layoutEditors } from './editor';

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
// Placeholder Run button handler
// ──────────────────────────────────────────────

function setupRunButton(): void {
  const btnRun = document.getElementById('btn-run');
  const outputContainer = document.getElementById('output-container');

  if (!btnRun || !outputContainer) return;

  btnRun.addEventListener('click', () => {
    // Clear placeholder
    outputContainer.innerHTML = '';

    const lines = [
      { text: 'TLC2 Model Checker — not yet connected', cls: 'info' },
      { text: '──────────────────────────────────────', cls: '' },
      { text: 'This is a placeholder. The CheerpJ integration', cls: '' },
      { text: 'will be added in a later stage.', cls: '' },
      { text: '', cls: '' },
      { text: '✓ UI Shell loaded successfully', cls: 'success' },
    ];

    lines.forEach((line, i) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = `output-line${line.cls ? ` ${line.cls}` : ''}`;
        div.textContent = line.text || '\u00A0';
        outputContainer.appendChild(div);
        outputContainer.scrollTop = outputContainer.scrollHeight;
      }, i * 80);
    });
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

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupResizeHandle();
  setupRunButton();
  setupWindowResize();
  initEditors();
});
