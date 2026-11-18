(() => {
  const root = document.documentElement;
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  const saved = () => localStorage.getItem('nj-theme');

  function applyTheme(theme, persist = false) {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = next;
    document.querySelectorAll('.theme-toggle').forEach(button => {
      const dark = next === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
      button.innerHTML = dark ? '☼ <span>Mode terang</span>' : '◐ <span>Mode gelap</span>';
    });
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = next === 'dark' ? '#101923' : '#122b4e';
    if (persist) localStorage.setItem('nj-theme', next);
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(saved() || (media?.matches ? 'dark' : 'light'));
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
    });
  });

  window.addEventListener('storage', event => {
    if (event.key === 'nj-theme') applyTheme(event.newValue || (media?.matches ? 'dark' : 'light'));
  });

  media?.addEventListener?.('change', event => {
    if (!saved()) applyTheme(event.matches ? 'dark' : 'light');
  });
})();
