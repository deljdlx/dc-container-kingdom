---
id: 2026-07-27_16-05
title: Une panne de l'API Docker vide le royaume
type: fix
branch: claude/panne-api-vide-le-royaume
created: 2026-07-27 16:05
ready: 2026-07-27 16:31
doing: 2026-07-27 16:35
verify:
done:
---

## Objectif

`DockerApiClient.getContainersDescriptors()` **avale** ses erreurs et renvoie
`[]`. `ContainerRepository.loadContainers()` ne peut donc pas distinguer « le
daemon ne répond pas » de « il n'y a plus aucun conteneur » : il élague *tous*
les conteneurs, détruit toutes les maisons et vide la carte.

Observé pour de vrai pendant la vérification de `2026-07-26_14-20` — une sonde
avait cassé `fetch`, et les 35 maisons ont disparu en un cycle. Avant `14-20` le
symptôme existait déjà, masqué par le rechargement de page ; maintenant que la
carte se réconcilie en place, il devient franc : un hoquet du daemon (ou un proxy
qui redémarre) efface le royaume sous les yeux de l'utilisateur.

On veut qu'une panne **conserve** la dernière vue connue et se **dise**, plutôt
que d'être confondue avec un cluster vide.

## Spécifications

**Arbitrage** (point laissé ouvert au tri) : on **signale**. Figer la carte en
silence laisserait croire à des données fraîches — c'est le même mensonge que
l'effacement, en plus discret.

### Fonctionnel

- **Pendant la panne** : maisons, routes et compteurs restent tels quels (dernière
  vue connue) ; une puce discrète dit que l'API est injoignable.
- **Au retour** : la réconciliation en place reprend normalement, la puce
  disparaît — sans rechargement de page.
- **Un cluster réellement vide** (le daemon répond, mais avec `[]`) continue
  d'élaguer : c'est une information, pas une panne.
- **Panne au démarrage** : l'app reste utilisable — écran de chargement masqué,
  carte vide, statut affiché — au lieu de rester bloquée sur le chargement.

### Technique

- `DockerApiClient` : `getContainersDescriptors()` et `getAllContainersStats()`
  **propagent** l'échec au lieu de renvoyer `[]`. C'est déjà la convention des
  autres méthodes de la classe (`loadContainerStats`, `startContainer`,
  `destroyContainer` lèvent) ; seules les deux méthodes « liste » dévient.
  `getAllContainersStats()` est inclus pour que l'état de panne soit cohérent :
  sinon la boucle croit ses stats fraîches alors que le daemon est muet.
- `ContainerRepository.loadContainers()` : capture l'échec et devient un **no-op
  strict** — aucun `destroy()`, aucun index reconstruit, checksum inchangé — puis
  le signale par sa **valeur de retour** booléenne, par symétrie avec
  `loadContainersStats()` qui renvoie déjà `true`/`false`.
- `ContainerKingdom` : `loop()` et `init()` dérivent l'état « en ligne /
  injoignable » de ces retours. `init()` n'a aujourd'hui **aucun** `try` — une
  panne au démarrage laisserait l'écran de chargement à l'écran.
- `KingdomHud` : rendu du statut dans `#header` (flex déjà en place, à côté de
  `.cluster-info`), visible seulement en panne.

### Risques

- Le test `DockerApiClient` « returns an empty array on network failure » encode
  le comportement fautif : il doit devenir « propage l'erreur ».
- Ne pas confondre **200 + liste vide** (vrai vide, on élague) et **échec
  réseau/HTTP** (panne, on conserve).

## Contexte / liens

- `src/container-kingdom/js/DockerApiClient.js` (la panne avalée)
- `src/container-kingdom/js/ContainerRepository.js` (l'élagage)
- `src/container-kingdom/js/ContainerKingdom.js` (boucle et démarrage)
- Ticket d'origine : `2026-07-26_14-20` (réconciliation de la carte en place)

## Definition of Done

- [ ] `getContainersDescriptors()` et `getAllContainersStats()` propagent l'échec
      au lieu de renvoyer `[]`.
- [ ] `loadContainers()` est un **no-op strict** en cas de panne (aucun conteneur
      supprimé, aucun `destroy()`, checksum inchangé) et le signale par son retour.
- [ ] Un cluster réellement vide élague toujours (pas de régression du vrai vide).
- [ ] Une panne au démarrage laisse l'app utilisable (écran de chargement masqué).
- [ ] La panne est signalée dans le HUD, et le signalement disparaît au retour.
- [ ] Preuve automatisée qui **échoue avant correction** : N conteneurs → panne →
      toujours N conteneurs, plus les cas « vrai vide » et « retour à la normale ».
- [ ] `npm run verify` vert.
- [ ] JSDoc / doc à jour là où le contrat public change.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
