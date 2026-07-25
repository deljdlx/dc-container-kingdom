# Recipe — vérifier un ticket (`040-doing` → `060-verify`)

**Vérification technique** par celui qui a fait le travail, une fois
l'implémentation terminée.

1. `git mv` le ticket vers `meta/workflow/060-verify/` (**sur la branche**) et
   renseigner `verify:` — on **entre dans la colonne au début** de la vérification :
   le board doit refléter « en cours de vérification », pas l'annoncer après coup.
2. Vérifier — voir [verify-a-change](../verify-a-change.md) : `npm run verify` vert,
   validation runtime si pertinent, nettoyage des résidus de debug.
3. **Documenter chaque itération de vérification** dans `## Journal > Vérification`,
   datée (ce qui a été vérifié, résultats, corrections).
