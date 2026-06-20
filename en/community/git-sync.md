# Sync Node IPs to Git

:::warning Version notice
This feature will be removed in the next major Komari release, `1.3`. Do not rely on this workflow for new production deployments, and plan a replacement for existing setups.
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
