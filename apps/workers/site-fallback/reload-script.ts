// The only script of the offline page. Every minute, and when the tab becomes visible again, it
// asks the same address once more and reloads only when the answer is no longer a server error, so
// a reader is never interrupted while the origin is still down.
// The Worker puts this text into the page and computes the hash for the CSP from it, so the two
// cannot differ.
export const RELOAD_SCRIPT = `(() => {
  const check = () => {
    if (document.hidden) return;
    fetch(location.href, { method: 'HEAD', cache: 'no-store' })
      .then(response => {
        if (response.status < 500) location.reload();
      })
      .catch(() => undefined);
  };
  setInterval(check, 60000);
  document.addEventListener('visibilitychange', check);
})();`;
