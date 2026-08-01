---
id: 2026-08-01_21-51
title: Un propriétaire unique de la transformation monde ↔ écran
type: refactor
branch: claude/viewport-transform
created: 2026-08-01 21:51
ready: 2026-08-01 21:56
doing: 2026-08-01 21:57
verify:
done:
---

## Objectif

**Deux endroits écrivent `board.style.transform`, avec deux modèles différents.**

| Qui | Ce qu'il écrit |
|---|---|
| `src/engine/map/Renderer/ViewportRenderer.js:101` | `translate(-camX, -camY)` — translation pure, pilotée par la caméra |
| `src/container-kingdom/js/ContainerKingdomLayout.js:174` | `translate(panX, panY) scale(scale)`, avec `transformOrigin: 0 0` |

Ils s'arbitrent par `camera.isActive()` : l'app ne touche jamais la caméra (aucune
occurrence dans `src/container-kingdom/js/`), donc le moteur s'abstient d'écrire.
**Ce drapeau n'existe que pour désigner le propriétaire de la transformation** —
c'est le symptôme, pas la solution.

### Ce que ça coûte déjà

- **Un défaut latent, introduit le 2026-08-01** : `ParticleLayer.render()` pose
  `setTransform(ratio, 0, 0, ratio, -camX·ratio, -camY·ratio)`. Dans l'app,
  `camX = 0` et la couche ignore et le pan et le `scale` — or `bootstrap.js:33`
  démarre à **`zoom(0.5)`**. Les particules s'alignent dans la démo et se
  désynchroniseraient dans Container Kingdom. Aucun test ne peut le voir : l'app
  n'appelle pas encore `enableParticles()`.
- **La conversion est déjà écrite trois fois à la main, dans un seul fichier** :
  `ContainerKingdomLayout.js:372` (`(e.clientX - panX) / scale` — c'est
  `screenToWorld`), `:375` et `:325-326` (l'inverse, pour ancrer le zoom sur le
  doigt). Plus la mienne dans le canvas, plus la chaîne CSS du renderer.
- **`getCurrentAreaCoordinates()`** (`Viewport.js`) porte un `+48` magique, sans
  nom ni justification, au milieu d'une conversion monde → aire.

Coût du non-fait : toute surface nouvelle qui doit s'aligner sur la carte (le
canvas FX, une minimap, une infobulle ancrée, un clic → monde) devra deviner dans
quel régime elle tourne, et se tromper comme le layer de particules.

## Spécifications

### Décisions prises en *specify* (2026-08-01)

Sept points tranchés avant de toucher une ligne, avec leur raison :

1. **Convention de signe unique** : la transformation stocke la **translation CSS
   appliquée au board** (`offsetX/offsetY`). La caméra alimente donc
   `offset = -camera.x()`, le pan de l'app alimente `offset = panX`. Une seule
   convention, écrite, plutôt que deux signes à retenir.
2. **`toCssTransform()` omet `scale(…)` quand l'échelle vaut exactement 1.** La
   chaîne produite pour la démo reste **identique au byte près** — donc pas de
   changement de rendu à prouver, et une écriture DOM plus courte.
3. **Aucun arrondi dans la transformation.** Les flottants passent tels quels,
   exactement comme aujourd'hui (le pan de l'app est déjà fractionnaire). Arrondir
   ferait vibrer la carte au zoom fractionnaire ; l'arrondi reste où il est, sur
   les positions d'éléments (`Coordinates`). Décision à documenter dans
   `documentation/engine.md`.
4. **`Camera.isActive()` est conservé**, et son rôle est **renommé dans la doc** :
   il ne désigne plus « qui possède la transformation » mais « la caméra
   alimente-t-elle la transformation ». Le supprimer obligerait à réinventer
   l'arbitrage ailleurs, pour zéro gain de comportement et un risque réel sur le
   pan/zoom. C'est la justification écrite que la DoD autorise.
5. **Chemin chaud sans allocation** : `worldToScreenX(x)` / `worldToScreenY(y)`
   scalaires pour la boucle de dessin, et des variantes rendant un objet pour les
   appelants qui n'en sont pas.
6. **L'hypothèse `clientX` est préservée, pas corrigée.** L'app traite `clientX`
   comme un point en espace viewport, ce qui n'est vrai que parce que `#viewport`
   commence à l'origine de la page. La corriger en silence **déplacerait la
   carte**. Elle est documentée telle quelle ; si elle doit changer, c'est un
   ticket avec sa propre validation.
7. **Le `+48` de `getCurrentAreaCoordinates` sort du périmètre** : c'est une
   conversion monde → **aire**, pas monde → écran, et elle touche le streaming.
   Déplacée en `Suite`.

### Un `ViewportTransform`, pas un « moteur de coordonnées »

Un objet qui possède **une** vérité — décalage (caméra ou pan), échelle,
`devicePixelRatio` — et à qui tout le monde demande :

- `worldToScreen(x, y)` / `screenToWorld(x, y)` ;
- `toCssTransform()` — la chaîne que le renderer écrit, au lieu de la fabriquer ;
- `applyToContext(context)` — ce que `ParticleLayer` fait à la main ;
- `scale()`.

Pur, sans DOM, testable sans jsdom. La caméra et le pan/zoom deviennent deux
**sources** qui l'alimentent, plus deux écrivains concurrents — et
`camera.isActive()` disparaît.

### Ce qui reste dehors (pour ne pas fabriquer un god-object)

- **local ↔ monde** : `SceneGraph.offsetX/offsetY` le possède déjà et fonctionne.
- **la profondeur** : `z = DEPTH_BASE + offsetY + height` est un *ordre*, pas un
  espace ; `Renderer` le possède, `FX_DEPTH` est documenté.
- **monde → aire** peut y entrer, mais seulement pour donner un nom au `+48`.

## Firewalls / risques

C'est une refacto profonde : **774 lignes dans le rayon** (`ContainerKingdomLayout`
381, `ParticleLayer` 192, `ViewportRenderer` 104, `Camera` 97). Les points
ci-dessous sont des conditions, pas des remarques.

1. **Aucun test ne couvre le pan/zoom.** Vérifié : `test/` ne contient rien sur le
   sujet (`catalog-preview-layout.test.js` est sans rapport). Le comportement
   n'existe qu'en validation manuelle au navigateur (`2026-07-26_14-27`).
   **Condition bloquante** : écrire les tests de caractérisation **avant** de
   toucher quoi que ce soit (chaîne de transformation produite, pan au doigt,
   pinch ancré, zoom programmatique), puis refactorer **sans modifier leurs
   assertions** — `refactor-safely`.
2. **`transformOrigin: 0 0` est un contrat implicite.** Tout le calcul de pan en
   dépend (`panX/panY` sont des offsets en espace écran). Un objet qui émettrait
   une autre origine casserait le pinch sans rien signaler.
3. **L'app trouve le board par `document.querySelector('#viewport').firstElementChild`**
   (`ContainerKingdomLayout.js:97` et `:159`). Or le canvas FX vit désormais dans
   **le même conteneur**. Il est ajouté après, donc `firstElementChild` reste le
   board — **par chance, pas par conception**. Toute réorganisation du conteneur
   transforme l'app en « je zoome le calque FX ».
4. **Un seul `style.transform`, deux sources.** Décider qui écrit et quand, et
   **préserver la discipline existante** : `ViewportRenderer` ne réécrit pas la
   transformation quand la caméra n'a pas bougé (`_lastCameraX/_lastCameraY`). La
   perdre, c'est 60 écritures DOM par seconde pour rien.
5. **L'arrondi devient une décision.** `Coordinates` arrondit à l'entier (pixel-art) ;
   à `scale(0.5)`, monde → écran produit des demi-pixels. Arrondir dans la
   transformation fait vibrer la carte au zoom fractionnaire ; ne pas arrondir pose
   les sprites sur des demi-pixels. À trancher **explicitement**, en cohérence avec
   la banque de sous-pixels (`2026-07-26_14-23`).
6. **Le `devicePixelRatio` a déjà un propriétaire** : `ParticleLayer`, qui le
   plafonne à 2. Si la transformation le reprend, le plafond déménage — et le
   canvas ne doit pas le multiplier deux fois.
7. **Les trois conversions manuelles de l'app doivent passer par l'objet**, sinon
   on finit avec quatre propriétaires au lieu de deux. C'est le vrai critère de
   réussite, pas l'existence de la classe.
8. **Chemin chaud.** La conversion est appelée par frame **et par particule** :
   ne pas allouer un objet `{x, y}` par appel dans la boucle de dessin. Mesurer
   après (référence actuelle : 0,42 ms/frame à 600 particules).
9. **Deux régimes à valider, pas un.** La démo (caméra active, sans zoom) **et**
   l'app (caméra inactive, pan + `scale(0.5)`). Un correctif qui marche dans la
   démo est exactement ce qui a produit le défaut latent d'aujourd'hui.
10. **jsdom n'a pas de layout** : `getBoundingClientRect()` y rend des zéros. Les
    tests de conversion doivent être **purs** (nombres en entrée, nombres en
    sortie) ; tout ce qui lit le DOM se vérifie au navigateur.
11. **L'état de pan/zoom est en mémoire dans le layout** et doit survivre à un
    rafraîchissement de données (`ContainerKingdom.js:81`). Aucun stockage trouvé :
    ne pas le déplacer sans vérifier ce qui le relit.
12. **Ne pas élargir le périmètre en cours de route** (voir « Ce qui reste
    dehors »). Une refacto de coordonnées qui avale la profondeur et le
    scene-graph devient irréversible.

## Contexte / liens

- Les deux écrivains : `src/engine/map/Renderer/ViewportRenderer.js`,
  `src/container-kingdom/js/ContainerKingdomLayout.js`.
- L'arbitre à supprimer : `Camera.isActive()` (`src/engine/map/Camera.js`).
- Le consommateur fautif : `src/engine/map/ParticleLayer.js` (`2026-08-01_21-07`).
- Le comportement non testé à verrouiller d'abord : `2026-07-26_14-27` (pan/zoom).
- Méthode imposée : `meta/agents/recipes/refactor-safely.md`.

## Definition of Done

- [ ] **Tests de caractérisation du pan/zoom écrits et verts avant tout
      déplacement**, et inchangés après.
- [ ] Un seul objet possède décalage + échelle + ratio de pixels ; `worldToScreen`
      et `screenToWorld` sont réciproques (test).
- [ ] `ViewportRenderer`, `ParticleLayer` et **les trois conversions manuelles de
      l'app** passent par lui. Aucun calcul de transformation ailleurs (grep en
      preuve).
- [ ] `camera.isActive()` a disparu, ou sa disparition est justifiée par écrit.
- [ ] **Critère falsifiable** : les particules s'alignent sur la carte dans
      Container Kingdom à `zoom(0.5)`, pan appliqué — capture au journal. C'est ce
      qui prouve que l'abstraction tient.
- [ ] La démo reste correcte (caméra active, sans zoom) : marche, D-pad,
      streaming d'aires.
- [ ] Le pan, le pinch et le zoom programmatique se comportent comme avant —
      validés au navigateur, gestes décrits au journal.
- [ ] Pas de régression de coût : ≤ 0,42 ms/frame à 600 particules, mesuré.
- [ ] La décision d'arrondi est écrite dans `documentation/engine.md`.
- [ ] `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

-

### Vérification

-

### Validation

-
