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
 * which checks it against the app's registered list, so a code cannot be
 * DELIVERED to someone else's page.
 *
 * AND THE LINE BELOW IS THE ONLY THING HOLDING THE DOOR. This file used to
 * claim the registered redirect URI meant "a stolen client id receives
 * nothing", and the config file said the same. It is half true and the wrong
 * half to rely on. A client id is public by construction — ours is sitting in
 * data/editor-config.json — and anyone may take it to GitHub, authorise the
 * app against their OWN account, land on the registered callback in their own
 * browser and read a perfectly valid code out of the address bar. Registration
 * controls where a code is delivered. It does not control who can obtain one.
 *
 * So the owner check further down is not a convenience that saves someone five
 * screens. It is the whole security boundary of this project: it is what makes
 * a code anybody can mint worth nothing. Weaken it — to "any authenticated
 * user", or to a path that returns a token when the /user call fails — and the
 * editor starts handing out tokens for a repository it does not own.
 *
 * deploy: see worker/README.md
 */

const OWNER = 'OnePanda2';

/* WHICH ORIGINS MAY CALL IT — AND THIS IS NOT A SECURITY CONTROL.
 * Origin is a header, and a header is whatever the client says it is: curl
 * sends any value it likes. What this actually does is stop a BROWSER on
 * another page from reading the response, which is worth having and is all
 * CORS was ever for. It is not what stops the exchange being used as an open
 * proxy — the owner check is. Said plainly here because the previous note
 * credited this list with work it does not do. */
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

    /* THE REFUSAL, AND THE SECURITY BOUNDARY OF THIS PROJECT.
       Ask GitHub whose token this is before handing it back. Anyone can obtain
       a valid code for this client id — see the note at the top of the file —
       so this is what makes one worthless. It fails closed by construction: if
       the /user call errors, user.login is undefined, String() makes it the
       text "undefined", and the comparison refuses. Do not replace String()
       with an optional chain that yields undefined on both sides. */
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
