// icon-source.svg degisirse: npm i -D sharp && node scripts/gen-icons.mjs && npm uninstall sharp
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const p = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const svg = readFileSync(p("../public/icons/icon-source.svg"));

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-32.png", size: 32 },
];

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(p(`../public/icons/${t.file}`));
  console.log("wrote", t.file);
}

// Maskable icon: same art with extra padding so Android's safe-zone crop doesn't clip it
await sharp(svg, { density: 384 })
  .resize(340, 340)
  .extend({ top: 86, bottom: 86, left: 86, right: 86, background: "#c2551a" })
  .png()
  .toFile(p(`../public/icons/icon-maskable-512.png`));
console.log("wrote icon-maskable-512.png");
