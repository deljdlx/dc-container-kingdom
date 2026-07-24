# Développement

## Commandes

```bash
npm install
npm run dev        # app sur http://localhost:5173 (API Docker mockée)
npm run build      # bundle ES modules → dist/
npm test           # Vitest (suite complète)
npm run test:watch
npm run lint       # ESLint — doit rester à 0 problème
```

Front-end en **modules ES** : `index.html` charge un seul module d'entrée
(`container-kingdom/js/bootstrap.js`) et chaque classe déclare ses propres
`import`s — dépendances explicites, bundling propre.

## Tourner sans Docker (le mock)

L'app tourne **sans daemon Docker** : un plugin du dev-server Vite mocke les
routes `/api/docker/*` (celles que nginx proxifie vers la socket Docker en prod)
à partir d'une capture de 35 conteneurs.

- `mock/fixtures/containers.json` — payload `GET /containers/json` capturé.
- `mock/docker-mock.js` — le mock, agnostique du framework (partagé dev + tests).
- `mock/vite-docker-mock-plugin.js` — branche le mock dans Vite.

## La démo du moteur

`http://localhost:5173/engine/demo/` — une vitrine **autonome** du moteur, sans
Container Kingdom (pilotée uniquement par `src/engine/index.js`). C'est le
**meilleur terrain pour développer/tester une feature moteur** : flèches pour
marcher, une foule de PNJ (patrouilleurs + immobiles), un PNJ « Cain » qui parle
au contact, et un PNJ timide qui fuit quand on l'approche.

> ⚠️ L'URL de la démo **doit finir par `/`** (`/engine/demo/`) — sinon le fallback
> SPA sert l'app à la place.

## Mode debug (`?debug=1`)

Ajouter `?debug=1` à l'URL (app **ou** démo) active la visualisation :

- outlines des areas / éléments (via `map-debug.css`, sous `body.debug`),
- **zones de collision** (jaune) et **zones trigger** (cyan),
- bounding boxes,
- les zones **s'allument en magenta au contact**.

Rien de tout ça hors `?debug=1` (coût nul).

## Tests

Vitest, avec deux environnements selon les fichiers : **node** (logique pure :
mock Docker, `Container`, `ContainerPlacement`, `ContainerRepository`) et
**jsdom** (`// @vitest-environment jsdom` en tête : moteur DOM — `Element`,
collisions, renderers, behaviors, bulle…).

Approche : des **tests de caractérisation** verrouillent le comportement observable
avant de refactorer (ex. diff de collision, équivalence passe-unique vs deux
passes, inversion des behaviors, cycle d'animation). La logique des behaviors est
testée de façon **déterministe** via un faux personnage duck-typé et un appel
direct à `_step()` / `update(dt)`.

## Piège : vérifier au navigateur quand rAF est en pause

La game loop tourne sur `requestAnimationFrame`. **Un onglet en arrière-plan met
rAF en pause** → joueur et PNJ gèlent, et une sonde qui `await` un rAF **timeout**.
Pour vérifier de façon déterministe (indépendamment du focus/onglet), on **pilote
la game loop à la main** en appelant `viewport.update(timestamp)` avec des
timestamps croissants :

```js
// après avoir exposé le viewport (window.__vp = viewport) le temps du test
const vp = window.__vp;
let t = performance.now();
vp.moving = 1; vp.direction = 'down'; vp.getCharacter().setDirection('down');
for (let i = 0; i < 40; i++) { t += 16; vp.update(t); }   // ~40 frames à 16 ms
```

C'est le **même chemin** que celui appelé par rAF, donc une vérification fidèle.
(Penser à retirer tout hook `window.__vp` temporaire avant de committer.)

> Attention aussi au cache de **service worker** sur `localhost` : un SW en cache
> peut servir la mauvaise app sur un port ; utiliser un port frais (`--strictPort`).

## Conventions

- **Langue** : code / identifiants / commentaires / JSDoc → **anglais** ;
  commits / PR / échanges → **français**.
- **Commits** : Conventional Commits + description FR (`feat:`, `fix:`, `refactor:`,
  `docs:`, `test:`, `chore:`). **Jamais** de mention d'assistance IA. **Commiter /
  pusher uniquement sur demande.** Ne jamais `git add -A`/`.` — stager des chemins
  explicites.
- **Workflow** typique : créer une branche → coder → **vérifier** (lint + build +
  tests, + navigateur si pertinent) → committer → merger sur `main` (`--no-ff`).
- **Design** : SOLID / découplage ; JSDoc sur l'API publique et la logique subtile,
  code auto-documenté ailleurs ; tests sur la logique critique.
- **« Terminé » = vérifié.** Rapporter fidèlement (un test qui échoue se dit).
