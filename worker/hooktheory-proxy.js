// ============================================================
// Cloudflare Worker — Hooktheory proxy for "verse"
// ============================================================
// Hooktheory's API cannot be called from the browser (no CORS, and it
// needs credentials). This Worker holds the credentials, adds CORS
// headers, and relays the two trends endpoints the app uses:
//
//   GET /nodes?cp=1,4,5   →  likely next chords after a progression
//   GET /songs?cp=1,4,5   →  real songs that use a progression
//
// ── Deploy (one time) ───────────────────────────────────────
// 1. Create a free Hooktheory account: https://www.hooktheory.com
// 2. Create a free Cloudflare account: https://dash.cloudflare.com
// 3. Install Wrangler:        npm i -g wrangler
//    Login:                   wrangler login
// 4. From the worker/ folder: wrangler deploy
// 5. Set the two secrets (you'll be prompted for the value):
//      wrangler secret put HOOKTHEORY_USERNAME
//      wrangler secret put HOOKTHEORY_PASSWORD
//    (optional, to lock down who can call it)
//      wrangler secret put ALLOWED_ORIGIN   → https://nicolastrsch-eng.github.io
// 6. Copy the deployed URL (e.g. https://verse-hooktheory.<you>.workers.dev)
//    and paste it into the app's Hooktheory panel.
// ============================================================

let cachedToken = null;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

async function authenticate(env) {
  const res = await fetch('https://api.hooktheory.com/v1/users/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      username: env.HOOKTHEORY_USERNAME,
      password: env.HOOKTHEORY_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error('hooktheory-auth-' + res.status);
  const data = await res.json();
  return data.activkey || data.token || data.bearer;
}

async function callTrends(path, env) {
  if (!cachedToken) cachedToken = await authenticate(env);
  const url = 'https://api.hooktheory.com/v1/' + path;
  let res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + cachedToken, Accept: 'application/json' },
  });
  if (res.status === 401) {
    // token expired — re-auth once
    cachedToken = await authenticate(env);
    res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + cachedToken, Accept: 'application/json' },
    });
  }
  return res;
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    const kind = url.pathname.replace(/^\/+/, '').split('/')[0]; // 'nodes' | 'songs'
    if (kind !== 'nodes' && kind !== 'songs') {
      return new Response(JSON.stringify({ error: 'use /nodes or /songs' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const params = new URLSearchParams();
    const cp = url.searchParams.get('cp');
    if (cp) params.set('cp', cp);
    const page = url.searchParams.get('page');
    if (page) params.set('page', page);

    try {
      const res = await callTrends(`trends/${kind}?${params}`, env);
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
          ...cors,
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }
  },
};
