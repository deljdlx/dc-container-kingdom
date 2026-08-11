---
id: 2026-08-11_08-55
title: Un quatrième hôte, qui est un jeu et pas une vitrine
type: feat
branch:
created: 2026-08-11 08:55
ready:
doing:
verify:
done:
---

## Objectif

Le moteur a trois hôtes, et **aucun n'est un jeu** :

- **Container Kingdom** — une visualisation, dont l'animation vient de Docker ;
- **`/engine/demo/`** — un **banc de conformité**. Chaque ticket clos y a laissé
  son démonstrateur : le rocher qui dérive prouve que bouger repeint, le puits
  qu'une entité survit au streaming, `p`/`s` que l'horloge tient. Précieux, et
  précisément pas un jeu ;
- **`/engine/catalog/`** — une planche de sprites.

Le but du moteur est pourtant de **faire des jeux**. Sans un hôte qui en soit un,
rien ne dit ce qui manque : un banc câblé par quelqu'un qui connaît tous les
internes **flatte** le moteur. Un hôte neuf, écrit comme un hôte, est le seul
test sévère.

C'est aussi ce qui évite d'écrire le combat deux fois : la tranche de combat
(`2026-08-08_17-58`) doit tourner **ici**, pas dans la démo.

## Spécifications

_À confirmer en « specify »._

### Ce que c'est

Un jeu **minuscule et fini** : un écran, des choses qui vous poursuivent, de quoi
tirer, un compteur, une fin. Pas un bac à sable — il doit pouvoir se **perdre**,
sinon rien ne force à écrire l'état, les écrans et le rejeu.

### Où il vit

`src/arena/`, frère de `src/container-kingdom/`, avec sa propre entrée dans
`vite.config.js` — comme la démo et le catalogue. La racine `src/index.html` est
occupée par Container Kingdom : ce ticket **ne touche pas** à ce problème
(consigné dans `200-ideas/git-kingdom_second-engine-consumer.md`).

**Il n'importe que `src/engine/index.js`.** C'est la règle de frontière, et c'est
ici qu'elle cesse d'être une affirmation pour devenir une preuve : un second
consommateur non-Docker est ce qui la démontre.

### Ce qu'on en attend, plus que le jeu lui-même

**Le journal des manques.** À chaque fois que l'hôte oblige à ouvrir un fichier du
moteur, noter quoi et pourquoi. Ce journal devient des candidats en
`100-follow-up/`. Les manques déjà pressentis — audio (zéro ligne), écrans et
pause de partie, entrées autres que directionnelles, monde en données — se
confirmeront ou non par l'usage plutôt que par la spéculation.

### Le dépôt séparé : plus tard, et pas trop tôt

Le but est bien de l'isoler un jour pour garder Container Kingdom propre. Mais
tant que le moteur bouge plusieurs fois par jour, une frontière de package coûte
un cycle de publication à chaque changement. Le signal de départ : quand l'API du
moteur cesse de bouger toutes les semaines.

En attendant : **concevoir comme si c'était déjà séparé**. Aucune dépendance
croisée, aucun asset partagé avec Container Kingdom, aucune configuration
commune autre que vite. La sortie doit rester un déplacement de dossier.

## Firewalls / risques

1. **Ne pas faire une seconde démo.** Si l'arène devient une vitrine de features,
   elle perd sa raison d'être. Le critère : on peut y perdre.
2. **Ne pas amender le moteur en douce.** Tout ajout au moteur passe par un
   ticket ; l'hôte, lui, se débrouille avec l'API publique ou **note le manque**.
3. **Ne pas hériter du décor de Container Kingdom.** Le contenu intégré
   (`src/engine/content/`) est au moteur, donc utilisable ; le royaume, non.
4. **Le nom.** `arena` est une proposition, pas une décision — le renommer plus
   tard ne coûte qu'un `git mv` (l'`id` du ticket, lui, ne bouge pas).

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-11**, `080-done` compris.
- Origine : demande du 2026-08-11.
- L'analyse déjà faite sur un second consommateur :
  `200-ideas/git-kingdom_second-engine-consumer.md` (emplacement, pas de package
  npm, obstacle de `src/index.html`).
- `vite.config.js` — `htmlEntries`, où s'ajoute l'entrée.
- `meta/agents/engine-boundary.md` — la règle que cet hôte doit prouver.
- Consommateur / suite immédiate : `2026-08-08_17-58` (tranche de combat).

## Definition of Done

- [ ] `src/arena/` tourne sur `npm run dev`, avec sa propre entrée vite, et se
      **joue** : on peut y perdre.
- [ ] **Zéro import** hors `src/engine/index.js` — vérifiable par grep, cité au
      journal.
- [ ] Aucune dépendance vers `src/container-kingdom/`, dans les deux sens.
- [ ] Le **journal des manques** est déposé en candidats `100-follow-up/`.
- [ ] `npm run verify` vert ; les **quatre** hôtes sans erreur console.

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
