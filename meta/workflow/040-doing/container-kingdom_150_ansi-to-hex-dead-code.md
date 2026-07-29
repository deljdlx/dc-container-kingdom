---
id: 2026-07-29_08-41
title: ansiToHex() — du code mort qui fabrique du HTML depuis le texte d'un conteneur
type: chore
branch: copilot/ansi-to-hex-dead-code
created: 2026-07-29 08:41
ready: 2026-07-29 14:40
doing: 2026-07-29 14:40
verify:
done:
---

## Objectif

`LogEntry.ansiToHex(str)` (`src/container-kingdom/js/LogEntry.js:18`, ~60 lignes)
convertit les séquences ANSI en `<span style="…">` **par concaténation de
chaînes**. Vérifié au grep le 2026-07-29 : la méthode n'apparaît qu'à sa propre
définition, elle n'est **appelée nulle part**. Le rendu des couleurs, aujourd'hui,
consiste à **supprimer** les séquences ANSI, pas à les traduire.

Ce n'est pas du code mort ordinaire : il **fabrique du HTML à partir du texte brut
d'un conteneur** — exactement le trou que `2026-07-29_08-26` vient de fermer.
Rebranché un jour par quelqu'un qui veut « remettre les couleurs », il le rouvre
en une ligne, et les tests de `2026-07-29_08-26` ne le verraient pas : ils portent
sur le chemin réellement emprunté.

Coût du non-fait : une amorce de XSS qui attend un contributeur bien intentionné.

## Spécifications

_Amorce — à confirmer / affiner en « specify »._

### Fonctionnel

**Supprimer** la méthode. Le rendu visible ne doit pas bouger : les couleurs ANSI
ne sont pas affichées aujourd'hui, elles ne le seront pas davantage après.

Si l'on veut **vraiment** les couleurs ANSI un jour, c'est une **fonctionnalité**,
pas un nettoyage, et elle mérite son propre ticket — avec la contrainte de
construire des **nœuds** (un `span` par segment, texte en `textContent`), jamais
une chaîne de HTML.

### Technique

- Vérifier une dernière fois l'absence d'appel avant de supprimer (grep sur
  `ansiToHex`, `test/` compris).
- Regarder si la suppression laisse du code désormais mort (table de
  correspondance ANSI, constantes de couleurs utilisées seulement par elle).

### Risques

- Aucun risque fonctionnel connu — c'est la définition du code mort. Le seul
  risque est de se tromper sur « mort » : le grep est la preuve, pas l'intuition.

## Contexte / liens

- `src/container-kingdom/js/LogEntry.js` (méthode `ansiToHex`, l. 18)
- Ticket d'origine (rendu de données non fiables) : `2026-07-29_08-26`
- Moitié infra de la même chaîne : `2026-07-27_17-28`

## Definition of Done

- [ ] `ansiToHex` n'existe plus dans `src/`, et rien ne l'appelait (grep en
      preuve, noté au journal).
- [ ] Le code devenu mort avec elle est supprimé aussi, ou son maintien justifié.
- [ ] Le rendu des logs ne régresse pas — tests existants de `LogEntry` verts.
- [ ] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`)._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
