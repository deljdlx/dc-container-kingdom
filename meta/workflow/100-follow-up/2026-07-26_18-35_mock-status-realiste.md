# Rendre le `Status` du mock Docker réaliste

- **Origine** : `2026-07-26_18-00`
- **Constat** : les fixtures (`mock/fixtures/containers.json`) ont un `Status`
  figé (`"Up 8 days"`), alors que l'API Docker renvoie un libellé qui vieillit
  (`"Up 4 seconds"` → `"Up 9 seconds"`). C'est précisément ce qui a rendu le bug
  du checksum invisible en dev **et** en CI : seul un test unitaire écrit à la
  main l'a attrapé.
- **Coût du non-fait** : toute régression liée à une donnée Docker **variable
  dans le temps** (libellés, uptime, stats) reste invisible tant qu'on ne l'a pas
  soupçonnée. Le mock donne une fausse assurance.
