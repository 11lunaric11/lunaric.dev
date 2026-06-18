//! Build script:
//! 1. discover every `posts/*.md` and embed it (RAW_POSTS)
//! 2. render a branded Open Graph PNG per post (+ a default) into assets/og/

use ab_glyph::{point, Font, FontRef, PxScale, ScaleFont};
use image::{Rgba, RgbaImage};
use std::{env, fs, path::Path};

const W: u32 = 1200;
const H: u32 = 630;
const BG: [u8; 3] = [11, 13, 18];
const TEAL: [u8; 3] = [21, 187, 159];
const WHITE: [u8; 3] = [223, 228, 236];
const DIM: [u8; 3] = [130, 140, 158];

fn main() {
    let manifest = env::var("CARGO_MANIFEST_DIR").unwrap();
    let posts_dir = Path::new(&manifest).join("posts");
    println!("cargo:rerun-if-changed=posts");
    println!("cargo:rerun-if-changed=ogen/JetBrainsMono-Bold.ttf");

    let mut entries: Vec<(String, String)> = Vec::new();
    let mut titles: Vec<(String, String)> = Vec::new();
    if posts_dir.exists() {
        for entry in fs::read_dir(&posts_dir).unwrap() {
            let path = entry.unwrap().path();
            if path.extension().and_then(|s| s.to_str()) == Some("md") {
                let slug = path.file_stem().unwrap().to_str().unwrap().to_string();
                let abs = path.canonicalize().unwrap();
                println!("cargo:rerun-if-changed={}", abs.display());
                let content = fs::read_to_string(&abs).unwrap_or_default();
                let title = extract_title(&content).unwrap_or_else(|| slug.clone());
                titles.push((slug.clone(), title));
                entries.push((slug, abs.to_str().unwrap().to_string()));
            }
        }
    }
    entries.sort();

    // --- posts_generated.rs ---
    let mut code = String::from("pub static RAW_POSTS: &[(&str, &str)] = &[\n");
    for (slug, abs) in &entries {
        code.push_str(&format!("    ({slug:?}, include_str!({abs:?})),\n"));
    }
    code.push_str("];\n");
    fs::write(Path::new(&env::var("OUT_DIR").unwrap()).join("posts_generated.rs"), code).unwrap();

    // --- OG images ---
    let og_dir = Path::new(&manifest).join("assets").join("og");
    fs::create_dir_all(&og_dir).unwrap();
    let font = FontRef::try_from_slice(include_bytes!("ogen/JetBrainsMono-Bold.ttf")).expect("font");
    render_og(&font, "lunaric.dev", "security · rust · homelab", &og_dir.join("default.png"));
    for (slug, title) in &titles {
        render_og(&font, title, "lunaric.dev", &og_dir.join(format!("{slug}.png")));
    }
}

fn extract_title(content: &str) -> Option<String> {
    let rest = content.trim_start_matches('\u{feff}').strip_prefix("---")?;
    let end = rest.find("\n---")?;
    for line in rest[..end].lines() {
        if let Some(v) = line.trim().strip_prefix("title:") {
            return Some(v.trim().to_string());
        }
    }
    None
}

fn render_og(font: &FontRef, title: &str, subtitle: &str, out: &Path) {
    let mut img = RgbaImage::from_pixel(W, H, Rgba([BG[0], BG[1], BG[2], 255]));
    // left teal accent bar
    for y in 0..H {
        for x in 0..14u32 {
            img.put_pixel(x, y, Rgba([TEAL[0], TEAL[1], TEAL[2], 255]));
        }
    }
    draw_text(&mut img, font, "~/ lunaric.dev", PxScale::from(34.0), 80.0, 72.0, DIM);

    let scale = PxScale::from(72.0);
    let line_h = 86.0;
    let lines = wrap(font, title, scale, W as f32 - 160.0, 4);
    let total = lines.len() as f32 * line_h;
    let mut y = (H as f32 - total) / 2.0 + 6.0;
    for l in &lines {
        draw_text(&mut img, font, l, scale, 80.0, y, WHITE);
        y += line_h;
    }
    draw_text(&mut img, font, subtitle, PxScale::from(30.0), 80.0, H as f32 - 78.0, TEAL);

    img.save_with_format(out, image::ImageFormat::Png).unwrap();
}

fn draw_text(img: &mut RgbaImage, font: &FontRef, text: &str, scale: PxScale, x: f32, y: f32, color: [u8; 3]) {
    let scaled = font.as_scaled(scale);
    let ascent = scaled.ascent();
    let mut pen = x;
    for ch in text.chars() {
        let gid = font.glyph_id(ch);
        let g = gid.with_scale_and_position(scale, point(pen, y + ascent));
        if let Some(o) = font.outline_glyph(g) {
            let bb = o.px_bounds();
            o.draw(|gx, gy, cov| {
                let px = bb.min.x + gx as f32;
                let py = bb.min.y + gy as f32;
                if px >= 0.0 && py >= 0.0 && (px as u32) < W && (py as u32) < H {
                    blend(img, px as u32, py as u32, color, cov);
                }
            });
        }
        pen += scaled.h_advance(gid);
    }
}

fn blend(img: &mut RgbaImage, x: u32, y: u32, color: [u8; 3], a: f32) {
    let p = img.get_pixel_mut(x, y);
    for i in 0..3 {
        p[i] = (color[i] as f32 * a + p[i] as f32 * (1.0 - a)).round() as u8;
    }
    p[3] = 255;
}

fn measure(font: &FontRef, text: &str, scale: PxScale) -> f32 {
    let scaled = font.as_scaled(scale);
    text.chars().map(|c| scaled.h_advance(font.glyph_id(c))).sum()
}

fn wrap(font: &FontRef, text: &str, scale: PxScale, max_w: f32, max_lines: usize) -> Vec<String> {
    let mut lines: Vec<String> = Vec::new();
    let mut cur = String::new();
    for word in text.split_whitespace() {
        let trial = if cur.is_empty() { word.to_string() } else { format!("{cur} {word}") };
        if measure(font, &trial, scale) > max_w && !cur.is_empty() {
            lines.push(std::mem::take(&mut cur));
            cur = word.to_string();
        } else {
            cur = trial;
        }
    }
    if !cur.is_empty() {
        lines.push(cur);
    }
    if lines.len() > max_lines {
        lines.truncate(max_lines);
        lines.last_mut().unwrap().push('…');
    }
    lines
}
