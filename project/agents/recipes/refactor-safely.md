# Recipe — refactorer sans casser

Refactorer = changer la structure **sans** changer le comportement observable.

## Étapes

1. **Filet d'abord** — si le comportement n'est pas déjà couvert, écrire des
   **tests de caractérisation** qui verrouillent le comportement *observable*
   actuel (pas les détails internes).
2. **Refactorer** sous ce filet, par petits pas.
3. **Suite verte à l'identique** — `npm run verify` doit rester vert **sans
   modifier les assertions** existantes ; un test qui change de résultat signale
   un changement de comportement (à éviter, ou à assumer explicitement).
4. **Vérifier** au-delà des tests si nécessaire (voir
   [verify-a-change](verify-a-change.md)) — surtout pour du rendu / du runtime que
   les tests ne couvrent pas.

## Piège

Ne pas mélanger refactor et changement de comportement dans le même pas : on ne
sait plus si une régression vient de l'un ou de l'autre.
