# 重置密码教程


## 快速上手（TLDR）

```bash
komari chpasswd -u <username> -p <password>

Flags:
-h, --help              help for chpasswd
-p, --password string   New password
-u, --user string       The username of the account to change password (default "admin")

Global Flags:
-d, --database string   Database file (default "./data/komari.db")
```


## 准备工作

**你需要知道：**
- 我们要用一个叫 `chpasswd` 的命令来改密码。
- 你需要打开终端（Windows 用 PowerShell 或命令提示符，Linux/Mac 用终端）。
- 如果你用的是 Docker 部署的 Komari，步骤会稍微不同，但我们也会讲清楚。

**工具准备：**
- 如果是用二进制文件部署的，确保你有 `komari` 可执行文件（Windows 是 `komari.exe`）。
- 如果是用 Docker 部署的，确保 Docker 正在运行（运行 `docker ps` 检查是否有 `komari` 容器）。
- 知道你的 Komari 数据文件在哪里（默认在 `data` 文件夹里的 `komari.db`）。


## 教程：重置 Komari 密码

我们会分开讲解 **Windows**、**Linux** 和 **Docker** 的操作步骤。找到你用的环境，直接照着做就行！

### 一、Windows 用户（二进制文件部署）

#### 步骤 1：找到 Komari 可执行文件
1. 打开你存放 `komari.exe` 的文件夹，比如 `C:\komari`。
   - 如果忘了放哪儿了，搜索 `komari.exe` 找找看。
2. 确认旁边有个 `data` 文件夹，里面有 `komari.db`（这是存储密码的地方）。

#### 步骤 2：打开 PowerShell
1. 在 `komari.exe` 所在的文件夹上，**右键空白处**，选择“在终端中打开”或“打开 PowerShell 窗口”。
   - 或者：按 `Win + R`，输入 `powershell`，回车，然后用 `cd` 命令切换到文件夹，比如：
     ```powershell
     cd C:\komari
     ```

#### 步骤 3：运行重置密码命令
1. 在 PowerShell 里输入下面命令，回车运行：
   ```powershell
   .\komari.exe chpasswd -u admin -p 新密码
   ```
   - `admin` 是你要改密码的用户名（默认是 `admin`，如果改过就换成你的用户名）。
   - `新密码` 换成你想要的新密码，比如 `MySecurePass123`。
   - 比如，想把 `admin` 的密码改成 `MySecurePass123`，就运行：
     ```powershell
     .\komari.exe chpasswd -u admin -p MySecurePass123
     ```

2. 如果命令成功，终端会显示类似“Password changed successfully”。

#### 步骤 4：验证新密码
1. 打开浏览器，访问 Komari（通常是 `http://localhost:25774` 或你的服务器 IP）。
2. 用用户名 `admin` 和新密码登录，检查是否成功。

#### 遇到问题？
- **命令报错说找不到文件？**
  - 确认你在正确的文件夹（用 `dir` 列出文件，看看有没有 `komari.exe`）。
  - 确认 `data` 文件夹和 `komari.db` 存在。
- **密码没变？**
  - 确认用户名对不对（默认是 `admin`）。
  - 检查 `data\komari.db` 是否在当前文件夹，或者用 `-d` 指定路径，比如：
    ```powershell
    .\komari.exe chpasswd -u admin -p MySecurePass123 -d C:\komari\data\komari.db
    ```


### 二、Linux 用户（二进制文件部署）

#### 步骤 1：找到 Komari 可执行文件
1. 打开终端，进入存放 `komari` 二进制文件的文件夹，比如 `~/komari`：
   ```bash
   cd ~/komari
   ```
2. 确认文件夹里有 `komari` 文件和 `data` 文件夹（里面有 `komari.db`）。
   - 用 `ls` 命令检查：
     ```bash
     ls
     ```
     应该能看到 `komari` 和 `data`。

#### 步骤 2：运行重置密码命令
1. 输入下面命令，回车运行：
   ```bash
   ./komari chpasswd -u admin -p 新密码
   ```
   - `admin` 是用户名（默认是 `admin`，如果改过就换成你的）。
   - `新密码` 换成你想要的密码，比如 `MySecurePass123`。
   - 比如：
     ```bash
     ./komari chpasswd -u admin -p MySecurePass123
     ```

2. 如果成功，终端会返回类似“Password changed successfully”。

#### 步骤 3：验证新密码
1. 打开浏览器，访问 Komari（比如 `http://localhost:25774` 或服务器 IP）。
2. 用用户名 `admin` 和新密码登录，检查是否生效。

#### 遇到问题？
- **命令说“Permission denied”？**
  - 给 `komari` 加可执行权限：
    ```bash
    chmod +x komari
    ```
    然后再试。
- **命令报错说找不到文件？**
  - 确认 `data/komari.db` 在当前文件夹。
  - 如果数据库在别的地方，用 `-d` 指定路径，比如：
    ```bash
    ./komari chpasswd -u admin -p MySecurePass123 -d /path/to/data/komari.db
    ```


### 三、Docker 用户（Windows/Linux/Mac）

如果你是用 Docker 部署的 Komari，重置密码需要进入容器或用 `docker exec` 运行命令。别担心，我们一步步来！

#### 步骤 1：确认 Docker 容器在运行
1. 打开终端，运行：
   ```bash
   docker ps
   ```
2. 找一个名叫 `komari` 的容器，确认它在运行（状态是 `Up`）。
   - 如果没看到，可能是容器停了，运行 `docker ps -a` 看看所有容器，然后启动它：
     ```bash
     docker start komari
     ```

#### 步骤 2：运行重置密码命令
1. 用 `docker exec` 在容器里运行 `chpasswd` 命令：
   ```bash
   docker exec komari komari chpasswd -u admin -p 新密码
   ```
   - `admin` 是用户名（默认是 `admin`，改过就换成你的）。
   - `新密码` 换成你想要的，比如 `MySecurePass123`。
   - 比如：
     ```bash
     docker exec komari komari chpasswd -u admin -p MySecurePass123
     ```

2. 如果成功，终端会返回“Password changed successfully”或没报错。

#### 步骤 3：验证新密码
1. 打开浏览器，访问 Komari（比如 `http://localhost:25774` 或服务器 IP）。
2. 用用户名 `admin` 和新密码登录，检查是否生效。

#### 遇到问题？
- **命令报错说“no such file”？**
  - 确认容器名叫 `komari`（用 `docker ps` 检查）。
  - 确认你在容器里运行的是 `komari chpasswd`，不是别的命令。
- **密码没变？**
  - 确认用户名正确。
  - 确认数据卷没问题，检查 `data` 文件夹是否挂载正确（默认在 `./data`）。
  - 如果数据库路径不是默认的，用 `-d` 指定，比如：
    ```bash
    docker exec komari komari chpasswd -u admin -p MySecurePass123 -d /app/data/komari.db
    ```


## 小贴士

- **密码安全**：新密码尽量复杂，包含字母、数字和符号，比如 `MySecurePass123!`。
- **备份数据**：改密码会更新 `data/komari.db`，建议备份 `data` 文件夹以防万一。
- **改了密码不生效？**
  - 确认你改的是正确的用户名。
  - 如果 Komari 在运行，改完密码后可能需要重启：
    - 二进制部署：关掉终端或 `Ctrl+C`，重新运行 `komari server`。
    - Docker：重启容器：
      ```bash
      docker restart komari
      ```


## 遇到其他问题？

- **日志怎么看？**
  - 二进制部署：启动 Komari 时看终端输出，或检查 `data` 文件夹里的日志文件（如果有）。
  - Docker：用 `docker logs komari` 查看。
- **还是搞不定？**
  - 把终端的错误信息复制下来，贴到在[这里](https://github.com/komari-monitor/komari/issues/new?template=general_issue.md)提问。
