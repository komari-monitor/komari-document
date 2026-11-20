# Run Agent without Root

Komari Agent can run as a non-root user. Some OS-level metrics or remote-control capabilities may be constrained by user permissions.

## Option 1: Official Installer (`systemd --user` / LaunchAgent)

On Linux systems with `systemd --user` (and on macOS), running the official `install.sh` as a non-root user automatically installs a user-level service:

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e https://your-komari-server.com -t your-token
```

- Linux non-root default paths: binary at `${XDG_DATA_HOME:-~/.local/share}/komari/agent` and unit at `~/.config/systemd/user/komari-agent.service`.
- Manage and view logs with `systemctl --user status komari-agent` and `journalctl --user -u komari-agent -f` (ask an administrator to run `sudo loginctl enable-linger <user>` if user services should stay active after logout).

## Option 2: Dedicated Non-root System Service

If you prefer a system-wide unit running under a dedicated `komari` user:

1. Create a dedicated user (`komari`).
2. Place the agent binary (`agent`) in a directory the user can read and execute (such as `/opt/komari/agent`).
3. Configure the systemd unit to use that user and disable remote control (`--disable-web-ssh`) if not needed:

```ini
[Service]
User=komari
Group=komari
WorkingDirectory=/opt/komari
ExecStart=/opt/komari/agent -e https://your-komari-server.com -t your-token
Restart=always
```

## Notes

- ICMP ping, hardware sensors, and full process details may require elevated privileges depending on the host OS.
- If `systemd --user` is unavailable (for example inside minimal containers or NAS shells), run the binary manually with `nohup`, `screen`, or `tmux`. See also [the Chinese guide](/faq/agent-no-root).
