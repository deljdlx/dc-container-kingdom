---
id: 2026-07-25_18-27
title: Exposer les sprites identifiables de map-sprites-01.png en éléments de carte
type: feat
branch:
created: 2026-07-25 18:27
ready:
doing:
verify:
done:
---

## Objectif

`src/engine/images/map/map-sprites-01.png` (**1920×3360**) est la plus grosse
planche du moteur, et il n'en sort aujourd'hui que **6 éléments** : `Tree00`,
`Ground00`, `Fountain00`, `Sunflower00`, `Fence00H`, `Fence00V`. Tout le reste
dort.

Objectif : en exposer les sprites **clairement identifiables** comme éléments
publics (`SpriteElement` déclaratifs), ré-exportés par `src/engine/index.js` et
visibles dans `/engine/catalog/` — même démarche que la planche `flowers-00`
(ticket `2026-07-25_17-33`), qui sert de patron.

### Contrainte forte : ne traiter que ce qui est identifiable

Cette planche mélange **deux natures de contenu**, et une seule est traitable ici :

1. **Objets autonomes** — un arbre, un banc, un rocher, un panneau, un torii, une
   fontaine, un bâtiment entier. Ils se posent tels quels sur une carte. **→ dans
   le périmètre.**
2. **Matériau d'assemblage** — autotiles de terrain (herbe, sable, eau, gravier
   avec leurs bords et coins), murs et coins de falaise, morceaux de route et de
   passage piéton, bandes de façade et de toiture, demi-ponts, escaliers en
   tronçons. **→ hors périmètre.**

Un morceau d'autotile **n'est pas un sprite** : c'est un fragment qui n'a de sens
qu'accolé à ses voisins par un algorithme de tuilage que le moteur n'a pas. Isolé,
il donne un élément inutilisable et une carte de catalogue illisible — exactement
les « sprites bizarres » de la planche. Les exposer polluerait l'API publique.

**Critère de tri, à appliquer à l'œil, sprite par sprite** :

> On garde ce qu'on peut **nommer en un mot et poser tel quel** (« un arbre »,
> « un banc », « un panneau STOP »). On écarte tout ce qu'on ne sait décrire que
> par sa fonction d'assemblage (« coin de falaise », « bord d'herbe », « bande de
> toit », « moitié de pont »).

En cas de doute : **on écarte**, et on le note. Mieux vaut un lot plus petit et
sûr qu'un catalogue rempli de fragments.

## Analyse rapide (relevé du 2026-07-25, à affiner en *specify*)

- **1920×3360** px, soit 120×210 cellules de 16 px ; **14 907 cellules occupées**
  (59 % de la planche).
- **334 composantes connexes** au niveau cellule, dont **44 gros blocs** (plus de
  10 cellules de côté) — ce sont précisément les zones d'assemblage — et ~290
  petites composantes, majoritairement des objets isolés. Ordre de grandeur du lot
  exploitable, **à confirmer visuellement**.
- **Cette planche n'est pas sur une grille régulière**, contrairement à
  `flowers-00`. Les frames existants le prouvent : `Ground00` fait 50×50 à
  `[-1790, -800]`, `Fountain00` 80×64 à `[-1170, -2754]`, `Sunflower00` 16×24 à
  `[-1760, -1256]` — ni les offsets ni les tailles ne tombent sur un pas commun.
  **Le helper `cell(col, row)` de `flowers-00` n'est donc pas réutilisable** : il
  faut des frames en pixels, dérivés des bounding boxes alpha puis validés à l'œil.
- Familles pressenties côté « identifiable » : arbres (beaucoup de teintes, plus
  les variantes enneigées), arbres morts, conifères, buissons, rochers, parterres
  de fleurs, clôtures et barrières, bancs et tables, panneaux et feux tricolores,
  lampadaires, torii, statues / puits / fontaines, et les bâtiments dessinés
  entiers.
- **Zone d'ombre à trancher en *specify*** : les bâtiments. Certains sont dessinés
  d'un bloc (identifiables), d'autres n'existent que sous forme de bandes de
  façade et de toiture à empiler. Idem pour les ponts, arches et tunnels, à moitié
  objets, à moitié pièces d'assemblage.

## Spécifications

_À remplir en « specify »._ Points déjà connus :

- Réutiliser le patron `flowers-00` : fichiers par thème sous
  `src/engine/map/Elements/<Planche>/`, nommage **`<Famille><NN>`** (index en
  ordre de lecture), baril de planche ré-exporté par `src/engine/index.js`,
  déclarations courtes et statiques.
- Helper propre à cette planche : `sprite(x, y, width, height, extra?)` plutôt
  que `cell(col, row)`, puisque la planche est irrégulière.
- Les **6 éléments existants** (`Tree00`, `Ground00`, `Fountain00`, `Sunflower00`,
  `Fence00H`, `Fence00V`) sont de l'API publique : nom, frame, taille et zones
  **inchangés**. Leurs frames sont taillés à la main et rognent parfois le sprite
  (`Tree00` : encre de 11 à 52 px dans une boîte de 64) — si l'un est franchement
  faux, **le signaler sans le corriger**, et proposer un élément voisin correct.
- Zones : `collision` sur ce qui bloque (arbres, bâtiments, rochers, statues,
  panneaux…), `manualZ` sur les sols, rien sur le décor traversable. Ombres : à
  vérifier planche en main (celles de `flowers-00` étaient peintes dans l'art).
- Catalogue : déjà groupé par famille et filtrable depuis le ticket `flowers-00` —
  rien à refaire, seulement à vérifier à la nouvelle échelle.
- Tests : mêmes garde-fous que `test/flowers-00.test.js` (frames dans les bornes
  1920×3360, aucun recouvrement entre sprites, exports par le baril, éléments
  historiques intacts).
- **Lotissement** : un commit par lot de familles.

## Contexte / liens

- `src/engine/images/map/map-sprites-01.png` (la planche)
- Éléments actuels : `src/engine/map/Elements/Tree00.js`, `Ground00.js`,
  `Fountain00.js`, `Sunflower00.js`, `Fence00H.js`, `Fence00V.js`
- Patron à suivre : `src/engine/map/Elements/Flowers/` (+ `atlas.js`),
  `test/flowers-00.test.js`, ticket `meta/workflow/080-done/2026-07-25_17-33_flowers-atlas-elements.md`
- `src/engine/map/SpriteElement.js` (format du `descriptor`), `src/engine/index.js`
- Recipes : `meta/recipes/add-map-element.md`, `meta/recipes/verify-in-browser.md`
- Doc : `meta/documentation/engine.md`, `src/engine/README.md`
- **Suite possible** : le matériau d'assemblage écarté ici (autotiles de terrain,
  falaises, routes, façades) mérite son propre ticket — c'est une **feature
  moteur** (tuilage automatique), pas une déclaration d'éléments.

## Definition of Done

- [ ] Les sprites **clairement identifiables** de `map-sprites-01.png` sont
      exposés comme éléments publics, avec `frame` / `width` / `height` **exacts**
      (validés à l'œil, aucun sprite tronqué ni débordant sur son voisin).
- [ ] **Aucun fragment d'assemblage** n'a été exposé : chaque élément livré se
      nomme en un mot et se pose seul sur une carte.
- [ ] La liste des sprites **écartés** est documentée (zones de la planche +
      raison), pour que le périmètre soit un choix lisible et non un oubli.
- [ ] Les 6 éléments historiques de la planche restent inchangés (nom, frame,
      taille, zones) ; toute anomalie constatée sur leurs frames est signalée.
- [ ] Zones cohérentes : `collision` sur ce qui bloque, `manualZ` sur les sols,
      rien par défaut sur le décor traversable.
- [ ] Tous les nouveaux éléments sont exportés par `src/engine/index.js` et
      apparaissent dans `/engine/catalog/`, qui reste lisible à cette échelle.
- [ ] Tests de cohérence de la planche + exports verts.
- [ ] Doc à jour (`meta/documentation/engine.md`, `src/engine/README.md`).
- [ ] `npm run verify` vert + validation visuelle au navigateur (catalogue, et
      démo pour un échantillon posé sur une area).

## Journal

### Travail

-

### Vérification

-

### Validation

-
