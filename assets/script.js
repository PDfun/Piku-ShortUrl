(() => {
  const form = document.getElementById('shorten-form');
  const fieldRow = document.getElementById('field-row');
  const urlInput = document.getElementById('long-url');
  const aliasInput = document.getElementById('alias');
  const aliasWrap = document.getElementById('alias-input-wrap');
  const segRandom = document.getElementById('seg-random');
  const segCustom = document.getElementById('seg-custom');
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-msg');
  const result = document.getElementById('result');
  const resultPill = document.getElementById('result-pill');
  const resultSource = document.getElementById('result-source');
  const copyBtn = document.getElementById('copy-btn');
  const openBtn = document.getElementById('open-btn');
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  const clearHistoryBtn = document.getElementById('clear-history');
  const refreshBtn = document.getElementById('refresh-clicks');

  const STORAGE_KEY = 'piku:links';
  let useCustomAlias = false;

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
  }

  function shortUrlFor(code) {
    return `${location.origin}/${code}`;
  }

  function renderHistory() {
    const items = loadHistory();
    historyList.innerHTML = '';
    if (items.length === 0) {
      historyEmpty.classList.add('shown');
      return;
    }
    historyEmpty.classList.remove('shown');
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <span class="h-code">/${escapeHtml(item.code)}</span>
        <span class="h-url" title="${escapeHtml(item.url)}">${escapeHtml(item.url)}</span>
        <span class="h-clicks" data-code="${escapeHtml(item.code)}">${item.clicks ?? 0} clicks</span>
        <span class="h-actions">
          <button type="button" data-action="copy" data-code="${escapeHtml(item.code)}" aria-label="Copy short link">Copy</button>
          <button type="button" data-action="open" data-code="${escapeHtml(item.code)}" aria-label="Open short link">Open</button>
        </span>
      `;
      historyList.appendChild(row);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function addToHistory(code, url) {
    const items = loadHistory();
    items.unshift({ code, url, clicks: 0, createdAt: Date.now() });
    saveHistory(items);
    renderHistory();
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('shown');
  }

  function clearError() {
    errorMsg.textContent = '';
    errorMsg.classList.remove('shown');
  }

  segRandom.addEventListener('click', () => {
    useCustomAlias = false;
    segRandom.classList.add('active');
    segCustom.classList.remove('active');
    aliasWrap.classList.remove('shown');
    segRandom.setAttribute('aria-pressed', 'true');
    segCustom.setAttribute('aria-pressed', 'false');
  });

  segCustom.addEventListener('click', () => {
    useCustomAlias = true;
    segCustom.classList.add('active');
    segRandom.classList.remove('active');
    aliasWrap.classList.add('shown');
    segCustom.setAttribute('aria-pressed', 'true');
    segRandom.setAttribute('aria-pressed', 'false');
    aliasInput.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const url = urlInput.value.trim();
    const alias = useCustomAlias ? aliasInput.value.trim() : '';

    if (!url) {
      showError('Paste a link first.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Shrinking…';

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, alias }),
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Something went wrong. Try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Shrink →';
        return;
      }

      playSqueeze(() => {
        showResult(data.code, data.url);
        addToHistory(data.code, data.url);
        form.reset();
        urlInput.style.transform = '';
        urlInput.style.opacity = '';
        fieldRow.classList.remove('squeezing');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Shrink →';
        segRandom.click();
      });
    } catch (err) {
      showError('Could not reach Piku. Check your connection and try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Shrink →';
    }
  });

  function playSqueeze(done) {
    fieldRow.classList.add('squeezing');
    const finish = () => {
      urlInput.removeEventListener('transitionend', finish);
      done();
    };
    urlInput.addEventListener('transitionend', finish);
    // fallback in case transitionend doesn't fire (reduced motion etc.)
    setTimeout(finish, 500);
  }

  function showResult(code, url) {
    resultPill.textContent = shortUrlFor(code);
    resultSource.textContent = `→ ${url}`;
    openBtn.href = shortUrlFor(code);
    result.classList.remove('shown');
    // restart animation
    void result.offsetWidth;
    result.classList.add('shown');
    result.dataset.code = code;
  }

  copyBtn.addEventListener('click', () => copyText(resultPill.textContent, copyBtn));
  openBtn.addEventListener('click', (e) => {
    // let default navigation happen (opens in new tab via target set in HTML)
  });

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copied');
      }, 1500);
    }).catch(() => {
      showError('Could not copy — select and copy the link manually.');
    });
  }

  historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const code = btn.dataset.code;
    if (btn.dataset.action === 'copy') {
      copyText(shortUrlFor(code), btn);
    } else if (btn.dataset.action === 'open') {
      window.open(shortUrlFor(code), '_blank', 'noopener');
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });

  refreshBtn.addEventListener('click', async () => {
    const items = loadHistory();
    if (items.length === 0) return;
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing…';
    await Promise.all(items.map(async (item) => {
      try {
        const res = await fetch(`/api/info/${encodeURIComponent(item.code)}`);
        if (res.ok) {
          const data = await res.json();
          item.clicks = data.clicks ?? item.clicks;
        }
      } catch {
        /* ignore individual failures */
      }
    }));
    saveHistory(items);
    renderHistory();
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Refresh clicks';
  });

  renderHistory();
})();
