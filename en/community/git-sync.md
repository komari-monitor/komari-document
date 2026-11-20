# Sync Node IPs to Git

:::warning Compatibility notice
`komari-git-sync` reads the `clients` table directly from the local SQLite database (`komari.db`). For newer Komari deployments, prefer using the official API or RPC endpoints rather than reading internal database tables directly.
:::

Some deployments sync node IP information to a Git repository for automation or inventory purposes.

## Suggested Workflow

1. Export or generate the node IP data.
2. Commit the generated file to a private repository.
3. Use a scheduled job or webhook to keep it current.
4. Avoid committing tokens, credentials, or private notes.

## Security Notes

- Keep repositories private if they contain infrastructure details.
- Use a deploy key or scoped token with the minimum required permissions.
- Review generated diffs before enabling automatic pushes.

The Chinese guide contains the current implementation notes: [Sync node IPs to Git](/community/git-sync).
