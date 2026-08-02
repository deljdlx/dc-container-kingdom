# `map.update` est du mauvais côté de la règle du bus

- **Origine** : 2026-08-02_19-30
- **Constat** : le ticket du bus a écrit la règle — le bus porte les **faits de
  jeu**, pas les **pas de simulation**. `map.update` est émis par `Viewport`
  à **chaque frame où le joueur se déplace** (`moveCharacter`), donc ~60 fois par
  seconde de marche, avec un payload alloué à chaque fois. Il a été **conservé
  tel quel** parce que `ContainerKingdomLayout.js` s'y abonne pour se
  resynchroniser.
- **Coût du non-fait** : le seul contre-exemple vivant de la règle qu'on vient
  d'écrire reste dans le catalogue, où il se lit comme un modèle à copier. Avec
  des projectiles, le réflexe « j'émets à chaque frame » coûtera cher — et la
  console d'events le noiera. La décision à prendre : le retirer du bus au profit
  d'un abonnement direct au `Viewport` (ce que Container Kingdom veut vraiment),
  le renommer pour dire qu'il est à part, ou assumer l'exception et l'écrire.
