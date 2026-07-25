# Recipe — spécifier un ticket (`000-backlog` → `020-ready`)

Cadrer une tâche avant de la prendre — pour qu'elle soit **prête à démarrer**.

1. Remplir la section **Spécifications** du ticket (quoi / comment, contraintes,
   pistes) et affiner la **Definition of Done**.
2. Renseigner `ready:` (date/heure) dans le frontmatter.
3. `git mv` le ticket vers `meta/workflow/020-ready/`.

Une tâche déjà claire peut n'avoir aucune spec à écrire : elle passe quand même en
`020-ready` (avec `ready:` daté), simplement sans remplir « Spécifications ».
