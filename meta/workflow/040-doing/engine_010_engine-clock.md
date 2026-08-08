---
id: 2026-08-08_17-55
title: Une horloge de moteur, source unique du temps
type: feat
branch: claude/engine-clock
created: 2026-08-08 17:55
ready: 2026-08-08 18:10
doing: 2026-08-08 18:15
verify:
done:
---

## Objectif

Le moteur a un **temps**, il n'a pas d'**horloge**. Aujourd'hui le temps entre par
un seul endroit — `Viewport.tick()` reçoit l'estampille rAF, `update(timestamp)`
en dérive un `dt` (borné à 100 ms) et le passe à deux clients : les behaviors et
`_fxSystem.update(dt)`. C'est une bonne graine, mais ce n'est qu'un nombre qui
traverse une pile d'appels :

- **personne ne peut lire l'heure** — il n'existe aucun « quelle heure est-il dans
  le jeu ? », donc rien ne peut être daté, programmé, ni comparé ;
- **personne ne peut l'arrêter** — pas de pause, pas de ralenti, pas de
  changement de vitesse ; « mettre en pause » se confond avec « arrêter la
  boucle », qui est une tout autre chose (`2026-07-26_14-24`) ;
- **il y a déjà une seconde source de temps** — `makeEvent()` estampille chaque
  event avec `performance.now()`, c'est-à-dire le **temps du mur**. Tant que le
  jeu tourne à vitesse réelle, les deux coïncident par accident. Dès qu'il y a
  une pause ou un ralenti, ils divergent, et **tout ce qui se mesure sur les
  events devient faux** — à commencer par la console d'events, qui coalesce sur
  `at`.

Et surtout : c'est le **prérequis** de tout ce qui vient (ordonnanceur, durées de
vie, explosions, cooldowns). Une primitive temporelle posée sans horloge se
recâblerait entièrement le jour où la pause arrive.

## Spécifications

### L'objet

`Clock`, dans `src/engine/time/`, exporté par le baril :

| | |
|---|---|
| `advance(timestamp)` | **seul** point d'avancement : la boucle lui donne l'estampille rAF, elle rend le `dt` de la frame |
| `now()` | millisecondes de **temps de jeu**, monotone, figé en pause |
| `dt()` | le pas de la frame courante, déjà borné et mis à l'échelle |
| `frame()` | index de frame |
| `scale(value = null)` | lecture / écriture, idiome du projet (`x()`, `y()`) |
| `pause()` / `resume()` / `isPaused()` | |
| `step(ms)` | avancer à la main — tests et pilotage manuel (piège rAF) |

Elle appartient à l'`Application`, qui la crée et l'expose (`getClock()`) ; le
`Viewport` la lit. **Pas de singleton de module.**

### Ce que la pause veut dire : `dt = 0`

C'est la clé de voûte, et elle simplifie beaucoup. La pause **n'arrête pas la
boucle** : elle rend `dt = 0` et fige `now()`. Alors, sans une ligne de plus :

- le joueur ne bouge pas (la distance due est `dt × vitesse`) ;
- les behaviors n'avancent pas (ils accumulent `dt`) ;
- les particules ne vieillissent pas (`_fxSystem.update(dt)`) ;
- **la frame se peint quand même** — caméra, renderer et canvas s'exécutent.

### La bifurcation du renderer, tranchée : sa signature ne change pas

La question posée à la création du ticket était « le renderer *reçoit* un `dt` ou
*lit* l'horloge ? ». La bonne réponse est **ni l'un ni l'autre, pour l'instant** :
le renderer **place**, il n'**avance** pas. Lui passer un `dt` qu'aucune de ses
six sous-classes n'utilise serait de la généralité spéculative payée tout de
suite.

La règle à écrire, elle, est durable : **ce qui avance prend `dt` ; ce qui place
n'en a pas besoin**. Le jour où le rendu interpole (caméra lissée, sprite qui
encaisse), il devient quelque chose qui avance et reçoit `dt` comme le reste.

### Le vrai impact sur l'affichage : le CSS anime déjà des objets de jeu

Trouvé en spécifiant, et c'est plus grave que prévu :

```css
/* src/engine/css/character.css */
.map-element.character { transition: left 0.2s linear, top 0.2s linear; }
.map-element.character.character--main { transition: none; }
```

**Le déplacement des PNJ est lissé par le navigateur**, sur le temps du mur — le
joueur, lui, est en `transition: none`. Le moteur ne possède donc pas l'horloge
qui anime la moitié de ses personnages. Conséquences directes :

- **en pause**, un PNJ continue de glisser pendant 200 ms ;
- **au ralenti** (`scale = 0,25`), le moteur déplace le PNJ d'un pixel toutes les
  quatre frames pendant que le CSS met 200 ms de temps réel à faire chaque pas :
  le lissage cesse de lisser et devient de la bouillie.

À trancher dans ce ticket, pas ailleurs. Trois issues, par ordre de préférence :

1. **Retirer la transition** et laisser le moteur placer chaque frame — ce qu'il
   fait déjà pour le joueur, sans que personne ne s'en plaigne. À vérifier au
   navigateur : le lissage existe peut-être pour masquer une cadence de pas
   grossière côté PNJ (`_tickDelay`).
2. **La garder et la figer** : une classe `is-paused` sur la racine du viewport
   qui pose `animation-play-state: paused` et neutralise les transitions. Traite
   la pause, **pas** l'échelle.
3. L'assumer par écrit comme une limite connue — le moins bon, mais mieux que de
   la laisser implicite.

Et une règle générale à poser : **un objet de jeu ne s'anime pas en CSS**, parce
que l'horloge ne peut pas le suivre. (`.shake` dans `map.css` est le seul autre
cas, et il est mort — plus aucun appelant.)

### Les autres sources de temps du moteur, recensées

| Source | Sort |
|---|---|
| `makeEvent()` → `performance.now()` | **passe en temps de jeu** : `Element.handle()` fournit l'heure de l'horloge de son application ; un élément détaché (sans application) garde le temps du mur, documenté comme hors timeline |
| `Character.quickReaction()` → `setTimeout` | **offender reconnu, laissé en l'état** : une bulle qui se ferme pendant la pause. Le corriger demande l'ordonnanceur — c'est son premier client (`2026-08-08_17-56`), noté dans `## Suite` |
| `EventConsole` → `setInterval` | **outillage**, hors jeu : reste sur le temps du mur, à dessein |
| `CharacterAnimator` | piloté par la **distance**, pas par le temps — inchangé, et documenté comme choix |

### Hors périmètre

Le pas fixe (fixed timestep) et l'interpolation de rendu : l'horloge doit les
rendre possibles plus tard sans se réécrire, pas les livrer ici.

## Firewalls / risques

1. **Pas de singleton de module.** Une `export const clock` importable de partout
   serait une variable globale déguisée, partagée entre deux `Application` (la
   page catalogue et le jeu en coexistent déjà). L'horloge appartient à
   l'`Application` / au `Viewport` et se **transmet**. La frontière moteur ne
   tolère pas mieux un global qu'un import interne.
2. **Le `at` des events doit être tranché, pas subi.** Temps de jeu (monotone,
   comparable à tout le reste, mais qui se fige en pause) ou temps du mur
   (bon pour profiler, faux pour le jeu) ? Proposition à confirmer : `at` en temps
   de jeu, et l'outillage garde le mur s'il en a besoin. Vérifier la coalescence
   de `EventConsole`, qui lit `at`.
3. **Le plafonnement de `dt` à 100 ms change de propriétaire** : aujourd'hui
   dissimulé dans `Viewport.update`, il devient une **politique de l'horloge** et
   doit être documenté (pourquoi 100, ce qu'il protège — le téléport après un
   retour d'onglet).
4. **Ne pas ralentir la boucle.** L'horloge est lue à chaque frame par tout le
   monde ; elle doit rester des accès de champ, sans allocation par frame (même
   discipline que `makeEvent`).
5. **Ne pas casser les tests existants** qui pilotent le temps à la main
   (behaviors, emitters). Ils doivent devenir *plus* simples, pas plus fragiles.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-08**, `080-done` compris.
- `src/engine/view/Viewport.js` — `tick()`, `update(timestamp)` (le `dt` et son
  plafond), `_behaviors`, le bloc particules.
- `src/engine/events/EngineEvents.js` — `now()`, `makeEvent()` : la seconde
  source de temps.
- `src/engine/fx/ParticleSystem.js`, `fx/Emitter.js` — clients de `dt`.
- `src/engine/character/CharacterAnimator.js` — le client **piloté par la
  distance**, à laisser tel quel et à documenter comme choix.
- `src/engine/render/Renderer.js` et ses sous-classes — la signature à trancher.
- Voisins : `2026-07-26_14-24` (boucle arrêtable, teardown) — frontière à tenir.
- Recipe : `meta/agents/recipes/verify-in-browser.md` (pilotage manuel rAF).

## Definition of Done

- [ ] Une horloge, **un seul point d'avancement**, exportée depuis
      `src/engine/index.js` ; aucun accès au temps réel ailleurs dans le moteur
      (hors outillage) — preuve par grep dans le journal.
- [ ] `pause()` démontré au navigateur : PNJ, joueur **et particules** figés, et
      la frame **se peint quand même**.
- [ ] `scale` démontré : à 0,25 tout ralentit **du même facteur**, particules
      comprises (mesure, pas impression).
- [ ] Le sort du `at` des events est tranché, écrit, et `EventConsole` marche
      encore.
- [ ] La règle sur les animations CSS des objets de jeu est écrite, et tenue par
      le moteur.
- [ ] Le contrat d'affichage est documenté : « ce qui avance prend `dt`, ce qui
      place n'en a pas besoin », l'animation à la distance, et ce que fait le
      rendu en pause.
- [ ] Le sort de la transition CSS des PNJ est **tranché et appliqué**, pas
      constaté.
- [ ] `meta/documentation/engine.md` et `recipes/verify-in-browser.md` à jour ;
      `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
