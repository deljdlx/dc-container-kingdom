# Recipe — créer un ticket (→ `000-backlog`)

1. Copier [`../../../workflow/TEMPLATE.md`](../../../workflow/TEMPLATE.md) dans
   `meta/workflow/000-backlog/` sous le nom **`YYYY-MM-DD_HH-MM_titre.md`** (heure de
   création ; `titre` court en kebab-case).
2. Renseigner le frontmatter — `id`, `title`, `type` (`feat` | `fix` | `refactor` |
   `docs` | `test` | `chore`), `created` — et l'**Objectif** (le *quoi* et le
   *pourquoi*).
3. Tu **peux amorcer** `Spécifications` / `Definition of Done` si la tâche est déjà
   claire, mais ce n'est pas requis : *specify* reste la porte qui les **confirme /
   affine** et pose `ready:` ([ticket-specify](ticket-specify.md)). Laisse vides les
   champs de transition (`ready`/`doing`/`verify`/`done`) et le `Journal`.
4. **Commiter immédiatement** le ticket sur `main`. Un ticket non committé n'est pas
   « sur le board » : invisible aux autres, perdable. C'est du **bookkeeping de
   board**, pas une modif de code → **hors du « commit sur demande »** (voir les
   Règles transverses de [work-a-task](work-a-task.md)).
