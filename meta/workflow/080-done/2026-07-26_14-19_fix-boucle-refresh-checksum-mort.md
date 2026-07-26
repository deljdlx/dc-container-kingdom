---
id: 2026-07-26_14-19
title: Boucle de rafraîchissement — checksum mort et boucle non résiliente
type: fix
branch: copilot/fix-boucle-refresh-checksum-mort
created: 2026-07-26 14:19
ready: 2026-07-26 17:27
doing: 2026-07-26 17:27
verify: 2026-07-26 17:28
done: 2026-07-26 17:28
---

## Objectif

La détection de changement de `ContainerKingdom.loop()` est **morte** : elle
appelle `sha256()` **sans argument** (deux fois), or `sha256(undefined)` hache
toujours la même valeur. `currentChecksum === newChecksum` est donc *toujours*
vrai et le `document.location.reload()` ne se déclenche **jamais**. Résultat :
l'apparition / disparition d'un conteneur n'est jamais reflétée sur la carte tant
qu'on ne recharge pas la page à la main.

Second défaut du même bloc : `loop()` n'a **aucun `try`/`catch`** et ré-arme son
`setTimeout` seulement en fin de corps. Un `await` qui rejette (daemon Docker
indisponible, 500) **tue la boucle définitivement** — l'app reste figée jusqu'au
rechargement.

## Spécifications

### Fonctionnel

- Un conteneur qui apparaît / disparaît / change d'état doit être **détecté** par
  la boucle (le rendu incrémental est traité par un ticket dédié, cf. liens).
- Une erreur transitoire côté Docker ne doit **pas** arrêter la boucle : log,
  puis nouvelle tentative au tick suivant.

### Technique

- `ContainerRepository.loadContainers()` calcule déjà un checksum pertinent
  (`ids` / `networks` / `labels` / `ImageID`) et appelle `handleNewContainers()`
  — aujourd'hui un *placeholder* vide. La détection doit passer par **là** (source
  unique) plutôt que par un second hachage dans `ContainerKingdom.loop()`.
- Décider en *specify* : exposer un événement / callback depuis le repository
  (`onContainersChanged`) que `ContainerKingdom` branche, ou faire renvoyer par
  `loadContainers()` un booléen « changé ». Préférer l'explicite.
- Ajouter le champ manquant à l'empreinte : `status` mappe `descriptor.ImageID`
  (probablement une coquille — l'état `State`/`Status` n'est pas dans le checksum,
  donc un `stopped` → `running` passe inaperçu). À trancher en *specify*.
- `try`/`catch`/`finally` autour du corps de `loop()`, ré-armement garanti.
- `sha256()` doit être appelée avec une valeur ; envisager de la rendre stricte
  (throw sur `undefined`) pour empêcher ce type de bug de revenir.

## Contexte / liens

- `src/container-kingdom/js/ContainerKingdom.js` (`loop`, `LOOP_INTERVAL_MS`)
- `src/container-kingdom/js/ContainerRepository.js` (`loadContainers`,
  `handleNewContainers`, `lastContainersChecksum`)
- `src/container-kingdom/js/sha256.js`
- Ticket lié (rendu) : `…_feat-refresh-incremental-sans-reload.md`
- Docs : `meta/documentation/container-kingdom.md` (cycle de rafraîchissement)

## Definition of Done

- [x] Un changement de la liste de conteneurs (ajout / suppression / état) est
      détecté et déclenche un seul point d'entrée explicite.
- [x] Tests : checksum sensible aux changements attendus, insensible au bruit ;
      la boucle survit à un rejet du client Docker et ré-arme son tick.
- [x] Plus aucun appel à `sha256()` sans argument dans le code.
- [x] Doc du cycle de rafraîchissement à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-26 17:27] Démarrage sur `copilot/fix-boucle-refresh-checksum-mort` + passage de la carte en doing.
- [2026-07-26 17:28] Suppression du checksum mort dans `ContainerKingdom.loop()` et branchement explicite `repository.onContainersChanged`.
- [2026-07-26 17:28] Durcissement de la boucle (`try/catch/finally`) avec réarmement garanti du tick.
- [2026-07-26 17:28] Normalisation du checksum repository (tri + champs état/status) et `sha256()` stricte sur `undefined`.
- [2026-07-26 17:28] Ajout de tests de non-régression (`ContainerKingdom.loop`, `ContainerRepository`, `sha256`).

### Vérification

- [2026-07-26 17:28] Tests ciblés verts : `test/ContainerRepository.test.js`, `test/ContainerKingdom.loop.test.js`, `test/sha256.test.js`.
- [2026-07-26 17:28] `npm run verify` vert (28 fichiers, 202 tests).

### Validation

- [2026-07-26 17:28] Validation technique: checksum repository unique et normalisé, callback explicite déclenché sur changement réel, boucle de refresh résiliente aux erreurs transitoires.
