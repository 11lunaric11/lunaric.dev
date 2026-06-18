//! Build script: discover every `posts/*.md` file at compile time and embed it,
//! so adding a Markdown file to `posts/` is all it takes to publish a post.

use std::{env, fs, path::Path};

fn main() {
    let manifest = env::var("CARGO_MANIFEST_DIR").unwrap();
    let posts_dir = Path::new(&manifest).join("posts");
    println!("cargo:rerun-if-changed=posts");

    let mut entries: Vec<(String, String)> = Vec::new();
    if posts_dir.exists() {
        for entry in fs::read_dir(&posts_dir).unwrap() {
            let path = entry.unwrap().path();
            if path.extension().and_then(|s| s.to_str()) == Some("md") {
                let slug = path.file_stem().unwrap().to_str().unwrap().to_string();
                let abs = path.canonicalize().unwrap();
                println!("cargo:rerun-if-changed={}", abs.display());
                entries.push((slug, abs.to_str().unwrap().to_string()));
            }
        }
    }
    entries.sort();

    let mut code = String::from("pub static RAW_POSTS: &[(&str, &str)] = &[\n");
    for (slug, abs) in entries {
        code.push_str(&format!("    ({slug:?}, include_str!({abs:?})),\n"));
    }
    code.push_str("];\n");

    let out = Path::new(&env::var("OUT_DIR").unwrap()).join("posts_generated.rs");
    fs::write(out, code).unwrap();
}
