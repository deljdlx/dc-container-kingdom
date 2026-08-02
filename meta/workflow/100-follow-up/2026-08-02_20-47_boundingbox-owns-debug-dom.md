# `BoundingBox` fait des maths et du DOM de debug

- **Origine** : audit du 2026-08-02 (périmètre : noyau du moteur).
- **Constat** : `src/engine/scene/BoundingBox.js` (281 lignes) est la primitive
  géométrique du moteur — intersections, boîtes agrégées — mais porte aussi un
  champ `dom` et fait `this.dom.classList.toggle('collided', value)` dans
  `collided()`. La géométrie pure et l'affichage de debug vivent dans la même
  classe.
- **Coût du non-fait** : la collision par paires (étape 4 de la feuille de route)
  voudra faire de la géométrie **par lots, hors DOM** — un balayage continu, une
  grille spatiale. Une primitive qui touche `classList` à chaque changement d'état
  ne se prête ni au batch ni au test sans jsdom. Ce n'est pas un bug aujourd'hui
  (le champ `dom` est absent hors debug, donc le `if` protège), c'est une gêne
  qui se paiera au moment précis où la géométrie deviendra chaude.
- **La décision** : extraire le rendu de debug (un observateur du drapeau
  `collided`, comme la console d'events observe le bus), ou assumer et l'écrire.
