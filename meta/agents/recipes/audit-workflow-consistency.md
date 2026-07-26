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
  [`../../workflow/TEMPLATE.md`](../../workflow/TEMPLATE.md), colonnes `meta/workflow/0*/`.
- Règles agent : [`../conventions.md`](../conventions.md),
  [`../workflow.md`](../workflow.md), `../engine-boundary.md`.
- Fichiers d'entrée : `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`.

## Contrôles mécaniques (commandes, depuis la racine du repo)

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
grep -rnE "meta/(000-backlog|020-ready|040-doing|060-verify|080-done|100-follow-up)/" \
  --include=*.md . CLAUDE.md AGENTS.md .github/*.md \
  | grep -vE "node_modules|/\.git/|/\.claude/" | grep -v "meta/workflow/"
```

### 3. `@imports` de `CLAUDE.md` — cibles existantes

```bash
grep -oE '^@[^ ]+' CLAUDE.md | while read -r p; do
  p="${p#@}"; [ -f "$p" ] && echo "OK $p" || echo "MISSING $p"
done
```

## Contrôles de cohérence (lecture croisée)

4. **Colonnes** — mêmes noms et même ordre (`000-backlog` → `020-ready` →
   `040-doing` → `060-verify` → `080-done`) dans : board README (table),
   [work-a-task](workflow/work-a-task.md) (table), chaque `ticket-*.md`, et les
   fichiers d'entrée. `100-follow-up` est **hors pipeline** : il ne doit apparaître
   dans aucune séquence d'étapes, seulement comme boîte de candidats
   ([ticket-follow-up](workflow/ticket-follow-up.md) /
   [follow-up-triage](workflow/follow-up-triage.md)).
5. **Cycle & topologie git** — aucune formulation contradictoire : branche créée au
   *work*, board sur `main`, clôture `done` sur `main` **post-merge** (section
   « Topologie git » de [work-a-task](workflow/work-a-task.md)).
6. **Entrées alignées** — `CLAUDE.md` / `AGENTS.md` /
   `.github/copilot-instructions.md` énoncent les mêmes règles essentielles (chemin
   du board, pointeur de cycle).
7. **TEMPLATE ↔ recipes** — le frontmatter du TEMPLATE (`ready`/`doing`/`verify`/
   `done`) et ses sections `Journal` (Travail / Vérification / Validation) et
   `Suite` correspondent aux transitions, journaux et clôture décrits par les
   recipes d'étape.

## Sortie

Rapport court, un item par contrôle : ✅ / ❌ + détail des écarts. **Doc obsolète =
bug** → corriger dans le même change. Un écart hors périmètre → déposer un ticket en
`meta/workflow/000-backlog/` plutôt que dériver.

> Les contrôles mécaniques (1–3) pourront migrer vers un script
> `meta/agents/tools/` ; cette recipe reste la source de vérité de la procédure.
