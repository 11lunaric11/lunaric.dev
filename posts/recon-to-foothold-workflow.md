---
title: My recon-to-foothold workflow for HTB & THM boxes
date: 2026-06-17
tags: [methodology, htb, thm, recon]
description: The repeatable enumeration process I run on every Hack The Box / TryHackMe machine — from the first port scan to a working foothold.
---

Most boxes aren't won at the exploit. They're won in **enumeration** — the foothold is usually sitting in plain sight once you've looked properly. So instead of memorising exploits, I run the same repeatable workflow every time. Here's the version I keep coming back to.

> Adjust paths/wordlists to your setup. I keep a `box.md` open the whole time and paste everything into it — commands, output, ideas. Notes are half the battle.

## 1. Map the ports

Start fast to get a direction, then go wide in the background.

```bash
# quick: top ports, find something to work with
nmap -sC -sV -T4 -oN nmap/initial.txt $IP

# thorough: every TCP port, run while you start on the obvious stuff
nmap -p- --min-rate 5000 -oN nmap/allports.txt $IP

# then service/script scan only the open ones
nmap -sC -sV -p<comma,separated,ports> -oN nmap/services.txt $IP
```

I always write to a file (`-oN`). You *will* want to grep the output again later.

## 2. Enumerate each service, one at a time

Resist the urge to jump straight to the web app. Walk the list:

- **22 / SSH** — note the version; rarely the way in, but good for context.
- **80 / 443 / 8080 — HTTP(S)** — almost always the main attack surface (see below).
- **139 / 445 — SMB** — `smbclient -L //$IP/ -N`, `enum4linux-ng $IP`. Anonymous shares leak constantly.
- **21 — FTP** — try `anonymous:anonymous`. Look for writable dirs.
- **53 — DNS** — attempt a zone transfer (`dig axfr @$IP domain`).
- **3306 / 5432 / 6379** — databases; test for default/blank creds.

## 3. Go deep on the web

This is where most footholds live.

```bash
# fingerprint the stack
whatweb http://$IP
# headers tell you a lot
curl -sI http://$IP

# content discovery
ffuf -u http://$IP/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -ic

# vhost fuzzing — boxes love a hidden virtual host
ffuf -u http://$IP/ -H "Host: FUZZ.target.htb" \
     -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -fs <baseline-size>
```

Then *actually read the site*: view source, check `/robots.txt`, comments, JS files (endpoints + secrets hide there), login pages, and any version strings. A CMS or framework version is often a one-line `searchsploit` away from a foothold.

## 4. Turn enumeration into a foothold

With the surface mapped, the foothold usually comes from one of:

1. **Default / weak credentials** on an admin panel, DB, or service.
2. **A known CVE** for an identified version — `searchsploit <product> <version>`.
3. **A web primitive** — file upload, LFI/RFI, SSTI, SQLi, or an exposed API.
4. **Leaked secrets** — creds in a config file, a `.git` directory, an S3 bucket, or a JS bundle.
5. **Credential reuse** — something you found on service A unlocking service B.

Pick the path with the clearest evidence, not the flashiest exploit. If two paths look open, take the simpler one first.

## 5. Keep a log

For every box I record: open ports, service versions, interesting URLs/files, creds found, and what finally worked. Over time that file becomes your real cheat sheet — patterns repeat across boxes far more than people expect.

---

None of this is exotic. The edge isn't a secret tool — it's doing the boring enumeration thoroughly and writing it down. The boxes that feel "easy" are usually just the ones where I enumerated properly the first time.
