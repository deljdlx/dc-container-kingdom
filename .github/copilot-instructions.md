# Instructions Copilot — Container Kingdom

> Miroir de [`../AGENTS.md`](../AGENTS.md) et [`../CLAUDE.md`](../CLAUDE.md) —
> garder les trois alignés si on modifie les règles.

Outil de visualisation de conteneurs Docker rendu comme un **RPG** (chaque
conteneur = une maison, les réseaux = des routes, des PNJ déambulent), bâti sur un
**moteur de mini-RPG maison** en **vanilla JS (ES modules, sans framework)**.

Deux couches :

- **`src/engine/`** — le moteur RPG **réutilisable**. Ne connaît RIEN de Docker.
- **`src/container-kingdom/`** — l'app, qui *utilise* le moteur.

Doc détaillée : dossier **`documentation/`** (`architecture.md`, `engine.md`,
`container-kingdom.md`, `development.md`). Le détail au niveau code est dans les
**JSDoc** de chaque fichier.

## Commandes

```bash
npm run dev     # app sur http://localhost:5173 (API Docker mockée, pas de daemon requis)
npm run build   # bundle ES modules → dist/
npm test        # Vitest
npm run lint    # ESLint (doit rester à 0 problème)
```

Démo moteur autonome : `http://localhost:5173/engine/demo/` (l'URL doit finir par
`/`). Mode debug : ajouter `?debug=1` à l'URL (visualise zones de collision/trigger,
bounding boxes ; les zones s'allument en magenta au contact).

## Règles pour générer du code

- **Langue** : code, identifiants, commentaires, **JSDoc** → **anglais**.
  Messages de commit, PR, échanges → **français**.
- **Épouser le style du code environnant** (nommage, densité de commentaires, idiomes).
- **JSDoc** sur l'API publique et la logique subtile ; ailleurs, privilégier un
  **code auto-documenté** (noms clairs) plutôt que des commentaires.
- **SOLID / découplage** : responsabilités séparées, dépendances explicites. Le
  moteur sépare déjà les préoccupations en sous-systèmes (`Element` compose
  `SceneGraph`, `CollisionSystem`, `Geometry`, `EventEmitter`, `Renderer`) — suivre
  ce patron plutôt que de gonfler une classe.
- **Tests** (Vitest) sur la logique critique et les chemins fragiles. Les fichiers
  DOM utilisent `// @vitest-environment jsdom` en tête ; la logique pure tourne en
  environnement node.
- **Produit** : mobile-first, soin de la performance et de la finition visuelle.

## Frontière moteur (impérative)

- Les dépendances vont **app → moteur uniquement**. Le moteur (`src/engine/`)
  **n'importe jamais** rien de `src/container-kingdom/`.
- Importer le moteur **uniquement** depuis le baril **`src/engine/index.js`**,
  jamais un fichier interne. Y ajouter l'export de toute nouvelle classe publique.
- Le moteur configure ses chemins d'assets via `setAssetsBase(...)` — pas de chemin
  Container Kingdom en dur dedans.

## Repères d'architecture (moteur)

- `Element` = nœud de scene-graph ; `Board`/`Area` = tuilage streamé 7×7 autour du
  joueur ; `Viewport` = game loop `requestAnimationFrame` (registre de behaviors) ;
  `Camera` suit une cible (découplée du perso) ; `Renderer/*` = rendu DOM, profondeur
  par algorithme du peintre (`z = DEPTH_BASE + offsetY + height`).
- Collisions : broad phase (bounding box agrégée) + narrow phase (**zones de
  collision** du détecteur vs zones de la cible), détection pure + réconciliation par
  diff. Zones **collision** (bloquent) vs **trigger** (émettent des events).
- Personnages : `Character` animé, IA déléguée à des **behaviors** interchangeables
  (`PatrolBehavior`, `FleeBehavior`, `CharacterBehavior`) tickés par la game loop.
  Déplacement via la primitive `Character.moveBlocked(dx, dy, isBlocked)`.
- Éléments intégrés : `SpriteElement` déclaratifs (`static descriptor`).

## Tenir la documentation à jour (impératif)

**Une doc obsolète est un bug.** Toute modification qui touche l'architecture, le
comportement, l'API publique, les commandes ou les conventions **doit** mettre à
jour la doc concernée **dans le même changement** :

- `documentation/` (architecture, engine, container-kingdom, development) — y
  compris les schémas Mermaid ;
- les README (racine et `src/engine/`) et les **JSDoc** de l'API touchée ;
- si les règles agent changent : les **trois** guides (`CLAUDE.md`, `AGENTS.md`,
  `.github/copilot-instructions.md`), à garder alignés.

## Vérification (« terminé » = vérifié)

Avant de considérer une modif finie : `npm run lint` (0 problème) + `npm run build`
+ `npm test` verts. Rapporter fidèlement (un test qui échoue se dit).

> ⚠️ La game loop tourne sur `requestAnimationFrame` : **rAF est en pause quand
> l'onglet est en arrière-plan**, donc rien ne bouge à l'écran. Pour vérifier de
> façon déterministe, piloter la boucle à la main : `viewport.update(timestamp)`
> avec des timestamps croissants (détails dans `documentation/development.md`).

## Git

- Messages en **Conventional Commits** + description **française** (`feat:`, `fix:`,
  `refactor:`, `docs:`, `test:`, `chore:`).
- **Ne jamais** ajouter de mention d'assistance IA (pas de `Co-Authored-By`, pas de
  « Generated with… »).
- **Ne jamais** `git add -A` / `git add .` — stager des chemins explicites.
