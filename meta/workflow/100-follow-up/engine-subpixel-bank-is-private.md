# La banque de sous-pixels est privée au viewport — tout le reste est figé

Trouvé en écrivant l'arène (`2026-08-11_08-55`).

`Coordinates` **arrondit chaque écriture** au pixel. Le `Viewport` le sait et
met le reste en banque pour le joueur (« sous un pixel par frame, chaque frame
arrondissait à zéro : le personnage ne partait jamais »).

Mais cette banque est **dans la boucle, pour le joueur seul**. Tout autre mobile
lent doit la réécrire : mes assaillants avancent à 14 px/s, soit 0,23 px par
frame, et sont restés **parfaitement immobiles** — position réécrite, arrondie,
inchangée, indéfiniment. Rien ne prévient : ni erreur, ni ralentissement, juste
un objet qui ne bouge pas.

Ce qui manque est une primitive : « avance cet élément de `dx, dy` en gardant le
reste ». Elle existe déjà à moitié dans `Character.moveBlocked`, qui prend des
entiers.

À noter : `2026-07-26_14-25` (le déplacement vers une cible, mort et faux) a
exactement le même défaut — un pas par frame, pas de reste — donc les deux se
traitent probablement ensemble.
