// Cloudflare Worker — GitHub OAuth proxy for Decap CMS
// Lets you log in to /admin with your own GitHub account (no third-party auth service).
//
// Setup (see oauth-worker/README.md):
//   1) Create a GitHub OAuth App; callback URL = https://<this-worker>.workers.dev/callback
//   2) npx wrangler deploy
//   3) npx wrangler secret put GITHUB_CLIENT_ID
//      npx wrangler secret put GITHUB_CLIENT_SECRET
//   4) Put https://<this-worker>.workers.dev into public/admin/config.yml -> base_url

const AUTHORIZE = "https://github.com/login/oauth/authorize";
const TOKEN = "https://github.com/login/oauth/access_token";

function postMessagePage(status, content) {
  const payload = `authorization:github:${status}:${JSON.stringify(content)}`;
  return `<!doctype html><html><body><script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(${JSON.stringify(payload)}, e.origin);
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
  </script></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Step 1: Decap opens /auth -> redirect to GitHub
    if (url.pathname === "/auth") {
      const redirectUri = `${url.origin}/callback`;
      const authUrl = new URL(AUTHORIZE);
      authUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", "repo user");
      authUrl.searchParams.set("state", crypto.randomUUID());
      return Response.redirect(authUrl.toString(), 302);
    }

    // Step 2: GitHub redirects back to /callback with ?code=...
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      const res = await fetch(TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const data = await res.json();

      if (data.error || !data.access_token) {
        return new Response(
          postMessagePage("error", { message: data.error || "no_token" }),
          { headers: { "Content-Type": "text/html" } }
        );
      }
      return new Response(
        postMessagePage("success", { token: data.access_token, provider: "github" }),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    return new Response("Decap OAuth worker is running. Entry point: /auth", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
};
