# Recipe — déboguer par la preuve

Corriger sur des **faits mesurés**, pas sur des hypothèses.

## Étapes

1. **Reproduire** le problème de façon fiable (un cas minimal, déterministe si
   possible).
2. **Isoler** — réduire jusqu'à cerner le composant fautif ; formuler une
   hypothèse **falsifiable**.
3. **Prouver par la mesure** — instrumenter / logger / écrire un test qui
   **confirme ou infirme** l'hypothèse. Ne pas « corriger » sur une intuition non
   vérifiée.
4. **Corriger** la cause racine (pas le symptôme).
5. **Verrouiller** — ajouter un **test de non-régression** qui échouait avant le
   fix et passe après, puis [verify-a-change](verify-a-change.md).

## Rappel

Une hypothèse séduisante mais non mesurée est souvent fausse — la mesure tranche
plus vite qu'un débat.
