# 在 NAS 中安装和运行 Komari Agent

想要在 NAS 中安装和运行 Komari Agent , 请先了解你的 NAS 的硬件环境，先了解一下 [非 Root 环境下安装和运行 Komari Agent](/faq/agent-no-root.html)，确保你能下载到正确的 `komari-agent`。

## 群晖

> 以群晖 DSM 7.2 例

### 安装 komari-agent 到你的群晖

1. 按 **非 Root 环境下安装和运行 Komari Agent** 中方法下载 `komari-agent`。
2. 在你的群晖 `File Station` 中的 home 创建目录 komari 目录。
3. 上传 `komari-agent` 到 komari 目录。
4. 右键点击 `komari-agent` 文件，点击属性，在常规中查看位置信息，会出现 `/volume1/homes/你的用户名/komari/komari-agent` 路径，复制保存。

### 创建计划任务

1. 打开控制面板 - 任务计划。
2. 新增 - 计划中任务 - 用户定义的脚本。
3. 常规 - 一般设置中任务名称填写你的名称，如 `komari-agent`，用户账号选择 root 或管理员权限账号。
4. 计划 - 日期默认重复每天， 时间默认00：00。
5. 任务设置 - 运行命令用户定义的脚本填写：
```bash
chmod +x /volume1/homes/admin/komari/komari-agent;
nohup /volume1/homes/admin/komari/komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef > /volume1/homes/admin/komari/komari.log 2>&1 &
```
6. 确定保存。

> `/volume1/homes/admin/komari/komari-agent` 是你安装时复制的路径。
> `-e http://127.0.0.1:8080 -t 1234567890abcdef` 是你在 komari-server 中获取到的运行所需参数。
> `/volume1/homes/admin/komari/komari.log` 是你日志想要保存的路径。

### 运行 Komari Agent

1. 选中你新增的任务，如 `komari-agent`，点击运行。
