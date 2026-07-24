# Recipe — implémenter une feature

## Étapes

1. **Comprendre d'abord** — lire le code concerné et sa doc (`../../documentation/`,
   JSDoc) avant d'écrire. Ne pas deviner l'existant.
2. **Concevoir** — SOLID / découplage : responsabilités séparées, dépendances
   explicites. Si une classe grossit, extraire un sous-système dédié plutôt que
   d'empiler.
3. **Implémenter** en épousant le style du code environnant, en respectant les
   frontières du projet (voir [../engine-boundary.md](../engine-boundary.md)).
4. **Tester** la logique critique et les chemins fragiles.
5. **Vérifier** — voir [verify-a-change](verify-a-change.md).
6. **Documenter** — mettre à jour la doc si l'archi / l'API / les commandes /
   les conventions changent (impératif, voir [../workflow.md](../workflow.md)).
