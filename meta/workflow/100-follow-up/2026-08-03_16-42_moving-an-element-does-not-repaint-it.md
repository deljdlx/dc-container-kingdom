# Déplacer un élément ne le repeint pas — le chaînon manquant avant les projectiles

- **Origine** : 2026-08-03_16-30.
- **Constat**, mesuré au navigateur : `Renderer.prototype.update()` est
  littéralement `update() { }`. Le positionnement (`style.top`, `style.left`,
  `zIndex`) vit dans **`render()`**. Donc :

  | geste | nœud DOM |
  |---|---|
  | `e.y(900)` (l'élément était à 400) | `top: 400px` — inchangé |
  | `e.y(900)` + `needUpdate(true)` + une frame | `top: 400px` — **toujours** |
  | `e.render()` | `top: 900px` |

  Un `Character` s'en sort parce qu'il repeint **lui-même** dans son `update()`
  (`Character.js`). Un `Element` nu, non.
- **Coût du non-fait** : une entité qui bouge est invisible là où elle est. Un
  projectile lancé traverserait la carte **sans jamais quitter son point de
  départ à l'écran**. C'est le dernier obstacle mécanique avant l'étape 5, et il
  rend le drapeau de redessin à moitié menteur : le parcours vient bien jusqu'au
  nœud sale, et n'en fait rien.
- **La décision** : faire de `Renderer.update()` le repositionnement (ce que le
  pipeline de drapeau laisse attendre — mais il faut mesurer, il tournerait pour
  chaque nœud sale), ou assumer que bouger se dit `render()` et l'écrire partout
  où on parle de mouvement.
