// lunaric.dev — tiny interactive terminal for the landing page
(function () {
  const body = document.getElementById("term-body");
  const input = document.getElementById("term-input");
  if (!body || !input) return;

  const PROMPT = '<span class="prompt">lunaric@dev</span>:<span class="path">~</span>$ ';

  const FS = {
    "about.md": "Dejan — aka lunaric. Security learner & builder.\nPT1 (TryHackMe) ✓  ·  CJCA (Hack The Box) in progress.",
    "blog": "→ /blog",
    "projects": "→ /projects",
    "uses": "→ /uses",
  };

  // fastfetch-style system info (HTML; teal labels via .prompt/.path/.out classes)
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

  const COMMANDS = {
    help: () =>
      "available commands:\n" +
      "  whoami      who is lunaric\n" +
      "  ff          system info (fastfetch)\n" +
      "  ls          list sections\n" +
      "  cat <file>  read a file (try: cat about.md)\n" +
      "  blog        go to the blog\n" +
      "  uses        go to the homelab / gear page\n" +
      "  clear       clear the screen",
    whoami: () => "lunaric — security learner. PT1 ✓ · CJCA (wip). builds things on the edge.",
    fastfetch: () => FF,
    ff: () => FF,
    ls: () => Object.keys(FS).join("   "),
    cat: (arg) => (FS[arg] ? FS[arg] : `cat: ${arg || ""}: No such file`),
    blog: () => { location.href = "/blog"; return "navigating → /blog"; },
    uses: () => { location.href = "/uses"; return "navigating → /uses"; },
    projects: () => { location.href = "/projects"; return "navigating → /projects"; },
    clear: () => "__CLEAR__",
  };

  function print(html, cls) {
    const div = document.createElement("div");
    div.className = "line" + (cls ? " " + cls : "");
    div.innerHTML = html;
    body.insertBefore(div, body.lastElementChild);
    body.scrollTop = body.scrollHeight;
  }

  function run(raw) {
    const cmd = raw.trim();
    print(PROMPT + escape(cmd));
    if (!cmd) return;
    const [name, ...rest] = cmd.split(/\s+/);
    const fn = COMMANDS[name];
    if (!fn) { print(`command not found: ${escape(name)} — try 'help'`, "out"); return; }
    const out = fn(rest.join(" "));
    if (out === "__CLEAR__") {
      // remove all printed lines EXCEPT the input line (which is also .line)
      body.querySelectorAll(".line:not(#term-input-line)").forEach((n) => n.remove());
      return;
    }
    if (typeof out === "string" && out.startsWith("__HTML__")) {
      print(out.slice(8)); // trusted, pre-formatted HTML (not user input)
      return;
    }
    if (out) print(escape(out), "out");
  }

  function escape(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { run(input.value); input.value = ""; }
  });
  // focus terminal on click anywhere in it
  document.querySelector(".term")?.addEventListener("click", () => input.focus());
})();

// live Berlin clock in the footer
(function () {
  var el = document.getElementById("clock");
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

// syntax highlighting on post pages (term.js is deferred, so highlight.js —
// also deferred and earlier in the document — has already loaded by now)
(function () {
  if (window.hljs) {
    try { window.hljs.highlightAll(); } catch (e) {}
  }
})();
