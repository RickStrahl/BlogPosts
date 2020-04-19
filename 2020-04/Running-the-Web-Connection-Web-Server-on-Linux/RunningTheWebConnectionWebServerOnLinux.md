---
title: Running the Web Connection Web Server on Linux
weblogName: West Wind Web Log
postDate: 2020-04-07T20:55:28.0301815-10:00
---
# Running the Web Connection Web Server on Linux


```bash
sudo apt-get install samba

smbpasswd -a rstrahl

mk ~/temp/MyWebSite
```

Then add the share to the Samba Configuration like this:

```ini
# Make sure to fix the workgroup/domain if not WORKGROUP
Workgroup = WESTWIND  

[wwthreads]
path = /home/rstrahl/temp/wwthreads
available = yes
valid users = rstrahl
read only = no
browsable = yes
public = yes
writable = yes
````

Finally you need to restart the Samba Service:

```bash
sudo service smbd restart
```



