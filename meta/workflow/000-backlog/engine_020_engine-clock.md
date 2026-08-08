---
id: 2026-08-08_17-55
title: Une horloge de moteur, source unique du temps
type: feat
branch:
created: 2026-08-08 17:55
ready:
doing:
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

_À confirmer en « specify »._

### Ce que l'horloge porte

- `now()` — millisecondes de **temps de jeu**, monotone, qui **n'avance pas en
  pause** ; `dt()` — le pas de la frame courante ; `frame()` — l'index de frame.
- `pause()` / `resume()` / `isPaused()`, et une **échelle** (`scale`) pour le
  ralenti et l'accéléré. `scale = 0` doit être équivalent à la pause, ou bien la
  différence doit être écrite.
- `step(ms)` — avancer à la main. C'est ce dont ont besoin les tests **et** le
  pilotage manuel de la boucle documenté dans
  `meta/agents/recipes/verify-in-browser.md` (piège rAF en onglet de fond) : ce
  ticket doit **améliorer** cette recipe, pas la casser.
- **Un seul appelant l'avance** : la boucle. Tout le reste **lit**.

### Le point délicat : le moteur d'affichage est impacté

C'est la partie à ne pas bâcler — l'affichage a aujourd'hui **quatre** rapports
au temps, dont trois que l'horloge ne contrôlerait pas si on ne tranche pas :

1. **Les particules vieillissent sur `dt`** (`_fxSystem.update(dt)`). En pause,
   elles doivent **geler** — sinon une pause laisse voler les confettis. Elles
   suivent l'horloge sans effort, à condition qu'on leur passe le `dt` de
   l'horloge et pas celui du rAF.
2. **Le renderer ne connaît pas le temps** — `renderer.update()` ne prend aucun
   `dt`. Tant que le rendu ne fait que placer, ça va. Dès qu'il **interpole**
   (caméra lissée, sprite qui encaisse un coup, texte flottant, tween), il lui
   faut le temps. **La bifurcation est ici** : le renderer *reçoit* un `dt` ou
   *lit* l'horloge. À trancher **maintenant**, parce que c'est la signature de
   `Renderer.update()` — donc celle de ses six sous-classes.
3. **Le CSS est une source de temps que l'horloge ne possède pas.** Une
   `transition` ou une `animation` CSS sur un objet de jeu continue de tourner en
   pause, et se moque de `scale`. Il faut une règle : soit rien d'animé en CSS sur
   un objet de jeu, soit l'horloge sait les figer (classe racine +
   `animation-play-state: paused`). Écrire laquelle, et pourquoi.
4. **Pause ≠ boucle arrêtée.** Une frame en pause doit **quand même se peindre**
   (redimensionner la fenêtre, ouvrir un menu, dessiner un overlay). Donc la
   boucle tourne, l'horloge n'avance pas, et le rendu s'exécute. C'est la ligne
   qui sépare ce ticket de `2026-07-26_14-24` (arrêter la boucle, démonter le
   viewport) — les deux doivent se rejoindre sans se recouvrir.

À l'inverse, un rapport au temps est **volontairement hors horloge** et doit le
rester, documenté comme tel : l'animation de marche est pilotée par la
**distance parcourue** (`CharacterAnimator`), pas par le temps — c'est ce qui la
rend identique à 60, 120 ou 240 Hz.

### Ce qui n'est pas dans ce ticket

Le pas fixe (fixed timestep) et l'interpolation de rendu. L'horloge doit **le
rendre possible plus tard** sans se réécrire, pas le livrer ici.

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
- [ ] Le contrat d'affichage est documenté : ce qui lit l'horloge, ce qui n'en
      dépend pas (animation à la distance), ce que fait le rendu en pause.
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
