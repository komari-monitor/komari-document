# 1Panel Deployment

Komari can be deployed from 1Panel when an app template is available in your 1Panel environment.

## Before You Start

- A server with 1Panel installed.
- Network access to pull the Komari image.
- A domain or server IP that can reach Komari after deployment.

## Install from the App Store

1. Open the 1Panel dashboard.
2. Go to the app store or installed apps area.
3. Search for `Komari`.
4. Configure the port, data directory, and optional environment variables.
5. Deploy the app and wait until the container becomes healthy.

## First Login

After deployment, open the configured address in your browser. If you did not set `ADMIN_USERNAME` and `ADMIN_PASSWORD`, inspect the application logs to find the generated default account.

## Notes

- Keep the data directory persistent.
- Back up the data directory before upgrades.
- If the 1Panel template changes, prefer the template's current instructions for fields such as network mode and volume mapping.

The Chinese page contains screenshots for the current 1Panel flow: [1Panel deployment](/install/1panel).
