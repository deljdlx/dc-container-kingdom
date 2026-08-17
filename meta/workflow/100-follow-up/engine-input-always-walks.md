# Les entrées directionnelles déplacent toujours le joueur

Trouvé en écrivant le dernier carré (`2026-08-17_18-10`).

`Viewport.update()` fait avancer le personnage principal dès qu'une direction est
tenue. Le couplage est **dans la boucle** : il n'existe aucun moyen de dire
« j'utilise les entrées, mais je ne veux pas que tu déplaces mon héros ».

L'arène lit le vecteur de `DirectionalInput` comme une **visée** — le héros est
censé pivoter sans bouger. Le moteur, lui, a continué de le faire marcher : il
est sorti par le haut de la carte, la vague à ses trousses, et toutes les mesures
d'équilibrage faites avant le diagnostic étaient fausses.

Contournement de l'hôte : `character.moveSpeed(0)`, qui marche parce que la
boucle dépense `dt × moveSpeed`. C'est un effet de bord, pas une intention.

Deux pistes : un `viewport.setPlayerControlled(false)` explicite, ou — plus
propre — sortir le déplacement du joueur de la boucle vers un **behavior** que
l'hôte compose ou non, comme tout le reste. La seconde rendrait le viewport
cohérent avec sa propre architecture : les PNJ sont déjà pilotés par des
behaviors interchangeables, le joueur est le seul cas câblé en dur.
