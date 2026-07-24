# Architecture

Container Kingdom est fait de **deux couches nettement séparées** :

```
┌─────────────────────────────────────────────────────────────┐
│  src/container-kingdom/  — l'application                     │
│  Docker → carte RPG : maisons, routes, PNJ, HUD             │
│                                                             │
│        dépend de ↓  (jamais l'inverse)                      │
├─────────────────────────────────────────────────────────────┤
│  src/engine/  — moteur de mini-RPG réutilisable             │
│  scene-graph, tuilage, caméra, rendu, collisions, behaviors │
│  ne connaît RIEN de Docker / Container Kingdom              │
└─────────────────────────────────────────────────────────────┘
```

La règle d'or : **les dépendances vont app → moteur, uniquement**. Le moteur
n'importe rien de `container-kingdom/`, et tout ce qu'un hôte consomme passe par
le baril `src/engine/index.js`. On pourrait embarquer le moteur dans un autre
projet sans toucher une ligne de Container Kingdom (c'est ce que fait la démo,
`src/engine/demo/`).

## Flux de données de l'app

```
DockerApiClient        GET /api/docker/*  (mocké en dev par un plugin Vite)
      │
      ▼
ContainerRepository    charge conteneurs + stats, les tient en mémoire
      │
      ▼
DockerCompose          regroupe les conteneurs par projet compose (les stacks dc-*)
      │
      ▼
ContainerPlacement     grille d'occupation déterministe → où poser chaque maison
      │
      ▼
ContainerKingdomRenderer   instancie les éléments du MOTEUR (maisons, routes, PNJ)
      │                     et les ajoute au Board via l'API moteur
      ▼
Engine (Viewport/Board/Renderer)   game loop rAF, rendu DOM, collisions, caméra
```

En parallèle : `KingdomHud` (mémoire/CPU, interrupteurs de réseaux),
`ContainersList` (barre latérale des stacks/conteneurs), et une **boucle de
polling** (`ContainerKingdom.loop`) qui recharge périodiquement l'état Docker et
ne redessine que s'il a changé (détection par checksum `sha256`).

## Le moteur en bref

Le cœur est **`Element`** : un nœud de graphe de scène qui **compose** des
sous-systèmes dédiés plutôt que de tout faire lui-même —

| Sous-système     | Responsabilité                                            |
|------------------|-----------------------------------------------------------|
| `Geometry`       | position/taille locales                                   |
| `SceneGraph`     | parent/enfants, offsets absolus, lookup par nom           |
| `CollisionSystem`| zones collision/trigger, broad+narrow phase, événements   |
| `EventEmitter`   | events locaux qui remontent à l'`Application`              |
| `Renderer`       | nœud DOM, position monde, profondeur (algo du peintre)    |

Au-dessus : `Board` (grille d'`Area`s tuilées, **streamées 7×7** autour du
joueur), `Viewport` (la game loop rAF, le registre de behaviors, le déplacement
du joueur), `Camera` (suit une cible, découplée du personnage), et les
`Renderer/*` spécialisés (area, board, character, sprite).

Les personnages (`Character`) sont des `Element`s animés ; leur IA est déléguée à
des **behaviors** interchangeables (`PatrolBehavior`, `FleeBehavior`,
`CharacterBehavior`) tickés par la game loop.

Détails : **[engine.md](engine.md)**. Détails app : **[container-kingdom.md](container-kingdom.md)**.

## Où vit quoi

```
src/
  index.html                 point d'entrée de l'app (charge bootstrap.js)
  engine/
    index.js                 baril d'exports — LA surface publique du moteur
    map/                     Element + sous-systèmes, Board/Area, Viewport/Camera…
      Elements/              éléments intégrés (maisons, arbres, clôtures, PNJ…)
      Renderer/              renderers spécialisés
    Renderer? (non) ; css/, images/   styles et sprite-sheets du moteur
    demo/                    vitrine autonome du moteur (/engine/demo/)
    debug.js                 flag ?debug=1 → classe body.debug
  container-kingdom/
    js/                      l'app (voir container-kingdom.md)
    css/                     styles de l'app
mock/                        mock de l'API Docker (dev + tests)
test/                        suite Vitest
documentation/               ce dossier
```
