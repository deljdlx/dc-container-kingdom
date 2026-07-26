---
id: 2026-07-26_18-00
title: Le champ Status rend le checksum instable et provoque un rechargement en boucle
type: fix
branch:
created: 2026-07-26 18:00
ready:
doing:
verify:
done:
---

## Objectif

Depuis le ticket `2026-07-26_14-19`, l'empreinte des conteneurs calculée par
`ContainerRepository.loadContainers()` inclut `descriptor.Status`. Or `Status`
est la chaîne **lisible par un humain** de l'API Docker — celle qu'affiche
`docker ps` : `"Up 4 seconds"`, `"Up 9 seconds"`, `"Up About a minute"`… Elle
**vieillit toute seule**, sans qu'aucun conteneur ne change.

Conséquence : le checksum varie à presque chaque tick de polling,
`handleNewContainers()` déclenche `onContainersChanged`, désormais câblé sur
`document.location.reload()` — l'application **se recharge en boucle toutes les
5 secondes** face à un vrai daemon Docker.

Le défaut est invisible en développement : les fixtures du mock sont figées
(`"Up 8 days"`), donc ni `npm run dev` ni la suite de tests ne font vieillir le
libellé. C'est aussi la première fois que ce `reload()` est réellement
atteignable — avant `14-19`, la détection était morte et masquait le problème.

## Spécifications

### Fonctionnel

- Un conteneur qui ne change pas **ne doit produire aucune détection**, quel que
  soit le temps écoulé.
- Un vrai changement d'état (`running` → `exited`), un ajout, une suppression, un
  changement d'image, de réseaux ou de labels reste détecté.

### Technique

- Retirer `status` de `checksumDescriptor` dans
  `ContainerRepository.loadContainers()` : `State` (`"running"`, `"exited"`,
  `"paused"`…) est la donnée stable et suffit à la DoD « changement d'état » du
  ticket `14-19`.
- Documenter **dans le code** pourquoi `Status` est exclu — sans commentaire, le
  champ sera réintroduit par le prochain lecteur qui le trouvera « plus complet ».
- Aligner `meta/documentation/container-kingdom.md`, qui liste aujourd'hui
  `status` parmi les champs de l'empreinte.

### Risques / vigilance

- Ne pas retirer `State` par confusion avec `Status` : ce sont deux champs
  distincts de l'API Docker.
- Les autres champs sont déjà normalisés (tri des ids, des réseaux, des labels) —
  ne pas y toucher.

## Contexte / liens

- `src/container-kingdom/js/ContainerRepository.js` (`loadContainers`,
  `checksumDescriptor`, `handleNewContainers`)
- `src/container-kingdom/js/ContainerKingdom.js` (`onContainersChanged` →
  `document.location.reload()`)
- `mock/fixtures/containers.json` (`Status` figé — d'où l'angle mort)
- `meta/documentation/container-kingdom.md` (cycle de rafraîchissement)
- Ticket d'origine : `meta/workflow/080-done/2026-07-26_14-19_fix-boucle-refresh-checksum-mort.md`
- Ticket lié : `meta/workflow/000-backlog/2026-07-26_14-20_feat-refresh-incremental-sans-reload.md`
  (remplacera le `reload()` par un rendu incrémental)

## Definition of Done

- [ ] `Status` ne fait plus partie de l'empreinte ; l'exclusion est justifiée par
      un commentaire dans le code.
- [ ] Test de non-régression : seul `Status` vieillit → **aucun** appel à
      `onContainersChanged`, checksum inchangé.
- [ ] Les détections légitimes restent couvertes (`State`, ajout / suppression).
- [ ] `meta/documentation/container-kingdom.md` corrigé.
- [ ] `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
