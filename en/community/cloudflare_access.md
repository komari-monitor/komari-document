# Cloudflare Access Login

Cloudflare Access can protect Komari sign-in and restrict access to trusted users.

## Setup Outline

1. Create an Access application in Cloudflare.
2. Set the application domain to your Komari public URL.
3. Configure identity providers and access policies.
4. Add the required Access settings to Komari.
5. Test with a non-admin browser session before relying on it for production.

## Agent Considerations

Agents connecting through Cloudflare Access need service-token credentials, usually `CF-Access-Client-Id` and `CF-Access-Client-Secret`.

## Notes

- Keep a recovery path available while testing.
- Use HTTPS in production.
- Confirm that WebSocket traffic works through the Access policy if you need terminal or full agent features.

The Chinese guide has the current detailed walkthrough: [Cloudflare Access login](/community/cloudflare_access).
