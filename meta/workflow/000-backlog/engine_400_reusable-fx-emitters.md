---
id: 2026-08-02_18-00
title: Isoler les effets en émetteurs réutilisables, dans un dossier fx
type: refactor
branch:
created: 2026-08-02 18:00
ready:
doing:
verify:
done:
---

## Objectif

Le layer de particules est en place (`2026-08-01_21-07`), mais **les deux effets
qui l'utilisent sont écrits à la main dans la démo** : une trentaine de lignes
inline dans `src/engine/demo/demo.js`, avec leur compteur de cadence, leur
descripteur d'émission et leur condition d'émission mélangés au code de mise en
scène. Rien n'est réutilisable : un second projet qui embarque le moteur
recopierait ces lignes.

Le moteur a pourtant déjà le patron : un émetteur, c'est un **behavior**
(`update(dt)` sur l'horloge unique), au même titre que `PatrolBehavior` ou
`FleeBehavior` — pas un timer maison.

Et le rangement ne suit plus : `ParticleSystem` et `ParticleLayer` vivent dans
`src/engine/map/`, alors qu'ils n'ont rien à voir avec la carte. `map/` compte
déjà une trentaine de fichiers.

Coût du non-fait : le prochain effet sera copié-collé depuis la démo, avec sa
propre variante de compteur — et la démo restera le seul endroit où lire comment
on émet.

## Spécifications

_Amorce — à confirmer en « specify »._

### Un dossier `src/engine/fx/`

Il accueille le sous-système complet : `ParticleSystem` et `ParticleLayer` y
**déménagent** depuis `map/`, rejoints par l'émetteur et les effets nommés. Le
baril `src/engine/index.js` réexporte, donc aucun consommateur externe ne bouge.

### `Emitter` — un behavior, pas un timer

- `update(dt)` : accumule le temps et émet à la **cadence** demandée. Sur
  l'horloge unique du moteur, donc il gèle et repart avec le jeu.
- **Cible** : soit un **point fixe** (la fontaine), soit un **élément qui bouge**
  (la poussière suit le joueur). C'est ce couple qui rend l'émetteur réutilisable
  ; l'élément est duck-typé (`offsetX()`/`offsetY()`), pas une classe imposée.
- `start()` / `stop()`, et un `shouldEmit()` que les effets surchargent — c'est
  ainsi que la poussière n'apparaît qu'en marche, sans condition câblée dans la
  base.

### Les effets nommés, déclaratifs

`FountainSpray` et `FootstepDust` portent leur descripteur en **statique**, sur le
modèle du `static descriptor` des `SpriteElement` : la donnée d'un côté, le
comportement de l'autre. La démo se contente alors de les instancier et de les
enregistrer.

### Risques

- **Déménager `map/` → `fx/` casse les imports internes** et les chemins cités
  dans la doc. Mécanique, mais à faire d'un bloc, garde-fou du board compris (il
  vérifie les liens markdown).
- **Ne pas figer l'API sur deux exemples.** Deux effets ne font pas une
  bibliothèque : garder le descripteur étroit, quitte à l'élargir au troisième.
- La démo doit rester **la preuve d'usage** : si elle devient plus courte et plus
  lisible, l'extraction a réussi ; si elle devient plus obscure, c'est raté.

## Contexte / liens

- Les effets à extraire : `src/engine/demo/demo.js` (section « Particles »).
- Le socle : `src/engine/map/ParticleLayer.js`, `src/engine/map/ParticleSystem.js`
  (`2026-08-01_21-07`).
- Le patron à suivre : `src/engine/map/PatrolBehavior.js`, `FleeBehavior.js`.
- Doc à mettre à jour : `meta/documentation/engine.md` §3.2 et §11.

## Definition of Done

- [ ] `src/engine/fx/` contient le sous-système ; `map/` n'a plus de fichier de
      particules.
- [ ] `Emitter` tick par `dt`, cadence respectée, et suit **un point comme un
      élément mobile** — les deux cas testés.
- [ ] `FountainSpray` et `FootstepDust` existent, déclaratifs, exportés par le
      baril.
- [ ] La démo n'écrit plus de logique d'émission : elle instancie et enregistre.
- [ ] Tests sans DOM sur la cadence, la cible mobile et `shouldEmit`.
- [ ] Rendu inchangé à l'écran (jet de la fontaine et poussière), vérifié au
      navigateur.
- [ ] `meta/documentation/engine.md` à jour ; liens du board verts.
- [ ] `npm run verify` vert.

## Suite

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
