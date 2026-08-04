---
id: 2026-08-04_17-15
title: Déplacer un élément ne le repeint pas — le dernier verrou avant les projectiles
type: fix
branch: claude/moving-repaints
created: 2026-08-04 17:15
ready: 2026-08-04 17:17
doing: 2026-08-04 17:18
verify: 2026-08-04 18:22
done: 2026-08-04 18:23 (merge bbff374)
---

## Objectif

`Renderer.update()` est **vide** sur l'élément de base. Le positionnement
(`left`, `top`, `zIndex`) vit dans `render()`. Mesuré au navigateur :

| geste | nœud DOM |
|---|---|
| `e.y(900)` (l'élément était à 400) | `top: 400px` — inchangé |
| `e.y(900)` + `needUpdate(true)` + une frame | `top: 400px` — **toujours** |
| `e.render()` | `top: 900px` |

Un `Character` s'en sort parce qu'il se repeint **lui-même**
(`CharacterRenderer.update()` = frame de sprite + `super.render()`). Un `Element`
nu, non.

Conséquence : **une entité qui bouge est invisible là où elle est**. Un projectile
traverserait la carte sans jamais quitter son pixel de départ à l'écran. C'est le
dernier obstacle mécanique avant l'étape 5, et il rend le pipeline de redessin à
moitié menteur : le parcours vient jusqu'au nœud sale et n'en fait rien.

## Spécifications

### Deux moitiés, et il faut les deux

1. **`Renderer.update()` repeint.** `render()` est déjà exactement « synchroniser
   taille, position et profondeur », idempotent et gardé par `_lastLeft` /
   `_lastTop` / `_lastZ` — il n'écrit que ce qui a changé. `update()` doit donc
   l'appeler. C'est déjà ce que fait `CharacterRenderer` ; on généralise.
2. **Bouger doit salir.** `Element.x()` / `y()` ne lèvent pas le drapeau de
   redessin, donc le parcours par frame ne descend jamais jusqu'à l'élément
   déplacé. Écrire une coordonnée doit marquer le nœud.

Sans (2), (1) ne sert à rien ; sans (1), (2) ne fait que promener le parcours.

### Le piège du board

`BoardRenderer.update()` appelle déjà `mountPending()`. Si `update()` se met à
appeler `render()` — qui appelle **aussi** `mountPending()` — le montage tourne
deux fois par frame. La surcharge devient inutile et doit disparaître plutôt que
d'empiler les appels.

## Firewalls / risques

1. **Le coût du parcours.** Marquer à chaque déplacement salit le chemin jusqu'à
   la racine, et le board sale visite **tous** ses enfants. Le joueur bouge à
   chaque frame : à mesurer avant/après, c'est le vrai risque.
2. **Double repaint** : `Character.update()` repeint déjà lui-même. Les gardes
   `_last*` doivent absorber le second appel sans écriture DOM — à vérifier, pas
   à supposer.
3. **`SpriteRenderer.render()` réécrit le fond** à chaque appel, sans garde.
   Devenu appelable par frame, ça mérite une mesure.
4. **Ne pas confondre avec l'animation** : ce ticket rend une entité *visible où
   elle est*, il ne touche pas à la cadence d'animation (déjà traitée par
   `2026-07-27_17-23`).

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-04**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-03_16-30`, trié le 2026-08-04.
- `src/engine/render/Renderer.js` — `update()` (vide) et `render()` (le vrai geste).
- `src/engine/render/CharacterRenderer.js` — le patron déjà en place.
- `src/engine/render/BoardRenderer.js` — la surcharge à retirer.
- `src/engine/scene/Element.js` — `x()`, `y()`, `needUpdate()`, `update()`.

## Definition of Done

- [x] **Le critère qui fait foi** : une entité déplacée par du code se retrouve
      dessinée **à sa nouvelle position** à la frame suivante, sans appel de
      l'hôte — mesuré au navigateur, `top`/`left` avant/après.
- [x] Un test couvre « bouger un élément puis avancer d'une frame le repositionne ».
- [x] **Le montage du board ne tourne qu'une fois par frame** (mesure).
- [x] **Le personnage n'est pas repeint deux fois** — ou le second appel n'écrit
      rien dans le DOM (mesure des écritures, pas du nombre d'appels).
- [x] **Coût mesuré** : nœuds visités par le parcours et ms/frame, monde immobile
      et joueur en marche, avant/après.
- [x] La démo montre une entité qui traverse l'écran (preuve visible).
- [x] `meta/documentation/engine.md` retire l'avertissement ⚠️ du §2.1 ;
      `npm run verify` vert.

## Suite

- **Ce que ça ouvre** — le dernier obstacle mécanique avant les **projectiles**
  tombe : une entité qui bouge est dessinée là où elle est. Le pipeline de
  redessin est enfin complet — un nœud sale est visité **et** repeint. La démo le
  montre avec un rocher qui dérive d'un bout à l'autre du village.
- **Ce qu'on laisse de côté** :
  - **le balayage de montage est devenu le poste principal** : `mountPending()`
    parcourt toutes les areas et leurs enfants à la recherche de ce qui n'est pas
    encore rendu, et il tourne une fois par frame de marche (le joueur salit la
    racine à chaque pas). Une liste de nœuds en attente coûterait O(1) au lieu de
    O(areas × enfants) — **candidat déposé** ;
  - **`SpriteRenderer.render()` réécrit `backgroundImage` et
    `backgroundPosition` sans garde** : devenu appelable par frame, il écrit deux
    propriétés à chaque repaint d'un sprite sale. Pas mesuré comme un problème
    (3,5 écritures DOM par frame au total), noté ;
  - **le déplacement mort d'`Element.update()`** (`_targetX`/`_targetY`) reste au
    ticket `2026-07-26_14-25` ;
  - **mesuré sur la démo seulement** : Container Kingdom n'a pas d'entité mobile.
- **Déposé en `100-follow-up/`** — un candidat :
  `2026-08-04_18-23_mount-sweep-is-o-areas-per-frame`.

## Journal

### Travail

- [2026-08-04 17:20] **Le test d'abord** : cinq cas, quatre rouges. Le cinquième —
  « n'écrit rien quand la position n'a pas changé » — vert dès le départ, ce qui
  garantit qu'on ne « corrige » pas en écrivant tout à chaque frame.
- [2026-08-04 17:22] **Les deux moitiés.** `Renderer.update()` appelle `render()`
  (qui *est* la synchronisation position/taille/profondeur, gardée par `_last*`),
  et `Element.x()`/`y()` lèvent le drapeau de redessin. Sans la seconde, la
  première ne sert à rien : le parcours élagué ne descend jamais jusqu'au nœud
  déplacé.
- [2026-08-04 17:23] **La surcharge du board retirée** : `BoardRenderer.update()`
  appelait `mountPending()`, et `render()` l'appelle déjà — la garder aurait fait
  tourner le balayage de montage deux fois par frame.
- [2026-08-04 18:05] **La mesure a imposé un troisième geste.** Le premier jet
  triplait le coût : **55 nœuds visités par frame** en marche (contre 2,5 avant),
  parce que le board sale visitait *tous* ses enfants. La descente ne visite plus
  que les enfants marqués — correct, puisque lever le drapeau marque tout le
  chemin jusqu'à la racine.
- [2026-08-04 17:45] **Un faux positif du board doctor** rencontré en chemin : le
  titre du ticket voisin que je venais de déposer contenait deux fois le mot
  « board », ce que le garde-fou des doublons lit comme un signal. `main` en était
  rouge ; corrigé là-bas d'abord (`1b55774`), puis rattrapé ici.

### Vérification

- [2026-08-04 18:21] `npm run verify` **vert** : **61 fichiers, 513 tests** (+5).
- [2026-08-04 18:15] **Critère qui fait foi** : le bloc rocheux de la démo,
  déplacé par un behavior, avance de **200 px à 320 px** en 120 frames — et le
  DOM suit **exactement** (`left: 200px` → `320px`, égal au modèle). Avant le
  correctif, le nœud restait à `200px`.
- [2026-08-04 18:10] **Le coût, avant / après le filtrage de la descente** :

  | | nœuds visités / frame | montages / frame | écritures DOM / frame | ms / frame |
  |---|---|---|---|---|
  | premier jet, immobile | 22,8 | 0,38 | 3,5 | 0,315 |
  | premier jet, en marche | 55,3 | 1,00 | 3,5 | 0,457 |
  | **retenu, immobile** | **1,4** | 0,38 | 3,5 | **0,168** |
  | **retenu, en marche** | **2,4** | **1,00** | 3,5 | **0,336** |

  Le montage tourne bien **une seule fois** par frame (critère de la DoD), et les
  gardes `_last*` absorbent le reste : 2,4 nœuds visités pour **3,5 écritures
  DOM**, soit la position et la profondeur du joueur, rien de plus.
- [2026-08-04 18:20] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 539 éléments, 219 conteneurs) et le catalogue (535 sprites).
- [2026-08-04 18:12] Sonde `window.__vp` retirée (0 résidu).

### Validation

- [2026-08-04 18:23] Review : deux lignes de correctif, une surcharge retirée, et
  un filtre de descente que **la mesure a imposé** — pas l'intuition. C'est ce
  troisième geste qui fait la différence entre « ça marche » et « ça marche sans
  tripler le coût ».
- [2026-08-04 18:23] Merge `--no-ff` sur `main` depuis le tree principal :
  **bbff374** — `merge: déplacer un élément le repeint`
  (7 fichiers, +201 / −29).
