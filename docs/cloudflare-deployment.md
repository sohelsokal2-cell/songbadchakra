# Cloudflare Deployment Guide — সংবাদচক্র

This guide documents the Cloudflare deployment setup using **OpenNext Cloudflare adapter v1.20.6**.

> [!IMPORTANT]
> Cloudflare deployment requires WSL (Windows Subsystem for Linux) for the build step on Windows, or you can run `npm run cf:build` from the GitHub CI environment. The Cloudflare Worker runtime itself works fine on any OS for preview/deploy after building.

---

## What's Configured

| File | Purpose |
|---|---|
| [open-next.config.ts](file:///d:/Newsportal/songbadchakra/open-next.config.ts) | OpenNext adapter entry point |
| [wrangler.jsonc](file:///d:/Newsportal/songbadchakra/wrangler.jsonc) | Cloudflare Workers runtime config |
| `package.json` scripts | `cf:build`, `cf:preview`, `cf:deploy` |

## Deployment Steps

### 1. Authenticate with Cloudflare

```powershell
npx wrangler login
```

### 2. Configure Secrets in Cloudflare

Run each command and enter the secret value when prompted:

```powershell
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

> [!CAUTION]
> NEVER put secrets in `wrangler.jsonc` as plaintext. Always use `wrangler secret put`.

### 3. Build for Cloudflare

```powershell
npm run cf:build
# or directly:
npx opennextjs-cloudflare build
```

> [!WARNING]
> This step is **not compatible with Windows natively** due to WASM path issues. Use WSL or a CI/CD pipeline (GitHub Actions) to run this step.

### 4. Preview Locally

```powershell
npm run cf:preview
# or:
npx wrangler dev
```

### 5. Deploy to Production

```powershell
npm run cf:deploy
# or:
npx opennextjs-cloudflare deploy
```

### 6. Connect Custom Domain

In Cloudflare Dashboard:
1. Workers & Pages → your worker → Settings → Domains & Routes
2. Add custom domain: `songbadchakra.com.bd`
3. HTTPS is automatic via Cloudflare

---

## Cache Rules (Cloudflare Dashboard)

Add these Cache Rules to prevent admin/API routes from being edge-cached:

| Route Pattern | Cache Setting |
|---|---|
| `songbadchakra.com.bd/admin/*` | Bypass Cache |
| `songbadchakra.com.bd/api/*` | Bypass Cache |

---

## Production Smoke Test Checklist

After deploying, verify:

- [ ] Homepage loads on mobile and desktop
- [ ] Category pages load and show articles
- [ ] Article detail page renders with correct JSON-LD
- [ ] Admin login works at `/admin/login`
- [ ] Admin can create, edit, publish, and delete an article
- [ ] Draft article is NOT visible at its public URL (returns 404)
- [ ] Breaking ticker updates on homepage after toggle
- [ ] Contact form submits and appears in admin inbox
- [ ] `/robots.txt` returns correct content
- [ ] `/sitemap.xml` lists published article URLs
- [ ] Unknown slug returns 404
- [ ] No route returns 500 or Node filesystem error
- [ ] Response headers include `X-Content-Type-Options: nosniff`

---

## Rollback Procedure

```powershell
# List previous deployments
npx wrangler deployments list

# Roll back to a specific deployment ID
npx wrangler rollback <deployment-id>
```
