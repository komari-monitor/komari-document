# Agent Auto Discovery

Auto discovery lets agents register themselves to Komari with an auto discovery key. It is useful for batch deployment.

:::tip
Auto discovery requires Komari `1.0.4` or later.
:::

## Quick Install

### Linux and macOS

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e https://example.com --auto-discovery <AD Key>
```

### Windows

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.ps1' -UseBasicParsing -OutFile 'install.ps1'; & '.\install.ps1' '-e' 'https://example.com' '--auto-discovery' '<AD Key>'"
```

Replace `https://example.com` with your Komari server URL and `<AD Key>` with the auto discovery key.

## Required Parameters

| Parameter | Description |
| --- | --- |
| `-e, --endpoint` | Komari server URL, for example `https://your-komari-server.com` |
| `--auto-discovery` | Auto discovery key used to register the agent |

## Optional Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| `--disable-auto-update` | `false` | Disable automatic updates |
| `--disable-web-ssh` | `false` | Disable remote control features such as Web SSH and remote execution |
| `-u, --ignore-unsafe-cert` | `false` | Ignore invalid TLS certificates |
| `-i, --interval` | `1.0` | Monitoring report interval in seconds |
| `--info-report-interval` | `5` | Basic information report interval in minutes |
| `--memory-mode-available` | `false` | Report available-memory mode instead of used-memory mode |
| `-r, --max-retries` | `3` | Maximum retry count |
| `-c, --reconnect-interval` | `5` | Reconnect interval in seconds |
| `--include-nics` | none | Comma-separated network interfaces to include |
| `--exclude-nics` | none | Comma-separated network interfaces to exclude |
| `--include-mountpoint` | none | Semicolon-separated mount points to include |
| `--month-rotate` | `0` | Monthly traffic reset day; `0` disables it |

## Installer-only Parameters

These parameters affect the install script and are not written into the agent runtime configuration.

| Parameter | Default | Description |
| --- | --- | --- |
| `--install-dir` | `/opt/komari` on Linux, `$Env:ProgramFiles\Komari` on Windows | Agent installation directory |
| `--install-service-name` | `komari-agent` | System service name |
| `--install-ghproxy` | none | GitHub proxy used to accelerate downloads |
| `--install-version` | `latest` | Agent version to install |

## Examples

Basic install:

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) \
  -e https://your-komari-server.com \
  --auto-discovery your-ad-key
```

Production-oriented install:

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) \
  -e https://your-komari-server.com \
  --auto-discovery your-ad-key \
  --disable-web-ssh \
  --interval 5.0 \
  --max-retries 5 \
  --reconnect-interval 10 \
  --info-report-interval 15
```

## Batch Deployment

Example shell script:

```bash
#!/bin/bash

KOMARI_SERVER="https://your-komari-server.com"
AD_KEY="your-ad-key"
SERVERS=("server1.example.com" "server2.example.com" "server3.example.com")

for server in "${SERVERS[@]}"; do
  echo "Deploying to $server..."
  ssh root@$server "bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e $KOMARI_SERVER --auto-discovery $AD_KEY"
done
```

## Troubleshooting

- Check that the target server can reach the Komari endpoint.
- Verify that the auto discovery key is correct.
- Run the installer as an administrator or root user.
- Avoid `--ignore-unsafe-cert` in production.
- Inspect logs with `sudo journalctl -u komari-agent -f` on Linux.
