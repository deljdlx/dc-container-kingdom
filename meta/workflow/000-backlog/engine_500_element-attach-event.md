---
id: 2026-08-03_09-24
title: Un event d'attache, pour que lier un effet cesse d'être manuel
type: feat
branch:
created: 2026-08-03 09:24
ready:
doing:
verify:
done:
---

## Objectif

Le cycle de vie d'un élément est **asymétrique** : sa **mort** s'annonce
(`element.destroy`, ticket `2026-08-02_19-30`) et le `FxBinder` s'y abonne pour
lâcher ses emitters ; sa **naissance** ne s'annonce pas, et la liaison des effets
reste explicite, à la charge de l'hôte (`FxBinder.bind`, idempotent).

La raison historiquement invoquée dans le docblock du binder — « émettre un event
d'attache **jetterait** pour les éléments que le catalogue construit avant de les
attacher » — **a disparu** : `Element.handle()` est silencieux sans application
depuis le même ticket.

Ce candidat avait été fusionné dans `2026-08-02_20-45` comme piste possible pour
faire apparaître un élément attaché. Le parcours de redessin élagué a réglé le
rendu **sans** nouvel event ; le besoin du binder, lui, est resté entier — d'où
ce ticket, comme le ticket d'origine le prévoyait.

## Spécifications

_À confirmer en « specify »._

- **`element.attach`**, émis quand un élément rejoint un arbre (`SceneGraph.addChild`),
  avec l'enveloppe habituelle (`type`, `source`, `at`) et le parent en payload.
- Le `FxBinder` s'y abonne et lie le sous-arbre entrant — symétrique de ce qu'il
  fait déjà sur `element.destroy`.
- **Le piège à mesurer** : `bind()` parcourt un sous-arbre. Émettre à chaque
  attache signifie un parcours par attache — au chargement d'une area, c'est une
  attache par élément. Vérifier que le coût du streaming ne double pas.

## Firewalls / risques

1. **Le catalogue attache 533 sprites** au chargement de sa page : l'event ne doit
   pas y coûter un parcours par sprite (il n'y a pas de binder, mais l'émission
   elle-même passe par le bus global).
2. **Idempotence** : `bind()` saute déjà un élément lié. L'event ne doit pas
   contourner cette garde.
3. **Ne pas rendre `bind()` obsolète sans le dire** : s'il devient automatique,
   la méthode publique reste-t-elle ? La doc doit trancher.

## Contexte / liens

- Origine : candidat déposé à la clôture de `2026-08-02_20-45`, trié le 2026-08-03.
- `src/engine/fx/FxBinder.js` — docblock à corriger, `dispose()`, `unbind()`.
- `src/engine/scene/SceneGraph.js` — `addChild()`, le point d'émission.
- `src/engine/events/EngineEvents.js` — le catalogue à compléter.

## Definition of Done

- [ ] `element.attach` existe, déclaré au catalogue, avec son `@typedef`.
- [ ] Le `FxBinder` lie **sans appel de l'hôte** — une entité déclarant un effet,
      attachée en cours de partie, émet ses particules (démo à l'appui).
- [ ] **Le coût du streaming ne régresse pas** : mesure avant/après au
      franchissement d'une area.
- [ ] Le docblock du `FxBinder` ne mentionne plus une raison qui n'existe pas.
- [ ] `meta/documentation/engine.md` §9 à jour ; `npm run verify` vert.

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
