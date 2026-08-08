# Déplacer les PNJ au `dt`, comme le joueur

Déposé à la clôture de `2026-08-08_17-55` (l'horloge du moteur).

Les behaviors déplacent les PNJ par **pas de 4 px toutes les 60 ms** (patrouille)
ou 100 ms (errance) — soit un sixième des frames. C'est cette cadence grossière
que la transition CSS de `character.css` masque, et c'est pour elle que
l'horloge doit maintenant dicter au navigateur une durée de transition
(`--engine-step-duration`).

Le joueur, lui, ne connaît pas ce problème : il avance de `dt × vitesse` pixels
avec mise en banque du sous-pixel, donc **chaque frame**, et il est en
`transition: none`.

Si les behaviors adoptaient la même primitive, la transition CSS n'aurait plus
rien à masquer : on pourrait la supprimer, et avec elle la seule source de temps
que le moteur ne possède pas.

À peser : la cadence sert peut-être aussi le *comportement* (une IA qui décide
16 fois par seconde plutôt que 60). Déplacement et décision peuvent se séparer —
décider à la cadence, se déplacer au `dt`.
