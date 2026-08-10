---
id: 2026-08-06_17-57
title: La surface FX cesse de savoir ce qu'est une particule
type: refactor
branch: claude/fx-painters
created: 2026-08-06 17:57
ready: 2026-08-10 17:00
doing: 2026-08-10 17:05
verify: 2026-08-10 20:25
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

### La couture, tranchée

- **`FxSurface`** — la surface seule : dimension, placement, transformation,
  effacement, et un parcours de **peintres**. Elle ne connaît ni particule ni
  sprite.
- **`ParticlePainter`** — le dessin des particules d'aujourd'hui, extrait tel
  quel (cache de sprites, fondu, filtre par couche).
- **`SpritePainter`** — le nouveau : des objets temporaires en coordonnées
  monde, que l'hôte mute lui-même.
- **`ParticleLayer` reste**, mais devient un **assemblage** : une `FxSurface`
  qui se monte un `ParticlePainter`. C'est le cas courant, et le garder évite de
  réécrire l'`Emitter`, le `FxBinder` et leurs tests pour un renommage. La
  surface, elle, ne référence plus `ParticleSystem` — ce qui est le critère.

### Ce que le peintre doit savoir faire

```js
painter.hasWork()             // rien à peindre → la surface reste au repos
painter.paint(context, transform)
```

`SpritePainter` porte une liste d'objets **plats**, que l'hôte crée et déplace :

```js
const bolt = painter.add({ x, y, width: 8, height: 8, color: '#ffd166', shape: 'circle' });
bolt.x += 15;                 // c'est l'hôte qui anime — l'ordonnanceur est là pour ça
painter.remove(bolt);
```

Ni animation ni tweening dans le moteur : l'ordonnanceur (`2026-08-08_17-56`)
vient d'arriver pour ça, et une explosion est un `tween` qui grossit un cercle.

### Le chargement des images

Un objet peut porter une `image` déjà résolue. Tant qu'elle n'est pas complète,
**elle est sautée** — pas d'exception, pas de clignotement, et le moteur ne
gère pas de file de chargement (ce serait un autre ticket, et il n'existe pas
encore de préchargeur).



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

- [x] La surface **ne référence plus `ParticleSystem`** : elle parcourt des
      peintres. C'est le critère du refactor.
- [x] Chaque peintre est isolé par `save()` / `restore()` — un peintre qui laisse
      `globalAlpha` de travers ne casse pas les suivants (test).
- [x] **Le repos reste gratuit** : rien de vivant → aucun `clearRect` (test, celui
      qui existe déjà doit continuer de passer).
- [x] Un **sprite en coordonnées monde** se dessine, taille et rotation comprises.
- [x] Une **explosion animée** tient sans classe dédiée dans le moteur.
- [x] **Le projectile de la démo passe sur le canvas** — plus aucun `Element` DOM
      pour un objet temporaire.
- [x] `sweep()` sert toujours un projectile qui n'est **pas** un `Element` (test).
- [x] **Coût mesuré** avec 1, 10 et 100 objets temporaires.
- [x] `meta/documentation/engine.md` §3.2 décrit la surface et ses peintres ;
      `npm run verify` vert.

## Suite

- **La règle DOM/canvas peut enfin s'écrire** (`2026-08-06_17-56`, le ticket
  suivant) : elle avait pour firewall « ne pas énoncer une règle que le moteur ne
  peut pas tenir ». Il peut, maintenant.
- **Le `ttl` de `spawn` n'a plus d'utilisateur dans la démo** — le projectile
  n'est plus une entité. Il reste juste et testé pour ce qu'il vise vraiment :
  une entité DOM temporaire (un butin qui s'efface, un piège qui expire).
- **Pas de préchargeur d'images.** `SpritePainter` saute une image incomplète
  plutôt que d'attendre ; le jour où un hôte dessinera de vrais sprites au
  canvas, il lui faudra un chargeur — ce sera un ticket, et il n'existe pas.
- Rien à déposer en `100-follow-up/`.

## Journal

### Travail

- [2026-08-10 17:05] Branche `claude/fx-painters`. `FxSurface` extraite de
  `ParticleLayer` : dimension, placement, transformation, effacement, parcours de
  peintres. Un peintre répond `hasWork()` et `paint(context, transform)`, et
  reçoit `attach(surface)` en rejoignant — de quoi cuire ses sprites hors écran
  sans que la surface sache pourquoi.
- [2026-08-10 17:20] `ParticlePainter` : le dessin des particules, déplacé tel
  quel. `SpritePainter` : le nouveau, des objets **plats** en coordonnées monde
  que l'hôte mute lui-même — position, taille, rotation, alpha, couleur ou image.
- [2026-08-10 17:30] **`ParticleLayer` reste, en assemblage** (`extends FxSurface`
  + son peintre). C'était le choix le moins coûteux et le plus honnête : le cas
  courant garde son API (`emit`, `update`, `getSystem`), l'`Emitter`, le
  `FxBinder` et leurs tests n'ont pas bougé d'une ligne — et la **surface**, elle,
  ne référence plus `ParticleSystem`, ce qui est le critère du ticket.
- [2026-08-10 17:40] La démo : le projectile **n'est plus un `Element`**. Ni nœud
  DOM, ni scene-graph, ni `spawn` — un `{x, y}` peint au canvas et déplacé par
  l'ordonnanceur. Son explosion est un `tween` qui grossit un cercle et le fait
  disparaître : **aucune classe « explosion » dans le moteur**. La classe CSS
  `.demo-bolt`, devenue morte, est supprimée.

### Vérification

`npm run verify` vert : **70 fichiers, 609 tests** (15 nouveaux).

**Le refactor est transparent** : les 594 tests existants sont passés sans une
modification, avant même que le premier nouveau test soit écrit.

Mesures au navigateur (`/engine/demo/`, boucle pilotée à la main) :

| | |
|---|---|
| peintres montés sur la surface | `ParticlePainter`, `SpritePainter` |
| après un tir | **1 sprite canvas, 0 nœud DOM**, entités inchangées (3) |
| vitesse du projectile | 14 px/frame (900 px/s au `dt` près) |
| pixels non transparents sur le canvas | 0 → **130** pendant le vol → 0 après |
| explosion | vue (le cercle passe de 8 à 52 px), disparue en 26 frames |
| nœuds `.demo-bolt` restants | **0** |

**Coût, rendu d'une frame, moyenne sur 200 passes** — les objets bougent à chaque
frame, comme de vrais projectiles :

| objets temporaires | canvas | DOM (parcours moteur seul) |
|---|---|---|
| 1 | 0,064 ms | 0,022 ms |
| 10 | 0,093 ms | 0,043 ms |
| 100 | **0,150 ms** | **0,282 ms** |

À lire honnêtement : le canvas part avec un coût fixe (effacer + la passe
particules, que la démo ne met jamais au repos — ses fontaines émettent en
permanence) et grimpe à peine ; le DOM part deux à trois fois moins cher et
**double tous les dix objets**. Le croisement est vers la dizaine. Et la colonne
DOM ne compte que le **script** : le layout du navigateur, non mesuré ici, est ce
qui franchit le budget d'une frame vers 1 000 éléments (passe d'audit B).

Les trois hôtes chargés sans erreur console.

### Validation

- Fusionné sur `main` en `--no-ff`.
