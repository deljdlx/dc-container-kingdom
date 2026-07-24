# Container Kingdom — guide agent

> Miroir de [`AGENTS.md`](AGENTS.md) et
> [`.github/copilot-instructions.md`](.github/copilot-instructions.md) —
> garder les trois alignés si on modifie les règles.

Outil de visualisation de conteneurs Docker rendu comme un **RPG** : chaque
conteneur devient une « maison » sur une carte, les réseaux deviennent des
routes, des PNJ déambulent. Le rendu repose sur un **moteur de mini-RPG maison**
(vanilla JS, sans framework), volontairement découplé de l'app.

Deux couches :

- **`src/engine/`** — le moteur RPG **réutilisable**. Ne connaît RIEN de Docker.
- **`src/container-kingdom/`** — l'app, qui *utilise* le moteur pour représenter
  des conteneurs.

## Commandes

```bash
npm run dev        # app sur http://localhost:5173 (API Docker mockée, pas de daemon requis)
npm run build      # bundle ES modules → dist/
npm test           # Vitest (suite complète)
npm run test:watch
npm run lint       # ESLint (doit rester à 0 problème)
```

- **Démo moteur autonome** : `http://localhost:5173/engine/demo/` (le moteur sans
  Container Kingdom — le meilleur terrain pour tester une feature moteur).
- **Mode debug** : ajouter `?debug=1` à l'URL (app ou démo) → visualise les zones
  de collision (jaune), les zones trigger (cyan), les bounding boxes et les
  outlines ; les zones **s'allument en magenta** au contact.

## Carte de l'architecture

- **Moteur** — `Element` (nœud de scene-graph) composé de sous-systèmes dédiés
  (`SceneGraph`, `CollisionSystem`, `Geometry`, `EventEmitter`) ; `Board`/`Area`
  (tuilage + streaming 7×7 autour du joueur) ; `Viewport`/`Camera` (game loop rAF,
  la caméra suit une cible) ; `Renderer/*` (algorithme du peintre, profondeur =
  `offsetY + height`) ; behaviors NPC (`PatrolBehavior`, `FleeBehavior`,
  `CharacterBehavior`) tickés par la game loop ; `SpriteElement` (éléments
  déclaratifs via `static descriptor`).
- **App** — `DockerApiClient` (→ `/api/docker/*`, mocké) → `ContainerRepository`
  → `ContainerPlacement` (grille d'occupation déterministe) →
  `ContainerKingdomRenderer` (dessine maisons/routes/PNJ dans le moteur) ;
  `KingdomHud`, `ContainersList`.

Détails : voir **`documentation/`** (architecture, engine, container-kingdom,
development).

## Frontière moteur (à respecter)

- Les dépendances vont **app → moteur uniquement**. Le moteur n'importe **jamais**
  rien de `container-kingdom/`.
- Tout ce qu'un hôte consomme est réexporté par **`src/engine/index.js`** —
  importer depuis ce baril, jamais un fichier interne.

## Conventions

- **Langue** : code, identifiants, commentaires, JSDoc → **anglais**. Commits, PR,
  échanges → **français**.
- **Branches** : **une branche par feature/fix** — jamais de travail direct sur
  `main`. Créer une branche dédiée (`feat/…`, `fix/…`, `refactor/…`, `docs/…`,
  `chore/…`), coder → vérifier → merger sur `main` (`--no-ff`).
- **Commits** : Conventional Commits + description FR (`feat:`, `fix:`, `refactor:`,
  `docs:`, `test:`, `chore:`). **Jamais** de mention d'assistance IA
  (pas de `Co-Authored-By`, pas de « Generated with… »). **Commiter/pusher
  uniquement sur demande.** Ne jamais `git add -A`/`git add .` — stager des chemins explicites.
- **Design** : SOLID / découplage (responsabilités séparées, dépendances
  explicites). JSDoc sur l'API publique et la logique subtile ; ailleurs, code
  auto-documenté. Tests sur la logique critique.
- **Produit** : mobile-first, soin de la performance et de la finition visuelle.

## Tenir la documentation à jour (impératif)

**Une doc obsolète est un bug.** Toute modification qui touche l'architecture, le
comportement, l'API publique, les commandes ou les conventions **doit** mettre à
jour la doc concernée **dans le même changement** :

- `documentation/` (architecture, engine, container-kingdom, development) — y
  compris les schémas Mermaid ;
- les README (racine et `src/engine/`) et les **JSDoc** de l'API touchée ;
- si les règles agent changent : les **trois** guides (`CLAUDE.md`, `AGENTS.md`,
  `.github/copilot-instructions.md`), à garder alignés.

## « Terminé » = vérifié

Avant d'annoncer qu'une tâche est finie : `npm run lint` (0 problème) +
`npm run build` + `npm test` verts, et quand c'est pertinent une validation du
rendu au navigateur. Rapporter fidèlement (un test qui échoue se dit).

### Piège de vérif au navigateur

La game loop tourne sur `requestAnimationFrame` : **rAF est en pause quand
l'onglet est en arrière-plan**, donc rien ne bouge (joueur ET PNJ). Pour vérifier
en pilotage déterministe, on peut appeler `viewport.update(timestamp)` à la main
avec des timestamps croissants (voir `documentation/development.md`).
