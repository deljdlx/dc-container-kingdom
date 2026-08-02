---
id: 2026-08-02_20-00
title: Ranger l'arborescence du moteur — map/ éclate, le contenu sort du noyau
type: refactor
branch:
created: 2026-08-02 20:00
ready:
doing:
verify:
done:
---

## Objectif

`src/engine/map/` porte **19 fichiers à plat** (3 977 lignes) qui ne parlent pas
de carte : l'`Application`, la game loop, la caméra, les entrées clavier, les
personnages, les collisions. **Seuls `Board` et `Area` sont vraiment « la map ».**
Le nom est un fossile de l'époque où le moteur affichait une carte, et il envoie
aujourd'hui chercher la boucle de jeu dans un dossier qui prétend parler de
tuiles.

Le découpage qui compte n'est pas cosmétique : **`map/Elements/` (32 fichiers,
219 fleurs, maisons, arbres, bases de personnages) est du _contenu_, pas du
moteur**. Un jeu de tir bâti sur ce moteur importe le noyau et hérite d'un
village. C'est la fracture **noyau / contenu**, et c'est elle qui sert l'objectif
« mini moteur pour créer des jeux ».

**Le faire maintenant plutôt qu'après** : la feuille de route ajoute une couche
d'entités dynamiques puis des projectiles. Les poser dans un `map/` à 19 fichiers
le ferait passer à 25, et le renommage coûterait plus cher avec plus de code. Le
board est vide, rien n'est en vol.

## Spécifications

### L'arborescence cible

`map/` **disparaît** ; son contenu se répartit à la racine du moteur.

```
src/engine/
  index.js  assets.js  debug.js  Application.js   ← le point d'entrée, avec le baril
  scene/        Element, SceneGraph, CollisionSystem, Geometry, Coordinates,
                BoundingBox, SpriteElement                            (7)
  world/        Board, Area — le tuilage et son streaming             (2)
  view/         Viewport, ViewportTransform, Camera, DirectionalInput (4)
  character/    Character, CharacterAnimator, CharacterBehavior,
                PatrolBehavior, FleeBehavior                          (5)
  render/       ← l'actuel map/Renderer/                              (7)
  content/      ← l'actuel map/Elements/                              (32)
  events/  fx/  catalog/  tools/  demo/  css/  images/     inchangés
```

`scene/` n'invente rien : il écrit dans l'arborescence ce que la doc décrit déjà
— « `Element` compose `SceneGraph`, `CollisionSystem`, `Geometry`,
`EventEmitter`, `Renderer` ».

**Pas un dossier par classe.** `collision/` avec un seul fichier serait pire que
la liste plate. Cinq dossiers qui portent chacun une responsabilité, pas huit qui
portent une symétrie.

### La règle dure

> **Uniquement des `git mv` et des réécritures de chemins d'import.**
> Zéro changement de logique, zéro renommage de classe, zéro renommage de
> fichier, zéro test modifié autrement que son `import`.

C'est ce qui rend le diff relisable : sous cette règle, **`npm run verify` vert
_est_ la preuve**, et tout ce qui n'est pas un déplacement devient suspect à la
relecture. Toute envie d'amélioration croisée en chemin se **dépose** en suite,
elle ne se traite pas ici.

### Ce qui ne bouge surtout pas

- **Les noms de classes CSS** (`map-element`, `map-area`, `map-fx-layer`,
  `map-element__shadow`…) et les chemins d'assets. Ils portent le préfixe `map-`
  et donneront envie de suivre le mouvement : **non**. C'est du DOM public, du
  CSS et des sélecteurs de test, hors périmètre.
- **La surface publique** : `src/engine/index.js` exporte exactement les mêmes
  noms, dans le même ordre de sections. Un hôte ne voit **rien**.
- **Les imports circulaires existants** (`Application` ↔ `Viewport`,
  `Element` → `Application`) : déplacer ne les crée ni ne les résout. Ne pas
  essayer de les démêler ici.

### Le périmètre documentaire, et sa limite

Mesuré le 2026-08-02 : **80 citations** de `engine/map` dans le dépôt, dont la
grande majorité dans des tickets **archivés**.

- **À mettre à jour** (docs vivantes) : `meta/documentation/engine.md`,
  `meta/recipes/add-map-element.md`, `meta/recipes/add-npc-behavior.md`,
  `src/engine/README.md`, et les trois tickets encore en backlog
  (`engine_120`, `engine_220`, `engine_410`) — plus les schémas **mermaid** de
  `meta/documentation/architecture.md` s'ils citent des chemins.
- **À ne PAS toucher** : `meta/workflow/080-done/`. Une archive décrit ce qui
  était vrai à sa date ; la réécrire falsifierait l'historique. Même raison que
  « `080-done` n'est pas renommé » dans `meta/README.md`.

### Ce que ça coûte, mesuré

- **50 lignes d'import** internes au moteur à réécrire.
- **5 fichiers de test** important des chemins internes (`BoundingBox`,
  `Geometry`, l'atlas des fleurs). Normal pour des tests, et corrigé en 5 lignes.
- **0 fichier applicatif** : `src/container-kingdom/` n'importe **rien** d'interne
  au moteur — vérifié, tout passe par `index.js`. La frontière tient, c'est ce qui
  rend ce déplacement contenu.

## Firewalls / risques

1. **Le `git mv` doit rester un `git mv`.** Déplacer en copiant-supprimant perd
   le suivi de renommage : `git log --follow` et le blame ne traverseraient plus.
   À vérifier après coup (`git log --follow` sur un fichier déplacé).
2. **La dérive « tant qu'on y est »** est le risque principal d'un refactor de
   rangement : renommer une classe, corriger une coquille, extraire une méthode.
   Chacune est défendable, toutes ensemble rendent le diff impossible à relire.
   La règle dure est là pour ça.
3. **Les imports oubliés ne se voient pas tous au build** : Vite résout à la
   demande, un chemin mort dans une branche rarement prise peut passer. `lint` +
   `build` + `test` doivent tous passer, et la **démo comme le catalogue** doivent
   être ouverts (ce sont les deux hôtes qui exercent le plus d'imports).
4. **`Application.js` remonte à la racine** : c'est le seul fichier qui change de
   niveau plutôt que de dossier. Vérifier ses chemins relatifs (`./` devient
   `./view/`, `../` devient `./`).
5. **Ne pas confondre `content/` et une extraction en package.** On range dans le
   même dépôt ; publier le moteur séparément est un autre sujet, et il n'est pas
   ouvert.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-02**, `080-done` compris.
- L'arborescence : `src/engine/map/` (19 fichiers), `map/Elements/` (32),
  `map/Renderer/` (7).
- La frontière qui rend l'opération sûre : `meta/agents/engine-boundary.md`
  (import du moteur **uniquement** via `src/engine/index.js`).
- La méthode : `meta/agents/recipes/refactor-safely.md`.
- Origine : discussion du 2026-08-02 sur l'ordre des chantiers — assainir la base
  avant la couche d'entités dynamiques. Le bus d'events (`2026-08-02_19-30`) a
  déjà sorti `EventEmitter` de `map/` vers `events/` ; ce ticket termine le geste.

## Definition of Done

- [ ] `src/engine/map/` **n'existe plus** ; l'arborescence cible est en place.
- [ ] `git log --follow` **traverse le renommage** sur au moins un fichier
      déplacé de chaque nouveau dossier (le `git mv` a bien été enregistré).
- [ ] **`src/engine/index.js` exporte exactement les mêmes noms qu'avant** —
      comparaison des deux listes au journal, pas une affirmation.
- [ ] **Aucun changement hors déplacement / import** : `git diff` filtré sur les
      fichiers déplacés ne montre que des lignes d'`import`.
- [ ] Les **classes CSS et chemins d'assets sont inchangés** (`grep` sur
      `map-element`, `map-area`, `map-fx-layer` → mêmes occurrences qu'avant).
- [ ] `src/container-kingdom/` **n'a pas été modifié** (0 fichier au diff).
- [ ] Docs **vivantes** à jour (engine.md, architecture.md, les deux recipes,
      README moteur, les 3 tickets du backlog) ; **`080-done/` intact**.
- [ ] `npm run verify` vert **et** les trois hôtes ouverts sans erreur console :
      l'app, `/engine/demo/`, `/engine/catalog/`.

## Suite

_Rempli à la clôture._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

-

### Vérification

-

### Validation

-
