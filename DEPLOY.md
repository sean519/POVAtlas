# Deploying to Vercel + connecting POVatlas.com

This is a static Vite app (no backend), so deployment is just a static build.
Vercel auto-detects Vite; `vercel.json` is already included.

---

## A. Move the project to another computer

Copy the **whole project folder EXCEPT** these (they're regenerated / machine‑specific):

- `node_modules/` (run `npm install` to recreate)
- `dist/` (run `npm run build` to recreate)
- `.vite-out.log`, `.vite-err.log`, `.claude/`

A ready-made clean zip is created at `world map/../povatlas-source.zip`
(i.e. `F:\povatlas-source.zip`) — it already excludes the folders above.

On the new computer:

```bash
# 1. Install Node.js 18+ from https://nodejs.org (if not installed)
# 2. Unzip, then inside the project folder:
npm install
npm run dev      # local preview at http://localhost:5180
```

---

## B. Put the code on GitHub

```bash
# inside the project folder (git is already initialized with a first commit)
# create an EMPTY repo on github.com first (no README), then:
git remote add origin https://github.com/<your-username>/povatlas.git
git branch -M main
git push -u origin main
```

> If git asks you to sign in, use the GitHub login window / a Personal Access
> Token. On a fresh machine set your identity once:
> `git config --global user.name "Your Name"` and
> `git config --global user.email "you@example.com"`.

---

## C. Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New… → Project → Import** your `povatlas` repo.
3. Vercel auto-detects **Vite**. Leave defaults:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **Deploy**. In ~1 minute you get a live URL like
   `povatlas.vercel.app`.

Every future `git push` to `main` redeploys automatically.

> Prefer no GitHub? Install the CLI: `npm i -g vercel`, then run `vercel`
> in the project folder and follow the prompts (`vercel --prod` to publish).

---

## D. Connect your domain POVatlas.com

1. In your Vercel project → **Settings → Domains → Add**.
2. Enter `povatlas.com` and also add `www.povatlas.com` (Vercel will offer to
   redirect www → root, accept it).
3. Vercel shows the DNS records to set. At your domain registrar (where you
   bought POVatlas.com), add them:
   - **Root `povatlas.com`** → an **A record** to `76.76.21.21`
     *(use the exact value Vercel shows you — it can change)*
   - **`www`** → a **CNAME** to `cname.vercel-dns.com`
   - *Easiest option:* if your registrar supports it, just change the domain's
     **nameservers** to Vercel's (Vercel will list them) — then it manages DNS
     for you.
4. Wait for DNS to propagate (minutes to a couple of hours). Vercel issues a
   free HTTPS certificate automatically. Done — `https://povatlas.com` is live.

---

## E. Live scores backend (`/api/live-scores`)

The app auto-fetches live World Cup scores. There is a serverless route at
`api/live-scores.ts` (a Vercel **Edge function**) that calls **API-Football**
first and falls back to the free **TheSportsDB**. Vercel auto-detects the
`api/` folder — no extra config.

To turn it on:

1. Get an **API-Football** key (https://www.api-football.com — free tier
   available; for sustained live polling a paid tier is recommended).
2. In your Vercel project → **Settings → Environment Variables**, add:
   - **Name:** `API_FOOTBALL_KEY`  **Value:** your key  (all environments)
3. Redeploy (push, or **Deployments → Redeploy**).

The key is read **only** server-side (`process.env.API_FOOTBALL_KEY`) and never
reaches the browser. **Until this is set up** (e.g. while the site is still
served as a plain static build), the front-end automatically falls back to
calling TheSportsDB directly, so scores still work — just without the
API-Football data quality / events.

> Local test: `npm i -g vercel`, then `vercel dev` runs the function at
> `http://localhost:3000/api/live-scores` (set `API_FOOTBALL_KEY` in `.env`).

## Notes

- The app loads flags (flagcdn), map tiles (CARTO/OpenStreetMap), country
  borders (GitHub) and live scores (see §E) over HTTPS at runtime.
- To change the browser tab title, edit `<title>` in `index.html`.
- Only secret needed is `API_FOOTBALL_KEY` (optional — see §E).
