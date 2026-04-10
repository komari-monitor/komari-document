# Mikrotik 路由器通过 HTTP 接口接入 Komari 探针

由于 `Mikrotik` 路由器没有标准程序运行环境无法运行 `Agent`，也不支持 `WebSocket`，因此需要通过 `HTTP` 协议来手动部署脚本来接入探针，在阅读本篇指引前，请先阅读 [通过 HTTP 接口上报信息](/faq/upload-via-http.html) 章节来了解基本原理。

## 前言

- `Komari` Server 端版本号 >= 1.1.8
- `RouterOS` 系统版本要求： 7.x ，仅 `7.x` 版本以上支持 `:serialize` 命令
- 测试用设备信息: `Mikrotik RB4011` / `7.21.2`
- 由于 `RouterOS` 各版本命令存在差异，如果你的设备和版本号和该设备不一致，请自行根据设备来调整命令。
- 采集实时信息脚本对 CPU 性能影响较大，经测试采集实时信息时，`CPU` 占用率会从 `3%` 跃升至 `10%`，可以通过不采集连接数来减轻脚本负载。
- Mikrotik 仅支持 `ICMP` 类型 `Ping` 任务。

## 使用流程

1. 在 `/system/scripts` 中新增 `komari_basic_info`、`komari_report`、`komari_ping`脚本，脚本内容见下方。

2. 修改各脚本内的对应变量内容。 
    + `apiBase`: 探针接口地址
    + `token`: 设备对应 Token，具体可参考 [获取 Token](/faq/upload-via-http.html#获取-token)

3. 在 `/system/scheduler` 中为上方脚本新增对应定时任务，执行间隔时间参见 [HTTP 接口上报信息](/faq/upload-via-http.html#使用介绍)
    + 定时任务内容： `/system/script/run {SCRIPT_NAME}`

## 上报基本信息脚本 komari_basic_info

```rsc
# Komari Basic Info Agent for MikroTik RouterOS v7
#
# Uploads static system information (CPU, memory, OS, IP, etc.)
# to the Komari server. Should run at startup and periodically.
#
# Installation:
#   1. Paste this script into a new script:
#        /system script add name=komari-basic-info source={<paste>}
#   2. Edit $apiBase and $token below.
#   3. Add a scheduler entry:
#        /system scheduler add name=komari-basic-info interval=5m \
#          on-event="/system script run komari-basic-info" \
#          start-time=startup
#
# Requirements: RouterOS v7.x (for :serialize support)

# ── Configuration ─────────────────────────────────────────────
:local apiBase "http://192.168.233.9:25774"
:local token   "ULN17NiERqufdJA4dzqrh9"

:local reportUrl "$apiBase/api/clients/uploadBasicInfo\?token=$token"

# ── Collect system information ────────────────────────────────
:local cpuName    [/system resource get cpu]
:local cpuCores   [/system resource get cpu-count]
:local arch       [/system resource get architecture-name]
:local rosVersion [/system resource get version]
:local boardName  [/system resource get board-name]
:local memTotal   [/system resource get total-memory]

# Disk (may not be available on all devices)
:local diskTotal 0
:do {
    :set diskTotal [/system resource get total-hdd-space]
} on-error={}

# Detect virtualization (CHR = Cloud Hosted Router)
:local virt "None"
:if ([:typeof [:find $boardName "CHR" 0]] = "num") do={
    :set virt "CHR"
}

# ── Collect public IP addresses ────────────────────────────────
# Fetch real public IPs via external services
:local ipv4 ""
:do {
    :local result [/tool/fetch url="https://4.ipw.cn" output=user as-value]
    :set ipv4 ($result->"data")
    # Strip trailing whitespace/newlines
    :while ([:pick $ipv4 ([:len $ipv4] - 1) [:len $ipv4]] = "\n" || \
            [:pick $ipv4 ([:len $ipv4] - 1) [:len $ipv4]] = "\r" || \
            [:pick $ipv4 ([:len $ipv4] - 1) [:len $ipv4]] = " ") do={
        :set ipv4 [:pick $ipv4 0 ([:len $ipv4] - 1)]
    }
} on-error={
    :log info "komari-basic-info: failed to fetch public IPv4"
}

:local ipv6 ""
:do {
    :local result [/tool/fetch url="http://6.ipw.cn" output=user as-value]
    :set ipv6 ($result->"data")
    :while ([:pick $ipv6 ([:len $ipv6] - 1) [:len $ipv6]] = "\n" || \
            [:pick $ipv6 ([:len $ipv6] - 1) [:len $ipv6]] = "\r" || \
            [:pick $ipv6 ([:len $ipv6] - 1) [:len $ipv6]] = " ") do={
        :set ipv6 [:pick $ipv6 0 ([:len $ipv6] - 1)]
    }
} on-error={
    # IPv6 may not be available on this network
    :log info "komari-basic-info: failed to fetch public IPv6"
}

# ── Build and upload ──────────────────────────────────────────
:local payload [:serialize to=json value={ \
    "cpu_name"=$cpuName; \
    "cpu_cores"=$cpuCores; \
    "arch"=$arch; \
    "os"="RouterOS $rosVersion"; \
    "kernel_version"=$rosVersion; \
    "mem_total"=$memTotal; \
    "disk_total"=$diskTotal; \
    "swap_total"=0; \
    "gpu_name"=""; \
    "version"="routeros-agent/1.0"; \
    "virtualization"=$virt; \
    "ipv4"=$ipv4; \
    "ipv6"=$ipv6 \
}]

:do {
    /tool fetch url=$reportUrl \
        mode=http \
        http-method=post \
        http-data=$payload \
        http-header-field="Content-Type:application/json" \
        output=none
    :log info "komari-basic-info: uploaded successfully ($cpuName, $arch, RouterOS $rosVersion)"
} on-error={
    :log warning "komari-basic-info: failed to upload basic info"
}

```

## 上报实时信息脚本 komari_report

```rsc
# Komari Report Agent for MikroTik RouterOS v7
#
# Uploads real-time monitoring data (CPU, memory, disk, network, uptime)
# to the Komari server via HTTP POST.
#
# Installation:
#   1. Paste this script into a new script:
#        /system script add name=komari-report source={<paste>}
#   2. Edit $apiBase, $token, and $interfaces below.
#   3. Add a scheduler entry:
#        /system scheduler add name=komari-report interval=3s \
#          on-event="/system script run komari-report"
#
# Notes:
#   - The POST endpoint has an 11-second keep-alive timeout on the server.
#     Set the scheduler interval to <=10s to maintain online status.
#   - Network speed (bytes/s) is calculated from the delta between runs.
#     The first run after boot always reports speed as 0.
#
# Requirements: RouterOS v7.x (for :serialize support)

# ── Configuration ─────────────────────────────────────────────
:local apiBase "http://192.168.233.9:25774"
:local token   "ULN17NiERqufdJA4dzqrh9"

:local reportUrl "$apiBase/api/clients/report\?token=$token"

# ── Collect system metrics ────────────────────────────────────
:local cpuLoad [/system resource get cpu-load]

:local memTotal [/system resource get total-memory]
:local memFree  [/system resource get free-memory]
:local memUsed  ($memTotal - $memFree)

:local diskTotal 0
:local diskFree  0
:do {
    :set diskTotal [/system resource get total-hdd-space]
    :set diskFree  [/system resource get free-hdd-space]
} on-error={}
:local diskUsed ($diskTotal - $diskFree)

:local uptime    [/system resource get uptime]
:local uptimeSec [:tonum $uptime]

# ── Collect network traffic from pppoe-out1 ───────────────────
:local totalRx 0
:local totalTx 0
:local netUp   0
:local netDown 0
:do {
    :local traffic [/interface/monitor-traffic pppoe-out1 once as-value]
    :if ([:len $traffic] > 0) do={
        :set netUp   ($traffic->"tx-bits-per-second" / 8)
        :set netDown ($traffic->"rx-bits-per-second" / 8)
    }
    :local ifStats [/interface/print stats as-value where name="pppoe-out1"]
    :if ([:len $ifStats] > 0) do={
        :local s ($ifStats->0)
        :set totalTx ($s->"tx-byte")
        :set totalRx ($s->"rx-byte")
    }
} on-error={
    :log warning "komari-report: failed to read stats for pppoe-out1"
}

:local totalTcpCount 0
:do {
    :local v4Count [:len [/ip firewall connection find protocol="tcp"]];
    :local v6Count 0;
    
    :do {
        :set v6Count [:len [/ipv6 firewall connection find protocol="tcp"]];
    } on-error={};
    
    :set totalTcpCount ($v4Count + $v6Count);
}

:local totalUdpCount 0
:do {
    :local v4Count [:len [/ip firewall connection find protocol="udp"]];
    :local v6Count 0;
    
    :do {
        :set v6Count [:len [/ipv6 firewall connection find protocol="udp"]];
    } on-error={};
    
    :set totalUdpCount ($v4Count + $v6Count);
}

# ── Build JSON payload ────────────────────────────────────────
# Fields not available on RouterOS are reported as zero:
#   swap     — RouterOS has no swap
#   load     — RouterOS does not expose load averages
#   process  — RouterOS does not expose process count
#   connections — TCP/UDP connection 
:local payload [:serialize to=json value={ \
    "cpu"={"usage"=$cpuLoad}; \
    "ram"={"total"=$memTotal; "used"=$memUsed}; \
    "swap"={"total"=0; "used"=0}; \
    "load"={"load1"=0; "load5"=0; "load15"=0}; \
    "disk"={"total"=$diskTotal; "used"=$diskUsed}; \
    "network"={"up"=$netUp; "down"=$netDown; "totalUp"=$totalTx; "totalDown"=$totalRx}; \
    "connections"={"tcp"=$totalTcpCount; "udp"=$totalUdpCount}; \
    "uptime"=$uptimeSec; \
    "process"=0 \
}]

# ── Upload report ─────────────────────────────────────────────
:do {
    /tool fetch url=$reportUrl \
        mode=http \
        http-method=post \
        http-data=$payload \
        http-header-field="Content-Type:application/json" \
        output=none
} on-error={
    :log warning "komari-report: failed to upload report"
}

```

## 上报 Ping 任务结果脚本 komari_ping

```rsc
# Komari Ping Agent for MikroTik RouterOS v7
#
# This script fetches ICMP ping tasks from the Komari server,
# executes them, and reports results back.
#
# Installation:
#   1. Paste this script content into a new script:
#        /system script add name=komari-ping-agent source={<paste>}
#   2. Edit the configuration variables below ($apiBase, $token).
#   3. Add a scheduler entry to run periodically:
#        /system scheduler add name=komari-ping interval=60s \
#          on-event="/system script run komari-ping-agent"
#
# Requirements: RouterOS v7.x (for :deserialize / :serialize support)

# ── Configuration ─────────────────────────────────────────────
:local apiBase "http://192.168.233.9:25774"
:local token   "ULN17NiERqufdJA4dzqrh9"

:local taskUrl   "$apiBase/api/clients/ping/tasks\?token=$token"
:local resultUrl "$apiBase/api/clients/ping/result\?token=$token"

# ── Helper: get current timestamp in RFC 3339 ────────────────
:local getTimestamp do={
    :local date [/system/clock/get date];
    :local time [/system/clock/get time];
    :local timeZone ([/system/clock/get gmt-offset] / 60 / 60);
    :return ($date . "T" . $time . "+08:00")
}


:global ConvertTimeToMs do={
    :local timeStr [:tostr $1]
    :if ([:len $timeStr] < 8) do={
        :return 0
    }

    :local hh [:tonum [:pick $timeStr 0 2]]
    :local mm [:tonum [:pick $timeStr 3 5]]
    :local ss [:tonum [:pick $timeStr 6 8]]

    :local totalSecs (($hh * 3600) + ($mm * 60) + $ss)

    :local dotPos [:find $timeStr "."]
    :local msPart 0
    
    :if ($dotPos >= 0) do={
        :set msPart [:tonum [:pick $timeStr ($dotPos + 1) ($dotPos + 4)]]
    }

    :local totalMs (($totalSecs * 1000) + $msPart)
    
    :return $totalMs
}

# ── Helper: execute ICMP ping ─────────────────────────────────
:local executePingTask do={
    # $target is passed as named parameter
    :global ConvertTimeToMs
    :local results [/ping address=$target count=4 as-value]

    :local totalRtt 0
    :local received 0

    :foreach packet in=$results do={
        :local packetTime [$ConvertTimeToMs ($packet->"time")]
        :if ($packetTime > 0) do={

            :set totalRtt ($totalRtt + $packetTime)
            :set received ($received + 1)
        }
    }
    :if ($received = 0) do={
        :return -1
    }

    :return ($totalRtt / $received)
}

# ── Main flow ─────────────────────────────────────────────────

# Step 1: Fetch ping tasks
:local fetchResult
:do {
    :set fetchResult [/tool fetch url=$taskUrl mode=http output=user as-value]
} on-error={
    :log warning "komari-ping: failed to fetch tasks from server"
    :error "failed to fetch tasks"
}

:local body ($fetchResult->"data")
# Step 2: Parse JSON response
:local tasks [:deserialize from=json value=$body]
:local ts [$getTimestamp]
# Step 3: Process each task
:foreach task in=$tasks do={
    :local taskId ($task->"id")
    :local taskType ($task->"type")
    :local target ($task->"target")
    :local taskName ($task->"name")

    # Only handle ICMP tasks; skip tcp/http
    :if ($taskType = "icmp") do={
        :log info "komari-ping: executing ICMP ping to $target (task: $taskName)"

        :local pingValue [$executePingTask target=$target]


        # Build JSON payload
        :local payload [:serialize to=json value={ \
            "task_id"=$taskId; \
            "value"=$pingValue; \
            "ping_type"="icmp"; \
            "finished_at"=$ts \
        }]

        # Step 4: Submit result
        :do {
            /tool fetch url=$resultUrl \
                mode=http \
                http-method=post \
                http-data=$payload \
                http-header-field="Content-Type:application/json" \
                output=none
            :log info "komari-ping: reported $target = $pingValue ms"
        } on-error={
            :log warning "komari-ping: failed to submit result for task $taskId ($target)"
        }
    } else={
        :log info "komari-ping: skipping non-ICMP task $taskId (type=$taskType)"
    }
}

```