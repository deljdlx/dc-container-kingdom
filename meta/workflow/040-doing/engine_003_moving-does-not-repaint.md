---
id: 2026-08-04_17-15
title: Déplacer un élément ne le repeint pas — le dernier verrou avant les projectiles
type: fix
branch: claude/moving-repaints
created: 2026-08-04 17:15
ready: 2026-08-04 17:17
doing: 2026-08-04 17:18
verify:
done:
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

- [ ] **Le critère qui fait foi** : une entité déplacée par du code se retrouve
      dessinée **à sa nouvelle position** à la frame suivante, sans appel de
      l'hôte — mesuré au navigateur, `top`/`left` avant/après.
- [ ] Un test couvre « bouger un élément puis avancer d'une frame le repositionne ».
- [ ] **Le montage du board ne tourne qu'une fois par frame** (mesure).
- [ ] **Le personnage n'est pas repeint deux fois** — ou le second appel n'écrit
      rien dans le DOM (mesure des écritures, pas du nombre d'appels).
- [ ] **Coût mesuré** : nœuds visités par le parcours et ms/frame, monde immobile
      et joueur en marche, avant/après.
- [ ] La démo montre une entité qui traverse l'écran (preuve visible).
- [ ] `meta/documentation/engine.md` retire l'avertissement ⚠️ du §2.1 ;
      `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
