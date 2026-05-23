# Phase 2B — Sécuriser le token GitHub via migration Netlify

> **Pour l'agent IA qui reprend ce sujet** : ce document est autonome. Lis-le en entier avant d'agir. Vérifie l'état actuel des fichiers (les choses ont pu changer depuis la rédaction). Le code à écrire est donné en bloc, mais **confirme avec Judith avant d'exécuter chaque étape** — elle veut valider étape par étape.

**Date de rédaction** : 2026-05-23
**Auteur** : Session Claude précédente, validé par Judith
**Statut** : Étape 1 exécutée ✅, étapes 2-7 en attente

**Compte Netlify déjà créé** (2026-05-23) :
- Site name : `ux-research-database`
- URL publique : `https://ux-research-database.netlify.app`
- Repo GitHub connecté : `equipollente/ux-research-database`
- Variables d'env Netlify : pas encore configurées (étape 6)

---

## 1. TL;DR

Le token GitHub PAT est actuellement exposé dans le bundle JS client (préfixe `PUBLIC_` dans Astro). C'est insoutenable pour la prod. Décision validée par Judith :

- **Hébergement** : migrer GitHub Pages → **Netlify** (free tier, largement suffisant)
- **Lecture** des ressources : passer par `raw.githubusercontent.com` (pas de token, repo public)
- **Écriture** : Netlify Function avec token côté serveur + auth par mot de passe partagé (Judith seule écrit)
- **Sécurité post-migration** : révoquer le PAT actuel, créer un nouveau avec scope minimal

---

## 2. Contexte du projet

- **Projet** : UX Research Database (Judith Heckmann)
- **Stack** : Astro 5.18.1, `output: 'static'`, TypeScript
- **Repo** : `equipollente/ux-research-database` (branche `main`)
- **Hosting actuel** : GitHub Pages → `https://equipollente.github.io/ux-research-database/`
- **Données** : `src/data/resources.json` (taxonomies + array `resources[]`)
- **Build local** : `npm run dev` (port 4321 par défaut)
- **Working dir** : `C:\Users\judit\Documents\UX-Research\RessourcesDatabase`

### État du code à la rédaction de cette doc

- Phase 1 ✅ (table + filtres + pagination + recherche)
- Phase 2A ✅ (lecture depuis GitHub API en client)
- Bug d'affichage table résolu (CSS scoping split `<style>` / `<style is:global>` dans [ResourceTable.astro](src/components/ResourceTable.astro))
- Lecture depuis GitHub API fonctionne en local (avec token PUBLIC_)
- Écriture (Add Resource) fonctionne en local
- **En prod GitHub Pages** : aucune des deux ne marche correctement (token requis mais non exposable)

---

## 3. Le problème de sécurité

```typescript
// .env.local
PUBLIC_GITHUB_TOKEN=github_pat_11BXVE4CY0...
```

Le préfixe `PUBLIC_` indique à Astro/Vite d'**inliner la valeur dans le bundle JS client**. Au build de prod :

```javascript
// dans le bundle servi au navigateur
const auth = { token: "github_pat_11BXVE4CY0...", owner: "equipollente", ... }
```

→ N'importe qui ouvre DevTools, lit le token, peut **supprimer le repo** (scope `repo`).

GitHub Pages = hébergement statique pur, **aucun moyen** de cacher un secret.

---

## 4. Décision architecturale validée

### 4.1 Hébergement

**Netlify** (free tier) :
- 100 GB bandwidth/mois (besoin réel : ~100 MB)
- 125 000 Functions invocations/mois (besoin réel : ~10/jour)
- Auto-deploy depuis le repo GitHub à chaque `git push`
- HTTPS auto, domaine custom possible
- URL : `https://<nom-choisi>.netlify.app`

Autres options évaluées et rejetées :
- **Vercel** : équivalent technique, interface moins guidée pour débutants, Hobby tier interdit usage commercial (pas notre cas mais zone grise)
- **Cloudflare Pages + Workers** : plus rapide mais setup plus complexe (2 services)
- **GitHub Pages + Cloudflare Worker séparé** : 2 plateformes, CORS à gérer → trop lourd

### 4.2 Flux de données

**Lecture** :
```
Navigateur → raw.githubusercontent.com/equipollente/ux-research-database/main/src/data/resources.json
```
- Pas de token (repo public)
- Pas de base64 (JSON direct)
- CORS OK
- Marche en local ET en prod **immédiatement**

**Écriture** :
```
Navigateur → POST /api/add-resource (Netlify Function)
              ↓ (avec password header)
              [vérif password]
              ↓
              [commit via GitHub API avec token serveur]
              ↓
              GitHub
```
- Token stocké dans var d'env Netlify (jamais dans le bundle client)
- Auth : champ password dans le form, comparé à `ADMIN_PASSWORD` côté serveur
- Le mot de passe peut être stocké en `localStorage` après première saisie

### 4.3 Authentification

**Mot de passe partagé** suffit pour usage perso. Niveau supérieur (OAuth GitHub, magic link) reportable.

---

## 5. Plan d'exécution (7 étapes)

> **Important** : Judith veut **valider étape par étape**. Ne pas enchaîner les étapes sans confirmation.

### Étape 1 — Bascule de la lecture vers `raw.githubusercontent.com`

**Pourquoi en premier** : marche immédiatement, déployable sur GitHub Pages actuel, débloque la prod en lecture **sans toucher à l'hébergement**.

**Fichier** : [src/utils/github-api.ts](src/utils/github-api.ts), fonction `getResourcesFromGitHub()`

**Remplacer** :
```typescript
export async function getResourcesFromGitHub(): Promise<Resource[]> {
  const auth: GitHubAuthContext = {
    token: import.meta.env.PUBLIC_GITHUB_TOKEN,
    owner: import.meta.env.PUBLIC_GITHUB_OWNER,
    repo: import.meta.env.PUBLIC_GITHUB_REPO,
    branch: import.meta.env.PUBLIC_GITHUB_BRANCH,
  };

  try {
    const { content } = await getFileContent(auth, 'src/data/resources.json');
    const data = JSON.parse(content);
    return data.resources || data || [];
  } catch (error) {
    console.error('Failed to fetch resources from GitHub:', error);
    return [];
  }
}
```

**Par** :
```typescript
export async function getResourcesFromGitHub(): Promise<Resource[]> {
  const owner = import.meta.env.PUBLIC_GITHUB_OWNER;
  const repo = import.meta.env.PUBLIC_GITHUB_REPO;
  const branch = import.meta.env.PUBLIC_GITHUB_BRANCH || 'main';

  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/src/data/resources.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.status}`);
    }
    const data = await response.json();
    return data.resources || data || [];
  } catch (error) {
    console.error('Failed to fetch resources from raw GitHub:', error);
    return [];
  }
}
```

**Tests** :
- Local : `npm run dev`, hard reload, tableau s'affiche avec les 4 ressources
- Vérifier dans Network tab : appel vers `raw.githubusercontent.com`, status 200, JSON brut

**Commit** : `Refactor: read resources via raw.githubusercontent.com (no token needed)`

---

### Étape 2 — Créer la Netlify Function `add-resource`

**Pourquoi** : endpoint serveur qui détient le token et valide les écritures.

**Créer** : `netlify/functions/add-resource.ts`

```typescript
import type { Handler } from '@netlify/functions';

interface Resource {
  id: string;
  source: string;
  comments: string;
  domain: string[];
  content_type: string[];
  topic: string[];
  access_model: string[];
  origin: string[];
  publisher_type: string[];
  trust_level: number;
  last_updated: string;
}

const GITHUB_API = 'https://api.github.com';

export const handler: Handler = async (event) => {
  // 1. Method check
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // 2. Password check
  const password = event.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 3. Parse payload
  let newResource: Resource;
  try {
    newResource = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // 4. Server-side env
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  const filePath = 'src/data/resources.json';
  const apiUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`;

  // 5. Get current file (need sha to update)
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!getRes.ok) {
    return { statusCode: 502, body: `Failed to fetch current file: ${getRes.status}` };
  }

  const fileData = await getRes.json();
  const currentContent = JSON.parse(atob(fileData.content.replace(/\s/g, '')));

  // 6. Append resource
  const updated = {
    ...currentContent,
    resources: [...(currentContent.resources || []), newResource],
  };

  // 7. Commit
  const newContentBase64 = btoa(JSON.stringify(updated, null, 2));
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add resource: ${newResource.source}`,
      content: newContentBase64,
      branch,
      sha: fileData.sha,
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    return { statusCode: 502, body: `Failed to commit: ${err}` };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, resource: newResource }),
  };
};
```

**Installer dépendance** :
```bash
npm install --save-dev @netlify/functions
```

**Tests locaux** : `npx netlify dev` lance Astro + les Functions en local. Endpoint dispo à `http://localhost:8888/.netlify/functions/add-resource`.

---

### Étape 3 — Adapter le formulaire client

**Fichier** : [src/components/AddResourceForm.astro](src/components/AddResourceForm.astro)

**Changements** :
1. Retirer toute référence à `import.meta.env.PUBLIC_GITHUB_TOKEN` (lignes 242-247)
2. Retirer l'import de `commitFile` et `getFileContent` depuis `github-api.ts`
3. Ajouter un champ password (avec option "remember me" pour stocker en localStorage)
4. Remplacer la logique de submit par un fetch vers `/api/add-resource` :

```typescript
async function submitResource(resource: Resource) {
  const password = localStorage.getItem('admin_password') || prompt('Mot de passe admin :');
  if (!password) return;

  const response = await fetch('/api/add-resource', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    body: JSON.stringify(resource),
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_password');
    alert('Mot de passe incorrect');
    return;
  }

  if (!response.ok) {
    alert(`Erreur : ${response.status}`);
    return;
  }

  // Save password for next time
  localStorage.setItem('admin_password', password);
  alert('Ressource ajoutée !');
  window.location.reload();
}
```

> ⚠️ `prompt()` est basique. Préférer un vrai champ password dans le form (Judith pourra le designer).

---

### Étape 4 — Configuration Netlify

**Créer** : `netlify.toml` à la racine

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

**Modifier** : `astro.config.mjs`

Le `base: '/ux-research-database/'` était pour GitHub Pages. Sur Netlify, le site est à la racine du sous-domaine. Retirer le base et le site, ou les ajuster :

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://<nom-netlify>.netlify.app/',
  output: 'static',
  vite: {
    ssr: {
      external: ['@octokit/rest']
    }
  }
});
```

> Vérifier qu'il n'y a pas de liens absolus dans le code qui dépendent du `base` (ex: `/ux-research-database/foo`).

---

### Étape 5 — Déploiement initial Netlify

**Manuel** (Judith doit faire ces étapes dans son navigateur) :

1. Aller sur https://app.netlify.com → "Add new site" → "Import an existing project"
2. Connecter GitHub → autoriser → choisir `equipollente/ux-research-database`
3. Settings auto-détectés : Astro, build command `npm run build`, publish dir `dist`
4. **Avant de cliquer "Deploy"** → "Show advanced" → ajouter les env vars (voir étape 6)
5. Choisir un nom de site (ex: `ux-research-judith.netlify.app`)
6. Deploy

---

### Étape 6 — Variables d'environnement Netlify

Dans Site settings → Environment variables, ajouter :

| Variable | Valeur | Usage |
|---|---|---|
| `GITHUB_TOKEN` | Le PAT (sans préfixe PUBLIC_) | Function only |
| `GITHUB_OWNER` | `equipollente` | Function only |
| `GITHUB_REPO` | `ux-research-database` | Function only |
| `GITHUB_BRANCH` | `main` | Function only |
| `ADMIN_PASSWORD` | (choisi par Judith, fort) | Function only |

Les variables côté client (pour la lecture via raw) restent dans `.env.local` ET doivent être déclarées dans Netlify aussi avec préfixe `PUBLIC_` :

| Variable | Valeur |
|---|---|
| `PUBLIC_GITHUB_OWNER` | `equipollente` |
| `PUBLIC_GITHUB_REPO` | `ux-research-database` |
| `PUBLIC_GITHUB_BRANCH` | `main` |

> ⚠️ **NE PAS** redéclarer `PUBLIC_GITHUB_TOKEN` côté Netlify. Ce sera la confirmation que le token n'est plus dans le bundle client.

---

### Étape 7 — Cleanup & sécurité

1. **Retirer du code** :
   - Dans `.env.local` : supprimer la ligne `PUBLIC_GITHUB_TOKEN=...`
   - Dans `src/utils/github-api.ts` : la fonction `commitFile()` peut être supprimée (seule la Function l'utilise maintenant). Idem `getFileContent()` si plus utilisée côté client. Garder uniquement `getResourcesFromGitHub()` côté client.
   - Dans `AddResourceForm.astro` : retirer `GITHUB_AUTH` et tout import de `commitFile`/`getFileContent`

2. **Révoquer le token actuel** :
   - Aller sur https://github.com/settings/tokens
   - Trouver le PAT actuel → "Delete" / "Revoke"
   - Créer un nouveau PAT avec scope **minimal** : seulement `contents: write` sur le repo `ux-research-database`
   - Mettre ce nouveau token dans la var d'env Netlify `GITHUB_TOKEN`

3. **Nettoyer les fuites historiques** :
   - Le token actuel apparaît dans `DIAGNOSTIC.md` ligne 12 (fichier untracked à la rédaction)
   - Vérifier : `git grep "github_pat_"` → si présent dans l'historique, le rotate suffit (la révocation à l'étape 2 a déjà neutralisé le danger)
   - Les fichiers untracked à risque : `DIAGNOSTIC.md`, `CHANGES_MADE.md`, `IMPLEMENTATION_SUMMARY.md`, `README_FOR_NEXT_AGENT.md` → vérifier qu'ils sont dans `.gitignore` ou les supprimer

4. **Désactiver GitHub Pages** :
   - Settings → Pages → désactiver (ou laisser, mais informer dans le README que l'URL canonique est Netlify)

5. **Mettre à jour la doc** :
   - `README.md` : nouvelle URL de prod
   - Supprimer `PHASE_2A_*` et `DIAGNOSTIC.md` (obsolètes)
   - Ce fichier `PHASE_2B_TOKEN_MIGRATION.md` peut être archivé ou supprimé une fois la phase finie

---

## 6. Inventaire des fichiers concernés

| Fichier | Étape | Type de modif |
|---|---|---|
| `src/utils/github-api.ts` | 1, 7 | Modifier `getResourcesFromGitHub()`, supprimer `commitFile`/`getFileContent` |
| `src/components/AddResourceForm.astro` | 3, 7 | Refactor logique submit |
| `netlify/functions/add-resource.ts` | 2 | **Créer** |
| `netlify.toml` | 4 | **Créer** |
| `astro.config.mjs` | 4 | Retirer `base`, mettre à jour `site` |
| `.env.local` | 7 | Supprimer `PUBLIC_GITHUB_TOKEN` |
| `package.json` | 2 | Ajouter `@netlify/functions` en devDep |

---

## 7. Pièges identifiés

### 7.1 Astro static + Netlify Functions
- `output: 'static'` reste OK car les Functions sont dans `netlify/functions/` séparées
- Pas besoin de l'adapter `@astrojs/netlify` (réservé au mode SSR)

### 7.2 Base path
- `base: '/ux-research-database/'` est spécifique GitHub Pages
- Sur Netlify, retirer ce setting sinon URL devient `ux-research-judith.netlify.app/ux-research-database/`

### 7.3 CORS
- Pas de problème car la Function `/.netlify/functions/add-resource` est sur la **même origine** que le front
- Le redirect `/api/* → /.netlify/functions/*` garde l'URL propre

### 7.4 `atob` / `btoa` dans Netlify Functions
- Node 18+ supporte nativement `atob`/`btoa` (utilisé dans la Function ci-dessus)
- Si erreur "atob is not defined", utiliser `Buffer.from(str, 'base64').toString()` à la place
- Vérifier `node_version` dans `netlify.toml` (par défaut Netlify utilise Node 18)

### 7.5 SHA race condition
- L'écriture nécessite le `sha` du fichier actuel
- Si deux écritures simultanées → conflit (409)
- Vu que Judith écrit seule, risque ~nul, mais à savoir

### 7.6 Schema mismatch
- La Function attend un objet `Resource` exact (voir interface en haut du handler)
- Si le formulaire envoie un champ mal nommé, ça écrit du JSON malformé
- À tester end-to-end avant de déclarer "fini"

### 7.7 LocalStorage du mot de passe
- Stocké en clair côté navigateur
- Acceptable pour usage perso sur appareils de confiance
- À documenter dans le formulaire ("ce mot de passe sera mémorisé sur cet appareil")

### 7.8 Token rotation
- **Toujours révoquer l'ancien token** avant/après mise en service
- Nouveau token avec scope minimal : `contents: write` uniquement sur le repo cible

---

## 8. Tests par étape

| Étape | Test |
|---|---|
| 1 | Hard reload local → tableau s'affiche, Network montre fetch `raw.githubusercontent.com` 200 |
| 2 | `npx netlify dev` → POST `localhost:8888/.netlify/functions/add-resource` avec et sans password → 401 / 200 |
| 3 | Submit du form en local → ressource apparaît dans le repo GitHub |
| 4 | `npm run build` ne casse pas, dist/ contient bien les pages sans `/ux-research-database/` |
| 5 | Premier deploy Netlify réussit, site visible à l'URL |
| 6 | Submit du form en prod → ressource ajoutée à GitHub. Inspecter bundle : `grep "github_pat" dist/` doit renvoyer rien |
| 7 | Token ancien révoqué → ancienne fuite désactivée |

---

## 9. Rollback

- **Étape 1** (raw read) : `git revert <commit>` — innocuous
- **Migration Netlify** : tant qu'on n'a pas désactivé GitHub Pages, le site reste accessible aux deux URL. Désactiver GitHub Pages = dernière étape, après validation Netlify
- **Token révoqué** : irréversible, créer un nouveau si besoin

---

## 10. Pour l'agent qui reprend ce sujet

**Avant d'agir** :
1. Lire ce document en entier
2. `git status` et `git log -5` pour voir où on en est
3. `cat .env.local` pour voir si `PUBLIC_GITHUB_TOKEN` est encore là (sinon l'étape 7 a été faite)
4. Vérifier si `netlify.toml` existe (sinon l'étape 4 n'a pas été faite)
5. Vérifier si `netlify/functions/add-resource.ts` existe
6. Demander à Judith où elle veut reprendre

**Style attendu par Judith** :
- Toujours expliquer le diagnostic AVANT de coder
- Proposer plusieurs options et attendre validation
- Ne pas enchaîner les étapes sans confirmation
- Communication en français, code en anglais
- Pas de docs `.md` créés sans demande explicite

**Pré-requis techniques** :
- Compte Netlify (gratuit, créer si besoin sur netlify.com)
- Accès au repo GitHub `equipollente/ux-research-database` (Judith est owner)
- PowerShell (Windows 11) ou Bash

---

## 11. Statut d'exécution

| Étape | Statut | Date | Notes |
|---|---|---|---|
| 1 — Lecture via raw | ✅ Done | 2026-05-23 | Code modifié dans github-api.ts getResourcesFromGitHub() |
| 2 — Netlify Function | ⬜ Pas commencée | — | — |
| 3 — Adapter le form | ⬜ Pas commencée | — | Inclut compléter le form (3 → 6 taxonomies) |
| 4 — netlify.toml | ⬜ Pas commencée | — | Retirer base path Astro |
| 5 — Déploiement | 🟡 Partiel | 2026-05-23 | Compte Netlify créé, site `ux-research-database.netlify.app`, repo connecté. Pas encore de premier deploy effectif. |
| 6 — Env vars | ⬜ Pas commencée | — | Manuel par Judith dans Netlify dashboard |
| 7 — Cleanup & sécu | 🟡 Partiel | 2026-05-23 | PAT révoqué ✅. Reste : retirer PUBLIC_GITHUB_TOKEN de .env.local + nettoyer github-api.ts (commitFile, getFileContent inutilisés après step 3) |

**Mettre à jour ce tableau au fur et à mesure de l'exécution.**
