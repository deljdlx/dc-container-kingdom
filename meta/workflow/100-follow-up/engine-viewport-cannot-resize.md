# Le viewport ne sait pas se redimensionner — donc pas de rotation

Repéré en spécifiant l'arène (`2026-08-11_08-55`), confirmé en l'écrivant.

`Viewport` prend sa taille à la construction et rien ne la reprend : pas de
`resize()`, aucune écoute de `resize` / `orientationchange`. L'arène calcule son
échelle **une fois**, au chargement, à partir de `window.innerWidth/innerHeight`.

Conséquence pour un hôte qui se dit mobile : passer le téléphone en paysage
laisse un plateau dimensionné pour le portrait, jusqu'au rechargement.

Ce que ça demanderait : redimensionner le conteneur, les surfaces FX (qui savent
déjà le faire) et re-décider l'échelle — et surtout **écrire ce que la caméra
devient** quand la fenêtre change de forme.
