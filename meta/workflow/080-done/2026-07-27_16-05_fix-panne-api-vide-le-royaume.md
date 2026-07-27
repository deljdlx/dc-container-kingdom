---
id: 2026-07-27_16-05
title: Une panne de l'API Docker vide le royaume
type: fix
branch: claude/panne-api-vide-le-royaume
created: 2026-07-27 16:05
ready: 2026-07-27 16:31
doing: 2026-07-27 16:35
verify: 2026-07-27 16:41
done: 2026-07-27 16:43 (merge fbc37a6)
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

- [x] `getContainersDescriptors()` et `getAllContainersStats()` propagent l'échec
      au lieu de renvoyer `[]`.
- [x] `loadContainers()` est un **no-op strict** en cas de panne (aucun conteneur
      supprimé, aucun `destroy()`, checksum inchangé) et le signale par son retour.
- [x] Un cluster réellement vide élague toujours (pas de régression du vrai vide).
- [x] Une panne au démarrage laisse l'app utilisable (écran de chargement masqué).
- [x] La panne est signalée dans le HUD, et le signalement disparaît au retour.
- [x] Preuve automatisée qui **échoue avant correction** : N conteneurs → panne →
      toujours N conteneurs, plus les cas « vrai vide » et « retour à la normale ».
- [x] `npm run verify` vert.
- [x] JSDoc / doc à jour là où le contrat public change.

## Suite

- **Ce que ça ouvre** — la panne est maintenant un **état de l'app**
  (`_dockerReachable`), pas un accident local. D'autres lectures pourraient s'y
  brancher : geler le compteur CPU/mémoire au lieu d'afficher des chiffres figés
  comme s'ils étaient frais, ou dater la puce (« dernière vue à 16:42 »).
- **Ce qu'on laisse de côté** — aucune **temporisation** : une panne d'un seul
  tick allume la puce immédiatement. Sur un daemon qui hoquette, elle clignotera.
  Un seuil (2 échecs consécutifs) serait plus doux, mais gagne à être réglé sur
  du vrai bruit observé plutôt qu'à l'aveugle.
- **Ce qu'on laisse de côté (2)** — `getContainerLogs()` avale toujours ses
  erreurs et renvoie `''` : un log vide et un daemon muet restent
  indistinguables. Périmètre différent (une vue, pas la carte), impact sans
  commune mesure — pas de candidat déposé.
- **Vérification** — la puce n'a **pas** été validée visuellement (extension
  Chrome non connectée) ; seul son comportement DOM est couvert, sous jsdom.
- **Déposé en `100-follow-up/`** — rien.

## Journal

### Travail

- [2026-07-27 16:36] Preuves posées **avant** correction. La plus fidèle au
  symptôme observé branche le **vrai** `DockerApiClient` sur un `fetch` cassé :
  elle échoue en `expected [] to have a length of 35 but got 0` — les 35 maisons
  effacées, exactement le constat d'origine. 14 tests rouges au total (repository,
  client, HUD, boucle).
- [2026-07-27 16:38] Correction en trois temps. (1) `DockerApiClient` :
  `getContainersDescriptors()` et `getAllContainersStats()` ne capturent plus —
  elles **propagent**, comme le faisaient déjà les autres méthodes de la classe.
  (2) `ContainerRepository.loadContainers()` capture l'échec et sort **avant**
  toute mutation : rien de détruit, indexes et checksum intacts, retour `false`.
  (3) `ContainerKingdom` dérive un `_dockerReachable` de ces retours et interrompt
  le tick sur panne, plutôt que de peindre des données à moitié rafraîchies.
- [2026-07-27 16:39] Signalement : `KingdomHud.renderConnectionStatus()` pose une
  puce `.docker-status` dans le `#header` (CSS avec pulsation, neutralisée sous
  `prefers-reduced-motion`), effacée dès le retour du daemon. `_setDockerReachable`
  ne redessine **qu'au changement** — la boucle l'appelle toutes les 5 s.
- [2026-07-27 16:40] Un détail de conception écarté : `init()` n'a pas eu besoin
  d'un `try`. Le repository ne lève plus, donc une panne au démarrage suit le
  chemin nominal (carte vide, écran de chargement masqué) — ajouter un `try`
  aurait été du bruit.
- [2026-07-27 16:40] Doc mise à jour : `meta/documentation/container-kingdom.md`,
  section orchestration — « une panne n'est pas un cluster vide ».

### Vérification

- [2026-07-27 16:39] Les 14 tests rouges passent au vert ; la preuve fidèle rend
  bien 35 conteneurs après le `fetch` cassé.
- [2026-07-27 16:39] `npm run verify` **vert** : eslint propre, `vite build` ok,
  **246 tests / 36 fichiers** — aucune régression sur les suites existantes.
- [2026-07-27 16:42] **Validation navigateur non faite** : l'extension Chrome
  n'était pas connectée (« Browser extension is not connected »). Serveur de dev
  laissé sur `http://localhost:5410` pour un contrôle visuel manuel de la puce.
  Le comportement DOM correspondant est couvert automatiquement sous jsdom
  (`test/KingdomHud.status.test.js` : apparition, effacement, pas d'empilement).

### Validation

- [2026-07-27 16:43] Review : DoD cochée point par point, frontière moteur non
  concernée (le changement est entièrement dans `container-kingdom/`), JSDoc des
  deux contrats modifiés (`getContainersDescriptors`, `loadContainers`) à jour,
  aucun résidu de debug. Mergé sur `main` en `--no-ff` : **fbc37a6**.
- [2026-07-27 16:43] Réserve assumée : la puce n'a pas eu de contrôle visuel
  (extension navigateur indisponible) — reportée en `## Suite`.
