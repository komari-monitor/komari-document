# Run Agent without Root

The agent can run as a non-root user, but some metrics or remote-control features may be limited by operating-system permissions.

## Recommended Approach

1. Create a dedicated user for the agent.
2. Install the agent into a directory the user can read and execute.
3. Ensure the service file uses that user.
4. Disable remote control if the deployment does not need it.

Example systemd service snippet:

```ini
[Service]
User=komari
Group=komari
ExecStart=/opt/komari/komari-agent -e https://your-komari-server.com -t your-token
Restart=always
```

## Notes

- ICMP ping, hardware sensors, and process details may require additional permissions.
- Remote terminal and remote execution should be reviewed carefully before enabling them for a non-root service account.
- If permissions are too restrictive, the agent may still report basic metrics but omit some fields.
