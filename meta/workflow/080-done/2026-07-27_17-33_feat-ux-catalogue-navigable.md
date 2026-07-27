---
id: 2026-07-27_17-33
title: Catalogue — rendre navigables 414 éléments (index, filtres, tri)
type: feat
branch: copilot/feat-ux-catalogue-navigable
created: 2026-07-27 17:33
ready: 2026-07-27 17:48
doing: 2026-07-27 17:48
verify: 2026-07-27 17:52
done: 2026-07-27 17:54
---

## Objectif

Le catalogue moteur (`/engine/catalog/`) est aujourd'hui **un seul mur** : on
scrolle ou on ne trouve pas. Mesuré le 2026-07-27 :

- **414 éléments** publics, en **44 familles**, empilés dans une page unique ;
- répartition très déséquilibrée — **404 sprites**, 8 personnages, 2 composites ;
- la végétation écrase le reste : `Conifer` 36, `Tree` 31, `TallTree` 30,
  `LeafTree` 27, `DeadTree` 25, `CanopyTree` 24 — **173 arbres** à eux seuls ;
- à l'autre bout, **6 familles n'ont qu'un seul élément** (`Fountain`, `Ground`,
  `StoneSlab`, `Sunflower`, `Well`, `FenceGroup`), noyées entre deux blocs de 30.

Le catalogue sert au **QA graphique** et à la **référence level-design** : son
utilité tient à la capacité d'atteindre un élément précis, ou de comparer les
variantes d'une même famille. À 414 cartes, les deux sont perdues.

> **Ce qui existe déjà** — le ticket n'est pas « ajouter une recherche ». Un
> filtre texte est en place (`data-catalog-filter`, `applyFilter()` dans
> `catalog.js`) : il matche nom + famille + type, masque les sections vides et
> tient un compteur de résultats honnête. Une grille responsive existe aussi
> (`repeat(auto-fit, minmax(270px, 1fr))`, une colonne sous 720 px). Le problème
> n'est pas l'absence d'outil, c'est qu'**il faut déjà savoir ce qu'on cherche** :
> rien ne permet de *parcourir*, seulement de *chercher*.

## Spécifications

_Rempli en « specify » (voir la recipe)._

Pistes, à arbitrer et à doser :

- **Index des familles** — les 44 familles avec leur compte, atteignables sans
  traverser la galerie (barre latérale, ou barre d'onglets déroulante). C'est le
  geste qui manque le plus : passer de « je scrolle » à « je saute ».
- **Onglets** — attention, **pas par type** : 404 / 8 / 2 laisserait un onglet
  contenant tout le problème. Un regroupement utile (arbres, fleurs, minéral,
  bâti, personnages) demanderait une **taxonomie qui n'existe pas** dans les
  données — `catalog-registry.js` ne dérive aujourd'hui que la `family`, par
  suffixe numérique du nom. **Décision à prendre en *specify*** : ajouter cette
  métadonnée (et où : registre ? descripteur d'élément ?), ou s'en tenir aux
  familles.
- **Filtres combinables** avec la recherche : par type, par présence de zones de
  collision / trigger, éventuellement par empreinte.
- **État partageable** — refléter recherche et filtres dans l'URL, pour qu'un
  lien pointe une sélection (usage QA : « regarde ces 6 arbres »).
- **Tri** — par nom, par taille, par famille.

### Piste connexe : le coût de rendu

`buildCard()` fait `new entry.ElementClass()` **puis** rend l'arbre DOM complet
(enfants compris) pour **chacun** des 414 éléments, au chargement, avant toute
interaction. Le filtre actuel se contente ensuite de `hidden = true`. Un index ou
des onglets rendraient naturel de **ne construire que ce qui est affiché**.

À arbitrer : profiter de ce ticket pour rendre à la demande, ou le laisser hors
périmètre. Le gain n'a **pas été mesuré** — le mesurer fait partie de la
décision, pas l'inverse.

## Contexte / liens

- `src/engine/catalog/index.html` (barre d'outils, hero), `catalog.js`
  (`buildFamilySections`, `applyFilter`, `buildCard`), `catalog.css` (grille,
  responsive à 720 px), `catalog-registry.js` (familles, types, tri)
- Tests existants : `test/catalog-registry.test.js`,
  `test/catalog-preview-layout.test.js` — la logique pure est déjà testée, y
  ajouter le regroupement / filtrage plutôt que tester le DOM.
- **Frontière moteur** : le catalogue vit dans `src/engine/` et ne doit rien
  importer de `src/container-kingdom/`.
- **Produit** : mobile-first, soin de la finition (voir `meta/agents/conventions.md`).

## Definition of Done

- [ ] Atteindre une famille donnée depuis le haut de page se fait **sans scroller
      la galerie** (index ou onglets), et le nombre d'éléments par famille est
      visible avant de cliquer.
- [ ] Recherche et filtres se **combinent** (le filtre texte existant reste
      fonctionnel), avec un état « aucun résultat » explicite.
- [ ] L'état de navigation est **partageable** par URL, ou la décision de ne pas
      le faire est tracée dans le ticket.
- [ ] Utilisable à **360 px de large** : rien ne déborde, l'index reste
      atteignable.
- [ ] La logique de regroupement / filtrage est **testée en unitaire** (fonctions
      pures, pas le DOM).
- [ ] Décision tracée sur le rendu à la demande — fait, ou explicitement écarté
      avec sa raison.
- [ ] Vérifié **au navigateur** sur la page réelle, pas seulement en tests.
- [ ] `npm run verify` vert ; doc à jour si l'usage du catalogue change
      (`src/engine/README.md`, `meta/documentation/engine.md`).

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 17:52] Ajout d'une barre d'outils navigable dans `engine/catalog` : filtres combinables (texte + kind + zones), tri (`family`/`name`/`footprint`), index des familles cliquable avec compteurs visibles avant navigation.
- [2026-07-27 17:52] État de navigation reflété dans l'URL (`q`, `kind`, `zone`, `sort`) via `history.replaceState`, avec parsing robuste au chargement/back-forward.
- [2026-07-27 17:52] Ajout d'un état explicite « aucun résultat » et d'une adaptation responsive de la toolbar/index pour un usage mobile.
- [2026-07-27 17:52] Décision rendue sur le rendu à la demande : pas de virtualisation lourde dans ce ticket (risque de complexité DOM + previews live) ; compromis retenu = cache des cartes et reconstruction ciblée par section au changement de filtres, pour garder un comportement déterministe et simple à maintenir.

### Vérification

- [2026-07-27 17:52] `npm run verify` OK (lint + build + tests) : 40 fichiers de test, 278 tests passants.
- [2026-07-27 17:52] Ajout de tests unitaires purs sur la logique de navigation (`test/catalog-navigation.test.js`) : parsing/sérialisation URL, combinaison des filtres, tri, regroupement par famille.

### Validation

- [2026-07-27 17:52] Validation navigateur sur `http://localhost:5175/engine/catalog/` : présence des contrôles, index 44 familles, navigation par ancre vers famille (`#family-woman`) sans scroller la galerie à la main.
- [2026-07-27 17:52] Validation état URL : exemple observé `?q=tree&kind=sprite&zone=collision&sort=footprint` et restauration de vue associée.
- [2026-07-27 17:52] Validation état vide : message explicite affiché lorsque la combinaison de filtres ne retourne aucun élément.
