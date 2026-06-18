---
title: Building lunaric.dev in Rust on Cloudflare's edge
date: 2026-06-18
tags: [rust, cloudflare, webassembly]
description: How I built this blog as a hand-written Rust + WebAssembly Worker running on Cloudflare's edge — and the toolchain landmines I hit on the way to a live site.
---

I could have spun this blog up with a static-site generator and a theme in ten minutes. Instead I wrote it in **Rust**, compiled it to **WebAssembly**, and shipped it to **Cloudflare's edge** as a Worker. This post is both the result and the writeup.

## Why this stack

I wanted three things: it had to be *dynamic* (real server-side code, not just pre-rendered files), it had to run on Cloudflare, and it had to be fun to build. That intersection points straight at Rust:

- Cloudflare has first-party Rust support through the [`workers-rs`](https://github.com/cloudflare/workers-rs) crate — your code compiles to WASM and runs in the same V8 isolate model as a JS Worker.
- Every request is server-rendered in Rust, so the site is genuinely dynamic — view counters and a guestbook are next.
- Writing a web backend in a systems language and having it boot in ~2ms at the edge is a good time.

## The shape of it

The whole site is one Worker. Routing, HTML rendering, and a small JSON API live in `src/lib.rs`:

```rust
use worker::*;

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    Router::new()
        .get("/", |_, _| Response::from_html(layout("~", "whoami", HOME)))
        .get("/blog", |_, _| Response::from_html(blog_index()))
        .get_async("/api/ping", |_, _| async move {
            Response::ok(r#"{"status":"ok"}"#)
        })
        .run(req, env)
        .await
}
```

Static assets (CSS, the terminal JS) are served straight from Cloudflare's network; the Worker only runs for routes that aren't a matching file. That split is configured in `wrangler.toml`:

```toml
name = "lunaric-dev"
main = "build/worker/shim.mjs"

[build]
command = "worker-build --release --no-panic-recovery"

[assets]
directory = "./assets"
```

## The landmines

It was not ten minutes. A few things bit me, and they're the kind of thing worth writing down so the next person finds it.

**Rust without rustup.** My Parrot box had Rust from the distro package — no `rustup`, no `wasm32-unknown-unknown` target, no clean way to add one. Fix: install rustup for the user and let it manage the toolchain.

**Node too old.** Wrangler 4.x needs Node ≥ 22; I was on 20. `nvm install 22` and move on.

**The wasm-bindgen externref wall.** This one cost the most time:

```
error: failed to generate catch wrappers
  Caused by: externref table required for catch wrappers
```

Since Rust 1.82, `wasm32-unknown-unknown` enables the `reference-types` feature by default. The version of `wasm-bindgen` that `worker-build` drives couldn't synthesize the externref table its panic catch-wrappers need under that config. The clean fix is to skip the catch-wrappers entirely:

```bash
worker-build --release --no-panic-recovery
```

The trade-off: a Rust panic aborts that single request instead of being converted into a JS error. For an SSR blog, that's fine.

## Going live

The account had no `workers.dev` subdomain, but I own the domain on Cloudflare anyway, so I bound the Worker straight to it:

```toml
routes = [
  { pattern = "lunaric.dev", custom_domain = true },
  { pattern = "www.lunaric.dev", custom_domain = true },
]
```

`wrangler deploy` created the DNS records and the managed TLS cert, and the site was live — first byte in around 166ms.

## What's next

The dynamic half is just getting started: per-post view counters and a guestbook backed by Cloudflare D1, then more writeups. If you're reading this, it's running in Rust, a few milliseconds from wherever you are.
