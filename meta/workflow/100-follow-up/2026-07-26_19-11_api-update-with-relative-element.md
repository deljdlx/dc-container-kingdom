# `updateWithRelativeElement` grossit la mauvaise boîte

- **Origine** : `2026-07-26_18-55`
- **Constat** : `BoundingBox.updateWithRelativeElement(parent, child)` ne modifie
  **pas la boîte réceptrice** mais celle qu'elle atteint via
  `parent.getCollisionBoundingBox()`. Sur le chemin incrémental les deux sont le
  même objet, donc le piège est invisible ; dans `recomputeAggregates` la boucle
  sur les enfants mutait l'ancienne boîte, aussitôt remplacée — les enfants
  n'étaient donc **jamais** repliés dans l'enveloppe recalculée. Bug réel, trouvé
  par la mesure, contourné par un ordre d'appel + un commentaire, **pas réparé**.
- **Coût du non-fait** : une méthode dont le receveur n'est pas ce qu'elle modifie
  reste un piège pour tout appel futur ; celui-ci a déjà coûté un bug silencieux.
  Le contournement tient par un commentaire, c'est-à-dire par la vigilance du
  prochain lecteur.
