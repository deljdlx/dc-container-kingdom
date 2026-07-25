# Recipe — valider et clore un ticket (`060-verify` → `080-done`)

**Acceptation / review** (distincte de la vérification technique) : le ticket
répond-il à son objectif ?

1. Valider — voir [review-changes](../review-changes.md) : conformité aux règles +
   qualité + **Definition of Done** cochée.
2. Merger la branche sur `main` (`--no-ff`) — **sur demande**.
3. `git mv` le ticket vers `meta/workflow/080-done/` ; renseigner `done:` et noter le
   commit / merge.
4. **Documenter chaque itération de validation** dans `## Journal > Validation`,
   datée.
