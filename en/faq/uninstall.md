# Uninstall Agent

Use the commands that match how the agent was installed.

## Linux systemd

```bash
sudo systemctl stop komari-agent
sudo systemctl disable komari-agent
sudo rm -f /etc/systemd/system/komari-agent.service
sudo systemctl daemon-reload
```

If the agent was installed to `/opt/komari`, remove it only after you confirm you no longer need its files:

```bash
sudo rm -rf /opt/komari
```

## Windows

If the installer created a Windows service, stop and remove that service from an elevated PowerShell session. The service name is usually `komari-agent` unless you customized it during installation.

```powershell
sc.exe stop komari-agent
sc.exe delete komari-agent
```

Then remove the installation directory if it is no longer needed.

## Dashboard Cleanup

After uninstalling the agent, remove or disable the node from the Komari admin dashboard.
