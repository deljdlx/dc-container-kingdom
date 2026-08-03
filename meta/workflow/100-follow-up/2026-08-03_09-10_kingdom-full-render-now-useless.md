# Container Kingdom re-rend tout à chaque rafraîchissement, sans plus en avoir besoin

- **Origine** : 2026-08-02_20-45.
- **Constat** : `ContainerKingdom.js:70` et `:88` appellent
  `viewport.render()` — un **re-rendu complet** — après chaque rafraîchissement
  de la liste des conteneurs. C'était la parade au défaut que ce ticket vient de
  corriger : attacher un élément ne le faisait pas apparaître. Le parcours par
  frame s'en charge désormais tout seul.
- **Coût du non-fait** : aucun bug — c'est du travail inutile, pas un défaut de
  comportement. Mais l'app repeint tout un royaume (535 éléments, 49 areas) à
  chaque cycle de rafraîchissement là où quelques nœuds suffiraient, et le code
  garde une ligne dont la raison d'être a disparu — donc que le prochain lecteur
  croira nécessaire.
- **La décision** : retirer les deux appels et vérifier au navigateur que les
  conteneurs apparaissent/disparaissent toujours correctement, ou constater qu'ils
  couvrent encore un cas (un conteneur qui change d'area ?) et l'écrire.
