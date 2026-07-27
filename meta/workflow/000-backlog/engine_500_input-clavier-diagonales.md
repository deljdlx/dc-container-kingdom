---
id: 2026-07-26_14-22
title: Entrées clavier — arrêt fantôme et pas de diagonale
type: fix
branch:
created: 2026-07-26 14:22
ready:
doing:
verify:
done:
---

## Objectif

`Viewport.run()` branche `keydown` → `move(direction)` et `keyup` → `stop()`
**sans regarder quelle touche** est relâchée, et le viewport ne retient qu'**une**
`direction`. Deux défauts sensibles à la manette de clavier :

- **Arrêt fantôme** : flèche droite maintenue, on appuie/relâche n'importe quelle
  autre touche (ou l'autre flèche) → le personnage s'arrête alors qu'une touche de
  direction est toujours enfoncée.
- **Pas de diagonale** : impossible de marcher en biais, ce qui est le minimum
  attendu d'un déplacement RPG en vue de dessus.

## Spécifications

### Fonctionnel

- Suivre l'**ensemble des touches de direction enfoncées** ; le personnage marche
  tant qu'au moins une l'est, dans la résultante des directions.
- Diagonales supportées ; le sprite prend une direction d'animation cohérente
  (priorité à définir en *specify* : dernière touche pressée, ou horizontale).
- Relâcher une touche parmi plusieurs ne stoppe pas le mouvement.
- Une touche non directionnelle n'a aucun effet sur le déplacement.

### Technique

- `Viewport.moving` (0/1) + `Viewport.direction` (string) sont à remplacer par un
  état d'entrée explicite. Extraire un petit sous-système (ex. `InputState` /
  `KeyboardInput`) plutôt que gonfler `Viewport` — cohérent avec le patron de
  composition du moteur (cf. `meta/agents/engine-boundary.md`).
- `moveCharacter(increment)` doit accepter un vecteur (dx, dy) ; normaliser la
  diagonale pour ne pas marcher ~1,41× plus vite en biais.
- Conserver la sémantique de collision : `moveBlocked` + revert. Décider en
  *specify* si un axe bloqué autorise le glissement sur l'autre (comportement
  attendu dans un RPG : oui, « slide along wall »).
- La démo (`src/engine/demo/`) émet des `KeyboardEvent` synthétiques depuis son
  D-pad tactile : vérifier qu'elle continue de fonctionner.

## Contexte / liens

- `src/engine/map/Viewport.js` (`run`, `move`, `stop`, `moveCharacter`, `update`)
- `src/engine/map/Character.js` (`moveBlocked`, `setDirection`)
- `src/engine/demo/demo.js` (D-pad tactile → événements clavier)
- Docs : `meta/documentation/engine.md` (boucle de jeu / entrées)
- Piège rAF pour la vérif : `meta/recipes/verify-in-browser.md`

## Definition of Done

- [ ] Deux flèches maintenues → déplacement diagonal ; relâcher l'une garde le
      mouvement sur l'autre.
- [ ] Vitesse diagonale normalisée (pas de bonus en biais).
- [ ] Une touche non directionnelle ne stoppe plus le personnage.
- [ ] Tests : état d'entrée (appuis/relâchés) et vecteur produit, en pilotant
      `viewport.update(t)` à la main.
- [ ] Démo moteur toujours pilotable (clavier + D-pad), doc à jour,
      `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
