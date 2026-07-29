---
id: 2026-07-29_08-26
title: Les logs d'un conteneur s'exécutent dans le navigateur
type: fix
branch: claude/untrusted-data-rendering
created: 2026-07-29 08:26
ready: 2026-07-29 08:27
doing: 2026-07-29 08:31
verify: 2026-07-29 08:40
done: 2026-07-29 08:42 (merge d5f08d1)
---

## Objectif

`LogEntry.getElement()` assigne les lignes de log **brutes** à `innerHTML` — trois
fois (l. 93, 99, 111). La source est `/containers/{id}/logs`, donc **tout ce qu'un
conteneur écrit sur stdout**. Un conteneur qui journalise
`<img src=x onerror="…">` obtient l'exécution de script dans le dashboard : pas
besoin d'un attaquant, une image tirée d'un registre public suffit.

Même vecteur, moins direct, pour les **noms** et **labels**, tous rendus en
`innerHTML` : `ContainersListEntry` (l. 19 et 23), `ContainersList` (l. 25, nom du
projet compose), `ContainerView` (l. 37).

L'app affiche des données qu'elle ne contrôle pas ; elle doit les traiter comme
telles. Issu du découpage de `2026-07-27_17-28`, dont il est la moitié qui
**n'attend aucune décision d'infrastructure**.

> **Pourquoi ça compte au-delà du dashboard** : la page a un accès non
> authentifié à l'API Docker, et nginx y ajoute `Access-Control-Allow-Origin *`.
> Un script injecté ici peut donc lire l'API et exfiltrer — dont les variables
> d'environnement de tous les conteneurs. Fermer ce trou-ci ne suffit pas
> (`2026-07-27_17-28` traite l'autre bout), mais il coupe la chaîne.

## Spécifications

_Rempli en « specify »._

### Le piège : `LogEntry` ne peut pas passer bêtement en `textContent`

La chaîne de formatage **s'appuie** sur `innerHTML` : la méthode écrit la ligne,
applique ses formatters, puis **relit `entry.innerHTML`** pour continuer à
travailler dessus. Remplacer l'affectation par `textContent` casserait les
formatters sans que rien ne le signale.

Il faut donc revoir le pipeline, pas substituer une propriété : séparer le
**texte** (jamais interprété) de la **décoration** (produite par le code, donc
sûre) — par exemple en travaillant sur des nœuds plutôt que sur des chaînes HTML.

À noter aussi : `Log.js` (l. 28) teste `element.innerHTML.match(/error/gi)` pour
colorer les lignes d'erreur — une lecture, pas une écriture, mais qui dépend du
même choix de représentation.

## Contexte / liens

- `src/container-kingdom/js/LogEntry.js` (l. 93, 99, 111 — les trois affectations)
- `src/container-kingdom/js/Log.js` (l. 28, lecture de `innerHTML`)
- `src/container-kingdom/js/ContainersListEntry.js`, `ContainersList.js`,
  `ContainerView.js` (noms, labels, projets compose)
- `src/container-kingdom/js/DockerApiClient.js` (`getContainerLogs`)
- Ticket d'origine : `2026-07-27_17-28` (exposition et CORS)

## Definition of Done

- [x] Aucune donnée venue de Docker — logs, noms, labels, projets compose — n'est
      interprétée comme du HTML.
- [x] **Preuve automatisée qui échoue avant correction** : une ligne de log
      contenant `<img src=x onerror=…>` s'affiche **en texte** et ne crée aucun
      élément exécutable.
- [x] Les formatters de `LogEntry` fonctionnent toujours (couleurs ANSI, lignes
      d'erreur) — le rendu visible ne régresse pas.
- [x] `npm run verify` vert.

## Suite

- **Ce que ça n'a pas fermé** — la chaîne n'est coupée qu'à moitié. L'API Docker
  reste **lisible sans authentification depuis Internet**, et le CORS `*` permet à
  n'importe quel site tiers de l'interroger : `2026-07-27_17-28` porte cette
  moitié, et il attend une décision du propriétaire.
- **Ce que ça ouvre** — le dépôt n'a aucune règle de lint contre `innerHTML`. Le
  correctif tient tant que personne n'en réécrit un ; une règle ESLint
  (`no-unsanitized` ou une interdiction locale de la propriété) transformerait la
  discipline en garde-fou. Non fait ici : ajouter une règle de lint touche tout le
  dépôt, c'est un ticket.
- **Limite de la vérification** — pas de contrôle au navigateur (extension
  indisponible) : le repli `details/summary` des logs multi-lignes et le
  surlignage sont couverts sous jsdom, pas vus à l'écran.
- **Déposé en `100-follow-up/`** — `2026-07-29_08-41` : `ansiToHex()`, code mort
  qui fabrique du HTML depuis le texte brut d'un conteneur.

## Journal

### Travail

- [2026-07-29 08:32] Le piège annoncé par le ticket **n'existe pas** : en lisant
  le code, `ansiToHex()` — la seule fonction qui produisait du HTML à partir du
  texte brut — n'est **jamais appelée**. Le seul formatter réellement branché est
  `highlightErrors`, qui **lit** `innerHTML` sans jamais en écrire. Le pipeline
  n'a donc aucun besoin de HTML : `textContent` suffit partout.
- [2026-07-29 08:36] Cinq points corrigés : les deux affectations de `LogEntry`
  (l. 93 et 111), la lecture intermédiaire (l. 99), et les noms venus de Docker
  dans `ContainersListEntry` (×2), `ContainersList` et `ContainerView`.
- [2026-07-29 08:37] `Log.highlightErrors` lit désormais `textContent`. La règle
  est « la ligne mentionne une erreur » : elle doit se lire comme l'utilisateur la
  lit, pas comme le DOM la stocke.
- [2026-07-29 08:38] `ansiToHex` reste en place — code mort, mais qui fabrique du
  HTML à partir de texte brut : rebranché un jour, il rouvrirait le trou.
  Supprimer du code mort est un autre ticket ; déposé en candidat plutôt que
  traité au passage.

### Vérification

- [2026-07-29 08:34] Preuves posées avant correction : **5 rouges sur 6**, dont
  quatre où l'élément `<img>` est réellement créé dans le DOM — l'injection n'est
  pas supposée, elle est constatée.
- [2026-07-29 08:39] Un de mes tests avait **tort**, pas le code : il attendait
  qu'une ligne contenant `<span title="error">` ne soit pas surlignée. Une fois
  rendue en texte, cette ligne affiche bien le mot « error » à l'écran — la
  surligner est juste. Test réécrit au niveau du formatter, là où la différence
  entre lire le texte et lire le balisage existe vraiment.
- [2026-07-29 08:40] `git stash` du correctif : **5 tests repassent au rouge**,
  puis vert une fois restauré. Les preuves portent bien sur le changement.
- [2026-07-29 08:40] `npm run verify` **vert** : lint + build + **305 tests /
  44 fichiers**. Aucune régression sur les suites existantes qui touchent au DOM
  (`ContainerView.refresh`, `ContainerKingdomRenderer.sync`).
- [2026-07-29 08:40] **Pas de validation navigateur** : l'extension Chrome n'est
  toujours pas connectée. Le rendu des logs (repli `details/summary`, surlignage)
  n'a donc pas été regardé à l'écran ; il est couvert sous jsdom.

### Validation

- [2026-07-29 08:42] Review : les cinq points d'injection sont clos, les preuves
  échouent sans le correctif (`git stash` à l'appui), frontière moteur non
  concernée. Mergé sur `main` en `--no-ff` : **d5f08d1**.
- [2026-07-29 08:42] Une correction de ma propre spécification est consignée au
  journal : le « piège » que le ticket annonçait sur les formatters n'existait
  pas. Mieux vaut le dire que laisser croire à une difficulté qu'on aurait
  vaincue.
