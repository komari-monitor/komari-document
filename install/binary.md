# 二进制文件部署


## 快速上手（TLDR）

如果你知道自己在干什么，可以直接看这里

[GitHub Release 页面](https://github.com/komari-monitor/komari/releases)

在25774端口开启服务
```bash
./komari server -l 0.0.0.0:25774
```

## 步骤 0：准备工作

**什么是二进制文件？**  
简单说，二进制文件就是一个已经打包好的程序，你下载后直接运行就行，不需要像 Docker 那样安装额外的工具。Komari 提供了适用于不同操作系统的二进制文件（比如 Linux、Windows、Mac）。

**你需要准备：**
- 一台电脑或服务器（Windows、Mac 或 Linux 都可以）。
- 能访问网络（用来下载文件）。
- 知道怎么打开终端（Windows 用 PowerShell 或命令提示符，Mac/Linux 用终端）。


## 步骤 1：下载 Komari 的二进制文件

1. 打开浏览器，访问 Komari 的 [GitHub Release 页面](https://github.com/komari-monitor/komari/releases)。
2. 在页面上找到最新的版本（通常在最上面，标着类似 `v1.x.x`）。
3. 根据你的操作系统选择对应的文件：
   - **Linux**：下载类似 `komari_linux_amd64` 的文件（如果是 ARM 设备，选 `arm64`）。
   - **Windows**：下载类似 `komari_windows_amd64.exe` 的文件。
4. 下载后，把文件放到一个方便操作的文件夹，比如：
   - Linux/Mac：可以放进 `~/komari` 文件夹（先运行 `mkdir ~/komari` 创建）。
   - Windows：可以放进 `C:\komari` 文件夹（手动新建一个文件夹）。
5. **重要**：为了方便，建议把下载的文件改个简单的名字，比如 `komari`（Windows 是 `komari.exe`）。


## 步骤 2：给二进制文件添加可执行权限（Linux/Mac）

**Windows 用户可以跳过这一步！**

在 Linux 或 Mac 上，下载的二进制文件默认可能没有“可执行”权限，我们需要手动加上。

1. 打开终端，进入放二进制文件的文件夹。比如文件在 `~/komari`：
   ```bash
   cd ~/komari
   ```
2. 运行下面命令给文件加权限：
   ```bash
   chmod +x komari
   ```
3. 确认权限加好了，运行：
   ```bash
   ls -l
   ```
   如果看到 `komari` 前面有 `x`（比如 `-rwxr-xr-x`），说明权限 OK。


## 步骤 3：运行 Komari

现在我们来启动 Komari！

1. 在终端里，确保你还在放 `komari` 文件的文件夹（如果不在，用 `cd` 命令切换目录）。
2. 运行下面命令启动 Komari：
   ```bash
   ./komari server -l 0.0.0.0:25774
   ```
   - `./komari` 是运行二进制文件。
   - `server` 告诉 Komari 以服务器模式运行。
   - `-l 0.0.0.0:25774` 让 Komari 监听 `25774` 端口，允许外部访问。

3. **Windows 用户**：命令稍微不同，运行：
   ```bash
   komari.exe server -l 0.0.0.0:25774
   ```

4. 启动后，终端会显示一些日志信息，别急着关终端，Komari 正在运行！

**小提示**：  
Komari 会自动在当前文件夹下创建一个 `data` 文件夹，用来保存数据（比如设置和记录）。别删这个文件夹，不然数据会丢失！

## 步骤 4：找到默认用户名和密码

Komari 第一次运行时会生成默认的用户名和密码，供你登录。

1. 看看终端里 Komari 的启动日志，找类似下面这样的信息：
     ```
   Default admin account created. Username: admin , Password: 2ioEnIPwn17a
   ```
    例如在这里，用户名就是`admin`,密码是`2ioEnIPwn17a`
2. 把用户名和密码记下来（可以用笔写，或存到记事本）。

## 步骤 5：访问 Komari

1. 打开浏览器（Chrome、Edge、Safari 都行）。
2. 在地址栏输入：
   ```
   http://<你的服务器IP>:25774
   ```
   - **本地电脑**：用 `http://localhost:25774` 或 `http://127.0.0.1:25774`。
   - **远程服务器**：把 `<你的服务器IP>` 换成服务器的公网 IP，比如 `http://192.168.1.100:25774`。

3. 输入步骤 4 记下的用户名和密码，登录 Komari。


## 步骤 6：大功告成！

如果看到 Komari 的界面，恭喜你，部署成功！可以开始玩转 Komari 了。

**但别急！** 现在 Komari 靠终端运行，你一关终端它就停了。接下来我们教你把它设为**系统服务**，让它后台运行，甚至开机自动启动。


## 额外步骤：把 Komari 设为系统服务（Linux）

**Windows 和 Mac 用户**：Windows 可以用 NSSM（非吸血服务管理器）或任务计划程序，Mac 可以用 `launchd`，但这里主要讲 Linux 的 systemd！

在 Linux 上，我们用 **systemd** 把 Komari 设为服务，这样它可以：
- 后台运行，不用一直开着终端。
- 开机自动启动。
- 崩溃时自动重启。

### 6.1 创建服务文件

1. 假设你的 `komari` 二进制文件在 `/home/user/komari` 目录（如果不是，替换成实际路径）。
2. 用文本编辑器（比如 `nano`）创建服务文件：
   ```bash
   sudo nano /etc/systemd/system/komari.service
   ```
3. 复制下面内容，粘贴到文件里：
   ```ini
   [Unit]
   Description=Komari Monitoring Service
   After=network.target

   [Service]
   ExecStart=/home/user/komari/komari server -l 0.0.0.0:25774
   WorkingDirectory=/home/user/komari
   Restart=always
   User=root

   [Install]
   WantedBy=multi-user.target
   ```
   - 把 `/home/user/komari` 替换成你的 `komari` 文件实际路径。
   - (可选)把 `root` 替换成你的 Linux 用户名（运行 `whoami` 可以查看）。

4. 保存文件：
   - 用 `nano`：按 `Ctrl+O`，回车保存，再按 `Ctrl+X` 退出。
   - 用 `vim`：按 `Esc`，输入 `:wq`，回车。


### 6.2 启用并启动服务

1. 重新加载 systemd 配置：
   ```bash
   sudo systemctl daemon-reload
   ```
2. 启用服务（让它开机自启）：
   ```bash
   sudo systemctl enable komari
   ```
3. 启动服务：
   ```bash
   sudo systemctl start komari
   ```
4. 检查服务状态：
   ```bash
   sudo systemctl status komari
   ```
   - 如果看到 `active (running)`，说明服务跑起来了！
   - 如果有错误，看看日志提示，可能是路径或权限问题。


### 6.3 管理服务

- **停止服务**：
  ```bash
  sudo systemctl stop komari
  ```
- **重启服务**：
  ```bash
  sudo systemctl restart komari
  ```
- **查看日志**：
  ```bash
  journalctl -u komari -f
  ```


## 遇到问题怎么办？

- **下载的二进制文件无法运行？**
  - Linux/Mac：确认文件有可执行权限（`chmod +x komari`）。
  - 确认下载的文件匹配你的系统（比如 Linux 不要下 Windows 的 `exe`）。
  - 运行 `./komari --help`，看看有没有输出。

- **浏览器打不开页面？**
  - 确认地址正确（`http://localhost:25774` 或服务器 IP）。
  - 检查端口 `25774` 是否被防火墙挡住（Linux 可运行 `sudo ufw allow 25774`）。
  - 确认 Komari 在运行（终端没关，或者服务状态是 `active`）。

- **服务启动失败？**
  - 运行 `journalctl -u komari -f` 查看日志，找错误原因。
  - 检查 `komari.service` 文件里的路径和用户名是否正确。
  - 确保 `data` 文件夹有写入权限（运行 `chmod -R 755 /home/user/komari/data`）。

- **数据丢失？**
  - 确认 `data` 文件夹在运行目录下，且没被删。
  - 备份 `data` 文件夹，防止意外丢失。


## 小提示

- **备份数据**：定期复制 `data` 文件夹到安全地方。
- **更新 Komari**：
  1. 停止服务（`sudo systemctl stop komari`）。
  2. 下载新版二进制文件，替换旧文件。
  3. 启动服务（`sudo systemctl start komari`）。
- **安全建议**：
  - 如果暴露在公网，考虑加 HTTPS 或用反向代理（比如 Nginx）。
