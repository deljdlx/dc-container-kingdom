# Le baril n'a pas suivi la séparation noyau / contenu

- **Origine** : 2026-08-02_20-00
- **Constat** : le rangement a sorti le contenu du noyau côté **dossiers**
  (`content/` vs `scene/`, `world/`, `view/`, `character/`, `render/`), mais
  `src/engine/index.js` reste un **baril unique** : il exporte `Application`,
  `Viewport` et `CollisionSystem` à côté de 219 fleurs, 8 bases de personnages et
  les planches d'arbres — **461 noms** au total, mesurés à la clôture. Un jeu de
  tir bâti sur ce moteur importe donc toujours un village.
- **Coût du non-fait** : la réutilisabilité reste une **affirmation**. Tant que
  la surface publique mélange les deux, rien ne permet de dire ce que pèse le
  noyau seul, ni d'empêcher un hôte de dépendre du décor par inadvertance. Un
  baril `core.js` à côté d'`index.js` (qui resterait la surface complète, pour ne
  rien casser) rendrait la frontière **mesurable** — et donnerait sa cible à la
  petite démo « shooter » évoquée comme second consommateur.
