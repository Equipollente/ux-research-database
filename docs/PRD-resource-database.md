# PRD — UX & Research Resource Database

**Owner :** Judith Heckmann
**Date :** 2026-05-23
**Statut :** Draft v1 — à valider
**Hébergement cible :** GitHub Pages (repo public, lecture publique, écriture privée)

---

## 1. Problem Statement

Judith utilise quotidiennement un grand nombre de ressources web (articles, tools, frameworks, papers, benchmarks) pour son travail de UX research et de design. Ces ressources sont aujourd'hui éparpillées entre bookmarks, onglets, notes Notion et fichiers locaux, ce qui rend difficile de les retrouver, les comparer, et les partager. L'absence d'un index unique, structuré et classifié génère du temps perdu à chaque projet et empêche le partage du travail de curation avec d'autres designers/researchers.

Le coût de ne pas résoudre ce problème : duplication d'effort de recherche, perte d'autorité sur sa propre veille, impossibilité de citer ou partager une bibliographie cohérente, et un signal de portfolio moins lisible pour la communauté UX.

---

## 2. Goals

1. **Centraliser et classifier** toutes les ressources web utiles dans une base de données unique, structurée selon un schéma maîtrisé (10 champs, 6 taxonomies fermées + 1 échelle de confiance).
2. **Offrir une vue tableau minimaliste**, rapide à scanner, avec recherche, filtres et pagination — accessible sur desktop et mobile.
3. **Permettre l'édition par deux canaux** : une UI in-page (ajout / édition / suppression / gestion des sous-catégories) ET l'édition directe du fichier source sur GitHub.
4. **Préserver l'asymétrie d'accès** : lecture publique pour tous, écriture authentifiée pour Judith uniquement.
5. **Héberger sur GitHub Pages** sans backend, sans coût récurrent, sans dépendance à un service tiers payant.

---

## 3. Non-Goals

| Hors scope | Pourquoi |
|---|---|
| Multi-contributeurs avec rôles et permissions | Reste un projet de curation personnelle. Ajouter de l'auth multi-user augmente massivement la complexité. |
| Commentaires publics, votes, ou signalements | Ressource = curation éditoriale, pas une plateforme communautaire. |
| Backend / base de données serveur | Un fichier JSON dans le repo suffit largement pour ≤ quelques milliers d'entrées et reste lisible/diffable. |
| Extension de navigateur pour capturer une page en un clic | Utile mais lourd à maintenir. Reportable en P2. |
| Authentification pour les visiteurs | Lecture publique, point. |
| Full-text search dans le contenu des ressources liées | Hors scope — l'index reste sur les métadonnées du tableau. |

---

## 4. User Stories

### Visiteur (lecture publique)

- En tant que visiteur, je veux **parcourir le tableau complet des ressources** pour découvrir ce que Judith recommande.
- En tant que visiteur, je veux **filtrer le tableau par Domain, Topic, Content Type, etc.** pour cibler ce qui m'intéresse.
- En tant que visiteur, je veux **chercher par mot-clé** (nom, URL ou commentaire) pour trouver une ressource précise.
- En tant que visiteur, je veux **cliquer sur une ressource pour ouvrir l'URL** dans un nouvel onglet.
- En tant que visiteur, je veux **lire le commentaire personnel de Judith** sur chaque ressource pour comprendre son contexte d'usage.
- En tant que visiteur sur mobile, je veux **une lecture confortable** même sur écran étroit (≤ 380 px).

### Owner (Judith, écriture authentifiée)

- En tant qu'owner, je veux **ajouter une ressource via un formulaire** et que ça commit sur GitHub automatiquement.
- En tant qu'owner, je veux **éditer n'importe quel champ** d'une ressource existante.
- En tant qu'owner, je veux **supprimer une ressource** avec confirmation.
- En tant qu'owner, je veux **ajouter une sous-catégorie** à n'importe laquelle des 6 catégories taxonomiques.
- En tant qu'owner, je veux **supprimer une sous-catégorie**, avec un garde-fou si des ressources l'utilisent encore.
- En tant qu'owner, je veux **renommer une sous-catégorie** et que toutes les ressources qui l'utilisent soient mises à jour en cascade.
- En tant qu'owner, je veux **pouvoir éditer le fichier JSON directement sur GitHub** (depuis l'interface GitHub ou un commit local) et que le site reflète immédiatement les changements après rebuild.
- En tant qu'owner, je veux **être la seule à pouvoir écrire** — un visiteur ne peut pas commit même s'il connaît l'URL d'édition.

---

## 5. Requirements

### P0 — Must have (v1)

#### 5.1 Architecture & hébergement
- Site statique hébergé sur **GitHub Pages**.
- Source de données : un fichier unique `data/resources.json` versionné dans le repo.
- Build automatique sur push (GitHub Actions ou build natif Vite/Astro).
- URL stable type `https://<user>.github.io/<repo>/`.

#### 5.2 Schéma de données — Ressource

Chaque entrée du tableau respecte exactement ce schéma :

| Champ | Type | Source | Obligatoire |
|---|---|---|---|
| `id` | string (généré) | auto (UUID court) | oui |
| `source` | string (URL cliquable ou texte libre) | saisie | oui |
| `access_model` | enum (1 valeur de Access Model) | liste fermée | oui |
| `origin` | enum (1 valeur de Origin) | liste fermée | oui |
| `publisher_type` | enum (1 valeur de Publisher Type) | liste fermée | oui |
| `domain` | **array** d'enums (≥ 1 valeur de Domain) | liste fermée, multi-valeurs | oui |
| `content_type` | **array** d'enums (≥ 1 valeur de Content Type) | liste fermée, multi-valeurs | oui |
| `topic` | **array** d'enums (≥ 1 valeur de Topic) | liste fermée, multi-valeurs | oui |
| `trust_level` | integer 1-5 | échelle fixe | oui |
| `comments` | string (texte brut, pas de markdown en v1) | texte libre | non |
| `last_updated` | date (YYYY-MM-DD) | auto à la création/édition | oui |

**Champs mono-valeur (1 sous-catégorie par ressource) :** `access_model`, `origin`, `publisher_type`.
**Champs multi-valeurs (plusieurs sous-catégories possibles par ressource) :** `domain`, `content_type`, `topic` — une ressource peut couvrir plusieurs domaines, plusieurs topics, et plusieurs content types simultanément.

#### 5.3 Schéma de données — Taxonomies (sous-catégories v1)

Les 6 catégories à listes fermées contiennent en v1 :

```
access_model     : Free, Freemium, Paid, Institutional
origin           : Academic, Industry, Independent, Community, Institutional
publisher_type   : Individual, Collective, Organization
domain           : UX Design, UX Research, Digital Product, Behavioral Science,
                   Sociology, Psychology, Multidisciplinary
content_type     : Article, Blog Post, Case Study, Research Paper, Tool, Framework,
                   Study, Benchmark, Audit, Dataset, Trend Report, Encyclopedic
topic            : Cognition, Emotion & Affect, Social Behavior, Culture & Identity,
                   Communication, Ethics & Values, Perception, Attention, Memory,
                   Decision Making, Problem Solving, Creativity, Reasoning,
                   Motivation & Engagement, Trust, Technology & Society, Interaction,
                   Usability, Research Practice, Design Process
```

`trust_level` reste **une échelle fixe 1-5** non modifiable par l'UI (pas une taxonomie).

#### 5.4 Vue tableau (lecture publique)

- Affichage de toutes les colonnes du schéma (sauf `id` masqué).
- **Recherche texte libre** : matche sur `source` et `comments` (insensible à la casse, sans accents).
- **Filtres par colonne** : un filtre dropdown multi-sélection sur les **6 colonnes catégories uniquement** (Access Model, Origin, Publisher Type, Domain, Content Type, Topic). Pas de filtre sur Trust Level, Source, Comments, ou Last Updated.

**Sémantique de filtrage (importante) :**

- **Entre filtres** (deux colonnes différentes) : AND. Ex : filtre Access Model = `Free` ET filtre Domain = `UX Research` → ressources qui sont à la fois Free et qui couvrent UX Research.
- **À l'intérieur d'un filtre multi-valeurs (Domain, Content Type, Topic)** : AND / superset. Si Judith sélectionne `Article + Case Study + Tool` dans Content Type, le filtre affiche **toutes les ressources qui contiennent au moins ces trois valeurs** (et éventuellement d'autres). Une ressource taguée `[Article]` seule ne passe pas le filtre ; une ressource taguée `[Article, Case Study, Tool, Framework]` passe.
- **À l'intérieur d'un filtre mono-valeur (Access Model, Origin, Publisher Type)** : OR. Si Judith sélectionne `Free + Freemium` dans Access Model, le filtre affiche les ressources qui sont Free **ou** Freemium (un champ mono-valeur ne peut pas être les deux à la fois).
- **Pagination** : 25 entrées par page par défaut, navigation page suivante/précédente + saut direct.
- **Responsive mobile** : sur écrans < 768 px, colonnes secondaires collapsées sous une vue "carte" empilée ou via un toggle "colonnes visibles".
- La cellule `source` est cliquable : si la valeur est une URL valide, elle ouvre la ressource dans un nouvel onglet (`target="_blank" rel="noopener noreferrer"`). Si la valeur est du texte libre (nom de ressource non-URL), la cellule reste non-cliquable. **Pas de page individuelle par ressource** — l'URL source est le seul lien de sortie.

#### 5.5 CRUD ressources (UI authentifiée)

- Bouton **"Mode édition"** dans le header → ouvre une modale demandant un GitHub Personal Access Token (PAT, scope `contents:write` sur ce repo uniquement).
- PAT stocké en `localStorage` avec bouton "Se déconnecter".
- Quand authentifié :
  - Bouton **"+ Ajouter une ressource"** → formulaire avec tous les champs, validation, commit au save.
  - Bouton **"Éditer"** sur chaque ligne → même formulaire pré-rempli.
  - Bouton **"Supprimer"** sur chaque ligne → confirmation modale → commit suppression.
- Chaque action génère un commit clair (ex : `Add resource: <source>` / `Edit resource <id>` / `Delete resource <id>`).
- Gestion du conflit de SHA : si le fichier a été modifié entre-temps, refetch + retry automatique avec re-merge.

**Acceptance criteria — Ajouter une ressource :**

- Given Judith est en mode édition authentifié,
- When elle clique "+ Ajouter", remplit le formulaire et clique "Enregistrer",
- Then une nouvelle entrée est ajoutée à `data/resources.json` avec un `id` unique et `last_updated` à la date du jour, un commit est créé sur GitHub, et le tableau se rafraîchit.

**Acceptance criteria — Champs obligatoires :**

- Le bouton "Enregistrer" est désactivé tant que tous les champs obligatoires ne sont pas remplis (validation côté client).
- Si `source` ressemble à une URL, validation que le format est correct (sans imposer l'URL : le champ accepte aussi un nom libre).

#### 5.6 Gestion des sous-catégories (UI authentifiée)

Une page/onglet **"Gérer les taxonomies"** accessible en mode édition seulement.

Pour chacune des 6 catégories fermées :
- Liste des sous-catégories existantes
- Bouton **"+ Ajouter une sous-catégorie"** → input texte → commit
- Bouton **"Renommer"** sur chaque sous-catégorie → input pré-rempli → commit qui met à jour la taxonomie **ET toutes les ressources utilisant l'ancien label** dans le même commit
- Bouton **"Supprimer"** sur chaque sous-catégorie → si des ressources l'utilisent : alerte avec compteur ("12 ressources utilisent ce label") + choix entre annuler ou réaffecter à une autre sous-catégorie avant suppression
- Une catégorie ne peut pas être vide : impossible de supprimer la dernière sous-catégorie d'une catégorie

**Acceptance criteria — Renommer en cascade :**

- Given la sous-catégorie "Blog Post" existe dans Content Type et 8 ressources l'utilisent,
- When Judith renomme "Blog Post" en "Article de blog",
- Then dans le même commit, la taxonomie est mise à jour ET les 8 ressources passent à `content_type: "Article de blog"`.

#### 5.7 Édition directe sur GitHub

- Le format JSON est volontairement lisible (clés explicites, 2-space indent, ordre stable des champs) pour permettre l'édition manuelle sur GitHub.
- Aucune validation runtime ne casse le site si le JSON est légèrement malformé : un fallback affiche un message "JSON invalide, vérifie ton dernier commit" plutôt qu'une page blanche.
- Un schéma JSON Schema (`data/schema.json`) est inclus dans le repo pour valider à la main si besoin.

### P1 — Nice to have (fast follow)

- **Tri par colonne** (asc/desc) — pas demandé explicitement mais quasi-natif sur un tableau.
- **Mode sombre** (toggle dans le header, respect du `prefers-color-scheme` au premier load).
- **Export CSV** du tableau filtré.
- **Highlight visuel du Trust Level** (étoiles, pastilles colorées).
- **Changelog** (`CHANGELOG.md` à la racine du repo, généré automatiquement à partir des messages de commit ou maintenu manuellement) — voir section 5.8.

### 5.8 Changelog (P1)

- Fichier `CHANGELOG.md` à la racine du repo, format [Keep a Changelog](https://keepachangelog.com/).
- Deux options à arbitrer avec l'agent ingénieur :
  - **Option A — auto** : une GitHub Action lit les commits depuis le dernier tag et génère/met à jour `CHANGELOG.md`.
  - **Option B — manuel** : Judith met à jour le fichier à la main aux moments-clés (nouvelles features, refactos).
- Le changelog n'est pas affiché dans l'UI en v1 (P2 : lien "What's new ?" dans le header pointant vers le fichier).

### P2 — Future considerations

- Tags libres en complément des taxonomies fermées.
- API JSON publique (en pratique, le fichier `data/resources.json` est déjà l'API).
- Flux RSS des nouvelles ressources ajoutées.
- Extension navigateur "Ajouter cette page à la base".
- Import CSV en bulk pour le seed initial.
- Génération automatique d'une "fiche ressource" partageable (page individuelle par ressource).

---

## 6. Architecture — à arbitrer avec un agent ingénieur

**Stack technique : décision déférée.** Judith préfère discuter du choix de stack avec un agent ingénieur dédié plutôt que de trancher maintenant. Plusieurs options viables existent et le bon choix dépend de critères qu'on n'a pas encore explorés (familiarité de Judith avec React, simplicité de maintenance long terme, contraintes de perf, etc.).

### Options à discuter avec l'agent eng

| Option | Forces | Faiblesses |
|---|---|---|
| **React + Vite** (compilé en statique) | Écosystème mature, TanStack Table dispo, formulaires faciles, communauté large | Surdimensionné si on reste sur ~quelques centaines d'entrées ; courbe d'apprentissage si Judith n'est pas familière |
| **Astro** (SSG) | Très léger, HTML par défaut, "islands" React/vanilla seulement où nécessaire | Moins d'exemples sur le pattern édition-via-API |
| **Vanilla JS + Alpine.js** | Zéro build, lit le JSON directement, ~50 lignes pour le tableau | Code custom à maintenir pour search/filter/paginate |
| **Static site generator type 11ty / Eleventy** | Excellent pour du contenu structuré | Édition in-page plus complexe |

### Contraintes communes à toutes les options

Quelle que soit la stack choisie, l'architecture devra respecter :
- Hébergement sur **GitHub Pages**, build statique uniquement
- Source de données : un fichier JSON unique versionné dans le repo
- Lecture publique sans auth, écriture via PAT GitHub stocké en `localStorage`
- Commits via API GitHub (Octokit ou équivalent fetch direct)
- Format JSON lisible/diffable pour permettre l'édition manuelle sur GitHub

### Modèle de données (indépendant de la stack)

```json
{
  "taxonomies": {
    "access_model":    ["Free", "Freemium", "Paid", "Institutional"],
    "origin":          ["Academic", "Industry", "Independent", "Community", "Institutional"],
    "publisher_type":  ["Individual", "Collective", "Organization"],
    "domain":          ["UX Design", "UX Research", "Digital Product", "Behavioral Science", "Sociology", "Psychology", "Multidisciplinary"],
    "content_type":    ["Article", "Blog Post", "Case Study", "Research Paper", "Tool", "Framework", "Study", "Benchmark", "Audit", "Dataset", "Trend Report", "Encyclopedic"],
    "topic":           ["Cognition", "Emotion & Affect", "Social Behavior", "Culture & Identity", "Communication", "Ethics & Values", "Perception", "Attention", "Memory", "Decision Making", "Problem Solving", "Creativity", "Reasoning", "Motivation & Engagement", "Trust", "Technology & Society", "Interaction", "Usability", "Research Practice", "Design Process"]
  },
  "resources": [
    {
      "id": "r-001",
      "source": "https://www.nngroup.com/articles/ten-usability-heuristics/",
      "access_model": "Free",
      "origin": "Industry",
      "publisher_type": "Organization",
      "domain": ["UX Design", "UX Research"],
      "content_type": ["Article", "Framework"],
      "topic": ["Usability", "Design Process"],
      "trust_level": 5,
      "comments": "Référence absolue pour toute heuristique d'évaluation.",
      "last_updated": "2026-05-23"
    }
  ]
}
```

### Flux d'authentification

1. Visiteur arrive → site charge `data/resources.json` via `fetch` → tableau s'affiche en lecture seule.
2. Judith clique "Mode édition" → modale demande un PAT GitHub (fine-grained, scope `contents:write` sur ce repo uniquement).
3. PAT stocké en `localStorage` → boutons d'édition apparaissent.
4. Save → Octokit lit le fichier, fait le diff, commit avec message clair → refresh.
5. Bouton "Se déconnecter" → efface le PAT du `localStorage`.

Le PAT en `localStorage` est un compromis pragmatique : il vit dans le navigateur de Judith uniquement, pas dans le code, pas dans le repo. Un attaquant qui aurait accès à son navigateur a déjà bien plus de pouvoir que ce token.

---

## 7. Success Metrics

### Leading (semaines après le launch)

| Métrique | Cible | Mesure |
|---|---|---|
| Temps d'ajout d'une ressource | < 60 sec (form open → commit visible) | Mesure manuelle sur 5 ajouts consécutifs |
| Temps de rendu initial du tableau (jusqu'à 200 ressources) | < 500 ms après chargement du JSON | DevTools, lighthouse |
| Latence recherche / filtre | < 100 ms perçu | Test à la main |
| Bug-free Pages build sur 10 commits consécutifs | 100% | GitHub Actions log |

### Lagging (3-6 mois post-launch)

| Métrique | Cible | Mesure |
|---|---|---|
| Volume de ressources curées | ≥ 100 entrées | Compte dans `data/resources.json` |
| Adoption personnelle | Judith arrête d'utiliser ses bookmarks pour la même veille | Auto-évaluation qualitative |
| Partage externe | ≥ 1 mention/citation publique du site (LinkedIn, portfolio, équipe) | Suivi manuel |
| Maintenance | Mise à jour ≥ 1×/semaine du fichier source | Activité GitHub |

---

## 8. Open Questions

### Décisions actées (closes)

| Question | Décision |
|---|---|
| Multi-sélection sur Domain, Topic et Content Type | **Oui** — ces 3 champs deviennent multi-valeurs par ressource. Sémantique de filtrage AND/superset (la ressource doit contenir toutes les valeurs sélectionnées). |
| Ordre des sous-catégories | Garder l'ordre fourni dans le brief initial, pas de tri alphabétique. |
| Markdown dans `comments` | Non, texte brut en v1. |
| Page individuelle par ressource | Non. Le champ `source` est cliquable et c'est l'unique lien de sortie. |
| Fine-grained PAT vs classic PAT | Recommandation : fine-grained PAT (scope `contents:write` limité à ce repo). |
| Changelog | Oui, `CHANGELOG.md` à la racine du repo (modalités auto/manuel à arbitrer avec l'agent ingénieur). |

### Encore à résoudre

| Question | À résoudre par | Bloquante ? |
|---|---|---|
| **Choix de la stack technique** (React+Vite, Astro, vanilla+Alpine, autre) | Discussion avec un agent ingénieur dédié | Oui (à arbitrer avant scaffolding) |
| Modalités du changelog : auto via GitHub Action ou manuel | Discussion avec l'agent ingénieur | Non (P1) |
| Nom du repo + URL GitHub Pages finale | Judith | Oui (avant scaffolding) |

---

## 9. Timeline & Phasing

Le projet est petit mais il y a trois blocs logiques. Suggestion de phasing :

**Phase 1 — Lecture publique (≈ 1-2 jours dev)**
Scaffold du repo (stack à arbitrer avec agent eng), JSON seed avec les 6 taxonomies pré-remplies + 5-10 ressources test, vue tableau avec recherche/filtres multi-valeurs sur les 6 colonnes catégories/pagination/responsive, déploiement GitHub Pages.

**Phase 2 — CRUD ressources (≈ 1-2 jours dev)**
Modale PAT, formulaire ajout/édition/suppression avec multi-sélection sur domain/topic/content_type, intégration GitHub API, gestion des conflits SHA.

**Phase 3 — Gestion des taxonomies (≈ 1 jour dev)**
Page d'admin des sous-catégories, logique de cascade au rename, garde-fou à la suppression.

**Phase 4 — Polish (P1, à faire au fil de l'eau)**
Sort, dark mode, export CSV, visualisation Trust Level, `CHANGELOG.md`.

Pas de deadline contractuelle — projet personnel, rythme libre.

---

## 10. Décisions ouvertes / prochaines étapes

Reste à faire avant le scaffolding :

1. **Discussion stack technique avec un agent ingénieur** — Judith veut explorer les options (React+Vite, Astro, vanilla+Alpine, autre) avec un agent eng dédié avant de trancher. La discussion devra aussi couvrir : modalités du changelog (auto via GitHub Action ou manuel), gestion du PAT et des conflits SHA, format du JSON.
2. **Nom du repo** + URL finale GitHub Pages souhaitée.

Une fois ces deux points calés, le scaffolding du repo peut démarrer (structure de fichiers, config build, premier composant tableau, JSON seed avec les 6 taxonomies pré-remplies dans l'ordre du brief initial).
