# The token exchange

The only server this project has, and it exists for one reason: GitHub's OAuth
web flow ends with a code that must be swapped for a token, the swap needs the
client secret, and a browser cannot keep a secret. Everything else — who may
publish, what is allowed into the store, when the site rebuilds — is decided by
GitHub and by the workflow, not here.

It is free to run. Cloudflare's Workers free tier is 100,000 requests a day and
this will use a handful a week.

---

## Deploying it

**1. Install the CLI** (one line, in PowerShell, from anywhere):

```bash
npm install -g wrangler
```

**2. Sign in to Cloudflare.** This opens a browser; create a free account if
you do not have one.

```bash
wrangler login
```

**3. From the `worker` folder**, publish it:

```bash
cd "F:\Projects\Siddhesh Thapa\worker"
wrangler deploy
```

It prints a URL like `https://siddheshthapa-auth.<your-subdomain>.workers.dev`.
**Keep that URL** — it goes into the editor's config in step 5.

**4. Give it the client secret.** This is the only place the secret goes. It is
stored by Cloudflare, encrypted, and is never written into this repository:

```bash
wrangler secret put GITHUB_CLIENT_SECRET
```

It will ask you to paste the secret. Paste it and press Enter. If you have lost
it, generate a new one on the OAuth app page — regenerating invalidates the old
one, which is fine because nothing else uses it.

**5. Tell the editor where it is.** Put the URL from step 3 into
`data/editor-config.json` as the `exchange` value, then rebuild and push:

```bash
node tools/build-v02.js
git add -A
git commit -m "Point the editor at its token exchange"
git push origin main
```

That is the whole setup. The Sign in button then completes the round trip
instead of falling back to a pasted token.

---

## What it refuses

- Any origin not in `ALLOWED` — so it cannot be used as an open exchange proxy.
- Any request that is not a POST carrying a `code`.
- **Any token that does not belong to `OnePanda2`.** After the swap it asks
  GitHub whose token it minted and returns nothing if the answer is anyone
  else. Such a token would already be useless — its holder cannot push to the
  repository — but there is no reason to mint one, and refusing here gives a
  clear answer instead of a failure five screens later.

It never logs the code or the token, and never stores either.

---

## Tokens expire, deliberately

The OAuth app was registered with **"Expire user access tokens"** left on, so a
token dies after eight hours. If a device of yours is lost or a token is
captured, it stops working the same day rather than lasting forever. The cost
is that the editor asks you to sign in again roughly once a day, which is the
right trade for a thing that can publish in your name.

When a token has expired the editor notices on its next call to GitHub, says
so, and signs out.

---

## If you would rather not run this at all

The editor works without it. With `exchange` left empty it says the round trip
is unavailable and offers to take a fine-grained personal access token instead,
stored in that one browser and sent only to `api.github.com`.

That is a real option, not a consolation: it removes this server entirely. The
trade is that the token lives in browser storage until it expires, rather than
being minted fresh per session — which is why the OAuth path is the one worth
having if you intend to write from more than one device.
