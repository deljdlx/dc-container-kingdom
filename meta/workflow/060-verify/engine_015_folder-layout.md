---
id: 2026-08-02_20-00
title: Ranger l'arborescence du moteur — map/ éclate, le contenu sort du noyau
type: refactor
branch: claude/folder-layout
created: 2026-08-02 20:00
ready: 2026-08-02 20:01
doing: 2026-08-02 20:03
verify: 2026-08-02 20:17
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

- [x] `src/engine/map/` **n'existe plus** ; l'arborescence cible est en place.
- [x] `git log --follow` **traverse le renommage** sur au moins un fichier
      déplacé de chaque nouveau dossier (le `git mv` a bien été enregistré).
- [x] **`src/engine/index.js` exporte exactement les mêmes noms qu'avant** —
      comparaison des deux listes au journal, pas une affirmation.
- [x] **Aucun changement hors déplacement / import** : `git diff` filtré sur les
      fichiers déplacés ne montre que des lignes d'`import`.
- [x] Les **classes CSS et chemins d'assets sont inchangés** (`grep` sur
      `map-element`, `map-area`, `map-fx-layer` → mêmes occurrences qu'avant).
- [x] `src/container-kingdom/` **n'a pas été modifié** (0 fichier au diff).
- [x] Docs **vivantes** à jour (engine.md, architecture.md, les deux recipes,
      README moteur, les 3 tickets du backlog) ; **`080-done/` intact**.
- [x] `npm run verify` vert **et** les trois hôtes ouverts sans erreur console :
      l'app, `/engine/demo/`, `/engine/catalog/`.

## Suite

_Rempli à la clôture._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-02 20:04] **Empreintes prises avant de bouger quoi que ce soit** : la
  liste des **461 exports** de `index.js` (obtenue par import dynamique en Node)
  et le décompte des occurrences de classes CSS `map-*`. Sans référence prise
  avant, « la surface publique n'a pas bougé » ne serait qu'une affirmation.
- [2026-08-02 20:05] Déplacements en **`git mv`** uniquement : 58 renommages
  détectés par git, dont les sous-arbres `Renderer/ → render/` et
  `Elements/ → content/` d'un seul geste.
- [2026-08-02 20:06] **Les imports réécrits par script**, pas à la main : chaque
  spécificateur relatif est résolu depuis l'**ancien** dossier du fichier, mappé
  vers sa nouvelle cible, puis recalculé depuis le **nouveau**. 101 imports dans
  43 fichiers. Le faire au `sed` aurait cassé les chemins des fichiers qui
  bougent *et* dont la cible bouge.
- [2026-08-02 20:07] **Deux angles morts du script, rattrapés à la main** :
  1. il a réécrit deux `@example` de JSDoc qui montrent un **hôte** important le
     moteur — `'../engine/index.js'` y était correct, `'./index.js'` faux ;
  2. il a **manqué** les annotations de type `import('../map/X.js')`, dont la
     forme n'a pas d'espace après `import`. Cinq occurrences dans `fx/` et
     `tools/`, corrigées.
  Les deux ne se voyaient ni au build ni aux tests — seulement à la relecture.
- [2026-08-02 20:12] **`080-done/` volontairement laissé intact.** Sur 80
  citations de `engine/map` dans le dépôt, la majorité sont dans des tickets
  archivés : les réécrire falsifierait ce qui était vrai à leur date. Même
  raisonnement que « `080-done` n'est pas renommé » dans `meta/README.md`.
- [2026-08-02 20:13] Deux corrections de doc au passage, dans le périmètre :
  `architecture.md` listait encore une ligne morte (`Renderer? (non)`) et ne
  mentionnait ni `events/` ni `fx/` ; `engine.md` gagne une section **§0 « où
  vivent les choses »**.

### Vérification

- [2026-08-02 20:10] `npm run verify` **vert** : 54 fichiers, **468 tests** —
  strictement le même compte qu'avant le refactor, ce qui est le résultat
  attendu d'un déplacement.
- [2026-08-02 20:08] **Surface publique identique** : `diff` des deux listes
  d'exports → **aucune différence**, 461 noms de part et d'autre.
- [2026-08-02 20:08] **Classes CSS identiques** : `diff` des décomptes `map-*`
  → aucune différence (21 `map-element`, 3 `map-area`, 3 `map-fx-layer`…).
  Le préfixe `map-` du DOM n'a pas suivi le dossier, comme spécifié.
- [2026-08-02 20:08] **`src/container-kingdom/` : 0 fichier au diff.** C'est la
  frontière moteur qui rend l'opération contenue.
- [2026-08-02 20:09] **Le diff des fichiers déplacés ne contient que des
  imports** — une seule ligne hors import dans tout `src/`, un chemin cité en
  commentaire (`map/Elements/Flowers` → `content/Flowers`), volontaire.
- [2026-08-02 20:09] **`git log --follow` traverse le renommage** pour un fichier
  de chaque nouveau dossier (`scene/Element`, `world/Board`, `view/Viewport`,
  `character/Character`, `render/Renderer`, `content/Tree00`, `Application`) :
  tous remontent au commit initial `e173ca9`. Le blame est préservé.
- [2026-08-02 20:15] **Les trois hôtes ouverts**, aucun avec d'erreur console :
  - `/engine/demo/?debug=1` — 49 areas, 305 éléments, 2 canvas FX, console
    d'events montée, 0 image cassée ;
  - `/engine/catalog/` — 533 sprites rendus, 0 image cassée ;
  - l'app — 49 areas, 538 éléments, 219 conteneurs, 0 image cassée.
  C'était le vrai risque : Vite résout à la demande, un chemin mort dans une
  branche rarement prise ne se voit pas au build.
- [2026-08-02 20:16] Aucune référence à `engine/map` ne subsiste hors archive.

### Validation

-
