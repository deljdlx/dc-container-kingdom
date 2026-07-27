# Pièces centrales du moteur sans aucun test

- **Origine** : `2026-07-27_10-20`
- **Constat** : en éprouvant les commandes de la recipe `audit-codebase`, le diff
  sources / tests sort des pièces centrales sans fichier de test :
  `Application`, `Area`, `AreaRenderer`, `CharacterRenderer`, entre autres.
  Mesuré, pas supposé — la commande est dans la recipe.
- **Recouvrement** : `2026-07-26_14-31` couvre déjà `Viewport`, `Board` et
  `SceneGraph`, mais **pas** ces fichiers-là. Au tri de trancher : élargir ce
  ticket existant, ou en ouvrir un distinct.
- **Coût du non-fait** : `Application` est le point d'entrée du moteur et `Area`
  porte le tuilage — deux pièces qu'on refactore en aveugle aujourd'hui. Les deux
  derniers bugs de collision trouvés cette semaine venaient de cette zone.
