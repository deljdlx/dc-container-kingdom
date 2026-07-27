# Recipe — créer un ticket (→ `000-backlog`)

1. Copier [`../../../workflow/TEMPLATE.md`](../../../workflow/TEMPLATE.md) dans
   `meta/workflow/000-backlog/` sous le nom **`projet_priorité_titre.md`** —
   convention détaillée dans [`../../../README.md`](../../../README.md).
   - **`projet`** obligatoire (`engine`, `container-kingdom`, `board`…) : c'est
     l'axe de découpage futur du dépôt, pas une étiquette décorative.
   - **`priorité`** = `500` par défaut. **Ne te priorise pas toi-même** : un agent
     qui crée un ticket le pose à `500` (« non priorisé »). Descendre vers `000`
     est une décision, prise par l'humain ou en *specify*, pas un réflexe de
     création.
   - **`titre`** court, kebab-case, **sans préfixe de type** — il est dans le
     frontmatter.
2. Renseigner le frontmatter — `id`, `title`, `type` (`feat` | `fix` | `refactor` |
   `docs` | `test` | `chore`), `created` — et l'**Objectif** (le *quoi* et le
   *pourquoi*). L'**`id` est immuable** : le nom du fichier bougera (repriorité,
   changement de projet), lui non — c'est l'ancre des références croisées.
3. Tu **peux amorcer** `Spécifications` / `Definition of Done` si la tâche est déjà
   claire, mais ce n'est pas requis : *specify* reste la porte qui les **confirme /
   affine** et pose `ready:` ([ticket-specify](ticket-specify.md)). Laisse vides les
   champs de transition (`ready`/`doing`/`verify`/`done`) et le `Journal`.
4. **Commiter immédiatement** le ticket sur `main`. Un ticket non committé n'est pas
   « sur le board » : invisible aux autres, perdable. C'est du **bookkeeping de
   board**, pas une modif de code → **hors du « commit sur demande »** (voir les
   Règles transverses de [work-a-task](work-a-task.md)).
