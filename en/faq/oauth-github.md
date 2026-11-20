# GitHub OAuth Login

Komari supports GitHub OAuth (as well as generic OIDC and QQ) as a single sign-on provider.

## 1. Enable SSO and Copy the Callback URL

1. In the Komari admin dashboard, go to **Settings → Login** (or **SSO**).
2. Enable single sign-on and select `github` as the provider.
3. Note the callback URL, which uses the form:
   `https://<your-domain>/api/oauth_callback`

## 2. Create a GitHub OAuth App

1. Open GitHub [Developer applications](https://github.com/settings/developers) and click **New OAuth App**.
2. Set the **Authorization callback URL** to `https://<your-domain>/api/oauth_callback`.
3. Click **Register application**, then click **Generate a new client secret** and copy both the **Client ID** and **Client secret**.

## 3. Configure and Bind Your Account

1. Paste the **Client ID** and **Client secret** into **Settings → Login** in Komari and save.
2. Go to **Settings → Account** and bind the GitHub account that will be used to sign in. (Signing in via OAuth fails unless an admin account has been bound first.)
3. Optionally enable **Disable password login** once you have verified OAuth sign-in works.

## Notes

- The public Komari URL and reverse proxy `Host` / `X-Forwarded-Proto` headers must match the configured callback URL.
- Use HTTPS in production and keep the client secret private.
- Keep password login enabled or know how to run `komari permit-login` before disabling password authentication.

For the Chinese walkthrough, see [GitHub OAuth login](/faq/oauth-github).
