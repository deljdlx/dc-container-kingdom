# Recipe — une feature moteur de bout en bout

Le déroulé type pour une évolution du moteur (`src/engine/`), respectant nos
règles.

## Étapes

1. **Branche dédiée** : `feat/…` (jamais sur `main`). Voir [../conventions.md](../conventions.md).
2. **Comprendre d'abord** : lire le code concerné + ses **JSDoc**, et
   `documentation/engine.md` / `architecture.md` pour le contexte.
3. **Respecter la frontière** : le moteur ne dépend pas de l'app ; toute nouvelle
   classe publique s'exporte depuis `src/engine/index.js`. Voir
   [../engine-boundary.md](../engine-boundary.md).
4. **Design** : SOLID / découplage. Si ça grossit une classe, envisager un
   sous-système dédié (comme `CollisionSystem`, `CharacterAnimator`, les behaviors).
5. **Tests** : sur la logique critique. Si tu **refactores un comportement
   existant**, écrire d'abord des **tests de caractérisation** qui verrouillent le
   comportement observable, puis refactorer sous ce filet.
6. **Vérifier** : `npm run verify` (lint + build + tests). Si rendu/gameplay :
   navigateur — voir [verify-in-browser.md](verify-in-browser.md).
7. **Documentation** : mettre à jour `documentation/` + JSDoc si l'API ou l'archi
   change (impératif — voir [../workflow.md](../workflow.md)).
8. **Commit & merge** : Conventional Commit FR, stager des **chemins explicites**
   (jamais `git add -A`), merger sur `main` (`--no-ff`), supprimer la branche.

## Anti-régression

Bâtir sur les tests existants comme filet : après un refactor, la suite doit
rester **verte à l'identique** (aucun changement de comportement non voulu).
