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
4. **Commiter** la création — bookkeeping de board sur `main` (voir la « Topologie
   git » de [work-a-task](work-a-task.md)).
