# Le CSS du moteur ne pixelise pas au zoom

Repéré en spécifiant l'arène (`2026-08-11_08-55`).

`image-rendering: pixelated` n'existe que dans `catalog.css`. Or dès qu'un hôte
zoome — ce qu'un écran de téléphone impose pour des sprites de 32 px —
l'interpolation par défaut du navigateur transforme le pixel art en bouillie.

L'arène le pose elle-même sur son conteneur. La question est de savoir si c'est
au moteur de le faire (il livre les sprites et connaît leur nature) ou à l'hôte
(c'est une décision de rendu, et un hôte pourrait vouloir du lissage).
