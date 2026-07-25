# Recipe — vérifier un ticket (`040-doing` → `060-verify`)

Quand l'implémentation est terminée — **vérification technique** par celui qui a
fait le travail.

1. Vérifier — voir [verify-a-change](verify-a-change.md) : `npm run verify` vert,
   validation runtime si pertinent, nettoyage des résidus de debug.
2. `git mv` le ticket vers `project/060-verify/` ; renseigner `verify:`.
3. **Documenter chaque itération de vérification** dans `## Journal > Vérification`,
   datée (ce qui a été vérifié, résultats, corrections).
