---
id: 2026-08-02_20-46
title: Une ligne d'Element noue 15 cycles d'import dans le moteur
type: refactor
branch:
created: 2026-08-02 20:46
ready:
doing:
verify:
done:
---

## Objectif

Le graphe d'imports du moteur contient **15 cycles** — mesurés le 2026-08-02 sur
les 76 modules de `src/engine/` (commentaires exclus : un `@example` de JSDoc qui
montre un `import` n'est pas une arête).

Tous partent du **même endroit**, une seule ligne :

```js
// src/engine/scene/Element.js:96
this._application = Application.mainInstance;
```

`Element` — le nœud de base, la feuille de l'architecture — importe
`Application`, le sommet. Et `Application → Viewport → Board → Area → Element`
referme la boucle. D'où :

```
Application → view/Viewport → world/Board → world/Area → scene/Element → Application
Application → view/Viewport → character/Character → scene/Element → Application
scene/Element → scene/SceneGraph → scene/Element
…
```

Un cycle d'imports ES n'est pas fatal — le module se résout, et le dépôt tourne.
Mais il rend l'ordre d'évaluation **dépendant du point d'entrée** : un jour où un
module lira une valeur de niveau supérieur au chargement (une constante, une
classe étendue), il obtiendra `undefined` selon qui a été importé en premier. Le
symptôme, quand il tombe, est illisible.

Surtout, le cycle **dit quelque chose de vrai** : le nœud de scène connaît
l'application globale. C'est ce qui rend un `Element` inutilisable hors d'un
monde — le catalogue en construit sans application, et `getBoard()` **jette**
pour eux (vérifié par sonde). C'est aussi ce qui a obligé `handle()` à devenir
silencieux quand `_application` est absent.

## Spécifications

### Le nœud à défaire

`Element` a besoin de l'application pour deux choses seulement :

1. **émettre** — `handle()` relaie au bus global ;
2. **`getBoard()`** — `this._application.getViewport().getBoard()`.

Et `SceneGraph.addChild()` **propage déjà** l'application du parent à l'enfant
(`SceneGraph.js:191`) — vérifié par sonde : un élément attaché à un arbre prend
l'application de cet arbre, pas celle qui était globale à sa création. Le
singleton n'est donc utile qu'aux éléments **détachés**, c'est-à-dire à ceux pour
qui il est le plus faux.

### Pistes (à trancher en *specify*)

- **Injecter plutôt que lire un global** : l'application (ou juste le bus)
  arrive par le parent à l'attache, et l'accès direct à `Application.mainInstance`
  disparaît de `Element`. L'import tombe, les 15 cycles avec.
- **Ou déplacer le défaut** : `Element` ne dépend plus que d'une interface
  minimale (`{ handle }`), déclarée dans `events/`, sans importer `Application`.
- **`Element → SceneGraph → Element`** est un cycle à part, dû à
  `SceneGraph.createChild()` qui fait `new Element()`. Il se règle par injection
  d'une fabrique, ou s'assume — à écrire dans les deux cas.

## Firewalls / risques

1. **`Application.mainInstance` est une API de fait.** Les tests s'en servent
   (`Application.mainInstance = { handle: vi.fn() }` dans plusieurs fichiers) et
   un hôte peut en dépendre. Ne pas la supprimer sans le décider explicitement.
2. **Ne pas confondre « supprimer le cycle » et « supprimer le couplage ».**
   Déplacer l'import sans changer qui connaît qui ferait un beau graphe et le
   même problème.
3. **Le comptage doit être reproductible** : le script d'audit comptait 1564
   cycles avant qu'on ne retire les commentaires du texte analysé. Toute mesure
   citée ici doit ignorer commentaires et chaînes.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-02**, `080-done` compris.
- `src/engine/scene/Element.js:1` (import) et `:96` (lecture du singleton).
- `src/engine/scene/SceneGraph.js:191` — la propagation qui rend le singleton
  presque inutile.
- `src/engine/Application.js` — `mainInstance` posé dans le constructeur.
- Le symptôme voisin, déjà traité : `handle()` rendu silencieux sans application
  (ticket `2026-08-02_19-30`).

## Definition of Done

- [ ] **0 cycle d'import** dans `src/engine/` — mesuré par un script qui ignore
      commentaires et chaînes, et dont le comptage est cité au journal.
- [ ] `Element` **n'importe plus `Application`**.
- [ ] Un `Element` construit hors de tout monde **ne jette sur aucune méthode
      publique** (test), `getBoard()` compris — il répond « pas de monde ».
- [ ] Le sort de `Application.mainInstance` est **tranché et écrit** (conservée,
      dépréciée ou retirée), tests mis à jour en conséquence.
- [ ] `npm run verify` vert ; les trois hôtes (app, démo, catalogue) ouverts sans
      erreur console — un cycle d'import se paie au chargement, pas aux tests.

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
