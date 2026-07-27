# `meta/` — board agentique (kanban en fichiers)

Un **kanban embarqué**, versionné dans le repo et pilotable par un agent :
l'avancement vit dans des **fichiers** (pas dans un outil externe), donc
n'importe quel agent ou humain reprend le contexte juste en lisant ce dossier.
**Auto-porteur.**

## Colonnes

Une tâche est un fichier `projet_priorité_titre.md` (ou un dossier si elle a des
artefacts) qu'on **déplace de colonne en colonne** avec `git mv` — ce qui trace
son avancement dans l'historique. Voir « Nommer un ticket » plus bas.

| Colonne | Rôle |
|---|---|
| **`000-backlog/`** | Backlog **priorisé** — groupé par projet, `000` en tête (voir « Nommer un ticket »). |
| **`020-ready/`** | **Spécifiée** et prête à démarrer (specs écrites si besoin, `ready:` daté). |
| **`040-doing/`** | En cours — idéalement **une** tâche à la fois. |
| **`060-verify/`** | Implémentation faite, **en validation** : `npm run verify`, navigateur, review, durcissement. |
| **`080-done/`** | Terminé — archive du résultat (commit / merge noté). |
| **`100-follow-up/`** | **Hors pipeline** — boîte de **candidats** (pas de tickets) émis à la clôture, triés vers `000-backlog/`. |
| **`200-ideas/`** | **Hors pipeline, hors horloge** — boîte à idées : ce qu'on aimerait faire un jour, sans échéance ni obligation de trancher. |

Les préfixes numériques **espacés** (pas de 20) ordonnent les colonnes **et**
laissent de la place pour en insérer (`010-…`, `030-…`, `050-…`, `070-…`).

`100-follow-up/` est **détaché** de la plage `000` → `080` à dessein : ce n'est pas
l'étape qui suit `080-done`, c'est une **boîte de sortie** qui **réalimente**
`000-backlog`. Un ticket ne s'y déplace jamais ; elle ne reçoit que des
**candidats** — des notes courtes, sans frontmatter, bon marché à écrire comme à
jeter. Elle existe pour protéger la propriété la plus fragile du backlog : être
**priorisé**. Voir [ticket-follow-up](agents/recipes/workflow/ticket-follow-up.md) (qui
la remplit) et [follow-up-triage](agents/recipes/workflow/follow-up-triage.md) (qui la
vide).

### `200-ideas/` — la boîte à idées

Les deux boîtes ne se ressemblent que de loin. Ce qui les sépare, c'est
l'**horloge** :

| | `100-follow-up/` | `200-ideas/` |
|---|---|---|
| D'où ça vient | la clôture d'un ticket | n'importe quand, de nulle part |
| Ce que ça demande | **une décision, bientôt** | rien |
| Durée de vie | **périme** : non trié deux fois = rejeté | illimitée, elle peut dormir des mois |
| Ce qu'on y met | une piste précise, issue d'un constat | une envie, une direction, un « et si… » |

Une idée n'est **pas** un ticket : pas de frontmatter, pas de DoD, pas de
priorité — elle n'est pas actionnable, et c'est normal. Nommer le fichier
`sujet_titre.md` (`git-kingdom_second-consommateur-du-moteur.md`).

**Aucun tri récurrent ne la vide** — c'est délibéré. Une boîte à idées soumise à
une échéance devient une boîte à candidats, et on a déjà celle-là. On y pioche
quand on cherche quoi faire ensuite, pas quand un rituel l'impose.

Le jour où une idée est retenue, elle ne « passe » pas en backlog : on **en tire
des tickets**, qui naissent normalement ([ticket-create](agents/recipes/workflow/ticket-create.md)).
La note peut rester — une idée réalisée à moitié reste une idée.

## Cycle de vie d'une tâche

Chaque étape a sa recipe (détail dans [`work-a-task`](agents/recipes/workflow/work-a-task.md)).
Chaque transition **date** son passage (frontmatter) et **documente ses itérations**
(section `## Journal` du ticket) :

1. **Créer** → `000-backlog/` — [ticket-create](agents/recipes/workflow/ticket-create.md).
2. **Spécifier** → `020-ready/` — specs + `ready:` — [ticket-specify](agents/recipes/workflow/ticket-specify.md).
3. **Travailler** → `040-doing/` — branche + `doing:` — [ticket-work](agents/recipes/workflow/ticket-work.md).
4. **Vérifier** → `060-verify/` — `npm run verify` + `verify:` — [ticket-verify](agents/recipes/workflow/ticket-verify.md).
5. **Valider & clore** → `080-done/` — review + merge + `done:` — [ticket-validate](agents/recipes/workflow/ticket-validate.md).
6. **Suite** → rubrique `## Suite` du ticket (+ candidats en `100-follow-up/` si
   besoin) — [ticket-follow-up](agents/recipes/workflow/ticket-follow-up.md). Ces
   candidats sont triés au **démarrage de la tâche suivante** —
   [follow-up-triage](agents/recipes/workflow/follow-up-triage.md).

## Nommer un ticket : `projet_priorité_titre`

Le nom de fichier **est** la clé de lecture du board. Il porte trois choses, dans
cet ordre :

```
container-kingdom_000_securite-exposition-api-docker.md
engine_010_mouvement-sous-pixel.md
engine_040_catalogue-navigable.md
board_500_nommage-des-tickets.md
└──── projet ────┘ └─ prio ─┘ └──── titre ────┘
```

- **`projet`** — le sous-projet auquel le ticket appartient : `engine`,
  `container-kingdom`, `board`… **Obligatoire.** Ce n'est pas une étiquette
  décorative : c'est l'axe selon lequel ce dépôt pourra un jour se découper.
- **`priorité`** — trois chiffres, **`000` = le plus prioritaire**, `999` le
  moins. **Numéroter clairsemé** (`010`, `020`, `050`…) pour insérer sans tout
  renommer — même raison que les préfixes espacés des colonnes.
- **`titre`** — court, en kebab-case. **Pas de type** (`fix-`, `feat-`…) : il
  vit dans le frontmatter, le répéter ici ne fait que rallonger.

Ainsi `ls 000-backlog/` regroupe par projet **et** ordonne par priorité à
l'intérieur de chacun — « le haut = le plus prioritaire » devient enfin vrai.

```bash
ls meta/workflow/000-backlog/engine_*        # un projet, dans l'ordre
ls meta/workflow/*/container-kingdom_*       # un projet, toutes colonnes
```

**Pas de sous-dossier par projet**, à dessein : ici un **dossier signifie déjà
« tâche avec artefacts »**, et un ticket voyage de colonne en colonne par
`git mv` — une arborescence devrait être répliquée dans chaque colonne.

> **Le nom bouge, l'`id` non.** Repriorité, changement de projet ou de titre =
> un `git mv` (bookkeeping, à committer). Le champ **`id:`** du frontmatter, lui,
> est **immuable** : c'est par lui qu'on référence un ticket, jamais par son nom
> ni par son chemin de colonne, qui changent tous les deux.

> **`080-done` n'est pas renommé** : une archive se lit par date, et une priorité
> y est un fossile. Les tickets clos avant cette convention gardent leur nom.

## Créer une tâche

Copier [`TEMPLATE.md`](workflow/TEMPLATE.md) dans `000-backlog/` sous le nom
`projet_priorité_titre.md` (voir ci-dessus). Un ticket naît à la priorité
**`500`** — « non priorisé » : hiérarchiser est un acte délibéré, pas un réflexe
de création. Voir [ticket-create](agents/recipes/workflow/ticket-create.md).

## Comment ça s'articule

- **Ce board** = le **QUOI** (état, priorité, avancement).
- **`agents/recipes/`** = le **COMMENT générique** (méthode réutilisable) ;
  **[`recipes/`](recipes/)** = le **COMMENT projet** (patterns Container Kingdom).
- **`agents/`** (conventions, workflow, frontière moteur) = les **RÈGLES**.
- **`documentation/`** = comment le **code** fonctionne.
