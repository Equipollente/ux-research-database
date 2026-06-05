# UXProjects Design System — référence

*UX Research Database · Judith Heckmann*

> Doc **canonique** du design system. Les règles destinées aux agents IA sont résumées dans [`CLAUDE.md` § Design system](../CLAUDE.md) ; ce fichier est la référence détaillée pour humains.
>
> ⚠️ **Principe anti-dérive** : ce doc ne recopie **pas** les valeurs des tokens (couleurs, rayons…). Elles vivent dans `tokens/uxprojects.tokens.json` / `src/styles/tokens.css`. Ici on décrit l'**intention, les règles et les pointeurs**.

---

## 1. Vue d'ensemble

Design system extrait du thème « Enseignement » (EFFICOM) : **thème indigo / lavande**, **Poppins** (titres, labels, boutons) + **Inter** (corps, tables, UI).

| Quoi | Où |
|---|---|
| Fichier Figma | `figma.com/design/zdUqwncdW4hMuNfTGNlH2S/ux-research-database` (key `zdUqwncdW4hMuNfTGNlH2S`) |
| **Source de vérité tokens** | `tokens/uxprojects.tokens.json` (format DTCG) |
| CSS généré | `src/styles/tokens.css` (← `npm run tokens`) |
| Pattern bouton | `src/styles/buttons.css` |
| Générateur | `scripts/generate-tokens.mjs` |
| Référence visuelle d'origine | `Design/project/index.html` |

---

## 2. Flux & source de vérité

```
Figma Variables  ──►  tokens/uxprojects.tokens.json  ──►  src/styles/tokens.css
 (surface design)        (données canoniques, DTCG)    (npm run tokens)  │
                                                                          ▼
                                                          src/styles/buttons.css
                                                          + composants (var(--token))
```

- **`tokens.json` est la source de vérité.** Judith édite les **Variables Figma** comme surface de design ; le JSON les reflète. 62 variables Figma réparties en 3 collections (`color`, `typography`, `dimension`) ; les ombres vivent côté JSON/CSS.
- **`tokens.css` est généré — ne pas l'éditer à la main.** Il porte un en-tête d'avertissement.
- Chargé globalement via `import '../styles/tokens.css'` dans le frontmatter de `BaseLayout.astro` (un `<link href="/styles/...">` ne résoudrait pas un fichier sous `src/`).
- **Inter** auto-hébergée (`public/fonts/`), **Poppins** via CDN Google Fonts.

### Conventions de nommage (générateur, option C)

| Collection JSON | Variable CSS |
|---|---|
| `color.brand.X` / `color.status.X` | `--X` |
| `color.semantic.X` | `--X` (+ mapping legacy ci-dessous) |
| `typography.fontFamily.X` | `--font-X` (+ stack de fallback) |
| `typography.fontSize.X` | `--t-X` |
| `typography.fontWeight.X` | `--weight-X` |
| `typography.lineHeight.X` | `--lh-X` |
| `typography.letterSpacing.X` | `--tracking-X` |
| `dimension.spacing.X` | `--spacing-X` |
| `dimension.radius.X` | `--radius-X` |
| `shadow.X` | `--shadow-X` |

**Mapping legacy** (noms historiques conservés côté code, centralisés dans `generate-tokens.mjs`) : `semantic/fg-primary → --fg-1`, `semantic/fg-secondary → --fg-2`, `semantic/border-hairline → --hairline`. Le JSON/Figma garde les noms sémantiques ; seul le CSS expose les noms courts.

`tokens.css` se termine par un **bloc d'alias de compatibilité** (`--color-primary`, `--color-border`, `--spacing-xs..xl`…) que d'anciens composants utilisent encore — **ne pas le supprimer**.

### Ajouter / modifier un token

1. Éditer `tokens/uxprojects.tokens.json`.
2. `npm run tokens` (régénère `tokens.css`).
3. Refléter la variable dans Figma (pour garder la surface design synchro).

### Workflow Figma → code (composants)

1. Judith designe le composant dans Figma.
2. Elle **sélectionne** le nœud (ou colle son lien) et dit « regarde ma sélection ».
3. L'agent lit via le **MCP figma-console** : `figma_get_selection`, `figma_get_component_for_development_deep` (structure + variables liées = noms de tokens), `figma_get_variables`.
4. Traduction en Astro/CSS **avec les tokens correspondants**, puis **vérification dans le preview navigateur** avant de valider.
5. Mise à jour de l'**inventaire** (§4) avec le node ID + statut.

---

## 3. Tokens — usage sémantique

*(Valeurs : voir `tokens.json` / `tokens.css`. Ci-dessous : quand utiliser quoi.)*

**Couleurs**
- `--indigo` : CTA, liens actifs, accents, focus ring · `--indigo-700` : hover/pressed · `--indigo-300` : accents atténués, graphiques
- `--lavender-mist` : **fond de page** · `--lavender` : fond des pills de filtre / tags de taxonomie
- `--ink` (`--fg-1`) : texte principal · `--slate` (`--fg-2`) : texte secondaire / captions
- `--positive` / `--negative` / `--warning` : trust level haut / bas / moyen, succès / erreur
- `--hairline` : bordures légères, séparateurs · `--border-card` : bordure de card

**Typographie**
- `--font-display` (Poppins) : titres, labels, boutons, en-têtes de table
- `--font-body` (Inter) : corps, cellules de table, captions
- échelle `--t-*` (de `--t-display` 40px à `--t-badge` 9px) ; poids `--weight-*` ; interlignes `--lh-*`

**Rayons** · `--radius-badge` (petits chips/badges) · `--radius-card` (cards, modales) · `--radius-pill` (boutons, filtres, tags)

**Ombres** · `--shadow-card` (cards au repos) · `--shadow-pop` (élément focal unique) · `--shadow-float` (modales, dropdowns)

---

## 4. Inventaire des composants

| Composant | Figma | Code | Statut |
|---|---|---|---|
| **Button** | ✅ node `9:8` (Primary/Secondary × Default/Hover) | `src/styles/buttons.css` | ✅ implémenté, conforme |
| Field / input | 🚧 node `25:25` « Field Nom » (design en cours) | inputs de `AddResourceForm` / modales `ResourceTable` | ⏳ pas encore aligné sur le composant Figma |
| Resource Card | ☐ à créer | — | ⏳ **prioritaire** |
| Filter chip / pill | ☐ à créer | `.pill` (`ResourceTable`) | ✅ codé (tokens), pas de composant Figma |
| Trust level badge | ☐ à créer | `.trust-level` (`ResourceTable`) | 🚧 partiel |
| Table | ☐ à créer | `ResourceTable` | ✅ codé (tokens) |
| Modale | ☐ à créer | `ResourceTable`, `index.astro` | ✅ codé (tokens) |
| Navigation / header | ☐ à créer | `BaseLayout` | ✅ codé (tokens) |

> Tenir cette table à jour à chaque composant designé/implémenté — c'est le point d'entrée pour savoir ce qui existe et où.

---

## 5. Règles de style par composant

### Boutons → pattern réutilisable
Utiliser `.btn` + `.btn-primary` / `.btn-secondary` de `src/styles/buttons.css` (conforme au composant Figma `9:8`). **Ne pas écrire de CSS bouton par composant.**

- **Primary** : fond `--indigo` → hover `--indigo-700` (sans ombre)
- **Secondary** : outline 1.5px `--indigo` + texte `--indigo` → hover = comme primary (fond `--indigo-700`, texte blanc)
- Commun : `--radius-pill`, padding `10px 20px`, `--font-display` 14px / 600

### Pills de filtre / tags de taxonomie
Fond `--lavender`, texte `--indigo`, `--radius-pill`, `--font-display`. Pill active : fond `--indigo`, texte blanc.

### Cards / modales
Fond `--surface-card`, `--radius-card`, bordure `--border-card`. Ombre `--shadow-card` (card) ou `--shadow-float` (modale).

### Trust level badge
4-5 → `--positive` · 3 → `--warning` · 1-2 → `--negative`. `--radius-badge`, texte blanc, `--font-display` 700.

### Table
En-tête : fond `--lavender-mist`, `--font-display`, texte `--fg-2`, bordure `--hairline`. Ligne au survol : `--lavender-mist`. Cellule : `--font-body`, texte `--fg-1`.

---

## 6. Conventions & gotchas

- **Jamais de hex / rgba / rayon en dur** dans les composants → toujours un `var(--token)`. Si aucun token ne convient, le signaler plutôt qu'inventer une valeur.
- **`tokens.css` est généré** : modifier le JSON puis `npm run tokens`, jamais le CSS directement.
- **Gotcha scoping Astro** : les lignes de table de `ResourceTable.astro` sont construites en JS (`innerHTML`) et **ignorent les styles scoped**. Toute règle ciblant un élément dynamique doit être dans `<style is:global>`. Détail complet : `CLAUDE.md` § « Critical gotcha ».
- Noms de tokens : voir le mapping legacy en §2 si un nom CSS diffère du nom Figma/JSON.

---

## 7. Pour aller plus loin

- **Aligner Figma sur le code** : renommer les 3 variables Figma `fg-primary`/`fg-secondary`/`border-hairline` en `fg-1`/`fg-2`/`hairline` pour supprimer le mapping legacy (écriture Figma via MCP, sur demande).
- **Figma** : ranger une page « Components », créer les Effect Styles (ombres) + Text Styles (échelle typo), **publier la librairie**.
- **Code Connect** (MCP Figma officiel) : lier chaque composant Figma à son code → snippet visible dans Figma Dev Mode (utile à partir de ~5 composants).
