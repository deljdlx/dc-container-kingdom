---
id: 2026-07-25_17-33
title: Exposer les sprites de flowers-00.png en éléments de carte
type: feat
branch:
created: 2026-07-25 17:33
ready:
doing:
verify:
done:
---

## Objectif

La planche `src/engine/images/map/flowers-00.png` (512×512) contient **~165
sprites** de décor végétal — fleurs, buissons, champignons, nénuphars, herbes,
tapis fleuris, plus quelques objets (puits, dalles, souche, tronc). Le moteur
n'en expose **qu'un seul** aujourd'hui : `Flower00`. Tout le reste est inutilisé.

Objectif : **exposer cette planche comme éléments de carte publics** du moteur
(`SpriteElement` déclaratifs), ré-exportés par `src/engine/index.js`, donc
visibles dans le **catalogue** et réutilisables par la démo et Container Kingdom.
Enjeu : donner de la variété visuelle aux cartes sans nouvel asset.

## Analyse de la planche (relevé fait au 2026-07-25)

Atlas **512×512**, grille de base **32 px** → **16×16 = 256 cellules**, presque
toutes occupées. Segmentation automatique (masque alpha + regroupement des
cellules dont l'encre traverse la couture) : **165 unités**, dont

| Taille | Nb |
|---|---|
| 32×32 | 140 |
| 64×32 | 8 |
| 32×64 | 6 |
| 64×64 | 2 |
| 96×32 | 2 |
| 32×96 · 32×128 · 64×96 · 64×128 · 96×128 · 128×96 | 1 chacun |
| bloc contigu 288×256 (non séparable automatiquement) | 1 |

Unités multi-cellules détectées (`frame` = `background-position`, donc offsets
négatifs) — **à confirmer visuellement**, la couture ne prouve pas l'unité :

```
frame [-288,    0]  64×32     frame [-352,    0]  32×128    frame [-256,  -32]  64×64
frame [-384,  -32]  64×96     frame [-256,  -96]  32×64     frame [   0, -128]  32×64
frame [ -64, -128]  64×32     frame [-128, -128]  64×32     frame [-288, -128]  96×32
frame [-384, -128]  64×32     frame [-256, -160]  64×32     frame [ -32, -192]  64×32
frame [ -96, -192]  32×64     frame [-384, -192]  64×32     frame [-384, -224]  96×32
frame [-288, -288] 128×96     frame [-416, -288]  96×128    frame [-128, -352]  32×64
frame [ -64, -384]  64×32     frame [-288, -384]  64×128    frame [-128, -416]  32×96
frame [-384, -416]  32×64     frame [-448, -416]  64×64     frame [-160, -448]  32×64
```

Familles repérées (nommage à trancher en *specify*) :

- **Fleurs / buissons fleuris 32×32** — le gros du lot, une même forme déclinée
  en ~10 teintes (rouge, rose, violet, bleu, jaune, blanc, orange…).
- **Champignons** — petits amas 32×32 (rouge, violet, brun, olive, orange) et une
  série de gros champignons 32×32 en bas à droite (orange, jaune, violet, rouge,
  beige, vert, gris, blanc, rose, bleu).
- **Nénuphars** (haut-droite) — grandes feuilles avec ou sans fleur : c'est
  l'essentiel des unités 64×32 / 32×128 / 64×64 / 64×96.
- **Hautes fleurs en épi** (lupins) et **hostas** fleuris — 32×32 et 64×32.
- **Herbes / fougères / blé / feuilles** — 32×32.
- **Tapis fleuris** — bandes d'herbe fleurie contiguës (le bloc 288×256) : ce sont
  des **fonds tuilables**, pas des objets ; à traiter comme `Ground00`
  (`manualZ: true`) et non comme du décor posé.
- **Massifs XXL** — champs de fleurs 96×128 / 128×96 (orange, jaune, bleu, violet,
  blanc, rose).
- **Objets non végétaux** — un **puits**, des **dalles de pierre**, une **souche**,
  un **tronc creux à champignons**, des **rochers/gemmes** colorés, des pétales
  isolés (particules).

### Points délicats identifiés

1. **La segmentation ne peut pas être 100 % automatique** : là où les sprites se
   touchent (bandes d'herbe, massifs), le regroupement par couture fusionne des
   sprites distincts (d'où le bloc 288×256). Un passage visuel est **obligatoire**
   pour arbitrer les frontières et les tailles réelles.
2. **`Flower00` existe déjà** (`frame [0, -96]`, 32×32, zone `trigger`) : son
   offset, son nom et sa zone ne doivent pas changer (API publique).
3. **Volume** : ~165 classes publiques d'un coup, contre ~13 éléments
   aujourd'hui. Impact direct sur le baril `src/engine/index.js`, sur la page
   catalogue (qui **instancie et rend chaque élément**) et sur la lisibilité.
4. **Ombres portées** : plusieurs sprites embarquent une ombre peinte dans le
   pixel-art → ne pas ajouter de `shadow` par-dessus.
5. **Zones** : le décor est majoritairement traversable. Multiplier les zones
   `trigger` alourdirait la narrow phase pour rien.

## Spécifications (amorce — à confirmer en *specify*)

### Technique

- **Source unique de vérité** : un **manifeste déclaratif** (p. ex.
  `src/engine/map/Elements/Flowers/flowers-00.manifest.js`) listant
  `{ name, frame, width, height, zones… }`, et une petite fabrique qui en dérive
  des sous-classes de `SpriteElement` — plutôt que ~165 fichiers d'une classe.
  Les classes restent **exportées nommément** par `src/engine/index.js` pour que
  le catalogue (dérivé du baril) et la frontière moteur soient inchangés.
  *Alternative* : une classe par fichier, fidèle à
  `meta/recipes/add-map-element.md` mais coûteuse ; à trancher en *specify*.
- **Zones par défaut** : aucune. `collision` seulement pour ce qui bloque
  (puits, souche, tronc, gros rochers) ; `trigger` seulement si un usage le
  demande ; `manualZ: true` pour les tapis / sols tuilables.
- **Catalogue** : les nouveaux exports y apparaissent automatiquement, mais la
  page doit rester **utilisable à ~180 cartes** — regroupement par famille et/ou
  filtre de recherche, compteur à jour. Si ce chantier UX grossit, le sortir en
  ticket dédié plutôt que de le diluer ici.
- **Tests** : cohérence du manifeste (frames dans les bornes 512×512, pas de
  doublon de frame, tailles multiples de 32), chaque entrée exportée par le baril,
  `Flower00` inchangé, catalogue non vide.
- **Méthode de relevé** : script d'analyse temporaire (masque alpha + grille
  32 px) pour proposer les frames, **puis validation visuelle** sprite par sprite
  via `/engine/catalog/` (et `?debug=1` pour les zones). Le script est un outil de
  travail, pas un livrable — sauf décision explicite de le committer.
- **Lotissement** : livrer par familles (fleurs 32×32 → champignons → nénuphars →
  massifs XXL → tapis → objets) pour garder des diffs relisibles ; un lot = un
  commit.

### Risques / questions ouvertes

- Nommage : familles + index (`Mushroom00…`) vs noms descriptifs
  (`MushroomRed00`) — impacte l'API publique, donc à figer avant de coder.
- Périmètre : tout l'atlas, ou seulement les familles utiles à Container Kingdom ?
- Les pétales isolés (quelques pixels) valent-ils un élément public ?

## Contexte / liens

- `src/engine/images/map/flowers-00.png` (l'atlas)
- `src/engine/map/Elements/Flowers/Flower00.js` (seul élément actuel de la planche)
- `src/engine/map/SpriteElement.js` (format du `descriptor`)
- `src/engine/index.js` (baril — frontière moteur)
- `src/engine/catalog/` + `src/engine/catalog/catalog-registry.js`, `test/catalog-registry.test.js`
- Recipes : `meta/recipes/add-map-element.md`, `meta/recipes/verify-in-browser.md`
- Doc : `meta/documentation/engine.md`, `src/engine/README.md`

## Definition of Done

- [ ] Les sprites de `flowers-00.png` sont exposés comme éléments publics du
      moteur, avec `frame` / `width` / `height` **exacts** (vérifiés visuellement,
      aucun sprite tronqué ni débordant sur son voisin).
- [ ] Zones cohérentes : `collision` sur ce qui bloque, `manualZ` sur les tapis,
      rien par défaut sur le décor traversable.
- [ ] `Flower00` reste inchangé (nom, offset, zone).
- [ ] Tous les nouveaux éléments sont exportés par `src/engine/index.js` et
      apparaissent dans `/engine/catalog/`, qui reste **lisible et fluide** à cette
      échelle (regroupement / filtre, compteur juste).
- [ ] Tests de cohérence du manifeste + exports verts.
- [ ] Doc à jour (`meta/documentation/engine.md`, `src/engine/README.md`, et
      `meta/recipes/add-map-element.md` si la façon d'ajouter un élément change).
- [ ] `npm run verify` vert + validation visuelle au navigateur (catalogue, et
      démo pour un échantillon posé sur une area).

## Journal

### Travail

-

### Vérification

-

### Validation

-
