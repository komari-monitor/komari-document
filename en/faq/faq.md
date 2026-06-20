# General FAQ

## Why does memory usage differ from other tools?

Starting with Agent `1.1.40`, Komari calculates memory usage in the same style as `htop`. Cache and buffer memory are treated as available memory, which can make the displayed usage differ from older Komari versions or other monitoring tools.

## Why are disk statistics incorrect?

Komari filters disks with simple mount point and filesystem-type rules. Special mount points or filesystem types can cause unexpected results.

Use these agent parameters to tune disk monitoring:

- `--include-mountpoint`
- `--exclude-mountpoint`

## How do I reset network traffic monthly?

During installation, set the monthly network traffic reset day to match your provider's billing reset day. This enables monthly traffic rotation.

## How do I show the traffic progress bar?

In the admin dashboard, edit a server from the server list and set the traffic threshold. After saving, the progress bar appears for that node.

Do not exceed the maximum `BIGINT` value: `9,223,372,036,854,775,807` bytes, roughly 9 PB.
