import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  const path = event.path || '/';
  const code = decodeURIComponent(path.replace(/^\/+/, '').split('?')[0]);

  if (!code) {
    return { statusCode: 302, headers: { Location: '/' }, body: '' };
  }

  const store = getStore('links');
  const record = await store.get(code, { type: 'json' });

  if (!record || !record.url) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: notFoundHtml(code),
    };
  }

  // best-effort click tracking, doesn't block the redirect
  try {
    record.clicks = (record.clicks || 0) + 1;
    await store.setJSON(code, record);
  } catch {
    /* ignore tracking failures */
  }

  return {
    statusCode: 301,
    headers: { Location: record.url, 'Cache-Control': 'no-cache' },
    body: '',
  };
};

function notFoundHtml(code) {
  const safe = String(code).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Link not found — Piku</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #EEF1EC; color: #1C2321; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; max-width: 420px; padding: 32px; }
    h1 { font-family: 'Space Grotesk', Arial, sans-serif; font-size: 26px; margin-bottom: 8px; }
    p { color: #5B6560; margin-bottom: 24px; }
    code { background: #fff; border: 1px solid #DCE1DA; padding: 2px 8px; border-radius: 6px; }
    a { display: inline-block; background: #F2542D; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="box">
    <h1>This link doesn't exist</h1>
    <p>Nothing is shortened at <code>/${safe}</code>. It may have never existed or was typed wrong.</p>
    <a href="/">Shrink a new link</a>
  </div>
</body>
</html>`;
}
