# Le plafond du rendu DOM est mesuré mais nulle part écrit

- **Origine** : passe d'audit B du 2026-08-06.
- **Constat** : personne ne savait combien d'éléments le moteur tient. Mesuré sur
  la démo (onglet en arrière-plan, donc **temps script** et **layout forcé** ; le
  compositing n'est pas mesuré) :

  | éléments | nœuds DOM | ms script | ms layout forcé |
  |---|---|---|---|
  | 301 | 1 108 | 0,7 | 2,2 |
  | 501 | 1 708 | 1,6 | 3,4 |
  | **1 001** | 3 208 | 3,5 | **16,2** |
  | 2 001 | 6 208 | 4,3 | 18,6 |
  | 3 501 | 10 708 | 6,6 – 14,6 | 29,9 |

  Le budget d'une frame à 60 fps est de **16,6 ms**. C'est le **layout du
  navigateur** qui le franchit en premier, vers **1 000 éléments** — pas les
  algorithmes du moteur. Chaque élément coûte **3 nœuds DOM**.
- **Coût du non-fait** : une feuille de route qui ignore son plafond décide à
  l'aveugle. « Combien de PNJ, de projectiles, de décor à l'écran » a désormais
  une réponse chiffrée ; ne pas l'écrire, c'est la reperdre.
- **La décision** : consigner ces chiffres dans `meta/documentation/engine.md`
  (avec leurs réserves de méthode), et décider s'il faut les **rendre
  reproductibles** — un petit banc dans la démo, plutôt qu'une sonde jetable.
