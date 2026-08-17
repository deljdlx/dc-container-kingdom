---
id: 2026-08-17_18-10
title: Le gameplay devient un dernier carré — un héros fixe qui oriente son tir
type: feat
branch:
created: 2026-08-17 18:10
ready:
doing:
verify:
done:
---

## Objectif

L'arène (`2026-08-11_08-55`) a livré une défense en couloirs façon *plantes contre
zombies*. Le gameplay est abandonné — décision du 2026-08-17, prise en jouant :
le héros n'y était qu'un curseur ambulant, et **espace ne tirait pas**, ce qui
dit assez que le joueur attendait d'être un combattant.

À la place, un **dernier carré** : un héros seul, **fixe** au bas du terrain, qui
**oriente** son tir pendant que les vagues descendent sur lui.

Le fond du jeu ne change pas — des vagues arrivent, il faut tenir — mais le geste
du joueur change complètement, et c'est lui qui compte.

## Spécifications

### Le geste, qui est tout le jeu

**Le pad ne déplace plus : il vise.** Le héros ne bouge pas d'un pixel ; il
pivote. Son tir part **tout seul**, sur la cible la plus proche **dans l'arc
qu'il regarde**. Tourner le dos à un flanc, c'est le laisser passer.

```
        ╱  arc de tir  ╲
┌──────╱──────────────╲──┐
│  z ╱      z         ╲ │
│   ╱          z      ╲│   z  ← ignoré : hors de l'arc
│  ╱   z              ╱│
│ ╲                   ╱ │
│  ╲        ↑        ╱  │
│            @          │  ← il pivote, il ne bouge pas
└───────────────────────┘
```

Une seule entrée, lisible au pouce, et une décision permanente : **quelle menace
je couvre, et laquelle j'accepte de laisser venir**. C'est ce qui empêche le
« fixe + tir automatique » d'être un jeu qui se joue tout seul.

### Ce que ça donne, précisément

| | |
|---|---|
| terrain | un écran, portrait, pas de scroll ; le héros au **bas-centre** |
| visée | le **vecteur** de `DirectionalInput`, **mémorisé** : on garde le cap quand on relâche |
| arc | demi-angle 45° (cône de 90°), plus une portée |
| tir | automatique, cadence fixe, sur la **plus proche** cible du cône |
| assaillants | descendent du haut sur tout le front, puis **convergent** sur le héros |
| types | 2 : un rapide et fragile, un lent et coriace — pour que les PV comptent |
| défaite | le héros a des **PV** ; ils le frappent au contact, zéro PV = fin |
| progression | tuer rapporte ; **entre les vagues**, on achète (cadence, dégâts, arc, portée, PV) |

**Hypothèses prises** faute de réponse, à corriger d'un mot si elles déplaisent :
les PV plutôt qu'une ligne au sol (le héros **est** l'objectif ; une ligne serait
contournable par les bords), et les améliorations entre les vagues plutôt qu'une
survie nue (un second axe de décision pour presque rien, l'état existe déjà).

### La visée, techniquement

`DirectionalInput.getVector()` rend déjà un vecteur **unitaire**, diagonales
comprises. On le lit comme une **visée** et non comme un déplacement, et on le
**retient** : relâcher ne remet pas le cap à zéro. Huit directions au pad, ce qui
suffit largement pour un cône de 90°.

Mais **le sprite n'a que quatre faces** (`up`, `down`, `left`, `right` dans
`CharacterRenderer`). Le cône est donc continu tandis que l'affichage s'aligne
sur la face la plus proche : viser en haut-à-gauche montre un héros de profil.
Acceptable, et à écrire ; en faire autre chose demanderait une planche de sprites
à huit faces, qui n'existe pas.

### Ce qui disparaît

Les plantes, les graines, les couloirs, le coût de pose, la ligne au sol. Le
`Sunflower00` / `Toadstool01` posés par le héros n'ont plus de rôle. **Supprimer,
pas commenter.**

### Ce qui reste au chaud, volontairement

L'état du jeu demeure **local à l'hôte** (des `Map`, des compteurs) : le
remplacer par le contrat du moteur est le travail de la tranche de combat
(`2026-08-08_17-58`), et **la friction de ce remplacement est la mesure**. Ne pas
la lui voler.

## Firewalls / risques

1. **Le jeu ne doit pas se jouer tout seul.** C'est le risque n° 1 de ce
   gameplay : si l'arc est trop large, ou la portée trop longue, l'orientation
   cesse d'être un choix. Régler pour qu'**on ne puisse pas tout couvrir** — le
   cône doit laisser passer.
2. **Un héros fixe n'exerce plus la pile de déplacement** (`moveBlocked`, banque
   de sous-pixels, animation à la distance, collisions du joueur). C'est une
   perte réelle par rapport à `2026-08-11_08-55`, assumée : la démo moteur les
   couvre toujours. À dire, pas à cacher.
3. **Les assaillants convergent, donc ils se déplacent en diagonale** — ils
   retombent en plein dans l'arrondi au pixel de `Coordinates`
   (candidat `engine-subpixel-bank-is-private`). L'hôte tient sa banque, comme
   déjà fait pour les couloirs.
4. **Un cône se teste par angle**, pas par rectangle : `board.query()` élague par
   rectangle, l'hôte filtre ensuite par angle. Ne pas demander au moteur une
   requête conique tant qu'une seule mesure ne le réclame pas.
5. **La boutique entre les vagues est une interface**, pas un détail : c'est le
   deuxième écran du jeu, et il doit rester jouable au pouce.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : décision de gameplay du 2026-08-17, prise avec l'humain après avoir
  joué `2026-08-11_08-55`.
- `src/arena/arena.js` — l'hôte à réécrire ; le tir et l'explosion au canvas, la
  cadence par `every()` et les couches y sont déjà et restent valables.
- `src/engine/view/DirectionalInput.js` — `getVector()`, la visée.
- `src/engine/render/CharacterRenderer.js` — les quatre faces du sprite.
- `src/engine/demo/demo.js` — le tir directionnel, modèle du projectile.
- Suite : `2026-08-08_17-58` (tranche de combat).

## Definition of Done

- [ ] Le pad **vise** et ne déplace plus ; le cap est **retenu** au relâchement.
- [ ] Le tir est automatique, borné par un **cône** et une portée, et prend la
      cible la plus proche — démontré à l'écran, cible hors cône ignorée.
- [ ] **On ne peut pas tout couvrir** : mesuré, un joueur qui garde un cap fixe
      finit par se faire toucher.
- [ ] Le héros a des PV, les perd au contact, et la partie se termine à zéro.
- [ ] Les vagues montent en intensité ; la **boutique entre les vagues** modifie
      réellement le tir.
- [ ] Le gameplay des couloirs est **supprimé**, pas désactivé.
- [ ] **Zéro import** hors `src/engine/index.js` ; aucun lien avec Container
      Kingdom.
- [ ] Les manques du moteur rencontrés partent en candidats `100-follow-up/`.
- [ ] `npm run verify` vert ; les quatre hôtes sans erreur console.

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
