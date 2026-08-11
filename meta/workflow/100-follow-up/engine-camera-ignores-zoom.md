# La caméra centre sa cible en pixels CSS, en ignorant le zoom

Trouvé en écrivant l'arène (`2026-08-11_08-55`), et **c'est le bug que l'humain a
signalé à l'écran** : « on ne voit pas le personnage au début, il faut le
déplacer ».

`Camera.update()` centre sa cible ainsi :

```js
this._x = target.x() + target.width() / 2 - this._viewportWidth / 2;
```

`_viewportWidth` est la largeur du viewport en **pixels CSS**, alors que le monde
est dessiné à travers `ViewportTransform.scale()`. À l'échelle 1 les deux
coïncident, et c'est le cas des trois premiers hôtes. À l'échelle 2,7 — ce qu'un
écran de téléphone impose pour des sprites de 32 px — le centrage est faux du
facteur de zoom : mesuré, le héros atterrit à `y = 840` dans un cadre de 862 px
de haut, c'est-à-dire hors champ jusqu'à ce qu'on le déplace.

La largeur du monde visible est `viewportWidth / scale`, pas `viewportWidth`.

Deux questions à trancher : la caméra doit-elle connaître le transform (elle en
est aujourd'hui découplée, à dessein), ou le viewport doit-il lui passer la
taille visible en unités monde ?

Contournement de l'arène : ne pas suivre du tout (`follow(null)`), ce qu'un jeu à
écran fixe peut se permettre — pas un jeu qui scrolle.
