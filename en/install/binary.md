# Binary Deployment

Binary deployment runs Komari directly without Docker. It is useful when you want a simple executable plus a system service.

## TLDR

Download the matching file from the [GitHub Releases page](https://github.com/komari-monitor/komari/releases), then start Komari:

```bash
./komari server -l 0.0.0.0:25774
```

On Windows:

```powershell
.\komari.exe server -l 0.0.0.0:25774
```

## Download Komari

1. Open the [GitHub Releases page](https://github.com/komari-monitor/komari/releases).
2. Download the asset for your operating system and CPU architecture.
3. Rename it to `komari` or `komari.exe`.
4. Place it in a dedicated directory, such as `~/komari` on Linux or `C:\komari` on Windows.

## Make It Executable

Linux and macOS only:

```bash
cd ~/komari
chmod +x komari
```

## Start the Server

```bash
./komari server -l 0.0.0.0:25774
```

Komari creates a `data` directory in the working directory. Do not delete it unless you intentionally want to remove local data.

## Complete Setup

Open `http://localhost:25774` or `http://<your-server-ip>:25774`. On first access, use the installation guide to create the administrator account and site settings.

## Run as a Linux Service

Create `/etc/systemd/system/komari.service`:

```ini
[Unit]
Description=Komari Monitoring Service
After=network.target

[Service]
ExecStart=/home/user/komari/komari server -l 0.0.0.0:25774
WorkingDirectory=/home/user/komari
Restart=always
User=root

[Install]
WantedBy=multi-user.target
```

Replace `/home/user/komari` with the real installation path.

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable komari
sudo systemctl start komari
sudo systemctl status komari
```

Useful service commands:

```bash
sudo systemctl stop komari
sudo systemctl restart komari
journalctl -u komari -f
```

## Troubleshooting

- If the binary will not run, confirm that you downloaded the correct architecture and set executable permissions.
- If the dashboard is unreachable, check the listen address, firewall, and service status.
- If a service fails to start, inspect `journalctl -u komari -f` and verify the paths in the service file.
