---
id: 2026-08-02_18-45
title: La garde anti-fuite tue les effets attachés au personnage
type: fix
branch: claude/orphan-check-fix
created: 2026-08-02 18:45
ready: 2026-08-02 18:46
doing: 2026-08-02 18:46
verify: 2026-08-02 18:51
done: 2026-08-02 18:52 (merge 2dcd5ec)
---

## Objectif

**Régression introduite par `2026-08-02_18-18`** : la poussière sous les pas du
personnage ne sort plus. Signalée par l'utilisateur, confirmée à la mesure le
2026-08-02 dans la démo — après 90 frames de marche, **0 particule** de poussière,
pendant que les fontaines en produisent 100.

La cause est la « ceinture deux » contre la fuite d'émetteurs :

```js
isAlive() {
  if (!this._follow) return true;
  return typeof this._follow.getParent !== 'function' || this._follow.getParent() !== null;
}
```

Elle suppose que **sans parent = détruit**. Or `Viewport.enableMainCharacter()`
crée le `Character` et **ne l'attache jamais** au scene-graph : il n'a donc
*jamais* eu de parent. L'émetteur se croit orphelin dès la première frame et
s'arrête définitivement (`isAlive()` faux, `isRunning()` faux, mesurés).

Coût du non-fait : tout effet attaché à un élément hors scene-graph est mort-né —
et silencieusement, puisque l'émetteur s'arrête au lieu de lever.

## Spécifications

_Amorce — à confirmer en « specify »._

Distinguer **« n'a jamais eu de parent »** de **« en a eu un, puis l'a perdu »**.
Seul le second cas est un orphelin.

Piste : mémoriser qu'un parent a été vu au moins une fois, et ne conclure à la
mort que dans ce cas. C'est plus robuste que de figer l'état à la construction —
un hôte peut construire l'émetteur avant d'attacher l'élément, et la ceinture doit
quand même s'armer ensuite.

### Le trou de test à combler

Les tests existants ne pouvaient pas voir le défaut : le cas « suit un élément
**sans parent** » n'était couvert nulle part. Les doubles de test attachaient
toujours l'élément (`area.add(...)`), et le cas « point fixe » n'a pas de `follow`
du tout. C'est exactement la combinaison du personnage principal.

## Contexte / liens

- La garde fautive : `src/engine/fx/Emitter.js` (`isAlive`).
- L'élément concerné : `Viewport.enableMainCharacter()`, qui n'attache pas.
- L'effet cassé : `src/engine/fx/FootstepDust.js`, câblé dans `src/engine/demo/demo.js`.
- Le ticket d'origine : `2026-08-02_18-18`.

## Definition of Done

- [x] La poussière ressort en marchant, **mesurée** dans la démo (particules > 0).
- [x] Un émetteur qui suit un élément **jamais attaché** continue d'émettre (test).
- [x] Un émetteur dont la cible **a perdu** son parent s'arrête toujours (test de
      non-régression de la ceinture, qui doit rester verte).
- [x] Le déliage par `Board.freeArea` reste opérant (test existant vert).
- [x] `npm run verify` vert.

## Suite

- **Ce que ça révèle, au-delà du correctif** — le personnage principal **vit hors
  du scene-graph** : `enableMainCharacter()` le crée, le positionne et le fait
  suivre par la caméra, sans jamais l'attacher. Ce n'est pas anodin : tout code
  qui raisonne « je remonte les parents » (un futur binder, une recherche
  d'ancêtre, un parcours de destruction) le manquera de la même façon. À garder en
  tête plutôt qu'à découvrir une seconde fois.
- **Ce qu'on laisse de côté — le trou qui a laissé passer le défaut.** Aucun test
  ne vérifie que les effets **réellement câblés dans la démo** émettent : la
  régression n'a été vue qu'à l'œil, par l'utilisateur. Les tests unitaires
  couvraient chacun leur cas, aucun ne couvrait « la démo marche encore ». Un
  test d'intégration léger (monter la démo sous jsdom, avancer la boucle, compter
  les particules) fermerait ce trou — c'est un ticket, pas une note.
- **La leçon de méthode** — mes doubles de test reproduisaient le **cas nominal**
  (un élément proprement attaché), jamais celui du vrai moteur. Trois fois sur ces
  tickets, une vérification a regardé moins loin que la réalité : sonde non
  récursive sur les clôtures, mesure de perf à un seul échantillon, et ici un
  double trop bien élevé.
- **Déposé en `100-follow-up/`** — rien.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-02 18:47] **Test d'abord** : deux cas ajoutés, tous deux **vus
  échouer** sur le code fautif — un émetteur suivant une cible jamais attachée, et
  un émetteur construit *avant* que sa cible ne rejoigne l'arbre.
- [2026-08-02 18:48] Correctif : `isAlive()` ne lit plus « sans parent » comme
  « détruit ». Il **mémorise** qu'un parent a été vu au moins une fois
  (`_everAttached`) et ne conclut à l'orphelin que dans ce cas. Mémoriser plutôt
  qu'échantillonner à la construction couvre l'hôte qui câble avant d'attacher —
  la ceinture s'arme alors quand même.

### Vérification

- [2026-08-02 18:49] `npm run verify` vert : **51 fichiers, 417 tests** (415
  avant, +2 de non-régression).
- [2026-08-02 18:50] **Mesuré dans la démo** : la poussière ressort — **15
  particules après 90 frames de marche**, contre **0** avant le correctif ; et
  **0 à l'arrêt**, donc `shouldEmit` fonctionne toujours. Les fontaines restent à
  100 gouttes, la ceinture n'a pas été désarmée.
- [2026-08-02 18:50] Le test de la ceinture (cible détachée → arrêt définitif)
  reste vert : le correctif ne rouvre pas la fuite qu'il protège.
- [2026-08-02 18:51] Sonde retirée (0 résidu).

### Validation

- [2026-08-02 18:52] Review : le correctif ne désarme pas la ceinture (son test
  reste vert), et les deux cas ajoutés ont été **vus échouer** avant.
- [2026-08-02 18:52] Merge `--no-ff` sur `main` : **2dcd5ec** — `merge: sans
  parent ne veut pas dire détruit` (3 fichiers, +73 / −12).
