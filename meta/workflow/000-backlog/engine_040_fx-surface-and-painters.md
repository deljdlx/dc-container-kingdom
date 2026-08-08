---
id: 2026-08-06_17-57
title: La surface FX cesse de savoir ce qu'est une particule
type: refactor
branch:
created: 2026-08-06 17:57
ready:
doing:
verify:
done:
---

## Objectif

`ParticleLayer` fait **deux métiers** dans une classe :

1. **posséder une surface** — dimensionner le canvas, appliquer la transformation
   caméra, effacer, tenir le ratio de pixels, se placer en coordonnées monde ;
2. **savoir dessiner des particules** — le cache de sprites, le dégradé radial,
   la courbe de fondu, le filtre par couche.

Le propriétaire de la surface connaît donc la **nature** de ce qu'elle porte. Tant
que les particules étaient le seul contenu, ça ne se voyait pas. La règle de
routage (`2026-08-06_17-56`) envoie désormais **tout ce qui est temporaire** sur
le canvas — projectiles, explosions, décalques — et la conflation devient
bloquante : il n'existe aucun moyen de dessiner autre chose qu'une particule, et
le contexte 2d est privé (`_context`).

C'est pour ça que le projectile de la démo est en **DOM**, à contre-sens de la
règle : le canvas ne pouvait pas l'accueillir.

## Spécifications

_Amorce — à confirmer en « specify »._

### La couture : une surface, des peintres

- Une **surface** qui ne sait que se dimensionner, se placer, appliquer la
  transformation, effacer — et parcourir une liste de **peintres**.
- **`ParticleSystem` devient un peintre**, pas le contenu privilégié.
- Le rendu des objets temporaires (un sprite positionné en monde) devient un
  **autre** peintre, ignorant tout des particules.

Deux responsabilités séparées, **une** surface partagée.

### L'isolation d'état, sans surface supplémentaire

Le seul avantage réel qu'apporterait un canvas dédié est d'empêcher un peintre
d'en corrompre un autre : `render()` manipule `globalAlpha` et la matrice, et un
peintre qui oublierait de restaurer casserait les suivants.

Ça s'obtient par un **`save()` / `restore()` autour de chaque peintre** — remède
standard, sans mémoire ni couche de compositing en plus. Une surface de plus, à
l'inverse, coûte un plein écran effacé et repeint chaque frame au
`devicePixelRatio` du mobile, **et** rouvre la question « à quel cran de
profondeur ? », qui n'a pas de bonne réponse (voir plus bas).

### Le premier consommateur

Le rendu d'un projectile : **un sprite en coordonnées monde**, avec taille et
rotation, et des cadres qui avancent avec le temps pour une explosion. Le strict
nécessaire — pas un moteur d'animation, pas de tweening.

C'est le **consommateur** du nouveau contrat, pas le sujet du ticket : s'il
demande de rouvrir la surface, c'est que la couture est mal placée.

### Décision prise : pas de troisième surface

Un canvas occupe **un cran de profondeur fixe**. Les deux surfaces encodent déjà
« sous les entités » (`ground`) et « au-dessus de tout » (`above`). Or « au niveau
des entités » n'est pas un cran mais une valeur **par élément**
(`DEPTH_BASE + offsetY + height`) : un missile à y = 300 doit passer derrière un
arbre à y = 350 et devant un à y = 250.

Donc **les projectiles vont sur `above`**, au prix — assumé et écrit — qu'ils
passent toujours au-dessus du décor. Ce qui rouvrirait le sujet n'est pas un
troisième canvas mais un **découpage par bandes de profondeur**, et seulement le
jour où la gêne se voit à l'écran. Un projectile qui doit vraiment s'intercaler
peut redevenir un `Element` DOM : la règle de routage est un défaut, pas une
police.

## Firewalls / risques

1. **Ne pas exposer le contexte.** `getContext()` public inviterait les hôtes à
   peindre hors de la boucle. Les peintres reçoivent le contexte pour la durée de
   leur passe, pas plus.
2. **Le repos doit rester gratuit.** L'optimisation actuelle — rien de vivant et
   rien de peint la frame d'avant → même pas de `clearRect` — doit survivre à la
   généralisation, sinon on paie une frame de canvas pour rien.
3. **Le culling et le budget** valent aussi pour les objets temporaires : c'est
   la moitié de l'intérêt du canvas.
4. **La détection reste indépendante du rendu.** `queryRect` / `sweepRect`
   prennent des **rectangles monde**, pas des `Element` : un projectile canvas —
   un simple `{x, y, vx, vy}` — interroge déjà le monde sans scene-graph ni DOM.
   Ce ticket ne doit rien y changer.
5. **Le chargement des images** : le DOM les résout seul, le canvas non. Prévoir
   « pas encore chargée » sans clignotement ni exception.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-06**, `080-done` compris.
- `src/engine/fx/ParticleLayer.js` — `render()`, `_spriteFor()`, `_context`.
- `src/engine/fx/ParticleSystem.js` — le futur premier peintre.
- `src/engine/scene/WorldQuery.js` — la détection, déjà indépendante du rendu.
- `src/engine/demo/demo.js` — le projectile DOM à rebasculer.
- La règle qui motive ce ticket : `2026-08-06_17-56`.
- La limite de profondeur, tranchée à l'origine : `2026-08-02_18-56`.

## Definition of Done

- [ ] La surface **ne référence plus `ParticleSystem`** : elle parcourt des
      peintres. C'est le critère du refactor.
- [ ] Chaque peintre est isolé par `save()` / `restore()` — un peintre qui laisse
      `globalAlpha` de travers ne casse pas les suivants (test).
- [ ] **Le repos reste gratuit** : rien de vivant → aucun `clearRect` (test, celui
      qui existe déjà doit continuer de passer).
- [ ] Un **sprite en coordonnées monde** se dessine, taille et rotation comprises.
- [ ] Une **explosion animée** tient sans classe dédiée dans le moteur.
- [ ] **Le projectile de la démo passe sur le canvas** — plus aucun `Element` DOM
      pour un objet temporaire.
- [ ] `sweep()` sert toujours un projectile qui n'est **pas** un `Element` (test).
- [ ] **Coût mesuré** avec 1, 10 et 100 objets temporaires.
- [ ] `meta/documentation/engine.md` §3.2 décrit la surface et ses peintres ;
      `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
