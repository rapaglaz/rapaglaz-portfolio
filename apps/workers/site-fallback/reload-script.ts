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
