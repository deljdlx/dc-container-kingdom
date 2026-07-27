# La cadence de marche suit la fréquence d'écran

- **Origine** : `2026-07-26_14-23`
- **Constat** : `CharacterAnimator.advance()` compte des **appels**, pas du temps.
  `Character.update()` étant appelé une fois par frame où le personnage avance,
  la vitesse de l'animation suit le taux de rafraîchissement. Mesuré après la
  correction du déplacement, sur 960 ms simulées à `speed = 300` : distance
  identique (287 px) à 16 / 8 / 4 ms, mais **60 / 120 / 240** avances d'animation
  — soit une marche **4× plus rapide** à 250 Hz qu'à 60 Hz.
- **Coût du non-fait** : le déplacement est maintenant indépendant de l'écran,
  l'animation non — les jambes du personnage s'agitent en accéléré sur un écran
  144/240 Hz pendant qu'il avance à la bonne vitesse. Le décalage est plus visible
  qu'avant, puisque les deux ne bougent plus ensemble.
- **Piste** : cadencer l'animation sur le **temps** (accumuler `dt`) ou sur la
  **distance parcourue** (avancer d'une frame tous les N pixels) plutôt que sur le
  nombre d'appels. La seconde est naturellement indépendante de la fréquence et
  colle au ressenti « les pas suivent la marche ».
- **À arbitrer** : `advance(tickInterval)` est l'API publique de
  `CharacterAnimator`, et les PNJ (`PatrolBehavior`, `FleeBehavior`) passent par
  le même chemin — la correction dépasse le seul joueur.
