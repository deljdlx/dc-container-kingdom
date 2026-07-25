# Recipe — valider et clore un ticket (`060-verify` → `080-done`)

**Acceptation / review** (distincte de la vérification technique) : le ticket
répond-il à son objectif ?

1. Valider — voir [review-changes](../review-changes.md) : conformité aux règles +
   qualité + **Definition of Done** cochée.
2. Merger la branche sur `main` (`--no-ff`) — **sur demande**.
3. **Sur `main`, une fois le merge fait** : `git mv` le ticket vers
   `meta/workflow/080-done/`, renseigner `done:` et **noter le hash du merge**
   (possible seulement post-merge).
4. **Documenter la validation** dans `## Journal > Validation`, datée.
