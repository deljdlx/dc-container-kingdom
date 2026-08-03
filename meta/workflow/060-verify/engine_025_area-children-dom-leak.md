---
id: 2026-08-03_09-32
title: Détruire une area laisse les nœuds DOM de ses éléments dans la page
type: fix
branch: claude/area-children-dom-leak
created: 2026-08-03 09:32
ready: 2026-08-03 09:37
doing: 2026-08-03 09:38
verify: 2026-08-03 16:16
done:
---

## Objectif

**Le streaming fuit dans le DOM.** Mesuré au navigateur le 2026-08-03, sur la
démo, en marchant réellement :

| | |
|---|---|
| joueur parti à | **43 areas** de l'origine |
| area (0,0) encore chargée ? | **non** |
| son propre nœud DOM encore présent ? | **non** |
| ses **21 nœuds enfants** encore dans le document ? | **oui — les 21** |

`Board.freeArea()` → `Area.destroy()` retire le nœud de l'area, détache l'area du
scene-graph et vide sa liste d'enfants. Mais les éléments qu'elle portait sont
montés **dans la racine du board**, pas dans le nœud de l'area
(`BoardRenderer.renderAreas()` : « mount … **into the board root** »), et
`Element.destroy()` **ne descend pas** dans son sous-arbre : il ne vide que son
propre renderer.

Résultat : chaque area peuplée qui sort de la fenêtre 9×9 abandonne ses nœuds
dans la page, **pour toute la session**.

> **Distinct du ticket `2026-07-26_14-18`**, qui a corrigé le détachement côté
> **scene-graph** (mémoire + coût de collision). Le côté **DOM** n'était pas dans
> son périmètre, et il est resté.

**Pourquoi la démo ne le montrait pas** : elle ne peuple que 7 areas, toutes près
de l'origine ; les areas streamées ensuite sont vides, donc rien de neuf ne
s'accumule. Container Kingdom, lui, peuple ce qu'il streame.

## Spécifications

### Le sens de la correction

`Element.clear()` **descend déjà** dans le sous-arbre en vidant chaque renderer.
`destroy()` n'appelle que `this.getRenderer().clear()`. La correction est donc
petite — mais son **ordre** compte :

1. émettre `element.destroy` (déjà le cas) — les abonnés doivent encore voir le
   sous-arbre intact ;
2. **vider le DOM du sous-arbre entier** ;
3. détacher du parent, `scene.reset()`.

### Ce qu'il ne faut PAS faire

**Ne pas monter les éléments dans le nœud de leur area.** Ce serait la
correction « structurelle » évidente — détruire l'area emporterait ses enfants —
mais elle **casserait la profondeur** : le board crée un contexte d'empilement
(mesuré à `z-index: 1 000 560`, ticket `2026-08-02_18-56`), et des éléments
enfermés dans le contexte de leur area ne pourraient plus s'ordonner avec ceux
des areas voisines. L'algorithme du peintre a besoin qu'ils soient **frères dans
la racine du board**. C'est un choix, pas un accident.

## Firewalls / risques

1. **La mesure doit porter sur des nœuds identifiés**, pas sur un décompte : une
   `.map-area` porte **aussi** la classe `.map-element` (vérifié), donc soustraire
   deux totaux induit en erreur — c'est ce qui m'a fait conclure d'abord qu'il n'y
   avait pas de fuite. Suivre des nœuds par identité (`document.contains(node)`).
2. **`Element.clear()` vide le rendu sans détacher le modèle** : vérifier qu'un
   élément dont l'area est libérée n'est pas seulement invisible mais bien
   injoignable, sinon on remplace une fuite DOM par une fuite mémoire.
3. **Le personnage principal n'appartient à aucune area** : s'assurer qu'un
   `clear()` récursif depuis le board ne l'emporte pas.
4. **Container Kingdom recycle-t-il des éléments ?** Si un conteneur change
   d'area entre deux rafraîchissements, son élément doit survivre. À vérifier
   avant de généraliser.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-03**, `080-done` compris —
  `2026-07-26_14-18` traite le scene-graph, pas le DOM.
- `src/engine/scene/Element.js` — `destroy()`, `clear()`.
- `src/engine/world/Board.js` — `freeArea()`, `clear()`.
- `src/engine/render/BoardRenderer.js` — `renderAreas()`, le montage en racine.
- La contrainte de profondeur : `meta/documentation/engine.md` §3.2 (`FX_DEPTH`,
  contexte d'empilement du board).

## Definition of Done

- [x] Après libération d'une area, **aucun de ses nœuds enfants n'est encore dans
      le document** — mesuré par identité de nœud, pas par décompte.
- [x] Une marche longue (≥ 20 areas traversées) sur une carte **peuplée** ne fait
      pas croître le nombre de nœuds DOM — mesure citée.
- [x] La **profondeur reste correcte** entre areas voisines : un arbre d'une area
      masque toujours un personnage d'une autre (vérifié à l'écran).
- [x] Le personnage principal survit à la libération de l'area qu'il quitte.
- [x] Container Kingdom : les conteneurs restent affichés et à jour au fil des
      rafraîchissements.
- [x] `npm run verify` vert ; un test porte la non-régression.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

- [2026-08-03 09:45] **Trois lignes, mais un ordre.** `destroy()` fait désormais :
  émettre → `clear()` (qui **descend** déjà dans le sous-arbre) → détacher →
  `scene.reset()`. L'ordre est le fond du correctif : vider l'arbre avant la
  descente DOM n'aurait rien laissé à visiter, et émettre après aurait donné aux
  abonnés un nœud vide.
- [2026-08-03 09:46] **La correction « évidente » écartée, et écrite** : monter les
  éléments dans le nœud de leur area aurait fait disparaître le problème — et
  cassé la profondeur, le board étant un contexte d'empilement. Le raisonnement
  est dans le JSDoc de `destroy()`, pour que personne ne le refasse.
- [2026-08-03 09:48] Un test de plus que prévu s'est révélé faux : j'affirmais que
  `destroy()` coupe le lien **vers** le parent. Il ne coupe que le lien
  descendant — le nœud détruit garde un pointeur vers son ex-parent.
  Préexistant, hors DoD : l'assertion a été corrigée et la trouvaille déposée en
  candidat plutôt que traitée en douce.

### Vérification

- [2026-08-03 16:14] `npm run verify` **vert** : **56 fichiers, 482 tests** (+5).
- [2026-08-03 16:10] **Critère qui fait foi**, même mesure qu'à l'audit, joueur
  parti à **43 areas** de l'origine :

  | | avant | après |
  |---|---|---|
  | nœuds enfants de (0,0) encore montés | **21 / 21** | **0 / 21** |
  | nœuds `.map-element` dans la page | 298 | **58** |

  La page ne traîne plus le monde qu'elle a quitté.
- [2026-08-03 16:12] **Profondeur intacte** — 11 éléments échantillonnés sur
  **3 areas** : tous frères dans **une seule** racine DOM, `z` égal à
  `DEPTH_BASE + offsetY + height` pour chacun, et l'ordre inter-areas suit le bas
  des sprites. Le risque n°2 du ticket ne s'est pas matérialisé.
- [2026-08-03 16:11] **Le personnage principal survit** : toujours monté après la
  libération des areas traversées (il n'appartient à aucune — `enableMainCharacter`
  ne l'attache à rien).
- [2026-08-03 16:13] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 536 éléments, 219 conteneurs) et le catalogue (536 sprites).
- [2026-08-03 16:12] Une de mes sondes s'est trompée en route : je testais
  « la profondeur suit `offsetY` » alors qu'elle vaut `offsetY + height` — le bas
  du sprite. Formule corrigée, invariant vérifié.
- [2026-08-03 16:15] Sonde `window.__vp` retirée (0 résidu).

### Validation

-
