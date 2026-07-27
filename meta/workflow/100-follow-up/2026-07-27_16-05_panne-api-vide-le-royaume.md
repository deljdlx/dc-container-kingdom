# Une panne de l'API Docker vide le royaume

- **Origine** : `2026-07-26_14-20`
- **Constat** : `DockerApiClient.getContainersDescriptors()` **avale** ses erreurs
  et renvoie `[]`. Le repository ne peut pas distinguer « le daemon ne répond
  pas » de « il n'y a plus aucun conteneur » : il élague donc *tous* les
  conteneurs, détruit toutes les maisons et vide la carte. Observé pour de vrai
  pendant la vérification de `14-20` — une sonde avait cassé `fetch`, et les 35
  maisons ont disparu en un cycle.
- **Coût du non-fait** : un hoquet du daemon (ou un proxy qui redémarre) efface le
  royaume sous les yeux de l'utilisateur. Avant `14-20` le symptôme existait
  déjà, masqué par le rechargement de page ; maintenant que la carte se
  réconcilie en place, il devient franc.
- **Piste** : distinguer l'échec du vide — renvoyer `null` (ou lever) sur erreur,
  et faire du repository un no-op dans ce cas, en gardant l'état précédent. À
  arbitrer : signaler la panne à l'utilisateur (bandeau) plutôt que de figer la
  carte en silence.
