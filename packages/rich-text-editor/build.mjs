import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/index.js",
  platform: "browser",
  target: "es2020",
  sourcemap: true,
  external: [
    "@tiptap/core",
    "@tiptap/starter-kit",
    "@tiptap/pm",
    "@tiptap/extension-*",
    "dompurify",
    "lucide",
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

// Copy + bundle CSS
const css = readFileSync(join(__dirname, "src/styles.css"), "utf-8");
mkdirSync(join(__dirname, "dist"), { recursive: true });
writeFileSync(join(__dirname, "dist/styles.css"), css);

// Generate declaration file (simplified — real projects use tsc --emitDeclarationOnly)
console.log("✓ Build complete");
