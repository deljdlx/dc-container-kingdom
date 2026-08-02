---
id: 2026-08-02_19-30
title: Un bus d'events typé, avec cycle de vie et console
type: feat
branch: claude/typed-event-bus
created: 2026-08-02 19:30
ready: 2026-08-02 19:32
doing: 2026-08-02 19:34
verify: 2026-08-02 19:51
done:
---

## Objectif

Le moteur doit devenir un **moteur de jeu** (projectiles, explosions, dégâts) et
non plus seulement un moteur de déambulation. Le socle sur lequel tout ça
reposera — les events — est aujourd'hui **embryonnaire**, et trois défauts
mesurés le rendent inapte à des entités qui naissent et meurent en continu.

Ce ticket est le **premier** d'une série de blindage (events → entités
dynamiques → horloge fixe → collision par paires → projectiles). Il a une valeur
propre, sans le moindre projectile : il **supprime** un couplage existant.

## Spécifications

### L'état des lieux (mesuré le 2026-08-02)

| Constat | Où | Conséquence |
|---|---|---|
| `EventEmitter` n'a **pas de `off()`** | `src/engine/map/EventEmitter.js` | un abonné éphémère ne peut pas se désabonner d'un émetteur durable → **fuite mémoire** |
| `on()` retourne un **index inutilisé** | idem | l'index deviendrait faux dès le premier retrait ; aucun appelant ne le lit |
| `emit()` itère la **liste vivante** (`.map`) | idem | un callback qui se désabonne lui-même **fait sauter le suivant** |
| `handle()` saute à l'application | `Element.js:222` | pas de niveau intermédiaire : on écoute l'élément exact, ou tout |
| `handle()` suppose l'élément **attaché** | `Element.js:224`, `_application = Application.mainInstance` | émettre depuis un élément détaché **jette** |
| Noms **concaténés**, déjà incohérents | `CollisionSystem.js:377` vs `:391` | `_eventPrefix + type` d'un côté, `'element.'` **en dur** de l'autre : une sous-classe qui changerait son préfixe verrait ses `.end` divorcer de ses débuts |
| **Neuf** noms d'events en tout, **aucun** de cycle de vie | tout le moteur | d'où la couture manuelle de `Board.freeArea` |

Le commentaire de `Board.js:136` est l'aveu écrit du dernier point :
« `destroy()` détache et **ne prévient personne** ».

### Ce que « typé » veut dire ici (vanilla JS, pas de TypeScript)

Trois choses, et **pas** de validation à l'exécution (coût par émission, n'attrape
rien qu'un test n'attrape mieux) :

1. **Un catalogue de noms déclaré** — des constantes exportées, gelées, aux
   **valeurs identiques aux chaînes actuelles** (rien ne casse). Ça tue les
   typos, ça rend les events **découvrables**, et ça donne à la console ses
   catégories gratuitement.
2. **Une enveloppe de payload commune** — un tronc `{ type, source, at }` plus les
   données propres à l'event. C'est ce tronc qui rend une console *générique*
   possible, sans un `if` par type.
3. **Un `@typedef` JSDoc par event** — le seul « typage » qui rende de
   l'autocomplétion en vanilla, et déjà la convention du dépôt.

### Décisions prises (à ne pas rouvrir en cours de route)

- **`on()` retourne une fonction de désabonnement**, pas un index. Un index est
  invalidé par le premier retrait ; la fermeture, jamais. Le retour actuel n'est
  lu nulle part → le changement est gratuit.
- **`emit()` itère une copie** de la liste des callbacks.
- **Pas de vrai bubbling** parent → parent : on **assume** le modèle *local +
  bus global*, plus simple et plus rapide. C'est un choix, il s'écrit dans la
  doc ; le jour où un niveau intermédiaire manque, ce sera un autre ticket.
- **`onAny(callback)`** existe — la console ne peut pas s'abonner nom par nom, et
  c'est précisément l'abonné qui a besoin de tout voir.
- **Le bus global reste hébergé par `Application`** : pas de nouveau singleton.

### Le cycle de vie — le vrai gain

`Element.destroy()` émet. Dès lors, **`FxBinder` s'abonne au lieu d'être appelé**,
et la ligne cousue à la main dans `Board.freeArea()` **disparaît**. C'est le
critère qui rend ce ticket vérifiable au-delà du déclaratif : il retire du
couplage.

```mermaid
flowchart LR
  A["Element.destroy()"] -->|"aujourd'hui"| B["rien —<br/>Board.freeArea recoud<br/>le FxBinder à la main"]
  A -->|"après"| C["émet element.destroy"]
  C --> D["FxBinder abonné<br/>libère ses emitters"]
  C --> E["console de la démo<br/>affiche l'event"]
  C --> F["futurs abonnés<br/>(projectiles, HUD…)"]
```

### Ce qui **ne** passe **pas** par le bus

La règle, à écrire dans la doc : **le bus porte les faits de jeu** (une entité est
née, a été touchée, est morte), **pas les pas de simulation** (le mouvement par
pixel, la détection par frame). Un payload alloué par frame et par entité coûte
cher et rend le flux illisible.

`map.update` est déjà du mauvais côté de cette ligne — il est émis à **chaque
frame où le joueur se déplace** (`Viewport.js:552`). Il est **conservé tel quel**
ici (`ContainerKingdomLayout.js:247` en dépend) ; son sort est un candidat de
suite, pas ce ticket.

### La console d'events (démo)

Pas un confort : un **instrument de mesure de l'architecture**. Si un fait de jeu
n'est pas lisible dedans, c'est qu'il n'est pas modélisé.

- **Coalescence des répétitions** (`element.collision ×247`) — *critique* : sans
  elle, un event de déplacement noie tout en une seconde.
- **Filtre par préfixe**, alimenté par le catalogue, + un compteur d'events/s.
- **Plafond d'entrées** (tampon circulaire) — une console sans plafond fuit
  exactement comme le reste.
- **Clic sur une entrée → surligne l'élément source** dans la scène. C'est ce qui
  la rend utile plutôt que décorative.
- **Derrière `?debug=1`** (flag existant, `src/engine/debug.js`) : `onAny` sur un
  bus chaud ne doit pas être branché en permanence.
- Outil du **moteur** (`src/engine/tools/`), exporté depuis `index.js`, **ignorant
  de Container Kingdom**.

Le `GameConsole` actuel est trop naïf pour ce rôle (ni plafond, ni filtre, et un
`innerHTML` par entrée — donc une injection dès qu'un event porte du texte
d'origine externe). **À trancher au début du travail** : le durcir, ou en faire un
outil frère. Dans les deux cas, **pas d'`innerHTML`** pour du contenu d'event.

## Firewalls / risques

1. **Le retrait pendant l'émission** est le bug classique de ce genre de bus :
   un callback qui se désabonne lui-même décale la liste et fait sauter le
   suivant. Le code actuel y est exposé. Ça se prouve par un test, pas par une
   relecture.
2. **`onAny` est un chemin chaud.** Il ne doit rien allouer quand personne n'est
   abonné, et la console ne doit exister que sous `?debug=1`.
3. **Le catalogue ne doit pas devenir un fourre-tout** : il liste ce que le
   **moteur** émet. Un event applicatif (Container Kingdom) n'y entre pas — c'est
   la frontière moteur qui parle.
4. **Ne pas renommer les events existants.** Les neuf noms actuels gardent leurs
   valeurs ; le catalogue les *déclare*, il ne les remplace pas.
5. **Un émetteur détaché ne doit jamais jeter** — c'est exactement le cas d'un
   projectile créé avant attachement, ou survivant à son area.
6. **Ne pas glisser vers la couche d'entités dynamiques** : elle est le ticket
   suivant. Ici, on pose le socle et on le prouve sur l'existant.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-02**, `080-done` compris.
- Le bus : `src/engine/map/EventEmitter.js`, `src/engine/map/Application.js`,
  `src/engine/map/Element.js` (`handle`, `addEventListener`).
- Les émetteurs actuels : `src/engine/map/CollisionSystem.js`,
  `src/engine/map/Character.js`, `src/engine/map/Area.js`,
  `src/engine/map/Viewport.js`.
- La couture à supprimer : `src/engine/map/Board.js` (`freeArea`) et
  `src/engine/fx/FxBinder.js`.
- La console existante : `src/engine/tools/GameConsole.js` ; la démo :
  `src/engine/demo/demo.js`.
- Le flag debug : `src/engine/debug.js`.
- Doc à tenir : `meta/documentation/engine.md`, `meta/documentation/architecture.md`.
- Tickets voisins (la suite de la série) : `engine_120_loop-stop-and-teardown`,
  `engine_130_frame-rate-independent-animation`.

## Definition of Done

- [x] `off()` / désabonnement : `on()` **retourne une fonction** qui retire le
      callback, et un test prouve qu'un abonné retiré n'est plus appelé.
- [x] Un test prouve qu'un **callback qui se désabonne pendant l'émission** ne
      fait pas sauter le suivant.
- [x] Un **catalogue de noms** est exporté depuis `src/engine/index.js`, avec les
      **valeurs actuelles inchangées**.
- [x] **Plus aucun nom d'event assemblé par concaténation** dans le moteur —
      l'incohérence `CollisionSystem.js:377` / `:391` a disparu.
- [x] Les events portent une **enveloppe commune** documentée, et chacun a son
      `@typedef` JSDoc.
- [x] `Element.destroy()` **émet** un event de cycle de vie.
- [x] **La couture disparaît** : `FxBinder` s'abonne, et l'appel manuel à
      `unbind` dans `Board.freeArea()` est supprimé — sans régression des
      emitters (démo à l'appui).
- [x] Émettre depuis un élément **sans application ne jette pas** (test).
- [x] `onAny()` existe et **ne coûte rien** quand personne n'est abonné.
- [x] **La console est dans la démo**, sous `?debug=1` : coalescence, filtre,
      plafond d'entrées, clic → surlignage de la source. **Capture au journal —
      c'est le critère qui fait foi.**
- [x] Aucun `innerHTML` pour du contenu d'event.
- [x] Aucun event émis **par frame et par entité** sur le chemin chaud.
- [x] `meta/documentation/engine.md` à jour (le bus, le catalogue, la règle
      « faits de jeu, pas pas de simulation », le choix assumé local + global) ;
      `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-02 19:36] **Un dossier `events/`** : `EventEmitter` quitte `map/` pour
  rejoindre `EngineEvents`. Le bus n'est pas une préoccupation de carte, et le
  sous-système devient repérable — un `git mv` et deux imports.
- [2026-08-02 19:38] **Copy-on-write plutôt que copie à l'émission.** `on()` et
  `off()` remplacent le tableau au lieu de le muter ; la boucle d'`emit()` itère
  donc un instantané *sans rien allouer*. C'est ce qui rend sûr le retrait
  pendant l'émission — le bug que la DoD demandait de prouver — sans payer une
  allocation par event. Sémantique de snapshot assumée et documentée.
- [2026-08-02 19:38] **Un `Map` à la place de l'objet nu.** Défaut trouvé en
  réécrivant : `typeof this._listeners['constructor'] === 'undefined'` est
  **faux** sur un objet nu — un event nommé `constructor` ou `toString` serait
  allé chercher `Object.prototype`. Test à l'appui.
- [2026-08-02 19:40] **L'enveloppe est estampillée à l'origine, pas au relais.**
  `makeEvent()` laisse passer un payload déjà estampillé pour le même nom : `at`
  date donc l'origine et `source` nomme l'émetteur, pas le dernier relais. Sans
  ça, `Element → Application` réécrivait les deux.
- [2026-08-02 19:41] **`_eventPrefix` supprimé.** Le mécanisme existait, n'était
  jamais surchargé, et `CollisionSystem` le contournait déjà en dur pour les
  `.end`. Remplacé par `collisionEventName(type, phase)`, qui **jette** sur un
  type inconnu plutôt que d'émettre dans le vide.
- [2026-08-02 19:42] **La couture retirée.** `Element.destroy()` émet **avant**
  de se détacher — un abonné doit encore pouvoir parcourir le sous-arbre qu'il
  lâche. Le `FxBinder` s'abonne (et `dispose()` le détache) ; les trois lignes de
  `Board.freeArea()` qui appelaient `unbind` à la main ont disparu.
- [2026-08-02 19:43] **La console n'écrit pas sur l'horloge du jeu.** Les events
  sont mis en file et le DOM est écrit sur un timer à 100 ms : un observateur de
  la boucle ne doit pas devenir lui-même un écrivain DOM par frame. Coalescence,
  tampon circulaire, `textContent` partout.
- [2026-08-02 19:43] **`GameConsole` laissé intact** — décision qui restait
  ouverte au ticket. Il est **utilisé par Container Kingdom**
  (`ContainerKingdomLayout.js:121`) : le durcir aurait fait bouger le contrat
  d'un consommateur vivant pour un besoin qui n'est pas le sien. `EventConsole`
  est donc un outil frère.
- [2026-08-02 19:44] Deux tests de caractérisation mis à jour (`Element`,
  `Viewport`) : ils comparaient le payload à l'identique, il porte désormais
  l'enveloppe. Changement de contrat voulu, écrit dans la doc.
- [2026-08-02 19:44] Au passage : `setInterval`/`clearInterval`/`performance`
  ajoutés aux globals ESLint, et un `const fx` inutilisé retiré de la démo
  (avertissement qui préexistait).

### Vérification

- [2026-08-02 19:45] `npm run verify` **vert** : **54 fichiers, 468 tests**
  (contre 51 / 418 avant — +50 tests).
- [2026-08-02 19:46] **Critère qui fait foi — le découplage, mesuré au
  navigateur** : `binder.count()` passe de **2 à 0** sur `board.freeArea(0, 0)`,
  alors que `freeArea` **ne contient plus aucun `unbind`** (vérifié en lisant la
  source de la fonction dans la page). La console affiche `element.destroy Area`
  au même instant. Le Board ne connaît plus le FxBinder.
- [2026-08-02 19:46] **Coalescence** : 90 frames de marche pilotées à la main
  (piège rAF) → **16 lignes** au lieu de ~130 ; une marche continue de 45 frames
  tient en **une** ligne `map.update ×45`. Capture au dossier.
- [2026-08-02 19:47] **Plafond** : 250 events de noms distincts → **200 lignes**
  à l'écran, de `probe.50` à `probe.249`. Le tampon circulaire tient.
- [2026-08-02 19:47] **Filtre** : `collision` masque 7 entrées sur 21 et les
  restaure toutes au vidage du champ, piloté par le vrai `<input>`.
- [2026-08-02 19:48] **Clic → surlignage** : la ligne cliquée surligne bien un
  `map-element` **dans le viewport**, et le retire après 1,2 s. Ma première sonde
  disait le contraire : elle cherchait `"2px solid"` là où le navigateur
  normalise en `"rgb(255, 62, 165) solid 2px"` — le code était juste, l'assertion
  fausse.
- [2026-08-02 19:48] **Hors `?debug=1`** : aucune console montée, l'emplacement
  hôte reste à 0 px de haut, et le personnage marche normalement.
- [2026-08-02 19:48] **0 erreur console** au chargement comme après pilotage.
- [2026-08-02 19:49] Sonde `window.__vp` retirée (0 résidu, `grep` à l'appui).

### Validation

-
