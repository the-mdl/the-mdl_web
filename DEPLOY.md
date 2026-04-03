# Cloudflare Pages Deployment Runbook

This runbook covers deploying the public site (`the-mdl.com`) and admin portal (`admin.the-mdl.com`) to Cloudflare Pages. Both are Vite+React SPAs in this monorepo.

---

## 1. Prerequisites

- [ ] Cloudflare account with the `the-mdl.com` zone active
- [ ] GitHub repo `the-mdl/the-mdl_web` accessible from that Cloudflare account
- [ ] Supabase anon key available (Dashboard → Settings → API → `anon` / `public` key)

---

## 2. Create Cloudflare Pages Project — Public Site

1. Go to **Cloudflare Dashboard → Pages → Create a project → Connect to Git**
2. Select repository: **`the-mdl/the-mdl_web`**
3. Configure build settings:

| Setting | Value |
|---------|-------|
| Project name | `the-mdl-public` |
| Production branch | `main` |
| Root directory (Advanced) | `packages/public` |
| Build command | `npm install --legacy-peer-deps && npm run build` |
| Build output directory | `dist` |

4. Set **Environment variables** (both Production and Preview):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://smxlmyoxfazaunepawvy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(paste from Supabase Dashboard → Settings → API → `anon` key)* |
| `VITE_API_URL` | `https://api.the-mdl.com` |
| `NODE_VERSION` | `20` |

5. Optionally set **Build watch paths** (include): `packages/public/**`
   - This prevents rebuilds when only the admin package changes

6. Click **Save and Deploy**

---

## 3. Create Cloudflare Pages Project — Admin Portal

1. Go to **Cloudflare Dashboard → Pages → Create a project → Connect to Git**
2. Select the same repository: **`the-mdl/the-mdl_web`**
3. Configure build settings:

| Setting | Value |
|---------|-------|
| Project name | `the-mdl-admin` |
| Production branch | `main` |
| Root directory (Advanced) | `packages/admin` |
| Build command | `npm install --legacy-peer-deps && npm run build` |
| Build output directory | `dist` |

4. Set **Environment variables** (both Production and Preview):

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://smxlmyoxfazaunepawvy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(same anon key as public site)* |
| `VITE_API_URL` | `https://api.the-mdl.com` |
| `NODE_VERSION` | `20` |

5. Optionally set **Build watch paths** (include): `packages/admin/**`

6. Click **Save and Deploy**

---

## 4. Custom Domains

### Public site

1. Go to **Pages → the-mdl-public → Custom domains**
2. Add `the-mdl.com`
3. Add `www.the-mdl.com`
4. Cloudflare auto-creates CNAME records when binding through the Pages dashboard

### Admin portal

1. Go to **Pages → the-mdl-admin → Custom domains**
2. Add `admin.the-mdl.com`

### ⚠️ DNS Cleanup

Before adding custom domains, check **DNS → Records** for existing A/AAAA/CNAME entries on `the-mdl.com`, `www`, and `admin` subdomains. These may point to Railway or Azure from prior deployments. **Remove or update** conflicting records — Cloudflare will warn you if a conflict exists during the custom domain binding step.

---

## 5. Update API CORS

The NestJS API must accept requests from the new domains.

1. Go to **Railway Dashboard** → the-mdl API service → **Variables**
2. Set `CORS_ORIGIN` to:
   ```
   https://the-mdl.com,https://admin.the-mdl.com
   ```
3. **Redeploy** the API service for the change to take effect

> If CORS_ORIGIN is a comma-separated list in the API code, do not add spaces or trailing slashes.

---

## 6. Post-Deploy Verification

Run these after both sites are deployed and custom domains are active:

```bash
# Both sites return 200
curl -I https://the-mdl.com
curl -I https://admin.the-mdl.com

# SPA routing works (deep links return 200, not 404)
curl -I https://the-mdl.com/account
curl -I https://admin.the-mdl.com/login

# Security headers present
curl -I https://the-mdl.com | grep -i x-frame-options
curl -I https://the-mdl.com | grep -i x-content-type-options

# _redirects is serving correctly (no 404 on refresh)
curl -s -o /dev/null -w "%{http_code}" https://the-mdl.com/nonexistent-route
# Expected: 200 (SPA catch-all)
```

### Browser checks

- [ ] Open `https://the-mdl.com` — landing page loads without console errors
- [ ] Open `https://admin.the-mdl.com` — login page loads without console errors
- [ ] Check browser DevTools Console for CORS errors on both sites
- [ ] Test auth flow on public site — Supabase auth UI loads and login works
- [ ] Navigate to a deep link, refresh the page — should not 404

---

## 7. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| 404 on route refresh | `_redirects` file missing from `dist/` | Verify `public/_redirects` exists and rebuild. The file must contain `/* /index.html 200` |
| CORS errors in browser console | `CORS_ORIGIN` not updated on Railway, or value has typo/trailing slash | Set to exactly `https://the-mdl.com,https://admin.the-mdl.com` and redeploy |
| Build fails on Cloudflare | Missing `--legacy-peer-deps` or wrong Node version | Ensure build command starts with `npm install --legacy-peer-deps &&` and `NODE_VERSION=20` is set |
| API calls fail / network errors | `VITE_API_URL` not set or wrong value | Must be `https://api.the-mdl.com` (no trailing slash) |
| Supabase auth doesn't work | `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` not set | Verify both are set in Cloudflare Pages env vars for Production environment |
| Custom domain shows "Host error" | DNS records conflict with old deployment | Remove stale A/AAAA/CNAME records pointing to Railway/Azure, then re-add custom domain |
| Preview deployments not working | Preview env vars not set | Set the same env vars for Preview environment in Cloudflare Pages settings |

---

## Reference

- SPA routing files: `packages/public/public/_redirects`, `packages/admin/public/_redirects`
- Security headers: `packages/public/public/_headers`, `packages/admin/public/_headers`
- Build output verified to include `_redirects` and `_headers` in `dist/`
