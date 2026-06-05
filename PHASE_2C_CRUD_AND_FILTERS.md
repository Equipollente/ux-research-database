# Phase 2C — CRUD ressources/taxonomies + UX filtres

> **Pour l'agent IA qui reprend** : ce document est autonome. Lis-le en entier avant d'agir. Vérifie l'état actuel des fichiers (les choses peuvent avoir changé). Le code à écrire est décrit, pas calqué — adapte aux conventions présentes dans `CLAUDE.md`. **Confirme avec Judith avant chaque étape**, c'est sa préférence.

**Date de rédaction** : 2026-05-24
**Statut** : ✅ Phase 2C complète — mergée sur `main` le 2026-06-05.
**Pré-requis** : Phase 2B terminée (voir `PHASE_2B_TOKEN_MIGRATION.md`)

**Déjà livré (2026-05-24, slice anticipée)** :
- Function `netlify/functions/delete-resource.ts` opérationnelle
- Colonne "Actions" à droite du tableau avec bouton `🗑️` par ressource
- `window.confirm()` natif pour la confirmation
- Password lu depuis localStorage, re-prompt sur 401
- Reload après succès (cache-buster sur raw rend la suppression instantanée)
- **Pas encore fait** : menu ⋮ avec Edit + Delete (le bouton 🗑️ direct sera remplacé par ce menu quand Edit sera livré)

---

## 1. TL;DR

Deux sprints **indépendants** :

- **Sprint 1 — CRUD complet** : éditer/supprimer une ressource depuis le tableau, éditer les valeurs de taxonomie. Touche backend (nouvelles Netlify Functions) + frontend (modales + colonne Actions).
- **Sprint 2 — UX filtres** : accordéon exclusif, compteurs, auto-fermeture, bouton "Effacer tout". 100% frontend.

Ordre suggéré : Sprint 1 d'abord (ajoute des capacités), Sprint 2 ensuite (polish UX). Mais ils ne se bloquent pas l'un l'autre.

**Hors scope** : Import/Export CSV/JSON (reporté à Phase 3 sur décision de Judith).

---

## 2. Décisions architecturales communes

### 2.1 Sécurité — quand demander le password admin

| Opération | Password ? |
|---|---|
| Add resource | ✅ (déjà en place) |
| Edit resource | ✅ |
| Delete resource | ✅ |
| Edit taxonomy (rename/add value) | ✅ |
| Read resources | ❌ (lecture publique via raw) |

Le password reste en `localStorage` après première saisie — l'utilisateur ne le retape pas à chaque action. C'est juste un gate côté serveur pour rejeter les requêtes anonymes.

### 2.2 Taxonomies : édition seulement, pas de suppression

- **Renommer** une valeur existante : oui
- **Ajouter** une valeur : oui
- **Supprimer** une valeur : **non, jamais** — pas de bouton "Delete" sur les valeurs

**Justification** : la suppression d'une valeur utilisée par des ressources créerait des valeurs orphelines non filtrables (bug rencontré en Phase 2B avec `Encyclopedia`/`Course`/`Book`). En interdisant la suppression, on rend ce problème structurellement impossible.

### 2.3 Renommage propagé

Si on renomme `Industry` → `Industrial` :
- La valeur dans `taxonomies.origin` devient `Industrial`
- **Toutes les ressources** qui avaient `"origin": ["Industry"]` deviennent `"origin": ["Industrial"]`
- Opération atomique : un seul commit GitHub modifie taxonomies + ressources concernées

### 2.4 Concurrence (sha mismatch)

Comme pour `add-resource`, les Functions `update`/`delete`/`update-taxonomy` doivent :
1. GET le fichier actuel pour obtenir le `sha`
2. Appliquer la modification
3. PUT avec ce `sha`
4. Si GitHub répond 409 (sha obsolète, quelqu'un a modifié entretemps) → retry une fois automatiquement

Pour Judith seule, le risque est ~nul. Mais le retry évite les surprises si deux onglets sont ouverts.

---

## 3. Sprint 1 — CRUD ressources et taxonomies

### 3.1 Ce qui change côté UI

**Nouvelle colonne "Actions" dans le tableau**
- Position : tout à droite, après "Last Updated"
- Cellule : icône `⋮` (trois points verticaux) cliquable
- Click → menu dropdown contextuel avec deux items :
  - `✏️ Edit` → ouvre modale d'édition
  - `🗑️ Delete` → ouvre alert box de confirmation
- Mobile : la colonne Actions devient un bouton dans la card (cohérent avec le layout responsive existant)

**Modale "Edit Resource"**
- Réutilise le même formulaire que `AddResourceForm.astro` (DRY)
- Pré-rempli avec les valeurs actuelles de la ressource
- Bouton submit : `Save Changes` au lieu de `Add Resource`
- Bouton `Cancel` ferme sans sauvegarder
- Submit → POST `/api/update-resource` avec password header

**Alert box "Delete Resource"**
- Modal natif simple (pas de modal pleine page)
- Texte : `Delete resource "{source}" ? This cannot be undone.`
- Deux boutons : `Cancel` (gris) et `Delete` (rouge danger)
- Click Delete → POST `/api/delete-resource` avec password header

**Bouton "Edit values" dans chaque accordéon de taxonomie**
- Position : aligné à droite de la filter-bar, à côté du titre du tiroir ouvert
- Visible seulement quand le tiroir est ouvert
- Click → modale "Edit {Taxonomy name}"

**Modale "Edit Taxonomy"**
- Liste les valeurs actuelles, chacune dans un champ `<input>` éditable
- Bouton `+ Add value` en bas pour ajouter une ligne vide
- **Pas de bouton "Remove"** sur les valeurs (cf 2.2)
- Bouton `Save` → POST `/api/update-taxonomy`, bouton `Cancel` ferme

### 3.2 Ce qui change côté backend

Trois nouvelles Netlify Functions, chacune dans `netlify/functions/` :

**`update-resource.ts`** — PUT-like semantics
- Body : `{ id: string, resource: Resource }` — la ressource entière, pas un patch
- Logique : fetch JSON, trouver la ressource par `id`, remplacer entièrement, commit
- Si `id` inconnu : 404
- Auth : `x-admin-password` header

**`delete-resource.ts`**
- Body : `{ id: string }`
- Logique : fetch JSON, filter out par `id`, commit
- Si `id` inconnu : 404
- Auth : `x-admin-password` header

**`update-taxonomy.ts`**
- Body : `{ name: string, values: string[], renames?: Record<string, string> }`
  - `name` : `access_model` / `origin` / `publisher_type` / `domain` / `content_type` / `topic`
  - `values` : nouveau tableau complet de valeurs après édition
  - `renames` : map `{ "ancien": "nouveau" }` pour les renames à propager
- Logique :
  1. Fetch JSON
  2. Valider : impossible de supprimer une valeur qui est dans `renames` source mais pas dans `values` final → réponse `400 cannot delete value used by N resources`
  3. Appliquer `renames` sur `taxonomies[name]` et sur **toutes les ressources** dans `resources[]` pour cette taxonomie
  4. Remplacer `taxonomies[name]` par `values`
  5. Commit (un seul PUT, atomique)
- Auth : `x-admin-password` header

### 3.3 Refactor recommandé — utiliser une utility partagée

Les 4 Functions (`add-resource`, `update-resource`, `delete-resource`, `update-taxonomy`) partagent :
- L'auth password check
- Le pattern fetch-then-PUT du JSON
- La gestion d'erreur

**Suggestion** : extraire dans `netlify/functions/_lib/github.ts` (le préfixe `_` indique que Netlify ne traite pas ce fichier comme une Function) :
```typescript
// Helper functions: requireAdminPassword(event), getResourcesFile(env), commitResourcesFile(env, updated, sha, message)
```

Réduit la duplication, facilite l'ajout futur de nouvelles Functions.

### 3.4 Fichiers à toucher

| Fichier | Nature |
|---|---|
| `src/components/ResourceTable.astro` | Ajout colonne Actions + dropdown + modal triggers |
| `src/components/AddResourceForm.astro` | Renommer en `ResourceForm.astro` ? + mode `create`/`edit` |
| `src/components/EditTaxonomyModal.astro` | Nouveau composant |
| `src/components/DeleteConfirmModal.astro` | Nouveau (ou alert natif via `confirm()`) |
| `netlify/functions/update-resource.ts` | Nouveau |
| `netlify/functions/delete-resource.ts` | Nouveau |
| `netlify/functions/update-taxonomy.ts` | Nouveau |
| `netlify/functions/_lib/github.ts` | Nouveau (refactor optionnel) |

### 3.5 Tests Sprint 1

| Test | Attendu |
|---|---|
| Click ⋮ sur une ligne → menu apparaît | OK |
| Edit → modale pré-remplie | OK |
| Submit Edit → commit GitHub avec message `Update resource: {source}` | OK |
| Delete → confirm → ressource disparaît du JSON | OK |
| Cancel sur confirm Delete → rien ne change | OK |
| Edit taxonomy : renommer une valeur → propagation sur toutes les ressources concernées | OK |
| Edit taxonomy : ajouter une valeur → apparaît dans le formulaire Add suivant | OK |
| Password manquant ou incorrect → 401 | OK |
| Concurrent edit (deux onglets) → second submit auto-retry sur 409 | OK |

---

## 4. Sprint 2 — UX filtres (refondu)

### 4.1 Comportements

**Règle 1 — Accordéon exclusif**
Un seul tiroir ouvert à la fois. Cliquer sur le bouton d'une autre taxonomie ferme le tiroir actuel et ouvre le nouveau. Cliquer sur le bouton du tiroir déjà ouvert le ferme (toggle).

**Règle 2 — Auto-fermeture si 0 sélection**
Quand l'utilisateur désélectionne la **dernière** pill d'un tiroir (passe de N=1 à N=0), le tiroir se ferme automatiquement.
**Exception** : si l'utilisateur a ouvert le tiroir manuellement et n'a encore rien sélectionné (N=0 → N=0), le tiroir reste ouvert (sinon impossible de commencer à filtrer).

**Règle 3 — Compteur sur les boutons**
- `N=0` : bouton affiche le nom seul (`Access Model`)
- `N≥1` : bouton affiche `{Nom} ({N})` (ex: `Access Model (2)`)

**Règle 4 — Style des boutons** (3 états)

| État | Background | Border | Texte |
|---|---|---|---|
| `N=0` (pas de filtre) | `white` | `var(--color-border)` #e5e7eb | `#4b5563` |
| `N≥1` et tiroir fermé | `#f3f4f6` (gris clair) | `var(--color-border)` | `var(--color-text)` #1f2937 |
| Tiroir ouvert | `var(--color-primary)` #3b82f6 | `var(--color-primary)` | white |

Compteur `(N)` : **même couleur** que le texte (pas plus discret). Conserve la lisibilité.

Le ton `#f3f4f6` = gray-100 Tailwind, contraste 8.5:1 avec text gray-800 → WCAG AAA. Accessible.

**Règle 5 — Bouton "Effacer les filtres"**
- Texte : `Effacer les filtres` (ou `Clear filters`)
- Position : aligné à droite de la filter-bar
- Visibilité : seulement si au moins 1 pill sélectionnée (sinon invisible, pas de clutter)
- Click : désélectionne toutes les pills + ferme le tiroir ouvert (si applicable)
- N'affecte pas la search bar (séparée)

### 4.2 État interne JavaScript

Simplifier le state :
```ts
let openPanel: string | null = null;  // au lieu d'un Set
const activeFilters: Record<string, Set<string>> = { /* idem */ };
```

Le passage d'un Set à un singleton pour `openPanel` reflète la règle 1.

### 4.3 Fichiers à toucher

Tout est dans `src/components/ResourceTable.astro` :
- HTML : ajouter `<button id="clearFiltersBtn">` dans la filter-bar
- CSS : 3 nouveaux états visuels pour `.filter-category-btn`, badge `(N)` inline-block dans le texte
- JS : refonte du gestionnaire de clic des `categoryButtons` (exclusif), du `pillButtons` (auto-fermeture), nouveau handler pour `clearFiltersBtn`

### 4.4 Tests Sprint 2

| Action | Attendu |
|---|---|
| Ouvrir tiroir A puis cliquer sur bouton B | A se ferme, B s'ouvre |
| Cliquer sur bouton A déjà ouvert | A se ferme |
| Sélectionner 2 pills dans A | Bouton A affiche `A (2)`, style gris clair (mais bleu car tiroir ouvert) |
| Sélectionner 2 pills puis fermer le tiroir | Bouton reste `A (2)` gris clair |
| Désélectionner la dernière pill | Tiroir se ferme automatiquement, bouton redevient `A` style normal |
| Ouvrir tiroir vide, ne rien sélectionner | Reste ouvert (pas d'auto-fermeture si on n'a jamais sélectionné) |
| Activer N filtres, cliquer "Effacer" | Toutes les pills désélectionnées, tiroir fermé, bouton "Effacer" disparaît |
| 0 filtre actif | Bouton "Effacer" invisible |
| Activer 1 filtre dans 1 taxonomie | Bouton "Effacer" apparaît |

---

## 5. Estimations

| Sprint | Effort dev | Action manuelle Judith |
|---|---|---|
| Sprint 1 — CRUD | ~2-3h | Aucune (tout déjà configuré côté Netlify env vars) |
| Sprint 2 — UX filtres | ~1h | Aucune |

Total : ~3-4h, livrables en 1 ou 2 sessions de travail.

---

## 6. Risques / pièges identifiés

### 6.1 Sprint 1

- **`update-taxonomy` est l'opération la plus complexe** : touche taxonomies ET ressources atomiquement. Tester soigneusement avec un cas où `renames` modifie 3+ ressources.
- **Confusion `update` vs `add`** : éviter qu'un Edit accidentellement appelle `add-resource` (qui créerait un doublon). Le form doit avoir un état `mode: 'edit' | 'create'` clair.
- **Mobile UX du dropdown ⋮** : sur mobile, les cards ne sont pas un `<tr>`. Penser au placement de l'icône dans le layout responsive.
- **Modale Edit pré-remplie** : pour les checkboxes multi-valeur, attention à bien re-cocher les valeurs actuelles. Bug classique : checkbox `checked` ne fonctionne pas si elle est setée avant que le DOM soit prêt.

### 6.2 Sprint 2

- **Auto-fermeture trop agressive** : la règle 2 ("si on désélectionne la dernière pill, le tiroir se ferme") peut surprendre l'utilisateur s'il voulait re-sélectionner immédiatement. À tester en usage réel.
- **Animation** : si tu veux une transition douce ouvre/ferme, c'est ~10 lignes de CSS en plus (`max-height` + `transition`). Sinon transition cut OK pour MVP.
- **Compteur en mode mobile** : vérifier que `Access Model (12)` ne casse pas le layout des boutons sur petit écran.

---

## 7. Statut d'exécution

### Sprint 1 — CRUD
| Étape | Statut | Date | Notes |
|---|---|---|---|
| 1.1 — Colonne Actions + menu ⋮ | ✅ | 2026-05-25 | Menu ⋮ dropdown (portal fixe via JS) avec Edit et Delete |
| 1.2 — Modale Edit Resource | ✅ | 2026-06-05 | Bug A corrigé : FormData + update optimiste (pas de reload CDN) |
| 1.3 — Confirm Delete | ✅ | 2026-05-24 | `window.confirm()` natif (via dropdown Delete) |
| 1.4 — Modale Edit Taxonomy | ✅ | 2026-06-05 | Bugs B+C corrigés : `localTaxonomyValues` + `rebuildPillsForTaxonomy` |
| 1.5 — Function `update-resource.ts` | ✅ | 2026-05-25 | Endpoint `/api/update-resource`, body `{id, resource}` — backend correct |
| 1.6 — Function `delete-resource.ts` | ✅ | 2026-05-24 | Endpoint `/api/delete-resource`, body `{id}` |
| 1.7 — Function `update-taxonomy.ts` | ✅ | 2026-05-25 | Propagation atomique des renames + validation valeurs orphelines — backend correct |
| 1.8 — Refactor `_lib/github.ts` | ✅ | 2026-05-25 | Extrait dans `netlify/functions/_lib/github.ts` ; add-resource et delete-resource refactorisés |
| 1.9 — Test end-to-end | ✅ | 2026-06-05 | Tous bugs corrigés et validés par Judith. Mergé sur `main`. |
| 1.10 — Nouvelles valeurs visibles dans Edit Resource | ✅ | 2026-06-05 | `updateEditFormCheckboxes()` + `data-taxonomy` sur `.modal-checkbox-group` |
| 1.11 — Style pills après rebuild | ✅ | 2026-06-05 | `.pill` et `.modal-checkbox-label` déplacés dans `<style is:global>` |
| 1.12 — Bug D : dropdown ⋮ au scroll | ✅ | 2026-06-05 | Suppression `window.scrollY` erroné + flip-up si overflow viewport |

### Sprint 2 — UX filtres
| Étape | Statut | Date | Notes |
|---|---|---|---|
| 2.1 — Accordéon exclusif (refactor state) | ✅ | 2026-05-25 | `openPanel: string \| null` remplace `openPanels: Set<string>` |
| 2.2 — Auto-fermeture sur 0 sélection | ✅ | 2026-05-25 | Exception "ouverture manuelle" respectée |
| 2.3 — Compteur `(N)` sur les boutons | ✅ | 2026-05-25 | Texte mis à jour dynamiquement via `updateCategoryButtonState()` |
| 2.4 — 3 états visuels boutons | ✅ | 2026-05-25 | idle / has-filters / open via `data-state` |
| 2.5 — Bouton "Effacer les filtres" | ✅ | 2026-05-25 | Visible seulement si ≥1 filtre actif |
| 2.6 — Tests visuels desktop + mobile | ✅ | 2026-06-05 | Validé par Judith sur deploy-preview-1 (desktop + mobile) |

**Phase 2C complète. Mergée sur `main` le 2026-06-05.**

---

## 9. Bugs identifiés — session test 2026-06-05

Testé sur : `https://deploy-preview-1--ux-research-database.netlify.app/`

### Bug A — Edit Resource : seul `source` est sauvegardé

**Symptôme** : après Submit dans la modale Edit Resource, seul le champ `source` (URL) est mis à jour dans le JSON. Les autres champs (`comments`, `trust_level`, taxonomies) reviennent à leur valeur précédente.

**Fichiers concernés** : `src/components/ResourceTable.astro` (JS client uniquement — backend `update-resource.ts` et `_lib/github.ts` sont corrects).

**Piste probable** : le handler `editForm.addEventListener('submit', ...)` (≈ ligne 1598) construit l'objet `updatedResource` en collectant les checkboxes via `editForm.querySelectorAll('input[name="..."):checked')`. **La piste la plus probable est que ces champs existent dans le DOM mais ne sont pas correctement collectés** — soit parce que les checkboxes sont hors du `<form>` dans le DOM réel, soit parce que le querySelectorAll utilise un sélecteur trop strict avec `CSS.escape`. **À vérifier impérativement avec l'onglet Network des DevTools** : inspecter le corps du POST vers `/api/update-resource` pour voir exactement ce qui est envoyé.

**Approche recommandée pour la correction** :
1. Ouvrir DevTools → Network, faire un Edit, inspecter le payload du POST `/api/update-resource`
2. Si le payload contient déjà tous les champs → le bug est dans le backend (peu probable : `update-resource.ts` fait un remplacement complet)
3. Si le payload ne contient que `source` → le bug est dans la collecte des champs côté frontend → corriger la logique de `updatedResource` dans le handler submit

### Bug B — Edit Taxonomy : `renames` jamais envoyé

**Symptôme** : renommer une valeur dans la modale Edit Taxonomy retourne un 400 (`Cannot delete taxonomy values still used by resources: "Outil" (3 resource(s))`). La Function backend `update-taxonomy.ts` reçoit un `renames` vide `{}` et interprète correctement l'ancienne valeur comme une suppression non autorisée.

**Fichiers concernés** : `src/components/ResourceTable.astro`, fonction `openTaxonomyModal` + handler `editTaxonomySave.addEventListener('click', ...)` (≈ lignes 1693–1813).

**Root cause** : le code suit bien les renames via `input.dataset.original` et les collecte dans un objet `renames`. Mais `addTaxonomyValueRow` lit les valeurs depuis les **pills SSR** du panel actif (lignes 1699–1701). Ces pills ont un `data-filter-value` mais pas de `data-original`. Quand les inputs sont construits, `input.dataset.original = value` est positionné. La logique semble correcte, mais les tests confirment que `renames` est vide à l'envoi. **Vérifier avec DevTools Network** le corps du POST vers `/api/update-taxonomy` — est-ce que `renames` est `{}` ou bien rempli ?

**Approche recommandée** : loguer `renames` en console avant le fetch pour isoler si le problème est dans la construction de l'objet ou dans la sérialisation.

### Bug C — État corrompu entre deux ouvertures de la modale Edit Taxonomy

**Symptôme** : après un save échoué (400), rouvrir la modale pour une opération différente (ajouter une valeur) produit la même erreur 400 avec la même valeur orpheline que la tentative précédente.

**Root cause** : `openTaxonomyModal` lit les valeurs depuis les pills SSR (`.pill[data-filter-value]`). Ces pills **ne sont pas mises à jour après un save raté** — elles représentent l'état au moment du premier chargement de la page. Si un save précédent a partiellement modifié les pills dans le DOM (ou si les inputs retiennent une mauvaise liste de valeurs), la ré-ouverture repart d'un état corrompu. La liste `taxonomyValuesList.innerHTML = ''` est bien vidée, mais les pills SSR qu'on lit pour reconstruire les inputs peuvent elles-mêmes être désynchronisées.

**Approche recommandée** : maintenir un objet JS `localTaxonomyValues: Record<string, string[]>` (copy-in des taxonomies au moment du fetch initial), et lire depuis cet objet plutôt que depuis les pills SSR. Mettre à jour cet objet après chaque save réussi.

### Bug D (mineur) — Positionnement dropdown ⋮

**Symptôme** : le menu dropdown ⋮ s'accroche au bas du contenu de la cellule plutôt qu'au bouton ⋮.

**Root cause** : le code `openDropdown` calcule `rect = menuBtn.getBoundingClientRect()`. Si `menuBtn` est un élément inline dans une `<td>` large, `rect.bottom` peut pointer loin en dessous du bouton selon la hauteur du contenu de la cellule.

**Approche recommandée** : vérifier que `menuBtn` est bien sélectionné via `.closest('.btn-actions-menu')` et que `getBoundingClientRect()` retourne les coordonnées du bouton et non celles de son parent. Si le bouton est wrappé dans un container, utiliser directement `menuBtn.getBoundingClientRect()` sans remontée dans le DOM.

---

## 8. Pour l'agent qui reprend

**Avant d'agir** :
1. Lire `CLAUDE.md` (conventions, gotchas — notamment le CSS scoping qui a posé problème en Phase 2A)
2. Lire ce document en entier
3. Vérifier l'état actuel : `git log -5`, `git status`
4. Confirmer avec Judith par quel sprint commencer (1 ou 2)

**Pièges connus à éviter** :
- Ne pas oublier `<style is:global>` pour les éléments rendus dynamiquement (cf gotcha CSS scoping dans CLAUDE.md)
- Toujours hardcoder les identifiants publics (owner/repo/branch) côté client, jamais en env var `PUBLIC_*` (cf incident Phase 2B step 1)
- Ne pas réintroduire `getFileContent`/`commitFile` côté client — tout passe par Netlify Functions maintenant
- Style préféré par Judith : valider step-by-step, jamais enchaîner sans confirmation explicite
