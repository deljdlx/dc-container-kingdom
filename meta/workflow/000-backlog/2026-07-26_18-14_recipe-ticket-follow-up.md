---
id: 2026-07-26_18-14
title: Recipe follow-up — clore chaque ticket par une vision de la suite
type: docs
branch:
created: 2026-07-26 18:14
ready:
doing:
verify:
done:
---

## Objectif

Un ticket qui se termine emporte avec lui tout ce que son auteur a compris en
chemin : ce qui reste à faire, ce qu'on a volontairement laissé de côté, la piste
entrevue, la dette assumée, la limite de la vérification. **Rien dans le ticket
ne regarde vers l'avant** — l'`Objectif` dit l'intention de départ, la `DoD` est
le contrat, le `Journal` raconte le passé. Résultat : le prochain qui ouvre le
sujet repart à zéro.

On veut qu'**à la clôture, chaque ticket réponde à « et ensuite ? »** — dans une
rubrique dédiée, courte, y compris quand la réponse est « rien ».

Créer un ticket de suite est **une** des issues possibles, pas le but : une piste
qui ne mérite pas encore de ticket a quand même sa place dans cette rubrique. Le
rattachement entre tickets (savoir qui a engendré quoi) est un **effet de bord
utile**, pas l'objet.

Preuve que le besoin est réel : le ticket `2026-07-26_18-00` s'est terminé sur
« suite identifiée, non traitée ici : les fixtures du mock ont un `Status` figé,
ce qui a rendu ce bug invisible en dev » — écrit **dans le journal de
validation**, faute d'endroit prévu. Le ticket `2026-07-26_00-48` (audit des
grilles) prévoit lui aussi d'ouvrir des tickets à son issue, sans convention pour
les tracer.

## Spécifications

### Fonctionnel

- Toute clôture de ticket (étape *validate*) renseigne la rubrique **Suite** :
  - ce que le ticket **ouvre** (piste, amélioration entrevue, question restée
    sans réponse) ;
  - ce qu'il **laisse volontairement de côté** (périmètre écarté, limite de la
    vérification, dette acceptée) ;
  - les **tickets créés** à cette occasion, s'il y en a.
- La rubrique est **obligatoire mais courte** : une ligne suffit dans le cas
  courant, et `aucune` est une réponse valable — elle dit « on y a réfléchi »,
  pas « on a oublié ».
- Une piste qui mérite d'être exécutée devient un ticket
  ([ticket-create](../../agents/recipes/workflow/ticket-create.md)) ; une piste qui n'est
  pas mûre reste **dans la rubrique**, consultable par le prochain qui touche au
  sujet — sans polluer le backlog.
- Garde-fou : une suite se **dépose**, elle ne se traite pas dans la foulée du
  ticket courant (règle « ne pas dériver » de
  [ticket-work](../../agents/recipes/workflow/ticket-work.md)).

### Technique

- Nouvelle recipe `meta/agents/recipes/workflow/ticket-follow-up.md` : courte,
  orientée étapes, **agnostique au projet**, dans la lignée des recipes d'étape.
- `meta/workflow/TEMPLATE.md` : ajouter la rubrique `## Suite` (nom à confirmer)
  **après la DoD**, avec une ligne d'explication et le cas `aucune`.
- **Rattachement, version légère** : quand un ticket naît d'un autre, le mentionner
  par son **`id`** — dans la rubrique `Suite` côté origine, et dans
  `Contexte / liens` côté suite. Pas de champ de frontmatter, pas de graphe à
  maintenir : la traçabilité est un bénéfice, pas une mécanique. Référencer par
  `id` (`2026-07-26_14-19`) et **jamais** par chemin de colonne, qui change à
  chaque transition.
- **Bookkeeping** : les tickets de suite se créent **sur `main`, depuis le tree
  principal**, jamais depuis la branche du ticket en cours — sinon ils n'arrivent
  sur le board qu'au merge.
- Cohérence documentaire (la doc obsolète est un bug) :
  - [work-a-task](../../agents/recipes/workflow/work-a-task.md) — la question de la suite
    fait partie de la clôture ;
  - [ticket-validate](../../agents/recipes/workflow/ticket-validate.md) — étape qui la
    déclenche ; [ticket-work](../../agents/recipes/workflow/ticket-work.md) — renvoi pour
    la piste qui émerge en cours de route ;
  - index : `meta/agents/recipes/README.md`, `meta/README.md` ;
  - les trois points d'entrée (`CLAUDE.md`, `AGENTS.md`,
    `.github/copilot-instructions.md`) ne bougent **que si** la règle agent change.
- Terminer par la recipe
  [audit-workflow-consistency](../../agents/recipes/audit-workflow-consistency.md) :
  c'est son cas d'usage exact (évolution du workflow).

### Risques / questions ouvertes

- **Nommage** à confirmer en *specify* : `## Suite` (recommandé — c'est la
  question « et ensuite ? ») vs `## Suites` / `## Follow-up`. Garder le mot
  « follow-up » dans la ligne d'explication pour qu'il reste cherchable.
- **Risque de cérémonie** : si la rubrique devient un formulaire, elle sera
  remplie mécaniquement et ne vaudra rien. La recipe doit assumer la brièveté et
  donner deux ou trois exemples **réels** plutôt qu'un gabarit à trous.
- **Frontière avec le Journal** : le journal raconte ce qui s'est passé, la
  rubrique regarde l'avant. Le dire explicitement, sinon les deux se dupliquent.
- **Ne pas rétro-remplir** tout `080-done` : se limiter au couple démonstratif.

## Contexte / liens

- `meta/workflow/TEMPLATE.md` (structure d'un ticket)
- `meta/agents/recipes/workflow/` (les 5 recipes d'étape + l'overview)
- `meta/agents/recipes/README.md`, `meta/README.md` (index à tenir à jour)
- Cas réels : `2026-07-26_18-00` (suite enterrée dans le journal),
  `2026-07-26_00-48` (audit qui doit engendrer des tickets)

## Definition of Done

- [ ] `meta/agents/recipes/workflow/ticket-follow-up.md` créé : court, orienté
      étapes, agnostique au projet, avec des exemples réels plutôt qu'un gabarit.
- [ ] `TEMPLATE.md` porte la rubrique de suite, avec sa ligne d'explication, le
      cas `aucune` et la distinction explicite d'avec le `Journal`.
- [ ] La règle « référencer par `id`, jamais par chemin de colonne » est écrite.
- [ ] La règle « créer les tickets de suite sur `main`, depuis le tree principal »
      est écrite.
- [ ] `work-a-task`, `ticket-validate` et `ticket-work` renvoient vers la recipe ;
      les index (`meta/agents/recipes/README.md`, `meta/README.md`) sont à jour.
- [ ] Les trois points d'entrée sont vérifiés (mis à jour seulement si nécessaire).
- [ ] Démonstration sur un cas réel : la suite du ticket `2026-07-26_18-00`
      (fixtures du mock au `Status` figé) est remontée du journal vers la rubrique,
      et le ticket correspondant est créé s'il est jugé mûr.
- [ ] Passe `audit-workflow-consistency` faite ; `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
