# Le parcours de redessin efface le signal de marche

- **Origine** : 2026-08-05_14-43.
- **Constat** : `Character.isWalking()` s'appuie sur la distance retenue par
  `update(walkedDistance)`. Or le parcours de redessin par frame appelle
  `element.update()` **sans argument** sur les nœuds sales — donc
  `Character.update(0)` — et remet la distance à zéro. Mesuré : sur 60 frames de
  patrouille, 16 appels avec une distance de 4 px et **23 appels sans argument**,
  entrelacés. Un observateur qui lit `isWalking()` *après* la frame voit donc
  toujours `false`.
- **Coût du non-fait** : `FootstepDust` n'en souffre pas — il mémorise « a marché
  depuis la dernière salve » et lit pendant la phase des behaviors, avant le
  parcours. Mais c'est un contournement chanceux, pas une garantie : le **prochain**
  consommateur du signal (un système de dégâts, un son de pas, une IA) lira faux
  s'il échantillonne au mauvais moment, et cherchera longtemps.
- **La décision** : distinguer « repeindre » de « avancer d'une distance » —
  `Character.update()` sans argument ne devrait pas toucher l'état de marche —
  ou donner au signal une durée explicite (dernière frame où l'on a bougé,
  comparée au numéro de frame courant) plutôt que de dépendre de qui appelle quoi.
