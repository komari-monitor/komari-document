# GitHub OAuth Login

Komari can use GitHub OAuth as a single sign-on provider.

## High-level Setup

1. Create an OAuth application in GitHub.
2. Configure the callback URL to point to your Komari instance.
3. Copy the client ID and client secret into the Komari admin dashboard.
4. Save the settings and test sign-in with a GitHub account.

## Notes

- The public Komari URL must match the callback URL.
- Use HTTPS in production.
- Keep the client secret private.
- Ensure password login or another recovery method is available before relying only on OAuth.

For the current Chinese walkthrough, see [GitHub OAuth login](/faq/oauth-github).
