---
id: 2026-07-24_21-53
title: Bulle de dialogue — DOM paresseux
type: refactor
branch: refactor/lazy-speech-bubble
created: 2026-07-24 21:53
ready: 2026-07-25 13:40
doing: 2026-07-25 13:42
verify: 2026-07-25 13:57
done: 2026-07-25 14:00
merge: 388e247
---

## Objectif

Créer la div `.quickReaction` au **premier** `showReaction()` plutôt qu'eager dans
le constructeur de `CharacterRenderer` — inutile pour les persos qui ne parlent
jamais. Petite optimisation d'hygiène, comportement inchangé.

## Contexte / liens

- `src/engine/map/Renderer/CharacterRenderer.js`
  (`_domQuickReaction`, `showReaction` / `clearReaction` / `isReactionVisible`)
- Tests bulle : `test/Character.test.js`

## Spécifications

- Accesseur privé `_ensureQuickReaction()` : crée + `append` le nœud au premier
  appel, le retourne ensuite ; seul `showReaction()` l'emprunte.
- `clearReaction()` : sortie anticipée tant que le nœud n'existe pas.
- `isReactionVisible()` : `false` tant que le nœud n'existe pas.
- Points de vigilance (risques de changement de comportement observable) :
  - **ordre DOM** — `Renderer.addShadow()` fait un `prepend`, la bulle doit rester
    le dernier enfant comme aujourd'hui (empilement des absolus) ;
  - **CSS** — `src/engine/css/character.css` ne doit cibler `.quickReaction` que
    par classe, sans sélecteur positionnel (`:nth-child`, `+`, `~`).
- Filet : ne pas toucher aux assertions existantes ; ajouter un test de
  caractérisation sur l'absence du nœud avant la première prise de parole.

## Definition of Done

- [x] `_domQuickReaction` créé à la demande (au 1er `showReaction`) ;
      `clearReaction` / `isReactionVisible` gèrent le cas « pas encore créé ».
- [x] Comportement inchangé : les tests bulle passent **sans modifier** d'assertion
      (voir recipe `meta/agents/recipes/refactor-safely.md`).
- [x] Test neuf : pas de `.quickReaction` dans le DOM avant le 1er `showReaction`.
- [x] JSDoc du champ `_domQuickReaction` à jour (création paresseuse).

## Vérification

- [x] `npm run verify` vert
- [x] bulle OK au navigateur (Cain dans la démo —
      `meta/agents/recipes/verify-a-change.md`)

## Journal

### Travail

- [2026-07-25 13:42] Levée des deux risques de comportement observable avant de
  toucher au code : `Renderer.addShadow()` fait un `prepend` (la bulle reste donc
  le dernier enfant, empilement inchangé) et `character.css` ne cible
  `.quickReaction` que par classe (aucun sélecteur positionnel). Aucun
  `querySelector('.quickReaction')` hors du renderer.
- [2026-07-25 13:45] Implémentation : `_ensureQuickReaction()` (idempotent, sur le
  modèle d'`addShadow()`), `showReaction()` passe par lui, `clearReaction()` sort
  tôt si le nœud n'existe pas, `isReactionVisible()` renvoie `false` via
  chaînage optionnel. Aucune assertion existante modifiée ; 3 tests de
  caractérisation ajoutés (absence du nœud avant la 1re prise de parole, réemploi
  du même nœud, bulle en dernier enfant après l'ombre).

### Vérification

- [2026-07-25 13:47] `npm run verify` vert : lint sans erreur, build en 598 ms,
  119 tests / 17 fichiers (Character.test.js passe de 16 à 19).
- [2026-07-25 13:55] Démo navigateur (`/engine/demo/`) : au chargement, 13
  personnages et **0** nœud `.quickReaction` ; après contact avec Cain, 1 nœud
  créé, classe `--enable` posée, texte et positionnement corrects ; après
  l'auto-close (10 s) le nœud est conservé et réemployé, classe retirée. Aucune
  erreur console. Sur l'app (`/`, API Docker mockée) : 35 personnages, 0 nœud
  bulle au chargement — le gain visé.

### Validation

- [2026-07-25 14:00] Revue du diff : frontière moteur respectée (rien de
  Container Kingdom dans `src/engine/`), style du fichier épousé,
  `_ensureQuickReaction()` calqué sur `Renderer.addShadow()` (même contrat
  idempotent). API publique et rendu inchangés → aucune doc à reprendre
  (`documentation/engine.md` ne décrit que `quickReaction()` côté `Character`).
  DoD cochée. Merge `--no-ff` sur `main` : `388e247`.
