# Publishing this to your GitHub portfolio

The repository is already initialised and committed. You need three things:
a repo on GitHub, one push, and one setting.

## 1. Create the repository

Either on github.com — **New repository**, name it `spendlens-ai-spend-intelligence`,
**public**, and do **not** initialise it with a README, .gitignore or licence
(this repo already has all three) — or with the GitHub CLI:

```bash
gh repo create spendlens-ai-spend-intelligence --public --source=. --remote=origin --push
```

If you used `gh repo create` with `--push`, skip to step 3.

## 2. Push

From inside this folder:

```bash
git remote add origin https://github.com/YOUR-USERNAME/spendlens-ai-spend-intelligence.git
git branch -M main
git push -u origin main
```

## 3. Turn on Pages

**Settings → Pages → Build and deployment → Source: `GitHub Actions`.**

That is the only setting to change. The workflow in `.github/workflows/deploy.yml`
runs on every push to `main`, builds the site, and publishes it. The first run
takes about a minute; watch it under the **Actions** tab.

Your site will be at:

```
https://YOUR-USERNAME.github.io/spendlens-ai-spend-intelligence/
```

The build passes the repository name to Vite as the base path automatically, so
nothing needs editing if you rename the repo — just push again.

## 4. Two small edits worth making

- **`README.md`** — replace the four `YOUR-USERNAME` placeholders in the links at
  the top so the badges point at your live site.
- **`LICENSE`** — the copyright line says `Aryak Ravi`. Change it if you would
  rather it said something else.

The in-app "Source" and "View the code" links need no editing: they derive the
repository URL from whatever GitHub Pages host is serving the site.

## Troubleshooting

**The Actions run fails at `npm ci`.** Delete `package-lock.json`, run
`npm install` locally, and commit the regenerated lockfile.

**The site loads but every asset 404s.** The base path and the repo name have
diverged. The workflow sets `BASE_PATH=/${{ github.event.repository.name }}/`,
so this only happens if you deploy by some other route — build with
`BASE_PATH=/your-repo-name/` explicitly.

**A deep link 404s.** It should not: routing uses `HashRouter` precisely because
GitHub Pages has no rewrite rule. If you switch to `BrowserRouter`, you will
need a `404.html` fallback.

**Custom domain.** Build with `BASE_PATH=/`, add a `CNAME` file to `public/`,
and set the domain under Settings → Pages.
