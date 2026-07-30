# Recipe — auditer la cohérence des specs de workflow

**Quand** : après toute évolution du workflow (colonnes, recipes, TEMPLATE, règles
agent, fichiers d'entrée). **But** : confirmer que l'écosystème `meta/` reste
cohérent, à jour, sans lien cassé ni référence périmée — sans relecture manuelle
exhaustive. Sœur de [verify-a-change](verify-a-change.md) et
[review-changes](review-changes.md), appliquée à la doc-agent elle-même.

## Périmètre

- Recipes de cycle : `meta/agents/recipes/workflow/*` (voir
  [work-a-task](workflow/work-a-task.md)).
- Recipes de méthode : `meta/agents/recipes/*`.
- Board : [`../../README.md`](../../README.md),
  [`../../workflow/TEMPLATE.md`](../../workflow/TEMPLATE.md), **toutes** les
  colonnes `meta/workflow/*/` — le glob `0*/` oubliait les boîtes hors pipeline
  (`100-follow-up`, `200-ideas`), qu'un audit doit regarder comme les autres.
- Règles agent : [`../conventions.md`](../conventions.md),
  [`../workflow.md`](../workflow.md), `../engine-boundary.md`.
- Fichiers d'entrée : `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`.

## Contrôles mécaniques — automatisés

> **Ils tournent déjà.** `test/board.test.js` porte les contrôles 1 à 3 ci-dessous
> plus le nommage, le frontmatter, la **monotonie de la timeline**, la rubrique
> `Suite` des tickets clos, les colonnes connues, l'identité des trois points
> d'entrée et l'hygiène git (branches mergées, préfixe `merge:`). Ils s'exécutent
> dans **`npm run verify`** : casser le board échoue comme un test rouge, sans
> attendre la CI ni une passe manuelle.
>
> Les commandes qui suivent restent la **description de la procédure** — utiles
> pour comprendre ce qui est vérifié, ou pour sonder un point précis à la main.
> Le test fait foi.
>
> Deux limites y sont assumées, à connaître avant de s'y fier :
> - **« titre en anglais » n'est pas testable** — le contrôle est un proxy (ASCII,
>   kebab-case) qui attrape `complétude` mais pas `routes-en-double` ;
> - **les contrôles d'`id` et de `## Suite` ne portent pas sur l'archive** : les
>   doublons d'`id` de `080-done` et les rubriques absentes d'avant le
>   2026-07-27 y restent. Réécrire l'historique pour faire passer un test serait
>   le falsifier.

### 1. Liens markdown relatifs — tous résolvent

```bash
python3 - <<'PY'
import re, os, glob
files = glob.glob('meta/**/*.md', recursive=True) + [
    'CLAUDE.md', 'AGENTS.md', '.github/copilot-instructions.md',
    '.github/pull_request_template.md', 'README.md']
bad = 0
for f in files:
    d = os.path.dirname(f)
    for m in re.findall(r'\]\(([^)]+)\)', open(f, encoding='utf-8').read()):
        if m.startswith(('http', '#')):
            continue
        t = os.path.normpath(os.path.join(d, m.split('#')[0]))
        if not os.path.exists(t):
            print(f'BROKEN {f} -> {m}'); bad += 1
print('links OK' if bad == 0 else f'{bad} broken')
PY
```

> Faux positif : un lien markdown écrit **littéralement en prose** (à titre
> d'exemple) est pris pour un vrai lien par la regex. Si la « cible » signalée n'est
> pas un chemin réel → trier ; mieux, éviter d'écrire un lien littéral hors d'un
> vrai lien.

### 2. Références périmées — y compris en prose / code-spans

Le link-check ci-dessus **ne détecte que les liens markdown** ; une référence
écrite en texte ou en back-ticks lui échappe. Après un renommage de dossier ou de
colonne, grep l'ancien
nom et **trie** les résultats — un hit dans un lien ou une **consigne active** est à
corriger ; un hit dans le **journal d'un ticket clos** (narration historique) est
légitime.

```bash
# ex. après un renommage <ancien>/ → <nouveau>/ : grep l'ancien nom, puis trier
grep -rn "<ancien>/" --include=*.md . | grep -vE "node_modules|/\.git/|/\.claude/"
```

Contrôle **dur** (doit être vide) : une colonne se cite toujours
`meta/workflow/<colonne>/`, jamais `meta/<colonne>/`.

```bash
grep -rnE "meta/(000-backlog|020-ready|040-doing|060-verify|080-done|100-follow-up|200-ideas)/" \
  --include=*.md . CLAUDE.md AGENTS.md .github/*.md \
  | grep -vE "node_modules|/\.git/|/\.claude/" | grep -v "meta/workflow/"
```

### 3. `@imports` de `CLAUDE.md` — cibles existantes

```bash
grep -oE '^@[^ ]+' CLAUDE.md | while read -r p; do
  p="${p#@}"; [ -f "$p" ] && echo "OK $p" || echo "MISSING $p"
done
```

### 4. Les commandes documentées **s'exécutent**

Un lien valide et une phrase juste ne garantissent rien : une commande peut être
grammaticalement parfaite et **échouer** dans le contexte où la recipe la place.
C'est le contrôle le plus rentable — et le seul qui manquait quand les trois
commandes git de [parallel-worktrees](parallel-worktrees.md) se sont révélées
fausses (2026-07-27).

Rejouer **littéralement** chaque bloc `bash` d'une recipe modifiée, **dans le
contexte qu'elle décrit** (un worktree secondaire n'est pas le tree principal),
et vérifier le **code retour** — pas seulement l'absence de message rouge :

```bash
# une chaîne `a && b` s'arrête au premier échec : b ne s'exécute pas, silencieusement
( cd <contexte décrit par la recipe> && <commande documentée> ) ; echo "rc=$?"
```

Piège récurrent : une commande qui échoue **au milieu** d'une chaîne `&&` laisse
l'agent dans un état intermédiaire plausible — il croit avoir changé de branche,
il n'a rien changé. Vérifier l'**effet** attendu, pas seulement le rc du dernier
maillon.

## Contrôles de cohérence (lecture croisée)

5. **Colonnes** — mêmes noms et même ordre (`000-backlog` → `020-ready` →
   `040-doing` → `060-verify` → `080-done`) dans : board README (table),
   [work-a-task](workflow/work-a-task.md) (table), chaque `ticket-*.md`, et les
   fichiers d'entrée. **Deux boîtes sont hors pipeline** et ne doivent apparaître
   dans aucune séquence d'étapes :
   - `100-follow-up` — boîte de **candidats**, qui **périme**
     ([ticket-follow-up](workflow/ticket-follow-up.md) /
     [follow-up-triage](workflow/follow-up-triage.md)) ;
   - `200-ideas` — boîte à **idées**, sans horloge ni tri récurrent.

   Toute colonne présente sur le disque doit être décrite dans le board README :
   une colonne que l'audit ignore est pire qu'une colonne non documentée, il donne
   le vert sans l'avoir regardée.
6. **Cycle & topologie git** — aucune formulation contradictoire : branche créée au
   *work*, board sur `main`, clôture `done` sur `main` **post-merge** (section
   « Topologie git » de [work-a-task](workflow/work-a-task.md)).
7. **Entrées alignées** — `CLAUDE.md` / `AGENTS.md` /
   `.github/copilot-instructions.md` énoncent les mêmes règles essentielles (chemin
   du board, pointeur de cycle).
8. **TEMPLATE ↔ recipes** — le frontmatter du TEMPLATE (`ready`/`doing`/`verify`/
   `done`) et ses sections `Journal` (Travail / Vérification / Validation) et
   `Suite` correspondent aux transitions, journaux et clôture décrits par les
   recipes d'étape.

## Sortie

Rapport court, un item par contrôle : ✅ / ❌ + détail des écarts. **Doc obsolète =
bug** → corriger dans le même change. Un écart hors périmètre → déposer un ticket en
`meta/workflow/000-backlog/` plutôt que dériver.

> **Un seul garde-fou.** La migration annoncée ici a eu lieu : les contrôles
> mécaniques vivent dans **`test/board.test.js`**, joué par `npm run verify` — pas
> dans un script de `meta/agents/tools/`, qui serait un second outil à maintenir
> pour les mêmes règles. Un contrôle à ajouter va donc **là**. Cette recipe reste
> la source de vérité de la *procédure*, y compris des contrôles 4 à 8, qui ne
> s'automatisent pas.
