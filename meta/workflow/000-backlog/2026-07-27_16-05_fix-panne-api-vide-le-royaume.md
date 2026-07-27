---
id: 2026-07-27_16-05
title: Une panne de l'API Docker vide le royaume
type: fix
branch:
created: 2026-07-27 16:05
ready:
doing:
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

_Rempli en « specify » (voir la recipe)._

Piste retenue au tri : distinguer l'échec du vide — lever (ou renvoyer `null`)
sur erreur, et faire du repository un no-op dans ce cas, en gardant l'état
précédent. **À arbitrer en specify** : signaler la panne à l'utilisateur
(bandeau) plutôt que de figer la carte en silence.

## Contexte / liens

- `src/container-kingdom/js/DockerApiClient.js` (la panne avalée)
- `src/container-kingdom/js/ContainerRepository.js` (l'élagage)
- `src/container-kingdom/js/ContainerKingdom.js` (boucle et démarrage)
- Ticket d'origine : `2026-07-26_14-20` (réconciliation de la carte en place)

## Definition of Done

- [ ] Une panne de l'API pendant la boucle laisse la carte intacte.
- [ ] La panne est distinguée d'un cluster réellement vide.
- [ ] Preuve automatisée qui échoue avant correction.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
