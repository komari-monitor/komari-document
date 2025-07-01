# Docker 教程

这个教程会手把手教你如何用 Docker 快速启动一个叫 **Komari** 的工具。即使你对 Linux 或者命令行不太熟悉，也能轻松搞定！跟着步骤走，10 分钟内就能看到成果。

## 快速上手（TLDR）

如果你已经装好 Docker 并且知道自己在干什么，可以直接用下面这串命令：

```bash
mkdir -p ./data
docker run -d \
  -p 25774:25774 \
  -v $(pwd)/data:/app/data \
  --name komari \
  ghcr.io/komari-monitor/komari:latest
docker logs komari
```

> 你也可以通过环境变量 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 自定义初始用户名和密码。

> 实验性：可以指定数据库参数，不指定默认使用sqlite3，详见--help参数


## 步骤 0：安装 Docker

**Docker** 是一个能让程序运行在“容器”里的工具，简单来说就像一个轻量级的虚拟机。Komari 需要 Docker 来运行。

### 如果你还没安装 Docker：
1. 打开终端。
2. 复制下面的命令，粘贴到终端，然后按回车：

   ```bash
   bash <(curl -sL get.docker.com)
   ```

3. 这一步会自动下载并安装 Docker。过程中可能会问你要密码，或者让你确认，按提示操作就行。
4. 安装完成后，检查 Docker 是否正常工作。运行下面这行命令：

   ```bash
   docker --version
   ```

   如果看到类似 `Docker version 20.x.x` 的输出，说明安装成功！


## 步骤 1：创建用来存数据的文件夹

Komari 需要一个地方来保存它的数据（比如你的设置和记录）。我们就给它建一个文件夹。

1. 在终端里，输入下面这行命令并按回车：

   ```bash
   mkdir -p ./data
   ```

2. 这会在你当前的工作目录（终端里所在的地方）创建一个叫 `data` 的文件夹。  
   **小提示**：如果你想确认文件夹建好了，可以输入 `ls`看看，应该能看到 `data`。

## 步骤 2：启动 Komari 的 Docker 容器

现在我们要用 Docker 把 Komari 跑起来！这一步会下载 Komari 的程序并启动它。

1. 在终端里，复制并运行下面这串命令：

   ```bash
   docker run -d \
     -p 25774:25774 \
     -v $(pwd)/data:/app/data \
     --name komari \
     ghcr.io/komari-monitor/komari:latest
   ```

2. 这串命令做了啥？
   - 让 Docker 下载并运行 Komari 的最新版本。
   - 把 Komari 的数据保存在你刚才创建的 `data` 文件夹里。
   - 让 Komari 通过 `25774` 端口工作（这个端口就像一个门，让你能访问 Komari）。
   - 给这个容器取名叫 `komari`，方便你管理。

3. 运行后，终端可能不会有太多输出，这是正常的！Docker 已经在后台默默工作了。


## 步骤 3：找到默认的用户名和密码

Komari 第一次运行时会自动生成一个用户名和密码，供你登录使用。我们需要去看看它们是什么。

1. 在终端里，输入：

   ```bash
   docker logs komari
   ```

2. 这会显示 Komari 容器的日志。你需要找类似下面这样的信息：

   ```
   Default admin account created. Username: admin , Password: 2ioEnIPwn17a
   ```
    例如在这里，用户名就是`admin`,密码是`2ioEnIPwn17a`
3. 把用户名和密码记下来（可以用笔写下来，或者复制到记事本里），一会儿登录要用。


## 步骤 4：打开浏览器，访问 Komari

现在万事俱备！让我们去看看 Komari 的界面吧。

1. 打开你的浏览器（比如 Chrome、Edge 或者 Safari）。
2. 在地址栏输入：

   ```
   http://<你的服务器IP>:25774
   ```

   - 如果你在自己的电脑上跑 Komari，`<你的服务器IP>` 通常是 `localhost` 或 `127.0.0.1`。所以地址就是：

     ```
     http://localhost:25774
     ```

   - 如果你在远程服务器上跑（比如云服务器），把 `<你的服务器IP>` 换成服务器的公网 IP 地址，比如：

     ```
     http://192.168.1.100:25774
     ```

3. 按回车后，你应该会看到 Komari 页面，点击登录按钮。
4. 输入步骤 3 里找到的用户名和密码，登录进去！


## 步骤 5：大功告成！

如果一切顺利，你现在应该已经登录到 Komari 的界面了！可以开始探索它的功能啦。


## 遇到问题怎么办？

- **看不到登录页面？**
  - 确认一下 Docker 是否在运行：输入 `docker ps`，看看有没有 `komari` 的容器。
  - 检查地址是否正确，尤其是 IP 和端口（`25774`）。
  - 如果是远程服务器，确保防火墙允许 `25774` 端口的访问。

- **不知道服务器 IP？**
  - 本地电脑就用 `localhost`。
  - 云服务器的话，登录云服务商的控制台，找你的服务器公网 IP。

- **日志里没找到用户名密码？**
  - 再跑一次 `docker logs komari`，多翻翻日志。有时候信息可能被埋在其他输出里。

- **还是搞不定？**
  - 在终端里运行 `docker logs komari` 把错误信息复制下来，在[这里](https://github.com/komari-monitor/komari/issues/new?template=general_issue.md)提问。


## 小提示

- **想停掉 Komari？** 在终端运行：
  ```bash
  docker stop komari
  ```

- **想重新启动？** 运行：
  ```bash
  docker start komari
  ```

- **想彻底删掉容器？** 先停止容器，然后运行：
  ```bash
  docker rm komari
  ```

- **数据安全**：你的数据都保存在 `data` 文件夹里，备份这个文件夹就能保存所有设置。

