# Community Agents

Community members actively contribute to and maintain a range of Agent projects. These projects extend what Komari can do. Thanks to everyone involved for their effort and contributions.

## Before Using Community Agents

- Review the source and release history.
- Confirm compatibility with your Komari server version.
- Check whether remote execution and terminal features are implemented.
- Prefer HTTPS or WSS for production connections.

## Official Agent

The official agent is maintained at:

[komari-monitor/komari-agent](https://github.com/komari-monitor/komari-agent)

## Komari-Agent-NodeJS

> Project: [Github](https://github.com/DsTansice/Komari-Agent-NodeJS)
>
> Developer: [DsTansice](https://github.com/DsTansice)

`Komari-Agent-NodeJS` is a Komari monitoring Agent written in NodeJS, for any environment where binary probes are restricted but NodeJS can run!

It supports configuration via environment variables or by editing the parameters directly in the script, and stays compatible with different Komari server versions:

- **v1**: for older Komari servers.
- **v2**: for Komari 1.5.1 and above.

## komari-zig-agent

> Project: [Github](https://github.com/luodaoyi/komari-zig-agent)
>
> Developer: [luodaoyi](https://github.com/luodaoyi)

`komari-zig-agent` is a Komari Agent written in Zig, aiming to directly replace the original Go Agent while keeping Komari's existing protocol, reported fields, tasks, Ping, Web SSH, self-update, and other behavior compatible.

Its focus is **low resource usage**, suited to resource-constrained environments such as small-memory VPSs, OpenWrt, and ARM/MIPS devices. According to the test data in the project repository, the Zig linux-amd64 binary is about `702 KB` with a resident RSS of about `1.2 MB`, noticeably lower than the original Go Agent; under systemd its current memory accounting can be below `1 MB`.

| Metric | Original Go Agent | Zig Agent |
| --- | ---: | ---: |
| linux-amd64 binary size | approx. `8.6 MB` | approx. `702 KB` |
| Resident RSS | approx. `17.8 MB` | approx. `1.2 MB` |
| Thread count | approx. `9` | approx. `4` |
| CPU usage | approx. `0.6%` | approx. `0.1%` |

:::tip Replace the original Agent in one step
If the original Go `komari-agent` is already installed on the machine, the project provides a replacement script (`replace.sh` in the project repository) that auto-detects the system and CPU architecture, downloads the matching release asset, verifies `SHA256SUMS`, backs up the original binary, and restarts the original service after replacing it. The replacement does not change the existing endpoint, token, report interval, or other service parameters.
:::

## komari-monitor-rs

> Project: [Github](https://github.com/GenshinMinecraft/komari-monitor-rs)
>
> Developer: [GenshinMinecraft](https://github.com/GenshinMinecraft)

`komari-monitor-rs` is a third-party **high-performance** monitoring Agent for the [komari-monitor](https://github.com/komari-monitor) monitoring service.

It aims to implement all features of the [original Agent](https://github.com/komari-monitor/komari-agent), and add more on top.

The `--fake` flag can give your little VPS seemingly infinite compute — great for showing off.

## Ulmaridae

> Project: [Github](https://github.com/nichbar/Ulmaridae)
>
> Developer: [nichbar](https://github.com/nichbar)

`Ulmaridae` is an app that wraps the [komari-agent](https://github.com/komari-monitor/komari-agent) binary to monitor an Android device as if it were a server.

Due to Android environment restrictions, some data is missing on non-rooted devices (latency works fine); granting root access gives better results.

## komari-agent-win7_win8_legacy

> Project: [Github](https://github.com/xykt/komari-agent-win7_win8_legacy)
>
> Developer: [xykt](https://github.com/xykt)

`komari-agent-win7_win8_legacy` is a Komari monitoring Agent tailored for **legacy Windows systems (Windows XP, Windows 7, Windows Server 2008, Windows Server 2012, and others)**.

Since these operating systems are no longer supported by the [original Agent](https://github.com/komari-monitor), this project provides full monitoring support for legacy Windows so users can keep using the Komari monitoring service.

## komari-agent-mips

> Project: [Github](https://github.com/rem0t3/komari-agent-mips)
>
> Developer: [rem0t3](https://github.com/rem0t3)

Based on the [original repository](https://github.com/komari-monitor/komari-agent), with support for the Linux mips architecture added, for **OpenWrt** and similar devices.

## komari-agent-s390x

> Project: [Github](https://github.com/lizhenmiao/komari-agent-s390x)
>
> Developer: [lizhenmiao](https://github.com/lizhenmiao)

Based on the [original repository](https://github.com/komari-monitor/komari-agent), with support for Linux s390x **(IBM Z)** architecture added.

## komari-agent-webhost

> Project: [Github](https://github.com/liveqte/komari-agent-webhost)
>
> Developer: [liveqte](https://github.com/liveqte)

`komari-agent-webhost` is a Komari monitoring Agent written in Python, for virtual hosting environments where binary probes are restricted.

## ikuai-komari-agent

> Project: [Github](https://github.com/ZeroTwoDa/ikuai-komari-agent)
>
> Developer: [ZeroTwoDa](https://github.com/ZeroTwoDa)

`ikuai-komari-agent` is a Komari monitoring agent written in Python, built to monitor **iKuai routers** in real time and report the data to a Komari server.

It supports containerized deployment via Docker, providing efficient router performance monitoring and data collection.

It supports both x86 and x64 architectures, providing stable and reliable performance monitoring and data collection.

## komari-agent-for-esp8266-arduinoc

> Project: [Github](https://github.com/GenshinMinecraft/komari-agent-for-esp8266-arduinoc)
>
> Developer: [GenshinMinecraft](https://github.com/GenshinMinecraft)

`komari-agent-for-esp8266-arduinoc` is a third-party high-performance monitoring Agent for the [komari-monitor](https://github.com/komari-monitor) monitoring service.

It only applies to ESP8266 under ArduinoC.

It integrates easily with existing programs — just one line of code is needed to send Realtime Info.
