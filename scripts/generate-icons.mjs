// Fabrique toutes les icônes de Kick-Time à partir du logo (le cadran vert du site).
// À relancer seulement si le logo change :  node scripts/generate-icons.mjs
// Utilise « sharp », l'outil d'images déjà installé avec Next.js.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const GREEN = "#2bff88";
const INK = "#03140a";
const BACKGROUND = "#070b09";

// Le logo, identique à celui de l'en-tête (components/Header.tsx), dessiné sur 32 × 32.
const LOGO = `
  <circle cx="16" cy="16" r="15" fill="${GREEN}"/>
  <circle cx="16" cy="16" r="9.5" fill="none" stroke="${INK}" stroke-width="2.5"/>
  <path d="M16 9.5V16l4.5 3" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;

// Favicon : le logo seul, fond transparent (bien visible sur un onglet clair comme sombre).
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${LOGO}</svg>`;

// Icône d'application (écran d'accueil du téléphone) : le logo sur un carré sombre.
// « scale » = place prise par le logo ; plus petit pour l'icône « maskable » qu'Android découpe en rond.
const appIcon = (scale) => {
  const offset = (32 - 32 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="${BACKGROUND}"/>
    <g transform="translate(${offset} ${offset}) scale(${scale})">${LOGO}</g>
  </svg>`;
};

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

// Un fichier .ico n'est qu'une petite « boîte » qui contient plusieurs PNG (16, 32 et 48 px).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // réservé
  header.writeUInt16LE(1, 2); // type : icône
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // largeur
    entry.writeUInt8(size, 1); // hauteur
    entry.writeUInt16LE(1, 4); // plans de couleur
    entry.writeUInt16LE(32, 6); // bits par pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

mkdirSync("public/icons", { recursive: true });

writeFileSync("app/icon.svg", favicon + "\n");
writeFileSync(
  "app/favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(favicon, size) })))),
);
writeFileSync("app/apple-icon.png", await png(appIcon(0.72), 180));
writeFileSync("public/icons/icon-192.png", await png(appIcon(0.72), 192));
writeFileSync("public/icons/icon-512.png", await png(appIcon(0.72), 512));
writeFileSync("public/icons/icon-maskable-512.png", await png(appIcon(0.56), 512));

console.log("Icônes créées : app/icon.svg, app/favicon.ico, app/apple-icon.png, public/icons/*.png");
