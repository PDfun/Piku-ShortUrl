# Piku — shrink any link

A tiny, shareable URL shortener. Anyone with the site link can shorten a URL,
pick a random code or a custom alias, and share the result. Links are stored
server-side (Netlify Blobs), so they work for every visitor, not just you.

## What's inside

- `index.html`, `assets/` — the frontend (no build step, plain HTML/CSS/JS)
- `netlify/functions/shorten.js` — creates a short link (random or custom alias)
- `netlify/functions/redirect.js` — sends `piku-yoursite.netlify.app/CODE` to the real URL
- `netlify/functions/info.js` — returns click counts for a code
- `netlify.toml` — routes short codes and `/api/*` calls to the right function

## Deploy on Netlify (no CLI needed)

1. Go to [app.netlify.com](https://app.netlify.com) and log in.
2. Click **Add new site → Deploy manually**.
3. Drag the whole `piku` folder onto the upload area.
4. Wait for the build to finish — that's it, it's live.

Netlify will auto-detect `netlify.toml`, install `@netlify/blobs`, and deploy
the functions. No database setup, no environment variables, and no signup
needed for storage — Netlify Blobs is built in and scoped to your site
automatically.

### If you'd rather deploy from a Git repo (recommended for updates later)

1. Push this folder to a new GitHub repo.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build command: leave blank. Publish directory: `.`
4. Deploy.

## Using it

- Paste a link, hit **Shrink**, get a short URL back.
- Toggle **Custom alias** to pick your own code (letters, numbers, `-`, `_`, 3–30 characters).
- Anyone who visits your deployed site can shorten links — it's shared, public storage.
- "Your links this session" is just a local, per-browser list for convenience (stored in
  `localStorage`) so you can find links you made — it doesn't limit who else can use the tool.

## Notes & limits

- There's no login and no moderation — anyone with your site URL can create links.
  If you're sharing this publicly, keep an eye on it.
- Reserved words (`api`, `assets`, `favicon.ico`, `index.html`) can't be used as aliases.
- Rename the site (Site settings → Change site name) to get a nicer domain, e.g.
  `piku.netlify.app`, or attach a custom domain from Site settings → Domain management.
