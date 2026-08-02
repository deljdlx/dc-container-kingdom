---
id: 2026-08-02_18-18
title: Un élément porte son effet, en coordonnées locales
type: feat
branch: claude/element-owned-fx
created: 2026-08-02 18:18
ready: 2026-08-02 18:21
doing: 2026-08-02 18:22
verify: 2026-08-02 18:30
done: 2026-08-02 18:38 (merge 83ce2f5)
---

## Objectif

Le jet de la fontaine est aujourd'hui posé **à la main dans la démo**, à une
position monde codée en dur :

```js
viewport.addBehavior(new FountainSpray(fx, { at: { x: 224, y: 438 } }));
```

Déplacez la fontaine, le jet reste. Posez-en une seconde, elle est sèche. Or
l'effet appartient à l'objet, pas à la scène : une fontaine **crache**, où qu'elle
soit.

Un élément déclare déjà sa géométrie, sa zone de collision et son ombre dans un
`static descriptor` interprété par le renderer. L'effet est de la même nature —
une propriété de l'objet, pas du décor où on le pose.

Le mécanisme est **à moitié là** : `Emitter` sait suivre un élément (`follow` +
`offset`) et résout sa position **à chaque salve** (`2026-08-02_18-00`). Il manque
la déclaration et le câblage.

## Spécifications

### Décisions prises en *specify* (2026-08-02)

Deux constats de code ont tranché la question centrale — **quel est le point
d'accroche du câblage ?**

- **Aucun événement d'attachement n'existe.** `Element.addElement` ne notifie
  personne, et `Element.handle()` appelle `getApplication().handle(...)` : émettre
  un événement à l'attachement **lèverait** pour tout élément construit avant
  d'être attaché — ce que fait le catalogue pour ses 414 éléments.
- **`_streamAreas` ne tourne jamais dans l'app** : il n'est appelé que lorsqu'un
  personnage se déplace, et Container Kingdom n'en a pas. Un câblage adossé au
  streaming ne couvrirait donc qu'un régime sur deux.

D'où :

1. **Liage explicite et idempotent** : `bind(root)` parcourt un sous-arbre,
   instancie un émetteur par déclaration et l'enregistre. Appelé automatiquement
   par `enableParticles()` (sur le board existant) et par `_streamAreas()` après
   chargement ; un hôte qui ajoute des éléments plus tard rappelle `bind` — c'est
   sans risque, puisque relier deux fois ne double rien. C'est le goût du moteur :
   `addBehavior`, `setRenderer`, `enableMainCharacter` sont tous explicites.
2. **Deux ceintures contre la fuite**, comme exigé : le liage retire les émetteurs
   d'un sous-arbre libéré, **et** l'émetteur se retire de lui-même quand sa cible
   n'a plus de parent. La seconde couvre les chemins de destruction qu'on n'a pas
   prévus.
3. **La visibilité est injectée, pas devinée** : `Emitter` reçoit un prédicat
   `isVisible(x, y)`, fourni par le lieur à partir du viewport et de la
   `ViewportTransform`. L'émetteur reste pur et testable sans DOM.
4. **Marge de culling : 128 px monde**, chiffrée — une goutte de fontaine vit
   1,2 s à 90 px/s, soit ~108 px de trajet maximum. En dessous, une particule née
   juste hors champ n'entrerait jamais dans le cadre.

### La déclaration, en coordonnées locales

```js
export class Fountain00 extends SpriteElement {
  static descriptor = {
    width: 80, height: 64,
    collision: [4, 5, 70, 59],
    fx: [{ emitter: FountainSpray, at: { x: 24, y: 8 } }],
  };
}
```

`at` est **local à l'élément** (depuis son coin haut-gauche), comme `collision` et
`shadow` — jamais une position monde. C'est ce qui rend l'élément posable
n'importe où, et duplicable.

### Le câblage : c'est le layer qui lie, pas l'élément qui cherche

L'élément **ne va pas chercher** la surface FX : le scene-graph dépendrait d'une
surface de rendu. C'est le layer (ou un lieur dédié) qui **parcourt un sous-arbre**
au chargement d'une aire, instancie un émetteur par déclaration et l'enregistre
comme behavior.

À trancher en *specify* : le point d'accroche exact (chargement d'aire dans
`Board`/`Viewport._streamAreas`), et l'**idempotence** — une aire rechargée ne doit
pas doubler ses émetteurs.

### Le culling entre dans le périmètre

Ce n'est plus un confort. Avec **une** fontaine posée à la main, un émetteur hors
écran ne gênait personne. Dès que chaque `Fountain00` de la fenêtre **7×7** émet,
les gouttes qu'on ne voit pas **évincent celles qu'on regarde** : le budget de
particules est partagé et plafonné (600), et l'éviction sacrifie les plus vieilles
sans regarder où elles sont.

`ViewportTransform.worldToScreen` rend la question triviale : l'émetteur se tait
quand sa position sort du viewport, avec une **marge** (une particule qui naît
juste hors champ doit pouvoir entrer dans le cadre).

## Firewalls / risques

1. **La fuite d'émetteurs — le risque n°1.** `Element.destroy()` détache du parent,
   vide la scène et le rendu ; il **ne prévient personne d'autre**. Un émetteur
   enregistré sur le viewport survivrait à l'aire libérée et continuerait d'émettre
   à la position d'un mort, indéfiniment. C'est exactement la famille de défaut
   déjà rencontrée (`2026-07-26_14-18` : `freeArea` qui ne détachait pas l'aire).
   **Deux ceintures** : délier explicitement à la libération d'aire, **et** un
   garde-fou dans l'émetteur (cible orpheline → il se retire tout seul). Un test
   doit prouver qu'après un cycle chargement → libération, la liste des behaviors
   revient à son état initial.
2. **Idempotence du liage.** Le streaming recharge des aires ; lier deux fois
   doublerait le débit sans que rien ne le signale.
3. **Le budget partagé reste le vrai plafond.** Le culling réduit les émetteurs
   actifs, il ne borne pas leur nombre : dix fontaines visibles se partagent 600
   particules. Vérifier que le comportement dégradé est acceptable, et le dire.
4. **La marge de culling est un compromis** : trop serrée, les particules
   apparaissent en bord d'écran ; trop large, on n'a rien coupé. À chiffrer, pas à
   deviner.
5. **Ne pas élargir le descripteur.** Un seul effet réellement porté (la fontaine)
   ne fait pas une API : garder `fx` étroit, quitte à l'élargir au troisième usage.
6. **Le catalogue** (`/engine/catalog/`) instancie tous les éléments pour les
   afficher : vérifier qu'un descripteur `fx` n'y déclenche rien (pas de viewport,
   pas de layer) plutôt que de lever.

## Contexte / liens

- Le socle : `src/engine/fx/Emitter.js`, `FountainSpray.js` (`2026-08-02_18-00`).
- L'élément : `src/engine/map/Elements/Fountain00.js`.
- Le cycle de vie : `Element.destroy()`, `Board.freeArea()`, `Viewport._streamAreas()`.
- La conversion pour le culling : `src/engine/map/ViewportTransform.js`.
- Le précédent de fuite : `2026-07-26_14-18`.

## Definition of Done

- [x] `Fountain00` déclare son jet dans son descripteur, en coordonnées locales ;
      la démo ne pose plus aucune position monde.
- [x] Deux fontaines posées à des endroits différents crachent **toutes les deux**,
      chacune chez elle — vérifié à l'écran.
- [x] **Aucune fuite** : après chargement puis libération d'une aire, la liste des
      behaviors du viewport revient à son compte initial (test).
- [x] Un émetteur dont la cible est détachée se retire de lui-même (test).
- [x] Lier deux fois la même aire ne double pas le débit (test).
- [x] Un émetteur hors champ **ne consomme pas le budget** ; la marge est chiffrée
      et justifiée.
- [x] Le catalogue affiche toujours les 414 éléments sans erreur.
- [x] `meta/documentation/engine.md` à jour ; `npm run verify` vert.

## Suite

- **Ce que ça ouvre** — le mécanisme vaut pour **n'importe quel élément** : une
  cheminée qui fume, une torche qui crépite, un conteneur qui chauffe selon sa
  charge CPU dans Container Kingdom. Ce n'est plus du code, c'est **une ligne de
  descripteur**. Le culling et le liage suivent gratuitement.
- **Ce qu'on laisse de côté** :
  - **une frame de latence** après un saut de caméra : les behaviors tournent
    *avant* `camera.update()` dans la boucle, donc un émetteur qui vient de sortir
    du champ émet encore une fois (4 gouttes mesurées sur un téléport de 6 000 px).
    Invisible à l'œil, mais c'est un ordre de boucle, pas une fatalité ;
  - **le budget reste global** : dix fontaines visibles se partagent 600
    particules, et l'éviction sacrifie les plus vieilles sans regarder de qui
    elles viennent. Acceptable tant que les effets sont rares ; à revoir le jour
    où un hôte en pose des dizaines ;
  - **`FootstepDust` reste câblée à la main** dans la démo : elle suit le joueur,
    qui n'est pas un élément déclarant un effet mais une création du viewport.
- **Limite de la vérification** — la marge de culling (128 px) est chiffrée **pour
  la goutte de fontaine** (1,2 s à 90 px/s). Un effet plus rapide ou plus
  long-vivant pourrait la dépasser et disparaître au bord de l'écran. Le jour où
  un tel effet existe, la marge devra se déduire du descripteur plutôt que d'être
  une constante.
- **Déposé en `100-follow-up/`** — rien.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-02 18:23] `Fountain00` déclare son jet dans son descripteur, en
  coordonnées **locales** (`at: { x: 24, y: 8 }`), au même titre que sa collision
  et son ombre. La démo ne pose plus **aucune** position monde ; une **seconde**
  fontaine a été ajoutée à la carte pour que la preuve soit visible.
- [2026-08-02 18:23] `FxBinder` lit les déclarations et câble. Liage **explicite
  et idempotent** : `enableParticles()` lie l'existant, `_streamAreas` relie après
  chargement, un hôte peut rappeler `bind` sans rien doubler.
- [2026-08-02 18:23] **Deux ceintures contre la fuite**, comme exigé :
  `Board.freeArea` délie **avant** `area.destroy()`, et un émetteur dont la cible
  n'a plus de parent s'arrête de lui-même (`isAlive()`), quel que soit le chemin
  de destruction.
- [2026-08-02 18:24] **Culling** : `isVisible` s'appuie sur `ViewportTransform`,
  donc il suit la caméra **et** le zoom. Marge de **128 px monde**, chiffrée : une
  goutte vit 1,2 s à 90 px/s (~108 px de trajet), couper au ras du bord
  empêcherait une particule née juste dehors d'entrer dans le cadre.
- [2026-08-02 18:24] Le prédicat de visibilité est **injecté** dans l'émetteur,
  pas déduit : `Emitter` reste pur et testable sans DOM.

### Vérification

- [2026-08-02 18:25] `npm run verify` vert : **51 fichiers, 415 tests** (402
  avant, +13 sur le lieur).
- [2026-08-02 18:26] **Deux fontaines liées toutes seules** dans la démo, sans
  aucune position posée : 2 émetteurs, **38 gouttes chacune** après 60 frames,
  chacune à son propre bassin (~224,438 et ~664,128). Visible à l'écran.
- [2026-08-02 18:27] **Aucune fuite, mesuré dans le vrai moteur** : avant
  `freeArea(0,0)` → 13 behaviors / 2 émetteurs liés ; après → **11 behaviors / 0
  lié**. La liste revient exactement à son état d'avant liage.
- [2026-08-02 18:27] **Culling vérifié dans les deux sens** : caméra emmenée à
  (6000, 6000) → 4 gouttes seulement et `isVisible(224,438)` faux ; retour près
  des fontaines → 76 gouttes. Les 4 gouttes résiduelles s'expliquent : les
  behaviors tournent **avant** `camera.update()` dans la boucle, donc la première
  frame après un saut de caméra émet encore. Une frame de latence, sans effet
  visible.
- [2026-08-02 18:29] **Catalogue intact** : 2 484 cartes, 88 entrées d'index,
  `Fountain00` présente, **aucune erreur console** — un descripteur `fx` ne
  déclenche rien hors d'un viewport, ce qui était le risque n°6.
- [2026-08-02 18:30] Sonde retirée (0 résidu).
- [2026-08-02 18:38] **Ancre ajustée à l'œil** sur demande, en deux passes :
  `at.x` de 24 → 34 → **39** (sur 80 px de large). C'est le genre de réglage que
  la déclaration locale rend trivial : un nombre, dans la classe de l'élément, et
  **les deux fontaines suivent**.
- [2026-08-02 18:40] **Chevauchement corrigé — et ma première sonde était fausse.**
  La seconde fontaine, posée en [640, 120], recouvrait la clôture de l'enclos. Ma
  vérification n'avait rien vu parce qu'elle ne parcourait que les **enfants
  directs** de l'aire : les clôtures sont imbriquées dans des `FenceGroup00` (81
  `Fence00H` + 72 `Fence00V` dans le board). Parcours refait **récursivement** :
  fontaine déplacée en [500, 480], en herbe libre, **0 chevauchement** pour les
  deux — clôtures, maisons, arbres et trajets de patrouille compris.

### Validation

- [2026-08-02 18:37] Review du diff : la frontière tient (les FX ignorent l'app,
  `FxBinder` s'exporte par le baril), l'élément **déclare** sans jamais aller
  chercher la surface de rendu, et les deux ceintures anti-fuite sont chacune
  couvertes par un test.
- [2026-08-02 18:38] Merge `--no-ff` sur `main` depuis le tree principal :
  **83ce2f5** — `merge: un élément porte son effet, en coordonnées locales`
  (10 fichiers, +545 / −19).
