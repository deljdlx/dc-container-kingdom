---
id: 2026-08-11_08-52
title: Une entité porte un blueprint partagé et un état par instance
type: feat
branch: claude/entity-blueprint
created: 2026-08-11 08:52
ready: 2026-08-11 09:05
doing: 2026-08-11 09:10
verify:
done:
---

## Objectif

Le moteur a des corps ; il n'a pas d'**entités**. Rien ne porte de points de vie,
de dégâts, d'appartenance — et surtout, il n'existe **aucun endroit prévu** :
`Element.data = {}` est un sac sans contrat.

Le sac, lui, existe déjà et **sert** : Container Kingdom y accroche son conteneur
Docker (`house.data.container`). Ce qui manque n'est donc pas un sac, c'est la
**seconde moitié** — la part **partagée** de ce qu'une entité est.

Le moteur connaît d'ailleurs déjà le patron : `static descriptor` est un blueprint
(partagé par la classe, en lecture seule, résolu à la construction) dont vivent
`SpriteElement` et `Emitter`. L'étendre aux données de jeu est de la
**cohérence**, pas une invention.

### Ce que le découpage achète

1. **La mémoire et la cohérence** — 200 gobelins partagent une définition ;
   changer la définition les change tous. La copier dans chaque instance donne
   200 copies qui divergent en silence.
2. **Le bug classique qu'il évite** — sans le découpage, un gobelin qui prend un
   coup écrit dans la structure partagée, et les 199 autres voient leurs PV max
   baisser. Il ne se voit qu'en jeu, tard. D'où deux règles non négociables :
   **blueprint gelé**, **écritures uniquement dans l'état**.
3. **La sauvegarde** — un fichier de sauvegarde est l'**état**, pas le blueprint.
   C'est ce qui le rend petit et tolérant aux versions.

## Spécifications

_À confirmer en « specify »._

### Un seul sac, plus un côté partagé

`data` **est** déjà l'état par instance : le garder tel quel, et lui adjoindre le
côté partagé.

```js
class Goblin extends Character {
  static blueprint = { maxHp: 12, damage: 3, speed: 40 };   // gelé, partagé
}

goblin.data.hp = 12;         // l'état, par instance — inchangé
goblin.get('damage');        // → 3, résolu : état d'abord, blueprint ensuite
goblin.get('hp');            // → 12, l'instance a toujours le dernier mot
new Goblin({ maxHp: 36 });   // un boss : l'override sème l'ÉTAT, jamais le blueprint
```

### Le moteur ne définit aucune clé

Pas de `hp` dans `src/engine/`. Le moteur fournit la mécanique — résolution, gel,
fusion — le jeu fournit le vocabulaire. **Critère de réussite : le moteur tourne
avec un sac vide.**

### Tranché en specify

**La fusion le long de la chaîne : oui**, et la divergence avec `descriptor` est
assumée parce qu'elle est **justifiée**, pas subie. Un descripteur décrit **un
sprite** : fusionner le `frame` du parent dans l'enfant n'aurait aucun sens — un
sprite dérivé est un *autre* sprite. Un blueprint décrit des **traits** : la
fusion est exactement ce que veut dire hériter (« un orque est un gobelin avec
plus de PV »). Deux patrons voisins, deux sémantiques, écrites toutes les deux.

**Le gel est profond.** Tout l'intérêt est qu'aucune instance ne puisse atteindre
le côté partagé ; un gel superficiel laisse `blueprint.loot.gold = 0` accessible,
c'est le même bug un étage plus bas. Il se paie **une fois par classe**, à la
première résolution, pas par instance.

**Les constructeurs ne sont pas touchés.** `new Goblin({ maxHp: 36 })`
demanderait de faire passer un paramètre d'options par `Element`, `SpriteElement`
et `Character` — beaucoup de plomberie pour une surface qu'on veut minimale. À la
place, une méthode chaînable :

```js
board.spawn(new Goblin().withState({ maxHp: 36 }), x, y);
```

### La surface, au complet

```js
entity.getBlueprint()        // le blueprint résolu, gelé, partagé par la classe
entity.get('damage')         // résolu : état d'abord, blueprint ensuite
entity.set('hp', 9)          // écrit dans l'ÉTAT, jamais dans le blueprint
entity.withState({ ... })    // sème l'état, chaînable
entity.data                  // l'état lui-même, inchangé — Container Kingdom y écrit
```

`set()` n'apporte rien que `data.hp = 9` ne fasse déjà : il existe pour être le
**point d'accroche** du jour où la notification aura été tranchée par l'usage,
sans avoir à réécrire les appelants.

### Hors périmètre, explicitement

- **La notification.** Pas d'event par écriture : la règle du bus dit « les faits
  de jeu, pas les pas de simulation », et un event à chaque `hp -= 3` la viole et
  noie tout observateur. Les faits (`touché`, `mort`) sont au jeu de les émettre.
  C'est à la tranche de combat (`2026-08-08_17-58`) de faire écrire ce contrat
  par l'usage, pas à ce ticket de le deviner.
- **Le schéma et la validation** — le moteur ne connaît pas les clés, il ne peut
  rien valider.
- **Un registre par nom** (`blueprints.get('goblin')`), qui n'aura de sens qu'avec
  un chargeur de niveaux en données. La classe suffit aujourd'hui, et un registre
  se posera par-dessus sans rien casser.

## Firewalls / risques

1. **Le sac devient une décharge.** Deux garde-fous : le moteur **ne lit jamais**
   une clé de jeu, et le blueprint est **gelé**. Si le moteur se met à dépendre
   d'une clé, la frontière est franchie.
2. **Ne pas glisser vers un ECS.** La tentation viendra à la première entité qui
   a trois propriétés. Le moteur est un scene-graph à behaviors ; y greffer un ECS
   est une refonte argumentée, pas un effet de bord.
3. **Ne pas casser `data`.** Container Kingdom écrit dedans aujourd'hui ; son
   comportement doit être **identique** après le ticket.
4. **Surface minimale.** Deux décisions se sont retournées cette semaine faute
   d'usage sous les yeux. Livrer le strict nécessaire et laisser la tranche
   affiner.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-11**, `080-done` compris.
- Origine : demande du 2026-08-11, en amont de la tranche de combat.
- `src/engine/scene/Element.js` — `data`.
- `src/engine/scene/SpriteElement.js` — `static descriptor`, le patron à suivre.
- `src/container-kingdom/js/ContainerKingdomRenderer.js` — l'utilisateur actuel
  de `data`, à ne pas casser.
- Consommateur : `2026-08-08_17-58` (tranche de combat).

## Definition of Done

- [ ] `static blueprint` est **gelé** et partagé ; une écriture par une instance
      ne peut pas l'atteindre (test : deux instances, l'une blessée, l'autre
      intacte).
- [ ] `get(key)` résout **état → blueprint**, et l'override de construction sème
      l'état.
- [ ] Le sort de la **fusion le long de la chaîne** est tranché, écrit, testé.
- [ ] Le sort du **gel profond** est tranché et écrit.
- [ ] Le moteur **ne lit aucune clé de jeu** — vérifiable par grep, cité au
      journal.
- [ ] `data` se comporte exactement comme avant (Container Kingdom intact).
- [ ] JSDoc + `documentation/engine.md` ; `npm run verify` vert.

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
