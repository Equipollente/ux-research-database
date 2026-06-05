# UXProjects Design System — intégration web

*UX Research Database · Judith Heckmann*
*Dernière mise à jour : 2026-06-05*

---

## Vue d'ensemble

Le design system **UXProjects** est extrait du thème PowerPoint "Enseignement" (EFFICOM 2026) et transposé en tokens web + variables Figma. Ce document couvre l'intégration dans le projet Astro.

**Fichier Figma :** `figma.com/design/zdUqwncdW4hMuNfTGNlH2S/ux-research-database`
**Référence visuelle :** `Design/project/index.html` (ouvrir dans le navigateur)
**Source de vérité tokens :** `tokens/uxprojects.tokens.json`

---

## État actuel vs cible

| Aspect | État actuel | Cible UXProjects |
|---|---|---|
| Couleur primaire | `#3b82f6` (bleu Tailwind) | `#3F2BFF` (indigo électrique) |
| Polices | Système (`-apple-system`, Roboto…) | Poppins (titres) + Inter (corps) |
| Tokens CSS | Variables ad hoc (`--color-primary`) | Tokens sémantiques (`--fg-accent`, `--bg-calm`…) |
| Tags de taxonomie | `#e0e7ff` / `#3730a3` | `--lavender` / `--indigo` |
| Status (trust level) | Vert/rouge hardcodés | `--positive` / `--negative` / `--warning` |
| Fond de page | `#ffffff` | `--lavender-mist` (`#F3F0FF`) |
| Ombres | `rgba(0,0,0,0.12)` | `--shadow-card` / `--shadow-pop` |

---

## Tokens disponibles

Définis dans `tokens/uxprojects.tokens.json` · Variables Figma créées (62 au total).

### Couleurs

| Token | Valeur | Usage principal |
|---|---|---|
| `--indigo` | `#3F2BFF` | CTA, liens actifs, accents, focus ring |
| `--indigo-700` | `#2C1ECC` | Hover bouton primaire |
| `--indigo-300` | `#8C7DFF` | Accents désactivés, graphiques |
| `--lime` | `#E1FF91` | Fond hero / celebrate |
| `--lavender-mist` | `#F3F0FF` | **Fond de page** |
| `--lavender` | `#ECE1FF` | Fond pills de filtre, tags taxonomie |
| `--pink` | `#FAC7FF` | Éléments décoratifs uniquement |
| `--ink` | `#2F2D2E` | Texte primaire |
| `--slate` | `#6A676D` | Texte secondaire, captions |
| `--positive` | `#48A66B` | Trust level élevé, succès |
| `--negative` | `#D94A4A` | Trust level bas, erreur |
| `--warning` | `#F59E0B` | Trust level moyen |
| `--hairline` | `#E6E1F5` | Séparateurs de table, bordures légères |

### Tokens sémantiques (à utiliser dans le code)

| Token CSS | Résout vers | Usage |
|---|---|---|
| `--fg-1` | `--ink` | Texte principal |
| `--fg-2` | `--slate` | Texte secondaire |
| `--fg-accent` | `--indigo` | Texte accentué, labels |
| `--bg-default` | `white` | Fond cards, modales |
| `--bg-calm` | `--lavender-mist` | Fond de page |
| `--bg-section` | `--lavender` | Fond pills, badges |
| `--bg-feature` | `--indigo` | Panels hero, sections indigo |
| `--surface-card` | `white` | Surface de card |
| `--border-card` | `#ECE9F5` | Bordure de card |

### Typographie

| Token | Valeur | Usage |
|---|---|---|
| `--font-display` | Poppins | Titres, labels, boutons |
| `--font-body` | Inter | Corps, table, captions |
| `--t-h2` | `24px` | Titre de section |
| `--t-h3` | `16px` | Titre de card/item |
| `--t-label` | `14px` | Eyebrow, filtre label |
| `--t-body` | `13px` | Corps de texte |
| `--t-small` | `12px` | Cellules table, pills |

### Rayons

| Token | Valeur | Usage |
|---|---|---|
| `--radius-badge` | `6px` | Badges trust level, petits chips |
| `--radius-card` | `14px` | Cards, modales |
| `--radius-pill` | `999px` | Boutons, filtres, tags |

### Ombres

| Token | CSS | Usage |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(47,45,46,.04), 0 8px 24px rgba(47,45,46,.06)` | Cards au repos |
| `--shadow-pop` | `0 12px 40px rgba(63,43,255,.14)` | Hover card, élément focal |
| `--shadow-float` | `0 2px 4px rgba(47,45,46,.04), 0 22px 48px -12px rgba(47,45,46,.16)` | Modales, dropdowns |

---

## Plan d'intégration

L'intégration se fait en 3 étapes. **Ne pas commencer une étape sans valider la précédente.**

### Étape 1 — Créer `src/styles/tokens.css` *(non démarrée)*

Adapter `Design/project/colors_and_type.css` pour le web app :
- Copier toutes les CSS custom properties
- Ajouter le `@font-face` Inter (copier le TTF dans `public/fonts/`)
- Ajouter le lien Poppins CDN dans `BaseLayout.astro`
- Importer `tokens.css` dans `<head>` de `BaseLayout.astro`

Ce fichier **remplace** les variables actuelles de `BaseLayout.astro` :

```css
/* AVANT (BaseLayout.astro) */
--color-primary: #3b82f6;
--color-bg: #ffffff;

/* APRÈS (tokens.css) */
--indigo: #3F2BFF;
--bg-calm: var(--lavender-mist);
/* + tous les tokens UXProjects */
```

### Étape 2 — Migrer `BaseLayout.astro` *(non démarrée)*

- `body` : fond `var(--bg-calm)` au lieu de `#ffffff`
- `h1` : `font-family: var(--font-display)`, `color: var(--fg-1)`
- `header` : fond `white`, bordure `var(--hairline)`
- Navigation links : `color: var(--fg-accent)` au survol

### Étape 3 — Migrer les composants *(non démarrée)*

Ordre recommandé : **ResourceTable → AddResourceForm**

---

## Composants — état de design

| Composant | Designé Figma | Implémenté | Notes |
|---|---|---|---|
| Resource Card | ☐ À créer | — | Composant Figma prioritaire |
| Filter Chip | ☐ À créer | — | Pills de taxonomie |
| Bouton primaire | ☐ À créer | Partiel (bleu actuel) | Migrer vers `--indigo` + `--radius-pill` |
| Table row | ☐ À créer | ✓ Fonctionnel | Restyler avec tokens |
| Trust level badge | ☐ À créer | Partiel | Utiliser `--positive/negative/warning` |
| Modale Edit | ☐ À créer | ✓ Fonctionnel | `--shadow-float`, `--radius-card` |
| Navigation header | ☐ À créer | ✓ Fonctionnel | Migrer polices + couleurs |
| AddResourceForm | ☐ À créer | ✓ Fonctionnel | Restyler avec tokens |

---

## Règles de style par composant

### Boutons

```css
/* Primaire */
background: var(--indigo);
color: var(--white);
border-radius: var(--radius-pill);
font-family: var(--font-display);
font-weight: 600;

/* Hover */
background: var(--indigo-700);
box-shadow: var(--shadow-pop);

/* Secondaire / outline */
background: transparent;
border: 1.5px solid var(--indigo);
color: var(--indigo);
```

### Pills de filtre / tags de taxonomie

```css
background: var(--bg-section);      /* --lavender */
color: var(--fg-accent);            /* --indigo */
border-radius: var(--radius-pill);
font-family: var(--font-display);
font-weight: 600;
font-size: var(--t-small);          /* 12px */

/* Pill active */
background: var(--indigo);
color: white;
```

### Cards / modales

```css
background: var(--surface-card);
border-radius: var(--radius-card);
box-shadow: var(--shadow-card);
border: 1px solid var(--border-card);

/* Hover */
box-shadow: var(--shadow-pop);
```

### Trust level badge

```css
/* Trust 4-5 */
background: var(--positive);
/* Trust 3 */
background: var(--warning);
/* Trust 1-2 */
background: var(--negative);

border-radius: var(--radius-badge);
color: white;
font-family: var(--font-display);
font-weight: 700;
font-size: var(--t-small);
```

### Table

```css
/* En-tête */
background: var(--bg-calm);
font-family: var(--font-display);
font-weight: 600;
font-size: var(--t-small);
color: var(--fg-2);
border-bottom: 1px solid var(--hairline);

/* Ligne hover */
background: var(--lavender-mist);

/* Texte cellule */
font-family: var(--font-body);
font-size: var(--t-body);
color: var(--fg-1);
```

---

## Gotcha CSS — scoping Astro

⚠️ Dans `ResourceTable.astro`, les lignes de table sont construites côté client via JS (`tr.innerHTML = ...`). Elles **ne reçoivent pas** l'attribut `data-astro-cid-*` et ignorent les styles scoped.

**Règle :** tout style qui cible un élément dynamique (rows, pills, tags, badges) doit être dans `<style is:global>`, pas dans `<style>`.

Voir `CLAUDE.md` section "Critical gotcha — CSS scoping vs innerHTML" pour le détail complet.

---

## Pour aller plus loin

- Ajouter les **Effect Styles** Figma (shadows) — non encore créées
- Créer les **Text Styles** Figma à partir de l'échelle typographique
- Publier la librairie Figma pour partage entre fichiers
- Envisager un script `npm run tokens` pour régénérer `tokens.css` depuis le JSON
