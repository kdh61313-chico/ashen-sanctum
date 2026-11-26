// Developer-tools guard. A web page can't truly stop a determined user from opening the
// browser's developer tools, but it can block the usual shortcuts and the context menu,
// notice when docked tools are open, and cover the game until they're closed.
export function installGuard({ onOpen, onClose } = {}) {
  const isTouch = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;

  // 1) shortcuts: F12, Ctrl/Cmd+Shift+I/J/C/K, Ctrl/Cmd+U (view source), Ctrl/Cmd+S
  addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (e.key === 'F12' || (mod && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) || (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k)) || (mod && ['u', 's'].includes(k) && !e.shiftKey)) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
  }, true);
  // 2) right-click menu (has "Inspect")
  addEventListener('contextmenu', (e) => { if (!e.target.closest('input, textarea')) e.preventDefault(); }, true);
  // 3) no dragging images out of the page
  addEventListener('dragstart', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); }, true);

  if (isTouch) return;
  // 4) detection: docked tools shrink the page (undocked windows can't be seen from here)
  let base = null, open = false;
  const rebase = () => { base = { w: outerWidth - innerWidth, h: outerHeight - innerHeight, dpr: devicePixelRatio }; };
  rebase();
  addEventListener('resize', () => { if (devicePixelRatio !== base.dpr) rebase(); });
  addEventListener('fullscreenchange', () => setTimeout(rebase, 400));
  const check = () => {
    if (document.fullscreenElement) return;
    const dw = (outerWidth - innerWidth) - base.w, dh = (outerHeight - innerHeight) - base.h;
    const now = dw > 200 || dh > 200;
    if (now !== open) { open = now; (open ? onOpen : onClose)?.(); }
  };
  setInterval(check, 1000);
}
