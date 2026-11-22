# Connecting MikroTik to Komari over HTTP

When RouterOS cannot run a resident agent or hold a WebSocket connection, you can use scheduled scripts to call the Agent v2 JSON-RPC API. This page covers v2 only; the legacy `/api/clients/report` and `/api/clients/uploadBasicInfo` endpoints and the standalone Ping HTTP API have been retired.

## Prerequisites

- RouterOS 7.x with `:serialize` and `:deserialize` support
- A node created in Komari Server, with its token at hand
- The server address and token filled into the scripts below

All requests go to:

```text
POST {apiBase}/api/clients/v2/rpc?token=<token>
```

The request body must be a JSON-RPC 2.0 envelope. The basic-info and realtime-report scripts below can be used as-is; for event pulling and Ping / remote-execution results, see [Connecting to Komari over HTTP](/en/faq/upload-via-http.html).

## Basic Info Script

```rsc
# Komari Agent v2 basic info for MikroTik RouterOS v7
:local apiBase "http://192.168.233.9:25774"
:local token   "replace-with-token"
:local rpcUrl  "$apiBase/api/clients/v2/rpc\?token=$token"

:local cpuName    [/system resource get cpu]
:local cpuCores   [/system resource get cpu-count]
:local arch       [/system resource get architecture-name]
:local rosVersion [/system resource get version]
:local memTotal   [/system resource get total-memory]
:local diskTotal 0
:do { :set diskTotal [/system resource get total-hdd-space] } on-error={}

:local info {
    "cpu_name"=$cpuName;
    "cpu_cores"=$cpuCores;
    "arch"=$arch;
    "os"=("RouterOS " . $rosVersion);
    "kernel_version"=$rosVersion;
    "mem_total"=$memTotal;
    "disk_total"=$diskTotal;
    "swap_total"=0;
    "gpu_name"="";
    "version"="routeros-agent/2.0";
    "virtualization"="None"
}
:local payload [:serialize to=json value={
    "jsonrpc"="2.0";
    "id"="basic-info";
    "method"="agent.basicInfo";
    "params"={"info"=$info}
}]

/tool fetch url=$rpcUrl mode=http http-method=post http-data=$payload \
    http-header-field="Content-Type:application/json" output=none
```

## Realtime Report Script

The script below shows the minimum report fields. Add network traffic and connection counts as the device allows, and run it every 5–8 seconds.

```rsc
# Komari Agent v2 report for MikroTik RouterOS v7
:local apiBase "http://192.168.233.9:25774"
:local token   "replace-with-token"
:local rpcUrl  "$apiBase/api/clients/v2/rpc\?token=$token"

:local cpuLoad  [/system resource get cpu-load]
:local memTotal [/system resource get total-memory]
:local memFree  [/system resource get free-memory]
:local memUsed  ($memTotal - $memFree)
:local uptime   [/system resource get uptime]
:local uptimeSec [:tonum $uptime]

:local report {
    "cpu"={"usage"=$cpuLoad};
    "ram"={"total"=$memTotal;"used"=$memUsed};
    "swap"={"total"=0;"used"=0};
    "load"={"load1"=0;"load5"=0;"load15"=0};
    "disk"={"total"=0;"used"=0};
    "network"={"up"=0;"down"=0;"totalUp"=0;"totalDown"=0};
    "connections"={"tcp"=0;"udp"=0};
    "uptime"=$uptimeSec;
    "process"=0;
    "message"=""
}
:local payload [:serialize to=json value={
    "jsonrpc"="2.0";
    "id"=("report-" . [/system clock get time]);
    "method"="agent.report";
    "params"={"report"=$report;"ack_event_ids"={}}
}]

/tool fetch url=$rpcUrl mode=http http-method=post http-data=$payload \
    http-header-field="Content-Type:application/json" output=none
```
