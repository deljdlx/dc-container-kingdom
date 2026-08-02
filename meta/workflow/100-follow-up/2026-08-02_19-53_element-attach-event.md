# Un event d'attache est redevenu possible

- **Origine** : 2026-08-02_19-30
- **Constat** : le docblock du `FxBinder` justifiait la liaison manuelle par deux
  raisons, dont « émettre un event d'attache **jetterait** pour les éléments que
  le catalogue construit avant de les attacher ». **Cette raison a disparu** :
  `Element.handle()` reste désormais silencieux quand l'élément n'a pas
  d'application. Il ne reste que la seconde (`_streamAreas` ne tourne pas dans un
  hôte sans personnage) — le docblock a été mis à jour en conséquence.
- **Coût du non-fait** : la liaison FX reste **explicite et à la charge de
  l'hôte** alors que la libération, elle, est devenue automatique — une asymétrie
  qui se paiera dès qu'une entité apparaîtra en cours de partie (un projectile,
  un butin lâché) et qu'il faudra penser à la lier à la main. La décision :
  ajouter `element.attach` et rendre `FxBinder.bind` automatique, ou assumer
  l'asymétrie en l'écrivant comme un choix.
