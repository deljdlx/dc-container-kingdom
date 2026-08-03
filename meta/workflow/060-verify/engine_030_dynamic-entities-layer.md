---
id: 2026-08-03_16-30
title: Une couche d'entités dynamiques, détachée du tuilage
type: feat
branch: claude/dynamic-entities-layer
created: 2026-08-03 16:30
ready: 2026-08-03 16:31
doing: 2026-08-03 16:32
verify: 2026-08-03 16:41
done:
---

## Objectif

**Rien dans le moteur ne peut appartenir au monde sans appartenir à une tuile.**
Tout élément est enfant d'une `Area`, et `Board.freeArea()` détruit l'area — donc
ses enfants — dès que le joueur s'éloigne de 4 areas. Un projectile en vol
appartiendrait à l'area d'où il est parti, qui peut se libérer sous lui.

C'est **l'étape 2** de la série de blindage ouverte le 2026-08-02, et le dernier
verrou avant les projectiles. Les deux premiers sont tombés :

- `2026-08-02_20-45` — un élément attaché **apparaît** (le parcours de redessin
  passe par frame) ;
- `2026-08-03_09-32` — un élément détruit **s'en va vraiment**, scene-graph et
  DOM compris.

Reste le **où**.

### Ce que la mesure a établi

Mesuré au navigateur le 2026-08-03, sur la démo :

| Entité attachée à… | montée ? | après libération de l'area (0,0) |
|---|---|---|
| l'**area** (0,0) | oui | **détruite avec elle** |
| le **board** directement | **non — jamais montée** | survit, mais invisible |

Attacher au board serait le bon endroit — mais `BoardRenderer.renderAreas()` ne
monte **que** les areas et les enfants d'areas. Un enfant direct du board n'est
jamais rendu. Les deux moitiés du problème sont là.

## Spécifications

_Amorce — à confirmer en « specify »._

### L'emplacement

Une **couche d'entités**, `Element` enfant du board posé en **(0, 0)**, créée à
la demande. Étant à l'origine, ses enfants sont positionnés en **coordonnées
monde** — ce qu'il faut pour un objet qui traverse les areas, là où les enfants
d'area vivent en coordonnées locales.

Elle n'est pas dans `board.areas`, donc `freeArea()` ne la voit pas. `Board.clear()`,
lui, détruit tous ses enfants — une remise à zéro du monde emporte les entités,
et c'est la sémantique voulue.

### Le montage

`BoardRenderer.renderAreas()` doit monter la couche comme il monte une area :
mêmes règles (nœud dans la racine du board, `relativeTo` pour l'offset), sinon
la profondeur ne s'ordonne plus entre entités et décor. La méthode change de rôle
— la renommer plutôt que de lui ajouter un cas.

### L'API

Sur le `Board` (c'est le monde) :

- `spawn(element, x, y)` — coordonnées **monde**, retourne l'élément ;
- `despawn(element)` — délègue à `destroy()`, désormais propre ;
- `getEntities()` — la liste, pour itérer.

### Ce qui doit continuer de marcher, sans effort

- **Collision** : la couche étant dans le sous-arbre du board,
  `detectCollisionAndTrigger(board)` voit les entités **gratuitement**. À vérifier,
  pas à supposer.
- **Profondeur** : `z = DEPTH_BASE + offsetY + height` — une entité doit passer
  derrière un arbre plus au sud et devant un arbre plus au nord.
- **FX** : une entité déclarant un effet reste à lier à la main
  (`engine_500_element-attach-event` traite ce manque) — le noter, ne pas le
  traiter ici.

### La durée de vie : la question à trancher

**Pas de culling automatique** dans ce ticket, et c'est un choix à écrire : un
projectile meurt de lui-même, un butin lâché doit persister. Le moteur fournit
`despawn()` ; **l'appelant possède la durée de vie**. Le risque assumé est qu'un
hôte négligent réaccumule ce que `2026-08-03_09-32` vient de nettoyer — d'où la
mesure de non-accumulation en DoD.

## Firewalls / risques

1. **Ne pas refaire une area.** La couche n'est pas une tuile : ni streaming, ni
   grille, ni coordonnées locales. Si elle commence à ressembler à une `Area`,
   c'est qu'on s'est trompé de conception.
2. **La bbox agrégée du board** ne sait que grossir (constat du ticket
   `2026-07-26_14-18`). Une entité qui part loin gonflerait la boîte du board et
   dégraderait l'élagage du broad phase pour tout le monde. À mesurer.
3. **Le parcours par frame** (`2026-08-02_20-45`) descend dans les enfants sales.
   Des entités qui bougent chaque frame ne doivent pas rendre le board sale en
   permanence — sinon l'élagage tombe et on repaie l'arbre entier. À mesurer,
   c'est le risque de perf principal.
4. **`Board.clear()` emporte la couche** : vérifier qu'un `clear()` suivi d'un
   `spawn()` refonctionne (la couche doit se recréer).
5. **Container Kingdom ne doit rien voir** : il ne spawn rien, sa carte est faite
   d'areas. Zéro régression attendue, à vérifier quand même.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-03**, `080-done` compris.
- `src/engine/world/Board.js` — `freeArea()`, `clear()`, `areas`.
- `src/engine/render/BoardRenderer.js` — `renderAreas()`, le montage et
  `relativeTo`.
- `src/engine/scene/Element.js` — `addElement()`, `destroy()`.
- Les deux étapes déjà faites : `2026-08-02_20-45`, `2026-08-03_09-32`.
- La suite : collision par paires (étape 4), puis les projectiles.

## Definition of Done

- [x] `board.spawn(element, x, y)` **monte l'entité** en coordonnées monde, sans
      geste supplémentaire de l'hôte.
- [x] **Le critère qui fait foi** : une entité posée au-dessus de l'area (0,0)
      **survit** à la libération de cette area — le joueur s'éloigne, l'area est
      déchargée, l'entité est toujours là et toujours montée. Mesuré.
- [x] Elle **collisionne** : le joueur bute dessus (démo à l'appui).
- [x] Sa **profondeur s'ordonne** avec le décor : elle passe derrière un élément
      plus au sud, devant un plus au nord (vérifié à l'écran).
- [x] `despawn()` la retire de l'arbre **et** de la page.
- [x] **Le coût par frame ne régresse pas** : `Element.update()` par frame mesuré
      avec 0 et avec N entités mobiles — l'élagage doit tenir.
- [x] La bbox agrégée du board **ne dérive pas** quand une entité s'éloigne
      (mesure ou décision écrite).
- [x] `Board.clear()` puis `spawn()` refonctionne.
- [x] La démo montre une entité qui n'appartient à aucune tuile ; les trois hôtes
      sans erreur console.
- [x] `meta/documentation/engine.md` décrit la couche et le choix « l'appelant
      possède la durée de vie » ; `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

- [2026-08-03 16:34] **La couche est un `Element` à l'origine du board**, créée au
  premier `spawn`, `manualZ` (elle n'est pas dessinée). Ses enfants ont donc pour
  offsets leurs coordonnées monde, sans conversion. Elle n'entre pas dans
  `board.areas`, donc `freeArea()` ne la voit pas.
- [2026-08-03 16:35] **Le montage était la moitié manquante.**
  `BoardRenderer.renderAreas()` ne montait que les areas et leurs enfants — c'est
  pour ça qu'un enfant direct du board n'était jamais rendu. Renommée
  **`mountPending()`**, avec `mountChildrenOf(container)` extrait : areas et
  couche d'entités passent par les **mêmes** règles, ce qui est la condition pour
  que leurs profondeurs restent comparables.
- [2026-08-03 16:35] `Board.clear()` remet `_entities` à `null` : la couche est un
  enfant comme un autre, donc détruite avec le reste ; sans ça le `spawn` suivant
  se serait accroché à un nœud mort.
- [2026-08-03 16:36] **Pas de culling automatique**, écrit comme un choix :
  l'appelant possède la durée de vie. `despawn()` délègue à `destroy()`, propre
  depuis `2026-08-03_09-32`.
- [2026-08-03 16:39] **Trouvaille en cours de route** : déplacer une entité ne la
  repeint pas. `Renderer.update()` est **vide** sur l'élément de base — le
  positionnement vit dans `render()`. Un `Character` s'en sort parce qu'il
  repeint lui-même dans son `update()`. Hors DoD, mais c'est le chaînon manquant
  avant les projectiles : documenté en ⚠️ et déposé en candidat.

### Vérification

- [2026-08-03 16:40] `npm run verify` **vert** : **57 fichiers, 491 tests** (+9).
- [2026-08-03 16:37] **Critère qui fait foi** : entité posée en monde (980, 300),
  joueur marché jusqu'à l'**area (0,13)** → l'area (1, 0) qui la portait est
  **déchargée**, et l'entité est **toujours là, toujours montée, aux mêmes
  coordonnées**. Avant ce ticket, la même entité attachée à une area mourait avec
  elle, et attachée au board n'était **jamais montée**.
- [2026-08-03 16:38] **Collision** : entité solide posée devant le joueur →
  **95 px parcourus sur 1440 possibles**. Une fois despawnée : **1439 / 1440**.
  Le sous-arbre du board suffit, rien à câbler.
- [2026-08-03 16:38] **Profondeur** : `z = DEPTH_BASE + offsetY + height` vérifié
  pour l'entité **et** le décor voisin, tous **frères dans la même racine DOM**.
- [2026-08-03 16:38] **`despawn()`** : hors de la liste **et** hors du document.
- [2026-08-03 16:39] **Le coût ne régresse pas** — 120 frames de marche :

  | | `Element.update()` / frame | ms / frame | bbox du board |
  |---|---|---|---|
  | 1 entité | 1,7 | 0,329 | 2244 × 1645 |
  | 51 entités immobiles | 1,0 | 0,314 | 2244 × 1645 |
  | 51 entités **qui bougent chaque frame** | 2,7 | 0,299 | 2244 × 1645 |

  L'élagage tient, et la **bbox agrégée du board ne dérive pas** — le risque n°2
  du ticket ne s'est pas matérialisé.
- [2026-08-03 16:39] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 529 éléments, 219 conteneurs) et le catalogue (536 sprites).
- [2026-08-03 16:36] **Deux mesures fausses écartées avant de conclure** :
  (1) j'ai cru à une régression du déplacement — le personnage partait à
  `y = -32966` ; c'était ma sonde qui pilotait la boucle avec `performance.now()`
  pendant que rAF tournait, d'où des `dt` incohérents. Avec une horloge à moi :
  **479 px pour 480 attendus**, aucun défaut. (2) « collision non bloquante » :
  mon seuil comptait 67 px comme un échec alors que c'était l'arrêt lui-même.

### Validation

-
