# Une zone créée sans dimensions fige la taille de l'élément

- **Origine** : passe d'audit A du 2026-08-06.
- **Constat** : `element.createCollisionZone()` sans arguments crée une zone
  amorcée sur la géométrie de l'élément **au moment de l'appel**. Mesuré : un
  élément de 40×40 dont on crée la zone sans dimensions, puis qu'on redimensionne
  à 120×120, garde une zone de **40×40**. Rien ne le dit — le JSDoc ne promet ni
  ne dément le suivi.
- **Coût du non-fait** : aucun aujourd'hui — personne n'appelle
  `createCollisionZone()` sans dimensions dans le dépôt, toutes les zones sont
  explicites. Mais la signature invite à l'omission (les quatre paramètres sont
  optionnels), et le premier qui s'en sert sur un élément redimensionnable
  obtiendra une hitbox silencieusement fausse.
- **La décision** : documenter que les dimensions omises sont **capturées** et non
  suivies, ou les faire suivre (ce qui rejoint
  `2026-08-06_11-28` sur la propagation), ou retirer les valeurs par défaut pour
  forcer l'explicite.
