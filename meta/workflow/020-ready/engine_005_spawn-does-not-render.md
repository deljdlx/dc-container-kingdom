---
id: 2026-08-02_20-45
title: Un élément ajouté n'apparaît pas — le pipeline de redessin de l'arbre est cassé
type: fix
branch:
created: 2026-08-02 20:45
ready: 2026-08-02 20:56
doing:
verify:
done:
---

## Objectif

**Ajouter un élément au monde ne le fait pas apparaître.** Mesuré au navigateur
sur la démo, le 2026-08-02 :

| Geste | Nœuds `.map-element` dans le DOM |
|---|---|
| avant | **303** |
| après `area.addElement(...)` × 20 | **303** — *aucun* |
| après `board.update()` | **323** |

`addElement()` pose bien l'élément dans le scene-graph et lève le drapeau
`needUpdate`, mais **rien ne parcourt l'arbre par frame** : `Element.update()`
n'est appelé que depuis `Board.update()`, lui-même appelé uniquement par
`Viewport._streamAreas` — c'est-à-dire **au franchissement d'une area**. Un
élément apparu au milieu d'une area reste invisible jusqu'à ce que le joueur
change de tuile.

Container Kingdom ne le voit pas parce qu'il appelle `viewport.render()` à chaque
rafraîchissement (`ContainerKingdom.js:70` et `:88`) — un **re-rendu complet**,
côté hôte. Autrement dit : la parade existe, elle est manuelle, et chaque hôte
doit la connaître.

**C'est le bloqueur direct de la couche d'entités dynamiques** (étape 2 de la
feuille de route) : un projectile, une explosion ou un butin lâché apparaîtraient
au mieux plus tard, au pire jamais. On ne peut pas construire dessus.

## Spécifications

### Le second défaut, de la même famille

`Element.needUpdate(value)` **propage vers le haut** (`Element.js`, ~ligne 508) :
écrire le drapeau l'écrit aussi sur le parent, et de proche en proche jusqu'à la
racine. Or `update()` finit par `this.needUpdate(false)` — **un enfant qui termine
sa mise à jour éteint donc le drapeau de tous ses ancêtres**.

Prouvé par deux sondes (jetables, écrites pendant l'audit, à réintégrer comme
tests de non-régression) :

1. `grandParent`, `parent`, `child` tous marqués sales ; `child.update()` seul →
   **les trois** ressortent à `false`.
2. `second.needUpdate(true)` puis `first.update()` (deux frères) → `second` veut
   toujours son redessin, mais **le parent n'est plus sale**, donc il ne
   redescendra pas vers lui.

Conséquence : une demande de redessin peut être **perdue**, pas seulement
retardée — l'ancêtre ne recursera plus tant qu'un autre geste ne le resalira pas.

Les deux défauts sont **le même mécanisme vu des deux bouts** : rien ne garantit
qu'un nœud sale finisse repeint. Les corriger séparément n'a pas de sens.

### Pistes (à trancher en *specify*)

- **Un drapeau qui monte, un parcours qui descend.** `needUpdate(true)` doit
  continuer à remonter (c'est ce qui permet d'élaguer), mais `needUpdate(false)`
  ne doit valoir que **pour soi** — un nœud ne parle pas au nom de ses ancêtres.
- **Un parcours par frame, élagué.** La boucle doit visiter l'arbre quand il est
  sale, pas seulement au streaming. Le coût doit rester nul quand rien n'a
  changé : c'est précisément à ça que sert le drapeau.
- **Ou bien** : un élément se peint lui-même à l'attache (`element.render()` dans
  `addElement`), ce que fait déjà `Character` en se repeignant directement
  (`Character.js:99`). Plus simple, mais ne règle pas le drapeau perdu.

### Un event d'attache — candidat fusionné ici le 2026-08-02

Le `FxBinder` documente que la liaison reste **manuelle** faute d'event d'attache,
et invoquait deux raisons dont l'une a disparu : « émettre en jetterait pour les
éléments que le catalogue construit avant de les attacher » — `Element.handle()`
est désormais silencieux sans application (`2026-08-02_19-30`).

D'où une asymétrie : la **libération** des emitters est automatique
(`element.destroy`), leur **liaison** reste à la charge de l'hôte. Or c'est le
même besoin que ce ticket : *quelque chose doit se produire quand un élément
rejoint le monde*. Un `element.attach` servirait les deux — le rendu **et** le
liage FX — plutôt que d'inventer deux mécanismes.

À évaluer en *specify* comme **une des pistes**, pas comme un ajout : si le
pipeline de redessin se règle autrement, l'event d'attache redevient un sujet
séparé et repart en candidat.

## Firewalls / risques

1. **Ne pas transformer ça en re-rendu par frame.** L'élagage par drapeau est ce
   qui rend le parcours gratuit à monde immobile ; le supprimer coûterait 300+
   visites de nœuds par frame sur la démo, pour rien.
2. **`Character` court-circuite déjà l'arbre** (il appelle son renderer
   directement). Vérifier qu'on ne le fait pas repeindre deux fois par frame.
3. **La mesure doit encadrer la correction** : compter les nœuds DOM et les
   écritures avant/après, sinon on ne saura pas si on a réglé le bug ou déplacé
   le coût.
4. **Container Kingdom appelle `viewport.render()` en entier** à chaque refresh.
   Si le pipeline devient correct, ce re-rendu complet devient du gaspillage —
   mais le retirer est un autre ticket, pas celui-ci.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-02**, `080-done` compris.
- `src/engine/scene/Element.js` — `update()`, `needUpdate()`, `addElement()`.
- `src/engine/view/Viewport.js` — `_streamAreas()`, seul appelant de
  `Board.update()` en régime permanent.
- `src/container-kingdom/js/ContainerKingdom.js:70,88` — la parade côté hôte.
- Ce que ça bloque : la couche d'entités dynamiques, étape 2 de la série ouverte
  par `2026-08-02_19-30`.

## Definition of Done

- [ ] Un élément attaché en cours de partie **apparaît sans geste de l'hôte** —
      mesuré au navigateur, compte de nœuds DOM avant/après, sans `board.update()`
      ni `viewport.render()` manuel.
- [ ] `needUpdate(false)` **n'éteint plus les ancêtres** — les deux sondes de
      l'audit deviennent des tests de non-régression et passent.
- [ ] **Aucune régression de coût à monde immobile** : nœuds visités par frame
      mesurés avant/après, l'élagage tient.
- [ ] `Character` n'est pas repeint deux fois par frame (mesure ou test).
- [ ] `meta/documentation/engine.md` décrit le pipeline de redessin réel ;
      `npm run verify` vert.

## Suite

_Rempli à la clôture._

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
