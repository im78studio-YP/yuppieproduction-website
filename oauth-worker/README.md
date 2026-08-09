# Decap OAuth Worker (Cloudflare)

Lets you log in to `/admin` with your own GitHub account — no Netlify Identity,
no third-party auth service, free.

## One-time setup

### 1. Create a GitHub OAuth App
GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
- Application name: `Yuppie CMS`
- Homepage URL: `https://yuppieproduction.com` (or your Pages URL for now)
- Authorization callback URL: `https://<your-worker>.workers.dev/callback`
- Copy the **Client ID** and generate a **Client Secret**

### 2. Deploy the worker
```bash
cd oauth-worker
npm install -g wrangler      # if not installed
npx wrangler deploy
```
Note the deployed URL: `https://yuppie-decap-oauth.<your-subdomain>.workers.dev`

### 3. Add the secrets
```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

### 4. Point Decap at the worker
In `public/admin/config.yml`, set:
```yaml
backend:
  base_url: https://yuppie-decap-oauth.<your-subdomain>.workers.dev
```
(Go back to the GitHub OAuth App and make sure the callback URL matches this.)

Then visit `https://yuppieproduction.com/admin`, click **Login with GitHub**, done.
