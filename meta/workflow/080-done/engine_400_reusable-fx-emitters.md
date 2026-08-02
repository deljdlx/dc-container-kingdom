---
id: 2026-08-02_18-00
title: Isoler les effets en émetteurs réutilisables, dans un dossier fx
type: refactor
branch: claude/fx-emitters
created: 2026-08-02 18:00
ready: 2026-08-02 18:01
doing: 2026-08-02 18:02
verify: 2026-08-02 18:06
done: 2026-08-02 18:12 (merge a579068)
---

## Objectif

Le layer de particules est en place (`2026-08-01_21-07`), mais **les deux effets
qui l'utilisent sont écrits à la main dans la démo** : une trentaine de lignes
inline dans `src/engine/demo/demo.js`, avec leur compteur de cadence, leur
descripteur d'émission et leur condition d'émission mélangés au code de mise en
scène. Rien n'est réutilisable : un second projet qui embarque le moteur
recopierait ces lignes.

Le moteur a pourtant déjà le patron : un émetteur, c'est un **behavior**
(`update(dt)` sur l'horloge unique), au même titre que `PatrolBehavior` ou
`FleeBehavior` — pas un timer maison.

Et le rangement ne suit plus : `ParticleSystem` et `ParticleLayer` vivent dans
`src/engine/map/`, alors qu'ils n'ont rien à voir avec la carte. `map/` compte
déjà une trentaine de fichiers.

Coût du non-fait : le prochain effet sera copié-collé depuis la démo, avec sa
propre variante de compteur — et la démo restera le seul endroit où lire comment
on émet.

## Spécifications

_Amorce — à confirmer en « specify »._

### Un dossier `src/engine/fx/`

Il accueille le sous-système complet : `ParticleSystem` et `ParticleLayer` y
**déménagent** depuis `map/`, rejoints par l'émetteur et les effets nommés. Le
baril `src/engine/index.js` réexporte, donc aucun consommateur externe ne bouge.

### `Emitter` — un behavior, pas un timer

- `update(dt)` : accumule le temps et émet à la **cadence** demandée. Sur
  l'horloge unique du moteur, donc il gèle et repart avec le jeu.
- **Cible** : soit un **point fixe** (la fontaine), soit un **élément qui bouge**
  (la poussière suit le joueur). C'est ce couple qui rend l'émetteur réutilisable
  ; l'élément est duck-typé (`offsetX()`/`offsetY()`), pas une classe imposée.
- `start()` / `stop()`, et un `shouldEmit()` que les effets surchargent — c'est
  ainsi que la poussière n'apparaît qu'en marche, sans condition câblée dans la
  base.

### Les effets nommés, déclaratifs

`FountainSpray` et `FootstepDust` portent leur descripteur en **statique**, sur le
modèle du `static descriptor` des `SpriteElement` : la donnée d'un côté, le
comportement de l'autre. La démo se contente alors de les instancier et de les
enregistrer.

### Risques

- **Déménager `map/` → `fx/` casse les imports internes** et les chemins cités
  dans la doc. Mécanique, mais à faire d'un bloc, garde-fou du board compris (il
  vérifie les liens markdown).
- **Ne pas figer l'API sur deux exemples.** Deux effets ne font pas une
  bibliothèque : garder le descripteur étroit, quitte à l'élargir au troisième.
- La démo doit rester **la preuve d'usage** : si elle devient plus courte et plus
  lisible, l'extraction a réussi ; si elle devient plus obscure, c'est raté.

## Contexte / liens

- Les effets à extraire : `src/engine/demo/demo.js` (section « Particles »).
- Le socle : `src/engine/map/ParticleLayer.js`, `src/engine/map/ParticleSystem.js`
  (`2026-08-01_21-07`).
- Le patron à suivre : `src/engine/map/PatrolBehavior.js`, `FleeBehavior.js`.
- Doc à mettre à jour : `meta/documentation/engine.md` §3.2 et §11.

## Definition of Done

- [x] `src/engine/fx/` contient le sous-système ; `map/` n'a plus de fichier de
      particules.
- [x] `Emitter` tick par `dt`, cadence respectée, et suit **un point comme un
      élément mobile** — les deux cas testés.
- [x] `FountainSpray` et `FootstepDust` existent, déclaratifs, exportés par le
      baril.
- [x] La démo n'écrit plus de logique d'émission : elle instancie et enregistre.
- [x] Tests sans DOM sur la cadence, la cible mobile et `shouldEmit`.
- [x] Rendu inchangé à l'écran (jet de la fontaine et poussière), vérifié au
      navigateur.
- [x] `meta/documentation/engine.md` à jour ; liens du board verts.
- [x] `npm run verify` vert.

## Suite

- **Ce que ça ouvre, et qui est déjà demandé** — que l'effet soit **porté par
  l'élément** plutôt que posé à la main dans la démo : `Fountain00` déclarerait son
  jet dans son descripteur, en coordonnées **locales**, et poser une fontaine
  n'importe où donnerait le jet gratuitement. Le mécanisme est à moitié là :
  `Emitter` sait déjà suivre un élément et résout sa position à chaque salve. Il
  manque la déclaration et le câblage. Ticket ouvert dans la foulée.
- **Ce qu'on laisse de côté** — l'émetteur **tourne hors écran**. Sans conséquence
  aujourd'hui (une fontaine posée à la main), mais dès que chaque `Fountain00` de
  la fenêtre 7×7 émettra, les gouttes invisibles **évinceront les visibles** : le
  budget de particules est partagé et plafonné. Le culling cesse alors d'être un
  confort ; il devient une condition, et il est porté par le ticket suivant.
  `ViewportTransform` rend d'ailleurs la question triviale — « suis-je visible ? »
  est une soustraction.
- **Ce qu'il ne faut pas faire trop tôt** — figer l'API sur deux effets. Le
  descripteur reste volontairement étroit ; on l'élargira au troisième, pas avant.
- **Déposé en `100-follow-up/`** — rien : la suite est un ticket, pas un candidat.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-02 18:02] Déménagement `map/` → **`src/engine/fx/`** en `git mv`
  (historique préservé) : `ParticleSystem` et `ParticleLayer` rejoignent le
  nouveau dossier, imports internes et baril réparés. `map/` perd deux fichiers
  qui n'avaient rien à y faire.
- [2026-08-02 18:03] `Emitter` : un **behavior**, pas une minuterie. Il tient la
  cadence et la cible — point monde fixe (`at`) **ou** élément qui bouge
  (`follow`, duck-typé sur `offsetX()`/`offsetY()`), plus un `offset` pour viser
  les pieds. La position est résolue **à chaque salve**, ce qui est précisément ce
  qui permet de suivre un personnage qui marche.
- [2026-08-02 18:03] Après un long gel (onglet en arrière-plan), le compteur est
  **remis à zéro** plutôt que décrémenté : une frame à 10 s produit une salve, pas
  cent. Verrouillé par un test.
- [2026-08-02 18:03] `FountainSpray` et `FootstepDust` sont **déclaratifs** —
  `static descriptor` + `static interval`, sur le modèle des `SpriteElement`. La
  condition d'émission passe par `shouldEmit()` surchargeable : la poussière ne se
  lève que sous un personnage qui marche, sans que la base connaisse les
  personnages. Sans prédicat, elle reste **silencieuse** — épousseter une statue
  serait le mauvais défaut.
- [2026-08-02 18:04] La démo passe de **46 à 17 lignes** de FX, et n'écrit plus
  aucune logique d'émission : elle instancie et enregistre. C'était le critère de
  réussite de l'extraction.

### Vérification

- [2026-08-02 18:04] `npm run verify` vert : **50 fichiers, 402 tests** (390
  avant, +12 sur l'émetteur).
- [2026-08-02 18:04] Les tests couvrent ce qui casse en silence : la cadence (une
  salve par intervalle, pas une par frame), l'absence de rattrapage après un gel,
  la cible **mobile** résolue à chaque salve, l'`offset`, `shouldEmit`, et le
  silence par défaut de `FootstepDust`. Tous **sans DOM**.
- [2026-08-02 18:06] **Rendu inchangé au navigateur** : jet bleu au-dessus du
  bassin et poussière sous les pieds, les deux familles vivantes simultanément
  (50 gouttes `#9fe4ff` + 15 poussières `#e8dcc4` après 110 frames de marche).
  Sonde retirée (0 résidu).

### Validation

- [2026-08-02 18:11] Review du diff : frontière moteur tenue (les FX ignorent
  Docker et l'app, tout s'exporte par le baril), le déménagement conserve
  l'historique (`git mv`), et la démo — la preuve d'usage — est plus courte
  qu'avant, ce qui était le critère.
- [2026-08-02 18:12] Merge `--no-ff` sur `main` depuis le tree principal :
  **a579068** — `merge: des effets réutilisables dans un dossier fx`
  (13 fichiers, +452 / −63).
