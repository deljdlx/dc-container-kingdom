---
id: 2026-08-06_17-57
title: Le canvas ne sait dessiner que des particules — il manque la couche du temporaire
type: feat
branch:
created: 2026-08-06 17:57
ready:
doing:
verify:
done:
---

## Objectif

La règle de routage (`2026-08-06_17-56`) envoie **tout ce qui est temporaire par
conception** sur le canvas. Le moteur ne sait pas le faire.

Constaté le 2026-08-06 : les deux surfaces FX ne dessinent **que des particules**
— `ParticleLayer.render()` parcourt le `ParticleSystem` et peint des disques à
dégradé radial (`_spriteFor`), avec un `fillRect` en secours. Et leur contexte 2d
est **privé** (`_context`) : aucun hôte, aucun sous-système ne peut y dessiner
autre chose.

Conséquences immédiates :

- **un projectile ne peut pas être un sprite** — au mieux un point flou ;
- **une explosion animée est impossible** : ni planche de sprites, ni rotation,
  ni échelle ;
- le projectile de la démo est donc en **DOM**, à contre-sens de la règle.

## Spécifications

_Amorce — à confirmer en « specify »._

### Ce qu'il faut, au minimum

Une **liste de dessin** sur chaque surface, à côté des particules : des objets
temporaires qui savent se peindre, parcourus et effacés à chaque frame comme
elles, dans les mêmes coordonnées monde et avec le même `applyToContext`.

```js
layer.draw(sprite);      // ajouté pour cette frame, ou tant qu'il vit
```

Le minimum utile pour un projectile et une explosion :

- **une image** (atlas + cadre, comme `SpriteElement` côté DOM) ;
- **position monde, taille, rotation** ;
- **un cadre d'animation** qui avance avec le temps, pour l'explosion.

### Ce qui doit rester vrai

- **Les deux surfaces existantes ne changent pas de rôle** : `ground` sous les
  entités, `above` au-dessus. Un projectile va sur `above`, une décalque au sol
  sur `ground`.
- **Le culling** (`isVisible`) et le **budget** doivent valoir pour ces objets
  aussi : c'est la moitié de l'intérêt du canvas.
- **La détection reste indépendante du rendu.** `queryRect` / `sweepRect`
  prennent des **rectangles monde**, pas des `Element` : un projectile canvas —
  un simple `{x, y, vx, vy}` dans un tableau — peut déjà demander au monde ce
  qu'il croise, sans scene-graph ni DOM. Ce ticket ne doit rien y changer.

### Ce qu'on ne fait pas

Pas de moteur d'animation général, pas de tweening, pas de système de
particules-sprites. Le strict nécessaire pour qu'un projectile et une explosion
vivent hors du DOM.

## Firewalls / risques

1. **Le canvas est effacé et repeint à chaque frame** ; une liste de dessin
   longue coûte linéairement. Mesurer avec 100 objets, écrire la limite.
2. **Le chargement des images** : le DOM les résout tout seul, le canvas non.
   Prévoir le cas « pas encore chargée » sans faire clignoter ni jeter.
3. **Ne pas rouvrir la question de la profondeur** : dans une surface canvas
   l'ordre est celui du dessin, pas un z-index. Un projectile ne peut pas passer
   *entre* deux éléments DOM — c'est la limite assumée des deux surfaces
   (`2026-08-02_18-56`), et elle vaut toujours.
4. **Le contexte doit rester encapsulé** : exposer `getContext()` inviterait les
   hôtes à peindre n'importe quoi n'importe quand, hors de la boucle.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-06**, `080-done` compris.
- `src/engine/fx/ParticleLayer.js` — `render()`, `_spriteFor()`, `_context`.
- `src/engine/fx/ParticleSystem.js` — le seul contenu dessinable aujourd'hui.
- `src/engine/scene/WorldQuery.js` — la détection, déjà indépendante du rendu.
- `src/engine/demo/demo.js` — le projectile DOM à rebasculer.
- La règle qui motive ce ticket : `2026-08-06_17-56`.

## Definition of Done

- [ ] Une surface FX sait dessiner autre chose qu'une particule : **un sprite
      positionné en coordonnées monde**, taille et rotation comprises.
- [ ] Une **explosion animée** (cadres qui avancent avec le temps) tient sans
      classe dédiée dans le moteur.
- [ ] **Le projectile de la démo passe sur le canvas** — plus aucun `Element` DOM
      pour un objet temporaire. C'est le critère qui fait foi.
- [ ] Le culling hors écran et le budget s'appliquent à ces objets.
- [ ] **Coût mesuré** avec 1, 10 et 100 objets temporaires.
- [ ] `sweep()` continue de servir un projectile qui n'est **pas** un `Element`
      (test).
- [ ] `meta/documentation/engine.md` §3.2 à jour ; `npm run verify` vert.

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
