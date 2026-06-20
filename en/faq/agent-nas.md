# Run Agent on NAS

NAS systems often have restricted shells, custom package managers, and different service managers. The best install method depends on the vendor.

## General Guidance

- Prefer the official agent binary for your CPU architecture.
- Keep the agent files in a persistent shared or application directory.
- Configure the agent as a service if the NAS supports it.
- Disable remote control features if you do not need web terminal or remote execution.

## Common Checks

- Confirm whether the NAS CPU is `amd64`, `arm64`, or another architecture.
- Confirm that the NAS can reach the Komari server URL.
- Check whether outbound WebSocket connections are allowed.
- Store tokens and configuration in a location that survives reboot.

The Chinese NAS page may include vendor-specific notes: [NAS agent guide](/faq/agent-nas).
