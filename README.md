# lunaric.dev

My personal security/dev blog — hand-written in **Rust**, compiled to **WebAssembly**, and served from **Cloudflare's edge** as a Worker.

Live: <https://lunaric.dev>

## Stack

- **Rust → WASM** via [`workers-rs`](https://github.com/cloudflare/workers-rs) (`worker` crate)
- **Cloudflare Workers** (static assets + SSR as one unit)
- **comrak** for Markdown → HTML
- Server-rendered HTML, minimal vanilla JS (interactive terminal + Berlin clock)

## Layout

```
src/lib.rs          Worker: routing, SSR pages, blog, RSS, /api
build.rs            embeds posts/*.md at compile time
posts/*.md          blog posts (frontmatter: title, date, tags, description)
assets/             static files (styles.css, term.js) served from the edge
wrangler.toml       Cloudflare config (custom domain + Rust build)
.cargo/config.toml  wasm target flags
```

## Develop

```bash
npx wrangler dev        # local server on http://127.0.0.1:8787
```

## Write a post

Drop a Markdown file in `posts/` with frontmatter:

```markdown
---
title: My post
date: 2026-06-18
tags: [rust, cloudflare]
description: One-line summary.
---

Body in Markdown.
```

The build script auto-discovers it — no code changes needed.

## Deploy

```bash
export CLOUDFLARE_API_TOKEN="$(cat ~/.cloudflare_token)"
npx wrangler deploy
```

> Build note: compiled with `worker-build --release --no-panic-recovery` to work
> around a wasm-bindgen externref issue under Rust ≥ 1.82.
