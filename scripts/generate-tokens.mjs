#!/usr/bin/env node
/* =========================================================================
   generate-tokens.mjs — régénère src/styles/tokens.css depuis
   tokens/uxprojects.tokens.json (la source de vérité des tokens).

   Usage : npm run tokens

   Règles de nommage (collection → variable CSS) :
     color.brand.X          → --X            (indigo, lavender-mist, ink…)
     color.status.X         → --X            (positive, negative, warning)
     color.semantic.X       → --X            (+ mapping legacy, cf. SEMANTIC_ALIAS)
     typography.fontFamily.X→ --font-X       (display, body)  [+ stack de fallback]
     typography.fontSize.X  → --t-X
     typography.fontWeight.X→ --weight-X
     typography.lineHeight.X→ --lh-X
     typography.letterSpacing.X → --tracking-X
     dimension.spacing.X    → --spacing-X
     dimension.radius.X     → --radius-X
     shadow.X               → --shadow-X

   Les alias { x } (DTCG) deviennent var(--…) ; les ombres composites sont
   aplaties en box-shadow CSS. Un bloc d'alias de compatibilité (--color-*,
   --spacing-xs..xl) est ajouté en fin de fichier (cf. CLAUDE.md).
   ========================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'tokens', 'uxprojects.tokens.json');
const OUT = path.join(ROOT, 'src', 'styles', 'tokens.css');

// Noms CSS « historiques » conservés côté code (mapping centralisé ici).
const SEMANTIC_ALIAS = {
  'fg-primary': 'fg-1',
  'fg-secondary': 'fg-2',
  'border-hairline': 'hairline',
};

// Les familles de polices n'ont que le nom dans le JSON → on ajoute le stack.
const FONT_STACK = {
  display: '"Poppins", "Poppins SemiBold", system-ui, sans-serif',
  body: '"Inter", system-ui, -apple-system, sans-serif',
};

const FONT_FACE = `@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-VariableFont_opsz_wght.ttf") format("truetype");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`;

const COMPAT_ALIASES = `/* ── Compatibility aliases — do not remove ───────────────────── */
:root {
  --color-primary:       var(--indigo);
  --color-primary-hover: var(--indigo-700);
  --color-bg:            var(--white);
  --color-text:          var(--ink);
  --color-border:        var(--hairline);
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
}`;

/** Chemin DTCG (ex. "color.brand.indigo") → nom de variable CSS. */
function cssVarName(dotPath) {
  const segs = dotPath.split('.');
  const leaf = segs[segs.length - 1];
  const [group, sub] = segs;

  if (group === 'color') {
    if (sub === 'semantic') return `--${SEMANTIC_ALIAS[leaf] ?? leaf}`;
    return `--${leaf}`; // brand, status
  }
  if (group === 'typography') {
    if (sub === 'fontFamily') return `--font-${leaf}`;
    if (sub === 'fontSize') return `--t-${leaf}`;
    if (sub === 'fontWeight') return `--weight-${leaf}`;
    if (sub === 'lineHeight') return `--lh-${leaf}`;
    if (sub === 'letterSpacing') return `--tracking-${leaf}`;
  }
  if (group === 'dimension') {
    if (sub === 'spacing') return `--spacing-${leaf}`;
    if (sub === 'radius') return `--radius-${leaf}`;
  }
  if (group === 'shadow') return `--shadow-${leaf}`;

  throw new Error(`Aucune règle de nommage pour le token: ${dotPath}`);
}

/** Aplati une ombre DTCG (objet ou tableau d'objets) en valeur box-shadow. */
function formatShadow(value) {
  const layers = Array.isArray(value) ? value : [value];
  return layers
    .map((l) => `${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread} ${l.color}`)
    .join(', ');
}

/** Valeur d'un token → valeur CSS. */
function cssValue(dotPath, token) {
  const segs = dotPath.split('.');
  const [group, sub] = segs;
  const leaf = segs[segs.length - 1];
  const v = token.$value;

  // Alias DTCG : "{color.brand.ink}" → var(--ink)
  if (typeof v === 'string' && /^\{.+\}$/.test(v)) {
    return `var(${cssVarName(v.slice(1, -1))})`;
  }
  if (group === 'typography' && sub === 'fontFamily') {
    return FONT_STACK[leaf] ?? `"${v}", sans-serif`;
  }
  if (group === 'shadow') return formatShadow(v);
  return String(v);
}

/** Parcourt l'arbre DTCG et collecte les tokens (feuilles avec $value). */
function collectTokens(node, prefix, out) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (child && typeof child === 'object' && '$value' in child) {
      out.push({ path: prefix ? `${prefix}.${key}` : key, token: child });
    } else if (child && typeof child === 'object') {
      collectTokens(child, prefix ? `${prefix}.${key}` : key, out);
    }
  }
}

// --- Build ----------------------------------------------------------------

const json = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const tokens = [];
collectTokens(json, '', tokens);

// Groupes ordonnés pour un fichier lisible.
const SECTIONS = [
  { title: 'Brand colors', match: (p) => p.startsWith('color.brand.') },
  { title: 'Status', match: (p) => p.startsWith('color.status.') },
  { title: 'Semantic (foreground / background / borders)', match: (p) => p.startsWith('color.semantic.') },
  { title: 'Type families', match: (p) => p.startsWith('typography.fontFamily.') },
  { title: 'Type scale', match: (p) => p.startsWith('typography.fontSize.') },
  { title: 'Font weights', match: (p) => p.startsWith('typography.fontWeight.') },
  { title: 'Line heights', match: (p) => p.startsWith('typography.lineHeight.') },
  { title: 'Letter spacing', match: (p) => p.startsWith('typography.letterSpacing.') },
  { title: 'Spacing scale', match: (p) => p.startsWith('dimension.spacing.') },
  { title: 'Radii', match: (p) => p.startsWith('dimension.radius.') },
  { title: 'Elevation (shadows)', match: (p) => p.startsWith('shadow.') },
];

const lines = [];
for (const section of SECTIONS) {
  const items = tokens.filter((t) => section.match(t.path));
  if (!items.length) continue;
  lines.push(`  /* ── ${section.title} ${'─'.repeat(Math.max(2, 56 - section.title.length))} */`);
  const rows = items.map((t) => [cssVarName(t.path), cssValue(t.path, t.token)]);
  const pad = Math.max(...rows.map(([n]) => n.length));
  for (const [name, value] of rows) lines.push(`  ${name.padEnd(pad)}: ${value};`);
  lines.push('');
}
lines.pop(); // dernière ligne vide

const css = `/* =========================================================================
   UXProjects Design System — web tokens
   ⚠️  FICHIER GÉNÉRÉ — ne pas éditer à la main.
   Source : tokens/uxprojects.tokens.json · Régénérer : npm run tokens
   ========================================================================= */

${FONT_FACE}

:root {
${lines.join('\n')}
}

${COMPAT_ALIASES}
`;

fs.writeFileSync(OUT, css, 'utf8');
console.log(`✓ ${path.relative(ROOT, OUT)} régénéré depuis ${path.relative(ROOT, SRC)} (${tokens.length} tokens).`);
