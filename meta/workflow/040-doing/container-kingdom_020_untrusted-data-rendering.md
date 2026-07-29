---
id: 2026-07-29_08-26
title: Les logs d'un conteneur s'exécutent dans le navigateur
type: fix
branch: claude/untrusted-data-rendering
created: 2026-07-29 08:26
ready: 2026-07-29 08:27
doing: 2026-07-29 08:31
verify:
done:
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

- [ ] Aucune donnée venue de Docker — logs, noms, labels, projets compose — n'est
      interprétée comme du HTML.
- [ ] **Preuve automatisée qui échoue avant correction** : une ligne de log
      contenant `<img src=x onerror=…>` s'affiche **en texte** et ne crée aucun
      élément exécutable.
- [ ] Les formatters de `LogEntry` fonctionnent toujours (couleurs ANSI, lignes
      d'erreur) — le rendu visible ne régresse pas.
- [ ] `npm run verify` vert.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
