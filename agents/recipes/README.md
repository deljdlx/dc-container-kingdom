# Recipes — playbooks de tâches

Des **modes d'emploi étape par étape** pour les tâches récurrentes de ce dépôt.
Là où [`../conventions.md`](../conventions.md) / [`../workflow.md`](../workflow.md)
donnent les *règles*, une recipe donne un *chemin concret et reproductible*.

## Disponibles

- **[add-map-element.md](add-map-element.md)** — ajouter un élément de carte
  (`SpriteElement` déclaratif).
- **[add-npc-behavior.md](add-npc-behavior.md)** — ajouter un behavior NPC piloté
  par la game loop.
- **[verify-in-browser.md](verify-in-browser.md)** — vérifier au navigateur
  (pilotage manuel rAF + `?debug=1`).
- **[engine-feature.md](engine-feature.md)** — une feature moteur de bout en bout.
- **[review-changes.md](review-changes.md)** — reviewer un changement (règles + qualité).

## Écrire une recipe

- **Courte** et **orientée étapes** (une liste numérotée qu'on peut suivre).
- **Pointer vers le code réel** (fichiers d'exemple, `documentation/`) plutôt que
  copier du code — le code reste à jour, pas une copie.
- **Finir par la vérification** (`npm run verify`, et navigateur si rendu).
- La tenir à jour si le pattern qu'elle décrit change (voir [../workflow.md](../workflow.md)).
