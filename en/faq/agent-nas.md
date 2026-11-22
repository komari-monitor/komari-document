# Run Agent on NAS

To install and run the Komari Agent on a NAS, first understand your NAS hardware environment. Read [Running the Komari Agent without root](/en/faq/agent-no-root.html) to make sure you download the correct `komari-agent` build.

## Synology

> The steps below use Synology DSM 7.2 as an example.

### 1. Install komari-agent on your Synology NAS

1. Download `komari-agent` following the method in **Running the Komari Agent without root**.
2. In `File Station`, create a folder named `komari` inside your home folder.
3. Upload `komari-agent` into the `komari` folder.
4. Right-click the `komari-agent` file, open Properties, and check the location shown on the General tab. It will look like `/volume1/homes/<your-username>/komari/komari-agent`. Copy and save this path.

### 2. Create a scheduled task

1. Open Control Panel → Task Scheduler.
2. Create a new scheduled task → User-defined script.
3. General settings: give the task a name, for example `komari-agent`, and run it as root or an administrator account.
4. Schedule: repeat daily, time 00:00 (the defaults are fine).
5. Task settings: enter the following as the user-defined script, then save.

```bash
chmod +x /volume1/homes/admin/komari/komari-agent
nohup /volume1/homes/admin/komari/komari-agent -e http://127.0.0.1:25774 -t 1234567890abcdef &
```

6. Under Settings, enable saving output results and choose a folder for the task's output logs.

#### Notes

- `/volume1/homes/admin/komari/komari-agent` is the path you copied during installation.
- `-e http://127.0.0.1:25774 -t 1234567890abcdef` are the parameters from your komari-server (replace them with your actual panel address, port, and token).

### 3. Run the Komari Agent

1. Select the task you just created, for example `komari-agent`, and click Run.
2. To check the run log, look in the log folder you configured in the task settings:

> In `File Station`, open the log folder you selected, then `synoscheduler`, then the folder with your task's sequence number, and open the newest `output.log`.
