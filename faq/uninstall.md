# Komari Agent 卸载指南

本文档将指导您如何从系统中完全卸载 Komari Agent。

## Windows

在 Windows 上卸载 Komari Agent 需要使用管理员权限的 PowerShell。

1.  **以管理员身份打开 PowerShell**

    -   在开始菜单中搜索 “PowerShell”。
    -   右键点击 “Windows PowerShell”，选择 “以管理员身份运行”。

2.  **停止并移除服务**

    Komari Agent 使用 `nssm` 进行服务管理。您需要使用 `nssm` 来停止和移除服务。如果安装时自定义了服务名称，请将 `komari-agent` 替换为您自定义的名称。

    ```powershell
    # 停止服务
    nssm stop komari-agent

    # 移除服务
    nssm remove komari-agent confirm
    ```

3.  **删除安装目录**

    默认情况下，Agent 安装在 `C:\Program Files\Komari`。如果安装时通过 `--install-dir` 参数指定了其他目录，请修改下面的路径。

    ```powershell
    Remove-Item -Path "$Env:ProgramFiles\Komari" -Recurse -Force
    ```

完成以上步骤后，Komari Agent 已从您的 Windows 系统中完全卸载。

## Linux

在 Linux 系统上卸载需要使用 root 权限。请根据您的系统的 `init` 系统（如 `systemd`、`OpenRC` 或 `procd`）执行相应命令。

如果安装时自定义了服务名称，请将 `komari-agent` 替换为您自定义的名称。

### Systemd

1.  **停止并禁用服务**

    ```bash
    # 停止服务
    sudo systemctl stop komari-agent

    # 禁用服务，使其不再开机自启
    sudo systemctl disable komari-agent
    ```

2.  **删除服务文件**

    ```bash
    sudo rm /etc/systemd/system/komari-agent.service
    sudo systemctl daemon-reload
    ```
3.  **确认无任何自定义修改可以使用一行命令一键删除**
    ```bash
    sudo systemctl stop komari-agent && sudo systemctl disable komari-agent && sudo rm -f /etc/systemd/system/komari-agent.service && sudo systemctl daemon-reload && sudo rm -rf /opt/komari /var/log/komari
    ```
    

### OpenRC

1.  **停止并禁用服务**

    ```bash
    # 停止服务
    sudo rc-service komari-agent stop

    # 从默认运行级别中删除服务
    sudo rc-update del komari-agent default
    ```

2.  **删除服务文件**

    ```bash
    sudo rm /etc/init.d/komari-agent
    ```
3。 **确认无任何自定义修改可以使用一行命令一键删除**
    ```bash
    sudo rc-service komari-agent stop && sudo rc-update del komari-agent default && sudo rm -f /etc/init.d/komari-agent && sudo rm -rf /opt/komari
    ```

### procd (OpenWrt)

1.  **停止并禁用服务**

    ```bash
    # 停止服务
    /etc/init.d/komari-agent stop

    # 禁用服务
    /etc/init.d/komari-agent disable
    ```

2.  **删除服务文件**

    ```bash
    sudo rm /etc/init.d/komari-agent
    ```
3.  **确认无任何自定义修改可以使用一行命令一键删除**
    ```bash
    /etc/init.d/komari-agent stop && /etc/init.d/komari-agent disable && sudo rm -f /etc/init.d/komari-agent && sudo rm -rf /opt/komari
    ```
### 删除安装文件 (所有 Linux 发行版)
**若已使用一行命令一键删除，则无须执行接下来的步骤**

在完成上述特定于 `init` 系统的步骤后，删除 Agent 的安装文件。
默认安装目录为 `/opt/komari`。如果安装时通过 `--install-dir` 参数指定了其他目录，请修改下面的路径。

```bash
sudo rm -rf /opt/komari
```

完成以上步骤后，Komari Agent 已从您的 Linux 系统中完全卸载。
