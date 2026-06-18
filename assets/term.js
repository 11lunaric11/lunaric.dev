// lunaric.dev — interactive terminal for the landing page
(function () {
  const body = document.getElementById("term-body");
  const input = document.getElementById("term-input");
  if (!body || !input) return;

  // ---------- fake filesystem ----------
  const F = (c) => ({ type: "file", content: c });
  const D = (children) => ({ type: "dir", children });
  const ROOT = D({
    "about.md": F("Dejan — aka lunaric. Offensive security learner, bug bounty hunter, homelab tinkerer.\nPT1 ✓ · AI1 ✓ · SEC0 ✓ · SEC1 ✓ · CJCA (wip)"),
    "contact.txt": F("contact@lunaric.dev\nhttps://github.com/11lunaric11\nhttps://x.com/11lunaric11"),
    "uses.txt": F("Parrot OS · Core Ultra 5 245KF · RX 9070 XT · 32 GB — see /uses"),
    "blog": D({
      "building-lunaric-dev-in-rust.md": F("→ /blog/building-lunaric-dev-in-rust"),
      "recon-to-foothold-workflow.md": F("→ /blog/recon-to-foothold-workflow"),
    }),
    "projects": D({ "lunaric.dev": F("→ https://github.com/11lunaric11/lunaric.dev") }),
    ".secrets": D({
      "id_rsa": F("nice try 😏 — no keys here"),
      ".env": F("SECRET=Z2V0X25vdGhpbmc=  # base64 for 'get_nothing'"),
      "flag.txt": F("the real flag is touching grass 🌱"),
      "passwords.kdbx": F("a honeypot watching a honeypot. hi 👋"),
    }),
  });

  let cwd = [];
  const nodeAt = (path) => {
    let n = ROOT;
    for (const p of path) {
      if (n.type !== "dir" || !n.children[p]) return null;
      n = n.children[p];
    }
    return n;
  };
  const curDir = () => nodeAt(cwd);
  const pathStr = () => "~" + (cwd.length ? "/" + cwd.join("/") : "");

  function resolve(arg) {
    let path = arg.startsWith("/") || arg.startsWith("~") ? [] : cwd.slice();
    const cleaned = arg.replace(/^~\/?/, "").replace(/^\//, "");
    for (const part of cleaned.split("/")) {
      if (part === "" || part === ".") continue;
      if (part === "..") { path.pop(); continue; }
      const n = nodeAt(path);
      if (!n || n.type !== "dir" || !n.children[part]) return null;
      path.push(part);
    }
    return { node: nodeAt(path), path };
  }

  // ---------- fastfetch ----------
  const FF = "__HTML__" + [
    '<span class="prompt">lunaric</span>@<span class="path">dev</span>',
    '<span class="out">───────────────────────────────────────</span>',
    '<span class="prompt">OS</span>      Parrot OS Security Edition',
    '<span class="prompt">Host</span>    lunaric.dev · Cloudflare edge',
    '<span class="prompt">Kernel</span>  Rust → WebAssembly',
    '<span class="prompt">Shell</span>   zsh',
    '<span class="prompt">CPU</span>     Intel Core Ultra 5 245KF (14) @ 5.20GHz',
    '<span class="prompt">GPU</span>     AMD Radeon RX 9070 XT',
    '<span class="prompt">Memory</span>  32 GB',
    '<span class="prompt">Certs</span>   PT1 · AI1 · SEC0 · SEC1',
    '<span class="prompt">WWW</span>     https://lunaric.dev',
  ].join("\n");

  // ---------- themes ----------
  const THEMES = ["teal", "blue", "purple", "amber", "crimson", "green"];
  const curTheme = () => document.documentElement.getAttribute("data-theme") || "teal";
  function setTheme(name) {
    document.documentElement.setAttribute("data-theme", name);
    try { localStorage.setItem("theme", name); } catch (e) {}
  }

  // ---------- commands ----------
  const COMMANDS = {
    help: () =>
      "available commands:\n" +
      "  whoami        who is lunaric\n" +
      "  ff            system info (fastfetch)\n" +
      "  ls [-a] [dir] list files   ·  cd <dir>  ·  cat <file>  ·  pwd\n" +
      "  theme [name]  switch accent (try: theme)\n" +
      "  contact       email me\n" +
      "  blog / uses / projects   jump to a page\n" +
      "  clear         clear the screen\n" +
      "(tip: ↑/↓ for history, Tab to complete)",
    whoami: () => "lunaric — security learner. PT1 ✓ · CJCA (wip). builds things on the edge.",
    ff: () => FF,
    fastfetch: () => FF,
    pwd: () => pathStr(),
    ls: (arg) => {
      let showAll = false;
      const rest = [];
      for (const t of arg.split(/\s+/).filter(Boolean)) {
        if (/^-[al]+$/.test(t)) showAll = showAll || /a/.test(t);
        else rest.push(t);
      }
      const p = rest.length ? resolve(rest[0]) : { node: curDir() };
      if (!p || !p.node) return "ls: " + rest[0] + ": no such file or directory";
      if (p.node.type === "file") return rest[0];
      const names = Object.keys(p.node.children).filter((n) => showAll || !n.startsWith("."));
      return names.map((n) => (p.node.children[n].type === "dir" ? n + "/" : n)).join("   ");
    },
    cd: (arg) => {
      const a = arg.trim();
      if (!a || a === "~" || a === "/") { cwd = []; updatePrompt(); return ""; }
      const p = resolve(a);
      if (!p || !p.node) return "cd: " + a + ": no such file or directory";
      if (p.node.type !== "dir") return "cd: " + a + ": not a directory";
      cwd = p.path; updatePrompt(); return "";
    },
    cat: (arg) => {
      const a = arg.trim();
      if (!a) return "usage: cat <file>";
      const p = resolve(a);
      if (!p || !p.node) return "cat: " + a + ": no such file or directory";
      if (p.node.type === "dir") return "cat: " + a + ": is a directory";
      return p.node.content;
    },
    theme: (arg) => {
      const a = arg.trim().toLowerCase();
      if (!a) return "themes: " + THEMES.join(", ") + "\nusage: theme <name>   (current: " + curTheme() + ")";
      if (THEMES.indexOf(a) === -1) return "unknown theme: " + a + "\navailable: " + THEMES.join(", ");
      setTheme(a);
      return "theme → " + a;
    },
    contact: () => { location.href = "mailto:contact@lunaric.dev"; return "opening mail → contact@lunaric.dev"; },
    sudo: () => "lunaric is not in the sudoers file. This incident will be reported. 🚨",
    blog: () => { location.href = "/blog"; return "→ /blog"; },
    uses: () => { location.href = "/uses"; return "→ /uses"; },
    projects: () => { location.href = "/projects"; return "→ /projects"; },
    clear: () => "__CLEAR__",
  };

  // ---------- rendering ----------
  const promptHtml = () =>
    '<span class="prompt">lunaric@dev</span>:<span class="path">' + pathStr() + "</span>$ ";

  function print(html, cls) {
    const div = document.createElement("div");
    div.className = "line" + (cls ? " " + cls : "");
    div.innerHTML = html;
    body.insertBefore(div, body.lastElementChild);
    body.scrollTop = body.scrollHeight;
  }
  function escape(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function updatePrompt() {
    const e = document.querySelector("#term-input-line .path");
    if (e) e.textContent = pathStr();
  }

  function run(raw) {
    const cmd = raw.trim();
    print(promptHtml() + escape(cmd));
    if (!cmd) return;
    const sp = cmd.indexOf(" ");
    const name = sp === -1 ? cmd : cmd.slice(0, sp);
    const arg = sp === -1 ? "" : cmd.slice(sp + 1);
    const fn = COMMANDS[name];
    if (!fn) { print("command not found: " + escape(name) + " — try 'help'", "out"); return; }
    const out = fn(arg);
    if (out === "__CLEAR__") {
      body.querySelectorAll(".line:not(#term-input-line)").forEach((n) => n.remove());
      return;
    }
    if (typeof out === "string" && out.startsWith("__HTML__")) { print(out.slice(8)); return; }
    if (out) print(escape(out), "out");
  }

  // ---------- history + tab complete ----------
  const hist = [];
  let hi = 0;

  function commonPrefix(arr) {
    if (!arr.length) return "";
    let p = arr[0];
    for (const s of arr) { while (!s.startsWith(p)) p = p.slice(0, -1); }
    return p;
  }
  function tabComplete() {
    const val = input.value;
    const parts = val.split(/\s+/);
    const pre = parts[parts.length - 1] || "";
    let pool;
    if (parts.length <= 1) pool = Object.keys(COMMANDS);
    else { const d = curDir(); pool = d && d.type === "dir" ? Object.keys(d.children) : []; }
    const m = pool.filter((c) => c.startsWith(pre));
    if (!m.length) return;
    if (m.length === 1) {
      input.value = val.slice(0, val.length - pre.length) + m[0] + " ";
    } else {
      const cp = commonPrefix(m);
      if (cp.length > pre.length) input.value = val.slice(0, val.length - pre.length) + cp;
      print(promptHtml() + escape(val));
      print(m.join("   "), "out");
    }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = input.value;
      run(v);
      if (v.trim()) hist.push(v);
      hi = hist.length;
      input.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hi > 0) { hi--; input.value = hist[hi]; }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hi < hist.length - 1) { hi++; input.value = hist[hi]; }
      else { hi = hist.length; input.value = ""; }
    } else if (e.key === "Tab") {
      e.preventDefault();
      tabComplete();
    }
  });

  document.querySelector(".term")?.addEventListener("click", () => input.focus());
})();

// live clock (Berlin) in the footer
(function () {
  const el = document.getElementById("clock");
  if (!el) return;
  function tick() {
    try {
      el.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Berlin",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }).format(new Date());
    } catch (e) { el.textContent = ""; }
  }
  tick();
  setInterval(tick, 1000);
})();

// syntax highlighting on post pages
(function () {
  if (window.hljs) { try { window.hljs.highlightAll(); } catch (e) {} }
})();
