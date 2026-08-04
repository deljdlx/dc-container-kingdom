# `board.getDom()` ne rend pas la vraie racine du board

- **Origine** : 2026-08-03_19-11.
- **Constat** : `Element` garde `this.dom` synchronisé via `setRenderer()`, mais
  le `Board` fait `this.renderer = new BoardRenderer(this)` **en assignation
  directe** (`Board.js`, constructeur). `this.dom` reste donc le nœud du renderer
  générique créé par `super()`, tandis que la vraie racine est
  `board.getRenderer().getDom()`. Mesuré en vérifiant un montage :
  `board.getDom().contains(noeudDuJoueur)` rend **false** alors que le nœud est
  bel et bien dans la racine.
- **Coût du non-fait** : deux nœuds prétendent être le board, et l'API publique
  (`getDom()`) rend le mauvais. Toute vérification, tout hôte, tout test qui passe
  par `getDom()` sur le board obtient une réponse fausse — ça m'a coûté une
  fausse piste pendant cette enquête, ça en coûtera d'autres.
- **La décision** : passer par `setRenderer()` dans le `Board` (et vérifier que
  `registerEvents()` rejoué ne double pas les écouteurs), ou documenter que sur le
  board il faut lire `getRenderer().getDom()` — la première option est la seule
  qui supprime le piège.
