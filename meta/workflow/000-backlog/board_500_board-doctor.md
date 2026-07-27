---
id: 2026-07-27_19-03
title: Un garde-fou automatique sur la cohérence du board
type: test
branch:
created: 2026-07-27 19:03
ready:
doing:
verify:
done:
---

## Objectif

Les conventions du board vivent désormais dans **cinq fichiers de doc** plus
**trois points d'entrée** qui les résument. Les tenir alignés est un travail
mécanique, donc un travail qu'on finit par ne plus faire : sur la seule journée
du 2026-07-27, les contrôles de cohérence ont été rejoués **à la main six fois**,
et ils ont attrapé un lien cassé et une colonne mal orthographiée qu'aucune
relecture n'avait vus.

La recipe [`audit-workflow-consistency`](../../agents/recipes/audit-workflow-consistency.md)
annonce d'ailleurs déjà la marche à suivre : « les contrôles mécaniques (1–3)
pourront migrer vers un script `meta/agents/tools/` ». Ce ticket la prend au mot.

Ce qu'on veut : que casser le board **fasse échouer `npm run verify`**, au même
titre qu'un test rouge.

## Spécifications

_Rempli en « specify »._

### Forme : un test vitest, pas un outil à part

Le dépôt n'a **aucune** dépendance Python et sa CI est un job unique
(`npm run verify`, Node 22). Un script dans un second langage ajouterait une
chaîne d'outils **et** un contrôle qui ne tourne pas dans `npm run verify` —
donc hors du « terminé = vérifié », qui est la règle centrale du projet : le
board casserait localement sans que personne ne le voie avant la CI.

Un `test/board.test.js` tourne déjà dans `npm test` → `npm run verify` → la CI
existante. Zéro plomberie, et c'est l'idiome du dépôt (36 fichiers de tests).

### Contrôles à porter

Repris de la recipe d'audit, plus ce que la journée a révélé :

1. **Liens markdown relatifs** — tous résolvent (contrôle 1 de la recipe).
2. **Colonnes** — toujours citées `meta/workflow/<colonne>/`, jamais
   `meta/<colonne>/` (contrôle 2).
3. **`@imports` de `CLAUDE.md`** — cibles existantes (contrôle 3).
4. **Nommage** — dans les colonnes actives, tout fichier suit
   `projet_priorité_titre.md`, projet dans la liste connue, priorité sur trois
   chiffres, **nom entièrement en anglais**.
5. **Frontmatter** — champs obligatoires présents, `type` dans l'enum, et les
   dates de transition cohérentes avec la colonne où le ticket se trouve.
6. **Points d'entrée alignés** — le bloc « Règles essentielles » est **identique**
   dans `CLAUDE.md`, `AGENTS.md` et `.github/copilot-instructions.md`. Une
   assertion suffit : générer ces fichiers depuis une source unique coûterait
   plus cher que le problème (ils ont chacun des sections propres — le bloc ⛔
   worktree de Copilot, les `@imports` de Claude).
7. **Colonnes connues** — toute colonne existante est documentée dans le README
   du board. `200-ideas` a justement été ajoutée sans que la recipe d'audit
   l'apprenne : un contrôleur aveugle à une colonne est pire qu'une colonne non
   documentée.

### ⚠️ Deux contrôles qui échouent dès le premier run

Ils sont légitimes mais **inapplicables au passé**, et un garde-fou rouge en
permanence est un garde-fou qu'on désactive sous quinze jours :

- **Unicité des `id`** — trois groupes sont en doublon, et **deux tickets du
  backlog actif** partagent `2026-07-25_16-48` (`engine_420_tools-readme` et
  `engine_430_proofread-engine-doc`). Le contrôle échoue sur des fichiers vivants,
  pas seulement sur l'archive.
- **`## Suite` non vide en `080-done`** — la rubrique date du `2026-07-26_18-14` ;
  la majorité des 41 tickets clos lui sont antérieurs.

À trancher en *specify* : date-pivot, périmètre « colonnes actives seulement », ou
correction préalable des doublons vivants.

## Contexte / liens

- `meta/agents/recipes/audit-workflow-consistency.md` (les contrôles à porter, et
  son contrôle 4 sur les commandes documentées)
- `meta/README.md`, `meta/workflow/TEMPLATE.md`, `meta/agents/conventions.md`
- `.github/workflows/quality.yml` (job unique `npm run verify`)
- Ticket frère : `2026-07-27_19-04` (aligner les règles sur la pratique)

## Definition of Done

- [ ] Casser une convention du board **fait échouer `npm run verify`**.
- [ ] Aucune nouvelle chaîne d'outils ni nouveau job CI.
- [ ] Les deux contrôles « inapplicables au passé » ont une stratégie **écrite**
      (pivot ou périmètre), et le vert du premier run le prouve.
- [ ] Chaque contrôle a un test qui **échoue si on retire le contrôle** — un
      garde-fou non testé ne garde rien.
- [ ] La recipe d'audit renvoie vers le test au lieu de décrire des commandes à
      rejouer à la main, pour ce qui est automatisé.
- [ ] `npm run verify` vert.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
