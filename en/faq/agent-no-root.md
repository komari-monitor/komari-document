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

## Option 3: Manual Download and Run (without `systemd --user`)

If the target environment does not support `systemd --user`, download the binary manually and keep it running with `nohup` / `screen`.

### Prerequisites

- A regular user account.
- Write access to the home directory.
- `curl` installed.
- Optional: `screen` or `tmux` for running in the background.
- Network access to GitHub and the target monitoring server.

### 1. Determine the System Architecture

Before downloading, check your system architecture:

```bash
# Check the system architecture
uname -m
```

Common architectures and matching file names:

- `x86_64` or `amd64` → `komari-agent-linux-amd64` (64-bit x86, the most common)
- `i386` or `i686` → `komari-agent-linux-386` (32-bit x86)
- `aarch64` or `arm64` → `komari-agent-linux-arm64` (64-bit ARM)
- `armv7l` → `komari-agent-linux-arm` (32-bit ARM)

Notes:

- **amd64/x86_64**: most modern PCs and servers.
- **386**: older 32-bit x86 systems.
- **arm64**: ARM64 processors (e.g. Raspberry Pi 4, Apple M1).
- **arm**: 32-bit ARM processors (e.g. older Raspberry Pi models).

### 2. Download Komari Agent

Visit the [GitHub Releases](https://github.com/komari-monitor/komari-agent/releases) page and download the file matching your system architecture.

**Verify the download**

After downloading, check that the file is complete:

```bash
# Check the file size (should be greater than 0)
ls -lh komari-agent

# Check the file type
file komari-agent
```

### 3. Grant Execute Permission

```bash
chmod +x komari-agent
```

### 4. Get the Runtime Arguments

Komari Agent is configured through command-line arguments. You can get them from the one-click install script:

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e http://127.0.0.1 -t 1234567890 --install-xxx xxx
```

From the install script output, drop the arguments starting with `--install`; the rest are the runtime arguments.

For example, if the script prints:

```bash
./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef
```

then that is the command you need.

### 5. Run Komari Agent

```bash
./komari-agent [runtime arguments]
```

Example:

```bash
# Using the arguments obtained from the install script
./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef
```

Verify it is running:

```bash
# Check the process
ps aux | grep komari-agent
```

### 6. Keep Komari Agent Alive

If the environment does not support the `systemd --user` user service, use one of the following methods to keep Komari Agent running in the background.

#### Method 1: `nohup`

`nohup` keeps the program running in the background, unaffected by SSH disconnects.

```bash
# Start the Agent with nohup
nohup ./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef > komari.log 2>&1 &

# View background jobs
jobs

# View the process PID
ps aux | grep komari-agent

# View the logs
tail -f komari.log

# Stop the process (using the PID)
kill [PID]
```

#### Method 2: `screen` (if installed)

`screen` is a terminal multiplexer that keeps the program running in the background even after the SSH connection drops. If it is not installed and you have no `sudo` access, use `nohup` above or `tmux` instead.

**Run the Agent with screen**

```bash
# Create a screen session named komari
screen -S komari

# Start Komari Agent inside the screen session
./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef

# Detach from the screen session (press Ctrl+A, then D)
# You can now safely close the SSH connection; the Agent keeps running
```

**Manage screen sessions**

```bash
# List all screen sessions
screen -ls

# Reattach to the komari session
screen -r komari

# End the screen session (from inside the session)
exit
# Or press Ctrl+A, then K, and confirm
```

### Troubleshooting

#### Common Issues

1. **Download failed**

   ```bash
   # Check the network connection
   ping -c 1 github.com

   # Download through a proxy (if needed)
   curl --proxy http://proxy.example.com:8080 -L -o komari-agent "https://github.com/komari-monitor/komari-agent/releases/latest/download/komari-agent-linux-amd64"
   ```

2. **Permission issues**

   ```bash
   # Make sure the file is executable
   chmod +x komari-agent

   # Check file permissions
   ls -l komari-agent
   ```

3. **Failed to connect to the server**

   ```bash
   # Check connectivity to the server
   nc -zv [server address] [port]
   ```

4. **Agent exits immediately after starting**

   ```bash
   # Run in the foreground to see detailed logs
   ./komari-agent -e http://127.0.0.1:8080 -t 1234567890
   ```

### Log Management

```bash
# View live logs
tail -f komari.log
```

### Performance Monitoring

```bash
# Check Agent resource usage
ps aux | grep komari-agent

# Check system load
top -p $(pgrep komari-agent)
```

## Notes

- ICMP ping, hardware sensors, and full process details may require elevated privileges depending on the host OS.
