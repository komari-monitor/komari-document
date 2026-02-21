# 社区维护的Agent项目

Komari 社区成员们积极贡献并共同维护着一系列 Agent 项目。这些项目丰富了 Komari 的功能。感谢所有参与者的努力和贡献。

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

> 项目地址：[Github](https://https://github.com/liveqte/komari-agent-webhost)
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
