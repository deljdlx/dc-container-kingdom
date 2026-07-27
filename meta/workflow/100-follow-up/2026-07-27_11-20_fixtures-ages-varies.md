# Des fixtures d'âges variés, pour voir le temps passer en dev

- **Origine** : `2026-07-26_18-35`
- **Constat** : les 35 conteneurs des fixtures ont été capturés il y a ~8 mois, et
  ils ont tous à peu près le même âge. Le `Status` calculé est donc `Up 36 weeks`
  partout, et ne changera qu'une fois par semaine. Mesuré : deux lectures de
  `/containers/json` à 6 s d'intervalle rendent exactement la même chaîne.
- **Coût du non-fait** : la variabilité n'est démontrée que par les tests, qui
  injectent une horloge. Devant un `npm run dev`, le bug d'origine
  (`2026-07-26_18-00`, un checksum bâti sur `Status`) resterait invisible pendant
  une semaine — c'est-à-dire exactement le trou qu'on vient de vouloir boucher.
- **Piste** : ancrer quelques `Created` près du démarrage de la session (un
  conteneur de quelques secondes, un de quelques minutes, un de quelques heures),
  pour que la carte montre au moins un libellé qui bouge sous les yeux. À arbitrer :
  `Created` deviendrait relatif au lancement, ce qui est du réalisme mais éloigne
  les fixtures de la capture d'origine.
