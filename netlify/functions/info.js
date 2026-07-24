import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  const parts = (event.path || '').split('/').filter(Boolean);
  const code = decodeURIComponent(parts[parts.length - 1] || '');

  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code' }) };
  }

  const store = getStore('links');
  const record = await store.get(code, { type: 'json' });

  if (!record) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, url: record.url, clicks: record.clicks || 0, createdAt: record.createdAt }),
  };
};
