# Deploy Komari with 1Panel

Komari is officially listed in the 1Panel app store, so you can install and deploy it directly from 1Panel without extra scripts or manual configuration.

> **Official app store page**: [https://apps.fit2cloud.com/1panel/komari](https://apps.fit2cloud.com/1panel/komari)

## Requirements

- A server with 1Panel installed ([1Panel installation guide](https://1panel.cn/docs/installation/online_installation/))
- At least 1 CPU core and 512 MB of memory
- At least 15 GB of storage

## Step 1: Install the Komari app

### 1. Open the app store

Log in to the 1Panel dashboard and click **App Store** in the left sidebar.

![1Panel app store entry](/assets/1panel-sidebar.png)

### 2. Search for Komari

Type `komari` in the app store search box, or find the Komari app under the utilities category.

![Search for Komari](/assets/1panel-search.png)

### 3. Configure and install

Click **Install** to open the configuration page:

| Setting | Default | Description |
|---------|---------|-------------|
| Port | 25774 | External access port, can be customized |

![Install configuration](/assets/xhcuyxfg.jpg)

> **⚠️ Note**: the first visit to Komari opens the installation wizard, where you create the administrator account.

### 4. Wait for the installation to finish

Confirm the settings and click **Confirm**. 1Panel pulls the image and finishes the deployment automatically.

![Installation progress](/assets/1p-installed.jpg)

## Step 2: Open the Komari dashboard

After installation, access Komari at:

- **By IP**: `http://<server-IP>:25774` (if you kept the default port)
- **By domain**: configure a reverse proxy in 1Panel's **Website** feature

![Komari login page](/assets/gdujcjv.jpg)

The first visit opens the installation wizard. Complete the administrator account and site settings to log in.

## Step 3: Start using Komari

After logging in, you can:

1. **Add servers to monitor**: generate the agent install command in the admin panel and deploy it on the servers you want to monitor.
2. **Customize the theme**: install third-party themes such as Purcarte to restyle the interface.
3. **Configure alerts**: set up notifications for abnormal server status.

## FAQ

### How do I change the port or password of a deployed instance?

In 1Panel, go to **App Store** → **Installed**, find Komari, and click **Parameters** to edit them, then restart the app.

### Image pulls are slow on servers in China?

1Panel has built-in image acceleration. You can also edit the compose configuration during installation and point the GitHub container registry at a mirror, for example `https://ghcr.1ms.run`.

## Notes

- Keep the data directory persistent.
- Back up the data directory before upgrades.
- If the 1Panel template changes, prefer the template's current instructions for fields such as network mode and volume mapping.
