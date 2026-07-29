---
id: 2026-07-29_08-43
title: Un board-doctor qui vérifie mécaniquement les invariants du board
type: feat
branch:
created: 2026-07-29 08:43
ready:
doing:
verify:
done:
---

## Objectif

Les règles du board ne sont vérifiées **par personne**. La CI ne joue que
`npm run verify` (le code) ; les quatre contrôles mécaniques de la recipe
`meta/agents/recipes/audit-workflow-consistency.md` sont des blocs à copier-coller
à la main, donc rejoués quand on y pense — c'est-à-dire pas après une évolution du
board.

Constaté à l'audit du 2026-07-27, tout étant du drift silencieux :

- **9 tickets partagent 3 `id`** (`2026-07-24_21-53`, `2026-07-25_15-19`,
  `2026-07-25_16-48`) alors que l'`id` est présenté comme l'**ancre immuable** par
  laquelle on référence un ticket. Une référence croisée est donc ambiguë.
- **5 tickets clos** ont un frontmatter incomplet (`done:` et/ou `branch:` vides).
- **4 tickets clos après l'introduction de la règle** n'ont pas de rubrique
  `## Suite`, et le plus récent (`2026-07-27_17-33`) l'a **vide** — ce que
  `ticket-follow-up` interdit nommément.
- La colonne `020-ready` manquait dans les points d'entrée sans que rien ne le
  signale (voir le ticket de résorption du drift, `2026-07-29_08-50`).

Un script qui échoue en CI transforme ces règles de prose en invariants. C'est le
seul remède durable : sans lui, chaque évolution du board rouvre les mêmes écarts.

## Spécifications

_Amorce — à confirmer / affiner en « specify »._

### Technique

Un script unique, sans dépendance (python3 ou node, cohérent avec l'outillage du
dépôt), déposé dans `meta/agents/tools/` et câblé en CI à côté de
`npm run verify` (`.github/workflows/quality.yml`). Sortie : une ligne par
contrôle, code retour non nul au premier écart.

### Contrôles (les invariants à vérifier)

| Contrôle | Règle vérifiée |
|---|---|
| **`id` unique** sur tout `meta/workflow/*/*.md` | l'`id` est l'ancre de référence (board README) |
| **Colonnes citées** `meta/workflow/<colonne>/`, jamais `meta/<colonne>/` | contrôle dur de `audit-workflow-consistency` |
| **Liens markdown relatifs** résolvent | contrôle 1 de la même recipe |
| **`@imports` de `CLAUDE.md`** existent | contrôle 3 |
| **Frontmatter par colonne** : `id`/`title`/`type`/`created` partout ; `ready:` en `020-ready` ; `branch:`+`doing:` dès `040-doing` ; `verify:` en `060-verify` ; `done:` en `080-done` | TEMPLATE ↔ recipes d'étape |
| **`## Suite` non vide** en `080-done` | `ticket-follow-up` (« une rubrique vide n'en est pas une ») |
| **Nom de fichier** `projet_priorité_titre.md` dans les colonnes actives (`000` → `060`), en ASCII/kebab-case anglais | board README ; `080-done` **exclu** (archive non renommée) |
| **Timeline monotone** : `created ≤ ready ≤ doing ≤ verify ≤ done` | règles transverses de `work-a-task` |

### Risques / points à trancher

- **Les violations existantes font échouer le script dès le jour 1.** La
  réparation doit donc être **dans le même changement** que le script — sinon la CI
  est rouge à la livraison. C'est du travail de ce ticket, pas d'un suivant.
- **Le format d'`id` doit être tranché** avant de pouvoir imposer l'unicité :
  la granularité minute ne tient pas quand les tickets naissent en salve. Options —
  (a) suffixe de désambiguïsation (`2026-07-25_16-48b`), (b) seconde dans l'id,
  (c) l'id devient un slug court indépendant de l'heure. Quelle que soit l'option,
  les 3 collisions existantes se réparent par édition du frontmatter (l'id ne
  circule que dans le board — vérifier au grep qu'aucun ticket n'y renvoie).
- **Les tickets clos ne se réécrivent pas à la légère** : compléter un `done:`
  manquant se fait à partir du hash de merge, pas d'une date inventée. Si
  l'information est perdue, l'admettre plutôt que la fabriquer (envisager une
  tolérance du contrôle sur les tickets antérieurs à la règle).
- Faux positif connu du link-check : un lien markdown écrit **littéralement en
  prose** (voir la note de `audit-workflow-consistency`).

## Contexte / liens

- Recipe source des contrôles 1–4 : `meta/agents/recipes/workflow/../audit-workflow-consistency.md`
  (elle prévoit déjà cette migration : « pourront migrer vers un script
  `meta/agents/tools/` ; cette recipe reste la source de vérité de la procédure »).
- Invariants : `meta/README.md` (colonnes, nommage, id immuable),
  `meta/workflow/TEMPLATE.md`, `meta/agents/recipes/workflow/*`.
- CI : `.github/workflows/quality.yml`.
- Doc du dossier outils : `meta/agents/tools/README.md` (à compléter avec le script).

## Definition of Done

- [ ] Script dans `meta/agents/tools/`, exécutable depuis la racine, sans
      dépendance nouvelle ; rc ≠ 0 au premier écart, une ligne par contrôle.
- [ ] Les 8 contrôles du tableau ci-dessus sont implémentés.
- [ ] Format d'`id` tranché et écrit dans `meta/README.md` + `TEMPLATE.md`.
- [ ] **Board vert** : les 3 collisions d'`id`, les 5 frontmatters incomplets et
      les 5 rubriques `## Suite` manquantes/vides sont réparés (ou explicitement
      couverts par une tolérance documentée).
- [ ] Job CI qui joue le script sur PR et push `main`.
- [ ] `audit-workflow-consistency` renvoie au script pour les contrôles
      automatisés et ne garde en manuel que ce qui ne l'est pas (contrôles 4–8).
- [ ] `meta/agents/tools/README.md` documente le script.
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
