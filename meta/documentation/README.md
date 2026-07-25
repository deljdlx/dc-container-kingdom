# Documentation

Container Kingdom = une app de **visualisation de conteneurs Docker** rendue comme
un **RPG**, bâtie sur un **moteur de mini-RPG maison** et découplée de lui.

## Par où commencer

| Document | Pour… |
|----------|-------|
| **[architecture.md](architecture.md)** | La vue d'ensemble : les 2 couches (moteur + app), le flux de données, où vit quoi. **Commencer ici.** |
| **[engine.md](engine.md)** | Plongée dans le moteur RPG réutilisable : scene-graph, streaming, game loop, caméra, rendu/profondeur, collisions, behaviors, debug, API publique. |
| **[container-kingdom.md](container-kingdom.md)** | L'application : de l'API Docker à la carte (mock → repository → placement → rendu), HUD, réseaux. |
| **[development.md](development.md)** | Lancer / tester / builder / linter, la démo, le mode `?debug=1`, le piège rAF, et les conventions. |

## Autres points d'entrée

- **[`../../CLAUDE.md`](../../CLAUDE.md)** — brief court pour un agent IA (résumé,
  commandes, carte de l'archi, conventions, workflow de vérif).
- **[`../../README.md`](../../README.md)** — présentation et démarrage rapide.
- **[`../../src/engine/README.md`](../../src/engine/README.md)** — usage, frontière et
  configuration des chemins d'assets du moteur (côté hôte).
- **JSDoc** — la doc de référence au niveau code vit dans les fichiers eux-mêmes
  (JSDoc exhaustifs) ; ces documents décrivent l'architecture et y renvoient.

## Principe directeur

Les dépendances vont **app → moteur uniquement**. Le moteur ignore tout de Docker ;
tout ce qu'un hôte consomme passe par le baril `src/engine/index.js`. C'est ce qui
rend le moteur réutilisable (la démo `src/engine/demo/` en est la preuve).
