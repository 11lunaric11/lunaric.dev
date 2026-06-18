// lunaric.dev — tiny interactive terminal for the landing page
(function () {
  const body = document.getElementById("term-body");
  const input = document.getElementById("term-input");
  if (!body || !input) return;

  const PROMPT = '<span class="prompt">lunaric@dev</span>:<span class="path">~</span>$ ';

  const FS = {
    "about.md": "Dejan — aka lunaric. Security learner & builder.\nPT1 (TryHackMe) ✓  ·  CJPT (Hack The Box) in progress.",
    "blog": "→ /blog",
    "projects": "→ /projects",
    "uses": "→ /uses",
  };

  const COMMANDS = {
    help: () =>
      "available commands:\n" +
      "  whoami      who is lunaric\n" +
      "  ls          list sections\n" +
      "  cat <file>  read a file (try: cat about.md)\n" +
      "  blog        go to the blog\n" +
      "  uses        go to the homelab / gear page\n" +
      "  clear       clear the screen",
    whoami: () => "lunaric — security learner. PT1 ✓ · CJPT (wip). builds things on the edge.",
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
      body.querySelectorAll(".line").forEach((n) => n.remove());
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
