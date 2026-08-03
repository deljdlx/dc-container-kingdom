# Un élément détruit garde un pointeur vers son ex-parent

- **Origine** : 2026-08-03_09-32.
- **Constat** : trouvé en écrivant les tests du nettoyage DOM. Après
  `child.destroy()`, le parent ne liste plus l'enfant (`getChildren()` est vide),
  mais **`child.getParent()` renvoie toujours le parent** : `SceneGraph.reset()`
  ne vide que le lien descendant. Le test qui l'affirmait a échoué, l'assertion a
  été corrigée plutôt que le code — c'était hors périmètre du ticket.
- **Coût du non-fait** : un nœud mort retient son ancien sous-arbre par le haut,
  donc rien de ce à quoi il donne accès (`getBoard()`, `offsetX()`, la chaîne de
  parents) n'est collectable tant qu'on le référence. Surtout, il **répond
  encore** : `offsetX()` d'une entité détruite remonte une chaîne fantôme et rend
  une position plausible. Avec des projectiles qui meurent en vol et des abonnés
  qui les tiennent une frame de trop, c'est le genre de valeur fausse qu'on
  cherche longtemps.
- **La décision** : couper le lien remontant dans `destroy()` (et décider ce que
  `getParent()`/`offsetX()` répondent alors), ou l'assumer et l'écrire —
  « un élément détruit reste lisible » est un contrat défendable, à condition
  qu'il soit choisi.
