# Lâcher la cible de la caméra n'a pas de nom

Trouvé en écrivant l'arène (`2026-08-11_08-55`).

`Camera.moveTo(x, y)` déplace la caméra **sans cesser de suivre** : la cible
réécrit la position à la frame suivante, et le `moveTo` semble simplement ne pas
avoir marché. Pour l'arrêter il faut deviner `follow(null)`.

Petit, mais c'est trente minutes perdues pour qui découvre l'API — et le
symptôme (« mon `moveTo` est ignoré ») n'oriente pas vers la cause.

Piste : un `unfollow()` explicite, ou un `moveTo` qui lâche la cible de lui-même
— à trancher, les deux sémantiques se défendent.
