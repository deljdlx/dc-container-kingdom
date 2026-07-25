# Recipe — ajouter un élément de carte

Un élément visuel (maison, arbre, décor…) est un **`SpriteElement`** déclaratif :
pas de code de rendu, juste un `static descriptor`.

## Étapes

1. **Créer la classe** dans `src/engine/map/Elements/` (ou un sous-dossier
   thématique), qui étend `SpriteElement` avec un `static descriptor` :
   - `width` / `height`, `atlas` (chemin sprite-sheet), `frame` (offset `[x, y]`) ;
   - `collision: [x, y, w, h]` si l'élément **bloque** (optionnel) ;
   - `trigger: [x, y, w, h]` s'il **émet un event** au contact (optionnel) ;
   - `manualZ: true` pour un sol/fond dont la profondeur n'est pas dérivée de `y`.
   - Modèles : `Tree00.js`, `House00.js`, `Fountain00.js`, `Flowers/Flower00.js`
     (trigger), `Ground00.js` (`manualZ`). Format du descriptor : `SpriteElement.js`.

2. **Exporter** la classe depuis **`src/engine/index.js`** (section « Built-in map
   elements ») — le moteur ne s'importe que par ce baril.

3. **(App, si instanciation par nom)** l'enregistrer dans
   `src/container-kingdom/js/ContainerKingdomLayout.js`
   (`this.rpgEngine.registerElement('MonElement', MonElement)`), utilisé par
   `instanciate(name)`.

4. **Vérifier** : `npm run verify`, puis visuellement dans la démo
   (`/engine/demo/` — l'ajouter à un `area.addElement(x, y, new MonElement())`) ;
   `?debug=1` pour voir ses zones de collision/trigger.

## Élément tiré d'une planche régulière (`flowers-00`)

Sur une planche découpée en cellules de taille fixe, on ne réécrit pas le
descripteur : `src/engine/map/Elements/Flowers/atlas.js` fournit `cell(col, row,
extra?)`, qui le dérive de la position dans la grille 32 px. Un élément tient
alors en **une ligne**, dans le fichier de thème correspondant
(`Blossoms.js`, `Mushrooms.js`, `Props.js`…) :

```js
export class Well00 extends SpriteElement { static descriptor = cell(2, 8, { collision: [3, 14, 26, 16] }); }
```

Le baril `Flowers/index.js` ré-exporte les fichiers de thème, et
`src/engine/index.js` ré-exporte le baril — rien à ajouter à la main. Voir
`meta/documentation/engine.md` (§ planche `flowers-00`) pour les conventions
(nommage `<Famille><NN>`, ombres, zones) et `test/flowers-00.test.js` qui les
verrouille.

## Élément composite

Pour un assemblage (plusieurs sprites), voir `House01.js` / `FenceGroup00.js` :
un `Element` qui compose des enfants dans son constructeur.
