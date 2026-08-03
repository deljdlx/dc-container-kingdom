---
id: 2026-08-02_20-45
title: Un élément ajouté n'apparaît pas — le pipeline de redessin de l'arbre est cassé
type: fix
branch: claude/spawn-does-not-render
created: 2026-08-02 20:45
ready: 2026-08-02 21:13
doing: 2026-08-02 21:25
verify: 2026-08-03 09:09
done: 2026-08-03 09:09 (merge 6f6ab7e)
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

- [x] Un élément attaché en cours de partie **apparaît sans geste de l'hôte** —
      mesuré au navigateur, compte de nœuds DOM avant/après, sans `board.update()`
      ni `viewport.render()` manuel.
- [x] `needUpdate(false)` **n'éteint plus les ancêtres** — les deux sondes de
      l'audit deviennent des tests de non-régression et passent.
- [x] **Aucune régression de coût à monde immobile** : nœuds visités par frame
      mesurés avant/après, l'élagage tient.
- [x] `Character` n'est pas repeint deux fois par frame (mesure ou test).
- [x] `meta/documentation/engine.md` décrit le pipeline de redessin réel ;
      `npm run verify` vert.

## Suite

- **Ce que ça ouvre** — la couche d'entités dynamiques (étape 2) peut commencer :
  faire naître une entité, c'est désormais l'attacher, point. Un projectile, une
  explosion, un butin lâché apparaissent à la frame suivante sans que l'hôte ait
  rien à appeler. Le drapeau de redessin devient aussi le levier naturel d'un
  futur budget de rendu (« ne repeins que N nœuds par frame »), si le besoin
  vient.
- **Ce qu'on laisse de côté** :
  - **le montage DOM reste l'affaire du `BoardRenderer`** (`renderAreas()`, sur
    `isRendered()`), pas de l'élément lui-même. Le parcours *atteint* le nouvel
    élément ; c'est le renderer du board qui le pose. Un élément attaché hors
    d'une area n'est donc toujours pas monté — personne n'en attache aujourd'hui,
    mais ça se saura le jour venu ;
  - **`Container Kingdom` appelle toujours `viewport.render()` en entier** à
    chaque rafraîchissement. C'est désormais du gaspillage, pas une nécessité —
    déposé en candidat ;
  - **le coût passe de 0 à 2–12 visites de nœuds par frame.** Assumé : c'est le
    prix de la correction, et l'élagage l'empêche d'être 376 ;
  - **le déplacement mort de `Element.update()`** (`_targetX`/`_targetY`, biais
    down/right) a été *traversé* sans être touché — il reste au ticket
    `2026-07-26_14-25`.
- **Déposé en `100-follow-up/`** — deux candidats :
  `2026-08-03_09-10_element-attach-event` (repris tel que ce ticket le prévoyait,
  le rendu s'étant réglé autrement) et
  `2026-08-03_09-10_kingdom-full-render-now-useless`.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-02 21:28] **Le drapeau monte, il ne descend plus.** `needUpdate(true)`
  continue de marquer le chemin jusqu'à la racine — c'est ce qui rend l'élagage
  possible ; `needUpdate(false)` ne vaut désormais **que pour soi**.
- [2026-08-02 21:29] **Éteint avant le travail, pas après.** Ce qui est marqué
  *pendant* la passe appartient à la frame suivante. Éteindre en fin d'`update()`
  aurait effacé la demande à l'instant où elle était levée — un test porte ce
  contrat.
- [2026-08-02 21:30] **Le parcours devient une étape de frame** :
  `this.getBoard().update()` dans `Viewport.update()`, entre les behaviors et la
  caméra. Le monde se pose avant d'être peint.
- [2026-08-02 21:31] **Un seul chemin, pas deux** : le `board.update()` que
  `_streamAreas` appelait à la main est retiré. Charger une area lève le drapeau
  du board, et le parcours de la même frame la monte. Le test de streaming portait
  ce couplage, il porte maintenant son absence.
- [2026-08-02 21:33] **L'event d'attache n'a pas été nécessaire** — le candidat
  fusionné dans ce ticket proposait `element.attach` comme piste. Le parcours
  élagué règle le rendu sans nouvel event ; le besoin du `FxBinder` (lier
  automatiquement) reste entier et repart en candidat, comme le ticket le
  prévoyait.
- [2026-08-02 21:34] Deux de mes propres tests étaient faux et la mesure a gagné :
  je supposais qu'un parent repeint ses enfants (il n'en fait rien, chaque nœud
  lit **son** drapeau), et qu'une demande levée avant que le parcours n'atteigne
  le nœud survivrait à la passe (elle est servie dans la passe, c'est correct).

### Vérification

- [2026-08-02 21:38] `npm run verify` **vert** : **55 fichiers, 477 tests**
  (+9 : le pipeline de redessin et le parcours par frame).
- [2026-08-02 21:35] **Critère qui fait foi** : 20 entités attachées au milieu
  d'une area, **aucun** geste de l'hôte (ni `board.update()` ni
  `viewport.render()`) → **301 nœuds DOM avant, 301 après l'attache, 321 après
  UNE seule frame**. Avant le correctif, la même mesure donnait 0 nouveau nœud
  tant que le joueur ne changeait pas de tuile.
- [2026-08-02 21:37] **L'élagage tient** — mesuré sur 120 frames, démo à 313
  éléments rendus et 63 areas :

  | Scénario | `Element.update()` / frame | Balayage du board / frame | ms / frame |
  |---|---|---|---|
  | immobile | 3,4 | 0,01 | 0,196 |
  | marche | 2,5 | 0,03 | 0,156 |
  | marche + collisions | 12,1 | 0,13 | 0,102 |

  Quelques nœuds sur 376, jamais l'arbre entier. Le coût total par frame reste du
  même ordre qu'avant le changement (0,17–0,20 ms mesurés à l'audit). Dit
  honnêtement : le parcours coûte 2 à 12 visites de nœuds là où il en coûtait 0 —
  et c'est ce prix-là qui fait apparaître les entités.
- [2026-08-02 21:37] **Pas de double repaint** : 150 frames de marche dans la
  foule → **150 peintures du joueur, pire frame à 1**.
- [2026-08-02 21:36] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 535 éléments, 219 conteneurs) et le catalogue (535 sprites).
- [2026-08-02 21:34] Une sonde m'a menti en cours de route : en restaurant un
  prototype par affectation, j'avais laissé une propriété propre sur
  `Board.prototype` qui masquait `Element.prototype` — d'où un compteur à 0
  incohérent. Mesure refaite sur page rechargée, avec un contrôle explicite que
  le board ne porte pas d'`update()` propre.
- [2026-08-02 21:38] Sonde `window.__vp` retirée (0 résidu).

### Validation

- [2026-08-03 09:09] Review : le changement tient en deux endroits — le drapeau
  (`Element.needUpdate` / `update`) et l'appel par frame (`Viewport.update`). Rien
  d'autre n'a bougé ; le `board.update()` retiré de `_streamAreas` supprime un
  chemin au lieu d'en ajouter un.
- [2026-08-03 09:09] Merge `--no-ff` sur `main` depuis le tree principal :
  **6f6ab7e** — `merge: un élément attaché apparaît — le parcours de redessin
  passe par frame` (6 fichiers, +288 / −22).
