import { getStore } from '@netlify/blobs';

const ALIAS_RE = /^[a-zA-Z0-9_-]{3,30}$/;
// Unambiguous charset: no 0/O, 1/l/I
const CHARS = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const RESERVED = new Set(['api', 'assets', 'favicon.ico', 'index.html', '']);

function randomCode(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const rawUrl = (body.url || '').trim();
  let alias = (body.alias || '').trim();

  if (!rawUrl) {
    return json(400, { error: 'A URL is required.' });
  }
  if (rawUrl.length > 2048) {
    return json(400, { error: 'That URL is too long.' });
  }
  if (!isValidUrl(rawUrl)) {
    return json(400, { error: 'Enter a valid link starting with http:// or https://' });
  }

  const store = getStore('links');

  if (alias) {
    if (!ALIAS_RE.test(alias)) {
      return json(400, { error: 'Alias must be 3-30 characters: letters, numbers, - or _.' });
    }
    if (RESERVED.has(alias.toLowerCase())) {
      return json(400, { error: 'That alias is reserved. Try another.' });
    }
    const existing = await store.get(alias);
    if (existing) {
      return json(409, { error: 'That alias is already taken.' });
    }
  } else {
    let attempts = 0;
    let candidate = randomCode();
    while ((await store.get(candidate)) && attempts < 12) {
      candidate = randomCode();
      attempts++;
    }
    alias = candidate;
  }

  const record = {
    url: rawUrl,
    createdAt: new Date().toISOString(),
    clicks: 0,
  };

  await store.setJSON(alias, record);

  return json(200, { code: alias, url: rawUrl });
};
