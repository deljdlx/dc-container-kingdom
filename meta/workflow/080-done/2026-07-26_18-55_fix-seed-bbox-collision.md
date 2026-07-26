---
id: 2026-07-26_18-55
title: Bbox de collision — le recalcul diverge du chemin incrémental
type: fix
branch: claude/fix-seed-bbox-collision
created: 2026-07-26 18:55
ready: 2026-07-26 18:56
doing: 2026-07-26 18:56
verify: 2026-07-26 19:10
done: 2026-07-26 19:12
---

## Objectif

`CollisionSystem` construit sa bbox de collision agrégée par **deux chemins qui ne
donnent pas le même résultat** :

- **incrémental** (`updateCollisionBoundingBox`) — la boîte part de la valeur créée
  dans le constructeur, avant que la géométrie ne soit posée : ses quatre coins
  sont `null`, donc elle ne contribue à rien. Le résultat est **l'union des zones
  de collision et des enfants** ;
- **recalcul** (`recomputeAggregates`, ajouté par le ticket `2026-07-26_14-18`) —
  la boîte part de `new BoundingBox(this._element)` **après** que la géométrie est
  posée, donc du **rectangle complet de l'élément**.

Mesuré sur un `Character` 48×48 portant une zone `(16, 24, 14, 12)` :

| Chemin | Bbox de collision agrégée |
|---|---|
| incrémental | `(16,24) → (30,36)` — l'union des zones |
| après un `removeChild` | `(0,0) → (48,48)` — le rectangle de l'élément |

Autrement dit : **un même état donne deux enveloppes différentes** selon que
l'élément a perdu un enfant ou non. Conséquences :

- **broad phase affaiblie** — l'enveloppe grossit (ici ×3,4 en surface) sans
  raison, donc `_detect` élague moins et descend dans des sous-arbres inutiles ;
- **overlay de debug faux** — `?debug=1` dessine cette boîte : elle ne représente
  plus les zones réelles ;
- **comportement dépendant de l'historique** — le pire des trois : le même objet
  se comporte différemment selon ce qui lui est arrivé avant.

La détection reste **correcte** (la narrow phase teste les vraies zones) : c'est un
défaut de cohérence et de performance, pas un faux positif de collision.

## Spécifications

### Fonctionnel

- Pour un même état (mêmes zones, mêmes enfants), la bbox de collision agrégée
  doit être **identique**, que l'élément soit passé par le recalcul ou non.
- La sémantique de référence est celle du chemin **incrémental** : l'enveloppe des
  **zones de collision et de trigger, plus celles des enfants** — et **pas** le
  rectangle de l'élément. C'est ce que la narrow phase teste réellement
  (`_hitZones` compare des zones, jamais le rectangle), donc l'enveloppe doit
  border exactement ces zones.

### Technique

- `CollisionSystem.recomputeAggregates()` doit partir d'une boîte **vide**
  (`new BoundingBox()` sans élément) pour `_collisionBoundingBox`, comme le fait
  le chemin incrémental.
- Ne **pas** toucher au seed de `_boundingBox` (bbox de rendu) : celle-ci part
  légitimement du rectangle de l'élément (`initBoundingBox`), et le recalcul est
  déjà cohérent avec ce choix.
- **Test existant à requalifier** : `test/Board.streaming-areas.test.js`
  (« shrinks aggregate bounding boxes after freeing a distant area ») affirme
  qu'après libération la bbox de collision du board vaut `(0,0) → (width, height)`
  — c'est-à-dire précisément le rectangle du board, donc le comportement fautif.
  L'attendu doit être **renforcé, pas affaibli** : vérifier que l'enveloppe se
  réduit à ce qui reste réellement (une aire voisine conservée), pas au rectangle
  du board.

### Risques / vigilance

- Une boîte « vide » (coins `null`) doit rester **inoffensive** pour
  `isCollided()` : vérifier qu'un élément sans zone ni enfant ne provoque ni
  exception, ni collision fantôme.
- Le `Board` est le cas limite : après libération de toutes ses aires, il n'a plus
  ni zone ni enfant. Fixer explicitement le comportement attendu par un test.

## Contexte / liens

- `src/engine/map/CollisionSystem.js` (`recomputeAggregates`, constructeur,
  `updateCollisionBoundingBox`, `_detect`, `_hitZones`)
- `src/engine/map/BoundingBox.js` (constructeur avec / sans élément, `isCollided`)
- `test/Board.streaming-areas.test.js` (attendu à requalifier)
- Origine : review du ticket `2026-07-26_14-18` (d'où vient `recomputeAggregates`)
- `meta/documentation/engine.md` (collisions : broad phase / narrow phase)

## Definition of Done

- [x] Un test **prouve la convergence** : pour un même état, la bbox de collision
      est identique avec et sans passage par `recomputeAggregates` (il échoue avant
      le correctif — contre-épreuve à documenter).
- [x] `recomputeAggregates` reproduit la sémantique incrémentale (zones + enfants,
      pas le rectangle de l'élément) ; `_boundingBox` inchangée.
- [x] Le cas limite « ni zone ni enfant » est couvert : pas d'exception, pas de
      collision fantôme.
- [x] L'attendu de `test/Board.streaming-areas.test.js` est **renforcé** (l'enveloppe
      se réduit à ce qui reste), pas affaibli ni supprimé.
- [x] Vérification runtime sur `/engine/demo/?debug=1` : les boîtes de debug
      correspondent aux zones, avant comme après une libération d'aire.
- [x] `meta/documentation/engine.md` dit ce que borne la bbox de collision.
- [x] `npm run verify` vert.

## Suite

- **Ouvre** : `BoundingBox.updateWithRelativeElement(parent, child)` grossit la
  boîte qu'elle atteint **via `parent`**, pas la boîte réceptrice — un piège qui a
  déjà produit un bug silencieux ici (les enfants n'étaient jamais repliés dans
  l'enveloppe recalculée). Contourné par un ordre d'appel + un commentaire, pas
  réparé. → candidat déposé, `2026-07-26_19-11_api-update-with-relative-element.md`.
- **Laisse de côté** : l'overlay `?debug=1` dessine une boîte pour les éléments
  **sans zone** (coins `null` → `left: nullpx`, largeur héritée du parent) : ~15
  boîtes fantômes sur la démo. Cosmétique, antérieur à ce ticket, non traité —
  l'enveloppe elle-même est correcte, c'est le rendu de debug qui ne gère pas le
  cas « boîte indéfinie ».
- **Gain non mesuré** : le broad phase élague désormais davantage (une aire vide
  n'inflige plus une enveloppe fantôme à son board — `x1 = 1216` mesuré avant
  correctif sur le cas réel). Aucun chiffre de perf n'a été relevé ; si le sujet
  revient, c'est là qu'il faut mesurer.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-26 18:56] Ticket pris sur `claude/fix-seed-bbox-collision` (worktree `/tmp/dc-container-kingdom-claude`).
- [2026-07-26 18:58] Test d'abord (`test/CollisionAggregates.test.js`) : convergence des deux chemins, bornage sur les zones, cas « ni zone ni enfant ». **2 échecs sur 3** avant correctif, aux valeurs exactes annoncées dans l'objectif.
- [2026-07-26 19:00] Correctif 1 — `recomputeAggregates` part d'une boîte vide au lieu du rectangle de l'élément.
- [2026-07-26 19:01] La suite complète a attrapé un défaut **latent** du correctif : une `BoundingBox` sans élément ne sait plus se projeter en coordonnées monde (`offsetX` sur `undefined`, 10 tests rouges). D'où le paramètre `seedFromElement` : la boîte reste **attachée** à son élément mais **non amorcée**.
- [2026-07-26 19:02] La mesure a contredit l'hypothèse de départ et révélé la **vraie** cause : le constructeur de `CollisionSystem` créait la boîte **avant** que la géométrie soit posée, d'où une boîte **à moitié définie** (`x0` à `null`, `x1` à la largeur par défaut `16`). Une aire vide gonflait ainsi l'enveloppe de son board de `x1 = 1216` — enveloppe fantôme mesurée sur le cas réel. Corrigé à la source : les **deux** chemins partent désormais d'une boîte vide.
- [2026-07-26 19:03] Second défaut trouvé en chemin (hors périmètre initial, corrigé car bloquant pour la DoD) : `updateWithRelativeElement` grossit la boîte qu'elle atteint **via l'élément**, pas la boîte réceptrice — la boucle sur les enfants de `recomputeAggregates` mutait donc l'ancienne boîte, aussitôt remplacée. Les enfants n'étaient jamais repliés dans l'enveloppe recalculée. L'ancien seed (rectangle de l'élément) masquait le symptôme. Corrigé en installant la nouvelle boîte **avant** de replier les enfants, avec le commentaire qui explique le piège.
- [2026-07-26 19:04] `test/Board.streaming-areas.test.js` : l'attendu affirmait le comportement fautif (`bbox == rectangle du board`). **Renforcé** — une aire voisine conservée porte un mur, on vérifie que l'enveloppe se pose sur le mur ; plus un test explicite du cas « plus rien de collisionnable → enveloppe indéfinie ».
- [2026-07-26 19:05] Doc moteur : `engine.md` dit désormais ce que borne l'agrégat (zones propres et des enfants, jamais le rectangle) et que la sémantique vaut **par les deux chemins**.

### Vérification

- [2026-07-26 19:06] Contre-épreuve : correctif remisé (`git stash`) → **4 échecs** (3 nouveaux tests + le test board requalifié) ; correctif restauré → **8/8**. Aucun test vacant.
- [2026-07-26 19:07] Navigateur, `/engine/demo/?debug=1` : sur les **195 éléments porteurs de zones**, la boîte agrégée dessinée colle **exactement** à l'union de leurs zones — **0 écart**. 0 erreur console.
- [2026-07-26 19:08] Le premier essai de déplacement au navigateur n'a rien bougé : mesure faite → `visibilityState: hidden`, **0 frame rAF en 600 ms**. C'est le piège documenté (`meta/recipes/verify-in-browser.md`), pas une régression — essai non concluant, pas un échec.
- [2026-07-26 19:09] Reprise par la méthode prescrite (hook temporaire `window.__vp`, boucle pilotée à la main) : le perso avance de 35 px puis **bute net** sur un obstacle solide (x figé à 485 sur 80 frames de poussée), descend librement de 300 px, et 5 zones de collision s'affichent en contact. Les collisions fonctionnent après correctif.
- [2026-07-26 19:09] Hook temporaire **retiré** ; `git diff src/engine/demo/demo.js` vide, serveur de dev arrêté.
- [2026-07-26 19:10] `npm run verify` vert : lint + build + **208 tests** (29 fichiers).

### Validation

- [2026-07-26 19:11] Review : DoD cochée, frontière moteur respectée (rien n'entre depuis l'app), aucun `git add -A`, Conventional Commits en français, hook de debug retiré.
- [2026-07-26 19:11] Écart au périmètre **assumé et tracé** : le second défaut (`updateWithRelativeElement`) a été contourné et non réparé, parce qu'il bloquait la DoD sans en faire partie. Le vrai correctif part en candidat plutôt qu'en dérive.
- [2026-07-26 19:12] Merge `--no-ff` de `claude/fix-seed-bbox-collision` sur `main` : **30fb622**. Candidat déposé sur `main` avant merge (`4c8da5e`), branche supprimée, worktree conservé.
