---
id: 2026-07-27_19-03
title: Un garde-fou automatique sur la cohérence du board
type: test
branch: claude/board-doctor
created: 2026-07-27 19:03
ready: 2026-07-27 19:21
doing: 2026-07-27 19:22
verify: 2026-07-27 19:31
done: 2026-07-27 19:33 (merge 97bb5e1)
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

**Tranché en *specify*** — les deux, selon le cas :

- **Doublons d'`id`** : les deux tickets **vivants** sont corrigés dans ce ticket.
  Vérifié : `2026-07-25_16-48` n'est référencé par aucun autre ticket, seulement
  porté par les trois qui le partagent. On décale l'`id` (et son `created`
  redondant) de l'un d'une minute. L'**archive garde ses doublons** —
  `2026-07-24_21-53` et `2026-07-25_15-19`, trois tickets chacun — donc le
  contrôle ne porte que sur les **colonnes actives**. Réécrire l'archive pour
  satisfaire un contrôle serait falsifier l'historique pour faire passer un test.
- **`## Suite` en `080-done`** : **date-pivot**. La rubrique naît avec
  `2026-07-26_18-14` ; le contrôle ne s'applique qu'aux tickets dont le `done:`
  lui est postérieur.

### Ce qui n'est pas mécanisable, et qu'il ne faut pas prétendre vérifier

« Le titre est en anglais » **ne se teste pas**. Ce qu'on peut vérifier est un
**proxy** : ASCII pur et kebab-case minuscule — ce qui attrape `priorité`,
`réseaux`, `complétude`, mais laisse passer `routes-en-double`. À écrire comme
tel dans le test, sinon le prochain lecteur croira la règle garantie.

## Contexte / liens

- `meta/agents/recipes/audit-workflow-consistency.md` (les contrôles à porter, et
  son contrôle 4 sur les commandes documentées)
- `meta/README.md`, `meta/workflow/TEMPLATE.md`, `meta/agents/conventions.md`
- `.github/workflows/quality.yml` (job unique `npm run verify`)
- Ticket frère : `2026-07-27_19-04` (aligner les règles sur la pratique)

## Definition of Done

- [x] Casser une convention du board **fait échouer `npm run verify`**.
- [x] Aucune nouvelle chaîne d'outils ni nouveau job CI.
- [x] Les deux contrôles « inapplicables au passé » ont une stratégie **écrite**
      (pivot ou périmètre), et le vert du premier run le prouve.
- [x] Chaque contrôle a un test qui **échoue si on retire le contrôle** — un
      garde-fou non testé ne garde rien.
- [x] La recipe d'audit renvoie vers le test au lieu de décrire des commandes à
      rejouer à la main, pour ce qui est automatisé.
- [x] `npm run verify` vert.

## Suite

- **Ce que ça ouvre** — le garde-fou ne couvre que le **mécanique**. Le contrôle 4
  de la recipe d'audit (« les commandes documentées s'exécutent »), qui avait
  révélé trois commandes git fausses, reste **manuel** : rejouer un bloc `bash`
  dans le contexte qu'il décrit ne se scripte pas trivialement.
- **Ce qu'on laisse de côté** — l'archive garde ses deux doublons d'`id`
  (`2026-07-24_21-53`, `2026-07-25_15-19`, trois tickets chacun) et ses 24
  rubriques `Suite` absentes. Assumé : réécrire l'historique pour verdir un test
  serait le falsifier.
- **Ce que la mesure a appris** — la rubrique `## Suite` était **décorative**
  depuis sa création : 5 tickets créés après elle ont été clos sans. Une règle
  qu'aucun contrôle ne porte n'est pas une règle, c'est une intention. Le même
  soupçon vaut pour les autres règles non couvertes.
- **Déposé en `100-follow-up/`** — rien.

## Journal

### Travail

- [2026-07-27 19:22] Forme retenue : `test/board.test.js` en vitest. Le dépôt n'a
  aucune dépendance Python et sa CI est un job unique `npm run verify` — un
  script dans un second langage aurait ajouté une chaîne d'outils **et** un
  contrôle hors du « terminé = vérifié ».
- [2026-07-27 19:25] 14 contrôles écrits : liens, colonnes citées, `@imports`,
  colonnes documentées ET connues du test, nommage par colonne active, unicité
  des `id`, frontmatter obligatoire, cohérence des dates de transition avec la
  colonne, rubrique `## Suite`, identité des trois points d'entrée.
- [2026-07-27 19:26] Le doublon d'`id` vivant est corrigé comme prévu :
  `engine_420_tools-readme` passe en `2026-07-25_16-49`. Vérifié au préalable
  qu'aucun ticket ne le référençait.
- [2026-07-27 19:28] **La stratégie de pivot a dû changer en cours de route.** Le
  ticket prévoyait de contrôler `## Suite` à partir de la naissance de la rubrique
  (`2026-07-26_18-14`). Mesure faite : **24 tickets clos n'ont pas la section**,
  dont **5 créés après** cette date. La rubrique était donc décorative, pas
  appliquée — un contrôle rétroactif aurait été rouge en permanence, donc
  désactivé. Pivot déplacé à l'**entrée en vigueur du contrôle** : à partir
  d'aujourd'hui, plus aucune clôture sans `## Suite`. La dette d'avant reste
  visible dans l'archive plutôt que réécrite pour faire passer un test.
- [2026-07-27 19:29] Deux limites écrites dans le test **et** dans la recipe :
  « titre en anglais » n'est pas testable (proxy ASCII + kebab-case), et les
  contrôles d'`id` et de `Suite` ne portent pas sur `080-done`.

### Vérification

- [2026-07-27 19:27] Premier run : **2 rouges**, tous deux réels — le doublon
  d'`id` vivant et 7 rubriques `Suite` manquantes. Aucun faux positif : vérifié
  sur pièce que la section était **absente** des fichiers, pas seulement vide.
- [2026-07-27 19:30] **Preuve que les contrôles mordent** (DoD) : quatre
  violations synthétiques injectées d'un coup — un ticket `badproj_99_Titre-Accentué.md`,
  un ticket en `020-ready` sans `ready:`, un lien mort dans le README du board, une
  ligne ajoutée au bloc de règles d'`AGENTS.md`. **Cinq tests sont passés au
  rouge** (l'unicité des `id` en prime, déclenchée par les copies), et le vert est
  revenu après nettoyage. Un garde-fou non testé ne garde rien.
- [2026-07-27 19:31] `npm run verify` **vert** : lint + build + **296 tests /
  43 fichiers**, dont les 19 nouveaux.

### Validation

- [2026-07-27 19:33] Review : les 14 contrôles sont verts et **prouvés non
  vacuous** (cinq passent au rouge sur violation synthétique). Les deux limites
  assumées — proxy ASCII pour « anglais », archive hors périmètre — sont écrites
  dans le test *et* dans la recipe, pas seulement dans le ticket. Mergé sur
  `main` en `--no-ff` : **97bb5e1**.
- [2026-07-27 19:33] La recipe d'audit ne décrit plus une procédure à rejouer à la
  main pour ce qui est automatisé : elle renvoie au test et garde les commandes
  comme description.
