# Uninstall Agent

Use the commands that match how the agent was installed. If you customized `--install-service-name` or `--install-dir`, replace `komari-agent` and the paths accordingly.

## Linux

### System-wide `systemd`

```bash
sudo systemctl stop komari-agent
sudo systemctl disable komari-agent
sudo rm -f /etc/systemd/system/komari-agent.service
sudo systemctl daemon-reload
sudo rm -f /opt/komari/agent
```

::: warning Note
If Komari Server is also installed in `/opt/komari`, only remove `/opt/komari/agent` (and `/opt/komari/auto-discovery.json` if present) rather than deleting the entire `/opt/komari` directory.
:::

### Non-root `systemd --user`

```bash
systemctl --user stop komari-agent
systemctl --user disable komari-agent
rm -f "${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/komari-agent.service"
systemctl --user daemon-reload
rm -f "${XDG_DATA_HOME:-$HOME/.local/share}/komari/agent"
```

## Windows

The Windows installer uses `nssm` to manage the `komari-agent` service. From an elevated PowerShell session:

```powershell
nssm stop komari-agent
nssm remove komari-agent confirm
Remove-Item -Path "$Env:ProgramFiles\Komari" -Recurse -Force
```

## Dashboard Cleanup

After uninstalling the agent, remove or disable the node from the Komari admin dashboard. See [the Chinese uninstall guide](/faq/uninstall) for OpenRC and OpenWrt `procd` steps.
