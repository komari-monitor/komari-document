# 社区维护的Agent项目

Komari 社区成员们积极贡献并共同维护着一系列 Agent 项目。这些项目丰富了 Komari 的功能。感谢所有参与者的努力和贡献。

## komari-zig-agent

> 项目地址：[Github](https://github.com/luodaoyi/komari-zig-agent)
>
> 开发者：[luodaoyi](https://github.com/luodaoyi)

`komari-zig-agent` 是使用 Zig 编写的 Komari Agent，目标是直接替换原 Go 版 Agent，并保持 Komari 现有协议、上报字段、任务、Ping、Web SSH、自更新等行为兼容。

它的重点是**低资源占用**，适合小内存 VPS、OpenWrt、ARM/MIPS 设备等资源紧张的环境。根据项目仓库中的测试数据，Zig 版 linux-amd64 二进制体积约为 `702 KB`，常驻 RSS 约 `1.2 MB`，相比原 Go Agent 明显更低；在 systemd 下的当前内存记账可低于 `1 MB`。

| 指标 | 原 Go Agent | Zig Agent |
| --- | ---: | ---: |
| linux-amd64 二进制大小 | 约 `8.6 MB` | 约 `702 KB` |
| 常驻 RSS | 约 `17.8 MB` | 约 `1.2 MB` |
| 线程数 | 约 `9` | 约 `4` |
| CPU 占用 | 约 `0.6%` | 约 `0.1%` |

:::tip 一键替换原 Agent
如果机器上已经安装了原 Go 版 `komari-agent`，可以使用以下命令一键替换为 Zig 版：

```bash
curl -fsSL https://raw.githubusercontent.com/luodaoyi/komari-zig-agent/main/replace.sh | sudo sh
```

替换脚本会自动识别系统和 CPU 架构，下载对应 Release 资产，校验 `SHA256SUMS`，备份原二进制，并在替换后重启原服务。替换过程不会修改已有的 endpoint、token、上报间隔等业务参数。
:::

## komari-monitor-rs

> 项目地址：[Github](https://github.com/GenshinMinecraft/komari-monitor-rs)
> 
> 开发者：[GenshinMinecraft](https://github.com/GenshinMinecraft)

`Komari-Monitor-rs` 是一个适用于 [komari-monitor](https://github.com/komari-monitor) 监控服务的第三方**高性能**监控 Agent

致力于实现 [原版 Agent](https://github.com/komari-monitor/komari-agent) 的所有功能，并拓展更多功能

`--fake` 参数可以让你的小鸡拥有无穷的算力，装逼必备

## Ulmaridae

> 项目地址：[Github](https://github.com/nichbar/Ulmaridae)
> 
> 开发者：[nichbar](https://github.com/nichbar)

`Ulmaridae` 是一个通过包裹 [komari-agent](https://github.com/komari-monitor/komari-agent) 二进制文件，把 Android 设备当作服务器来监控的 App

由于 Android 环境的限制，在非 root 设备上部分数据会有缺失（延迟部分可正常运作），授予 root 权限后效果更佳

## komari-agent-win7_win8_legacy

> 项目地址：[Github](https://github.com/xykt/komari-agent-win7_win8_legacy)
> 
> 开发者：[xykt](https://github.com/xykt)

`komari-agent-win7_win8_legacy` 是一个为 **旧版本 Windows（Windows XP、Windows 7、Windows Server 2008、Windows Server 2012等）** 系统专门定制的 Komari 监控 Agent

由于这些操作系统已停止支持[原版 Agent](https://github.com/komari-monitor)，该项目致力于为旧版 Windows 系统提供完整的监控功能支持，使用户能够继续使用 Komari 监控服务

## komari-agent-mips

> 项目地址：[Github](https://github.com/rem0t3/komari-agent-mips)
> 
> 开发者：[rem0t3](https://github.com/rem0t3)

基于[原仓库](https://github.com/komari-monitor/komari-agent) 添加了对 Linux mips 架构的支持，适用于 **OpenWRT** 等设备

## komari-agent-s390x

> 项目地址：[Github](https://github.com/lizhenmiao/komari-agent-s390x)
> 
> 开发者： [lizhenmiao](https://github.com/lizhenmiao)

基于[原仓库](https://github.com/komari-monitor/komari-agent) 添加了对 Linux s390x **(IBM Z)** 架构的支持

## komari-agent-webhost

> 项目地址：[Github](https://github.com/liveqte/komari-agent-webhost)
> 
> 开发者：[liveqte](https://github.com/liveqte)

`komari-agent-webhost`是一个使用 Python 语言编写的 komari 监控 Agent，适用于限制执行二进制探针的虚拟主机环境

## ikuai-komari-agent

> 项目地址：[Github](https://github.com/ZeroTwoDa/ikuai-komari-agent)
> 
> 开发者：[ZeroTwoDa](https://github.com/ZeroTwoDa)

`ikuai-komari-agent` 是一个使用 Python 编写的 Komari 监控代理，专门用于实时监控 **iKuai 路由器**并上报数据到 Komari 服务器

支持通过 Docker 容器化部署，提供高效的路由器性能监控和数据收集功能

支持 x86 和 x64 两种架构，提供稳定可靠的性能监控和数据收集功能

## komari-agent-for-esp8266-arduinoc

> 项目地址：[Github](https://github.com/GenshinMinecraft/komari-agent-for-esp8266-arduinoc)
> 
> 开发者：[GenshinMinecraft](https://github.com/GenshinMinecraft)

`komari-agent-for-esp8266-arduinoc` 是一个适用于 [komari-monitor](https://github.com/komari-monitor) 监控服务的第三方高性能监控 Agent <!-- 真的会有人往8266上插针么？！ -->

仅适用于 ArduinoC 下的 ESP8266

易与现有程序相结合，仅需一行代码即可发送 Realtime Info
