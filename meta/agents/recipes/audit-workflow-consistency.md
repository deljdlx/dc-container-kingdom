# Recipe — auditer la cohérence des specs de workflow

**Quand** : après une évolution du workflow, des recipes, du TEMPLATE, des règles
agent ou des points d'entrée. **But** : vérifier que `meta/` reste cohérent sans
relecture exhaustive.

## Périmètre

- Recipes de cycle et de méthode : `meta/agents/recipes/*`.
- Board : `../../README.md`, `../../workflow/TEMPLATE.md`, toutes les colonnes
  `meta/workflow/*/`.
- Règles agent : `../conventions.md`, `../workflow.md`, `../engine-boundary.md`.
- Points d'entrée : `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`.

## Contrôles mécaniques

> **Ils tournent déjà.** `test/board.test.js` porte les contrôles automatisés du
> board vivant : liens, colonnes, `@imports`, id uniques, frontmatter, hash de
> merge, DoD clôturée, `## Suite`, nommage, monotonie de timeline et hygiène git.
> Ils s'exécutent dans `npm run verify` ; le test fait foi.
>
> Limites assumées : **« titre en anglais » n'est pas testable** (proxy ASCII /
> kebab-case) et l'archive antérieure aux pivots documentés reste hors réécriture.

### 4. Les commandes documentées **s'exécutent**

Un lien valide et une phrase juste ne garantissent rien : une commande peut être
grammaticalement parfaite et **échouer** dans le contexte où la recipe la place.
C'est le contrôle le plus rentable. Vérifier le **code retour** et l'**effet**
attendu, pas seulement la fin de la chaîne `&&`.

### 5. Colonnes

Même noms et même ordre (`000-backlog` → `020-ready` → `040-doing` →
`060-verify` → `080-done`) dans le board README, `work-a-task`, les tickets et
les points d'entrée. `100-follow-up` et `200-ideas` restent hors pipeline.

### 6. Cycle & topologie git

Aucune contradiction : branche créée au *work*, board sur `main`, clôture `done`
sur `main` **post-merge**.

### 7. Entrées alignées

`CLAUDE.md`, `AGENTS.md` et `.github/copilot-instructions.md` énoncent les mêmes
règles essentielles : chemin du board, pointeur de cycle, conventions de travail.

### 8. TEMPLATE ↔ recipes

Le frontmatter du TEMPLATE (`ready`/`doing`/`verify`/`done`) et ses sections
`Journal` / `Suite` correspondent aux transitions, journaux et clôture décrits par
les recipes d'étape.

## Sortie

Rapport court, un item par contrôle : ✅ / ❌ + détail des écarts. **Doc obsolète =
bug** → corriger dans le même change. Un écart hors périmètre → déposer un ticket
en `meta/workflow/000-backlog/` plutôt que dériver.

> **Un seul garde-fou.** Les contrôles mécaniques sont dans
> `test/board.test.js`, joué par `npm run verify`. Cette recipe reste la source de
> vérité de la procédure, y compris des contrôles 4 à 8, qui ne s'automatisent pas.
