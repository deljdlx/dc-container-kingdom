# Le balayage de montage parcourt tout le board à chaque frame de marche

- **Origine** : 2026-08-04_17-15.
- **Constat** : `BoardRenderer.mountPending()` parcourt **toutes les areas et
  tous leurs enfants** pour trouver ce qui n'est pas encore rendu (`isRendered()`).
  Depuis que bouger salit le nœud, le joueur salit la racine à chaque pas, donc le
  board se repeint — et le balayage tourne **exactement une fois par frame** de
  marche (mesuré le 2026-08-04). C'est devenu le poste principal du parcours :
  2,4 nœuds visités par frame, mais un balayage complet derrière.
- **Coût du non-fait** : O(areas × enfants) par frame là où le travail réel est
  O(nouveaux nœuds). Sur la démo (49 areas, ~300 éléments) ça reste sous 0,34 ms,
  donc invisible aujourd'hui ; ça grandit avec la carte, et c'est exactement le
  genre de coût qui se découvre quand il est trop tard.
- **La décision** : tenir une **liste des éléments en attente de montage**
  (remplie à l'attache, vidée au montage) plutôt que de balayer — ou mesurer sur
  une carte dense et décider que le balayage suffit.
