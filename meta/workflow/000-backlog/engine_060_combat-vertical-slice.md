---
id: 2026-08-08_17-58
title: Une tranche verticale de combat, pour faire écrire le contrat d'état
type: feat
branch:
created: 2026-08-08 17:58
ready:
doing:
verify:
done:
---

## Objectif

Le moteur a des corps, il n'a pas d'**entités**. Rien n'a de points de vie, rien
ne prend de dégâts, rien ne meurt — et surtout, il n'existe **aucun endroit
prévu** pour mettre ça : `element.data = {}` est un sac sans contrat, et le
moteur n'émet rien qui ressemble à « touché », « mort ». Conséquence directe : un
HUD n'a rien à écouter, un effet d'impact n'a rien à quoi s'accrocher, et chaque
jeu réinventera sa propre notion d'entité — précisément ce que le moteur existe
pour éviter.

Ce ticket ne demande pas de concevoir ce contrat dans l'abstrait. Il demande de
**faire la plus petite boucle de combat qui marche** — tirer, voler, toucher,
infliger, mourir, exploser — et de laisser ce besoin réel écrire le contrat. Deux
passes d'audit ont montré qu'une décision prise sans usage se retourne ; celle-ci
sera prise avec l'usage sous les yeux.

C'est aussi le premier vrai test des trois briques précédentes : si l'horloge,
l'ordonnanceur et les couches sont bons, cette tranche s'écrit **côté hôte**,
sans toucher au moteur. Tout ce qu'il faudra ajouter au moteur pour y arriver est
un **résultat du ticket**, pas un échec.

## Spécifications

_À confirmer en « specify »._

- La tranche, **dans l'arène** (`2026-08-11_08-55`) et non dans la démo — amendé
  le 2026-08-11 : le banc de conformité est câblé par quelqu'un qui connaît tous
  les internes, donc il flatte le moteur ; un hôte neuf est le test sévère, et ça
  évite d'écrire le combat deux fois. Le joueur tire un projectile **typé** vers
  une direction ou une cible ; il vole ; il touche un PNJ ; le PNJ perd des points
  de vie et le montre ; à zéro il meurt ; un effet d'impact et une explosion
  jouent.
- **Ce que le moteur doit fournir**, et rien de plus : la façon dont une entité
  porte son état, et les **events** qui disent qu'il a changé (touché, mort). Les
  points de vie, les dégâts, les résistances sont du **jeu** — le moteur fournit
  le support et le signal, pas les règles.
- **Le projectile passe par le canvas**, conformément à la règle DOM/canvas
  (`2026-08-06_17-56`) — c'est le cas d'usage qui la valide ou la met en défaut.
- **Tenir un journal des manques** : à chaque fois que la tranche oblige à
  ouvrir un fichier du moteur, noter quoi et pourquoi. Ce journal devient des
  candidats en `100-follow-up/`.

## Firewalls / risques

1. **Ne pas glisser vers un système de composants (ECS).** La tentation sera
   forte à la première entité qui a trois propriétés. Le moteur est un
   scene-graph à behaviors ; y greffer un ECS est une refonte, pas une tranche.
   Si l'usage le réclame vraiment, c'est un ticket à part, argumenté.
2. **Ne pas faire de Container Kingdom la cible**, ni la démo : la tranche vit
   dans l'arène, qui est là pour ça.
3. **Ne pas cacher des règles de jeu dans le moteur** : « 10 dégâts », « 3 points
   de vie », « meurt à zéro » sont de l'hôte. La frontière se juge à ça.
4. **Le son est hors périmètre**, faute d'exister (aucune ligne d'audio dans le
   moteur) — mais la tranche doit dire **où** il se brancherait.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-08**, `080-done` compris.
- Dépend de : `2026-08-08_17-55` (horloge), `2026-08-08_17-56` (ordonnanceur),
  `2026-08-08_17-57` (couches), `2026-08-06_17-56` (règle DOM/canvas),
  `2026-08-11_08-52` (blueprint et état), `2026-08-11_08-55` (l'arène).
- `src/engine/demo/demo.js` — le projectile canvas, point de départ à recopier
  dans l'arène.
- `src/engine/scene/WorldQuery.js` — `sweep()`, déjà écrit pour ça.
- `src/engine/events/EngineEvents.js` — le catalogue à étendre.
- `meta/documentation/engine.md` §6 et §7.

## Definition of Done

- [ ] La boucle complète tourne **dans l'arène** : tirer → toucher → infliger →
      mourir → effet.
- [ ] Le contrat d'état est **écrit** (JSDoc + `engine.md`) : comment une entité
      porte son état, quels events le moteur émet, ce qui reste au jeu.
- [ ] Les règles de jeu sont **dans l'hôte** — un lecteur peut le vérifier en
      lisant la frontière.
- [ ] Le projectile est dessiné au canvas, et la règle DOM/canvas est confirmée
      ou amendée par écrit.
- [ ] Le journal des manques est déposé en candidats `100-follow-up/`.
- [ ] `npm run verify` vert ; les trois hôtes sans erreur console.

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
