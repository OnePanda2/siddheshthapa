/* The token exchange. About forty lines, and the only server this project has.
 *
 * WHY IT EXISTS AT ALL. GitHub's OAuth web flow ends with a one-time code that
 * has to be swapped for a token, and the swap requires the client secret. A
 * browser cannot hold a secret — anything shipped to the page is public the
 * moment it is shipped — so the swap has to happen somewhere the secret can
 * live. That is this file's entire job. It is not an authorisation server and
 * it decides nothing about who may write; GitHub does that, twice, and this
 * merely stands between them because a static page cannot keep a secret.
 *
 * IT REFUSES TO HAND A TOKEN TO THE WRONG PERSON. After the swap it asks
 * GitHub who the token belongs to, and returns nothing unless that is OWNER.
 * A token for anyone else would already be useless — they cannot push to the
 * repository — but there is no reason to mint one, and a refusal here is a
 * clearer answer than a failure five screens later.
 *
 * WHAT IT NEVER DOES: log the code, log the token, store either, or accept a
 * redirect_uri of its own choosing. The redirect is echoed back to GitHub,
 * which checks it against the app's registered list — so a stolen client id
 * pointed at someone else's page receives nothing.
 *
 * deploy: see worker/README.md
 */

const OWNER = 'OnePanda2';

/* Only these origins may call it. Registered redirect URIs already stop a code
 * from being issued to anyone else; this stops the exchange from being used as
 * an open proxy on top of that. */
const ALLOWED = [
  'https://onepanda2.github.io',
  'https://siddheshthapa.com',
  'https://www.siddheshthapa.com',
  'http://localhost:8777'
];

function cors(origin) {
  const ok = ALLOWED.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) }
  });

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
    if (!ALLOWED.includes(origin)) return json({ error: 'origin not allowed' }, 403, origin);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'expected JSON' }, 400, origin); }
    if (!body || !body.code) return json({ error: 'no code' }, 400, origin);

    /* the swap. The secret is read from the environment and never appears in
       this repository — see README for how it is set. */
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: body.code,
        redirect_uri: body.redirect_uri
      })
    });
    const data = await res.json();
    if (!data.access_token)
      return json({ error: data.error || 'exchange failed',
                    error_description: data.error_description || null }, 400, origin);

    /* and the refusal. Ask GitHub whose token this is before handing it back. */
    const who = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': 'Bearer ' + data.access_token,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'siddheshthapa-editor'
      }
    });
    const user = await who.json();
    if (!user || String(user.login).toLowerCase() !== OWNER.toLowerCase())
      return json({ error: 'this editor belongs to ' + OWNER }, 403, origin);

    return json({ access_token: data.access_token }, 200, origin);
  }
};
