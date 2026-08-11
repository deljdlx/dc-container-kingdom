---
id: 2026-08-11_08-55
title: Un quatrième hôte, qui est un jeu et pas une vitrine
type: feat
branch: claude/arena
created: 2026-08-11 08:55
ready: 2026-08-11 10:30
doing: 2026-08-11 10:35
verify: 2026-08-11 15:20
done: 2026-08-11 15:25 (merge 1992195)
---

## Objectif

Le moteur a trois hôtes, et **aucun n'est un jeu** :

- **Container Kingdom** — une visualisation, dont l'animation vient de Docker ;
- **`/engine/demo/`** — un **banc de conformité**. Chaque ticket clos y a laissé
  son démonstrateur : le rocher qui dérive prouve que bouger repeint, le puits
  qu'une entité survit au streaming, `p`/`s` que l'horloge tient. Précieux, et
  précisément pas un jeu ;
- **`/engine/catalog/`** — une planche de sprites.

Le but du moteur est pourtant de **faire des jeux**. Sans un hôte qui en soit un,
rien ne dit ce qui manque : un banc câblé par quelqu'un qui connaît tous les
internes **flatte** le moteur. Un hôte neuf, écrit comme un hôte, est le seul
test sévère.

C'est aussi ce qui évite d'écrire le combat deux fois : la tranche de combat
(`2026-08-08_17-58`) doit tourner **ici**, pas dans la démo.

## Spécifications

### Le jeu : une défense en **couloirs verticaux**, portrait, mobile-first

Des assaillants descendent par le haut ; le joueur pose des défenses sur leur
chemin ; un assaillant qui franchit la ligne du bas fait perdre.

**Verticaux, et c'est le cœur de la décision.** En portrait, l'écran donne de la
**hauteur**, et une défense a besoin de **profondeur** — le temps que
l'assaillant met à traverser *est* le jeu. Des couloirs horizontaux sur un
téléphone donneraient cinq lignes empilées avec trois cases de profondeur : le
jeu ne respire plus. Verticaux : 3 colonnes, 8 à 10 rangées.

Deux conséquences heureuses :

- **l'axe de progression est l'axe de profondeur** — les assaillants descendent,
  donc leur `y` croît, donc l'algorithme du peintre les trie **gratuitement** :
  un assaillant devant une défense la masque, sans une ligne de code ;
- **3 couloirs seulement** : perdre une ligne est un événement. Cinq couloirs
  tièdes seraient pires pour un petit jeu.

### Le périmètre, fini et petit

| | |
|---|---|
| terrain | 3 colonnes × ~9 rangées, un écran, **pas de scroll** |
| héros | marche (D-pad tactile + flèches) et **pose là où il se tient** |
| défenses | 2 : un producteur de ressource, un tireur |
| assaillants | 2 : un lent basique, un plus résistant — pour que les PV comptent |
| économie | une ressource, un coût de pose, un temps de recharge |
| progression | des vagues qui accélèrent, un score |
| fin | un assaillant franchit la ligne → écran de fin, rejeu |

**Le héros plutôt qu'un curseur** : ça garde en jeu toute la pile de déplacement
(entrées, `moveBlocked`, banque de sous-pixels, animation à la distance,
poussière), sans laquelle l'hôte censé dire « ce qui manque » ne dirait rien sur
la moitié mobile du moteur. Et ça offre une tension de placement gratuite :
défendre le couloir de gauche éloigne du couloir de droite.

**Taper une case pour s'y rendre est la bonne interaction tactile** — mais elle
demande `2026-07-26_14-25` (le déplacement vers une cible est mort *et* faux :
ni gauche, ni haut, ni diagonale, un pas par frame au lieu du `dt`). On ne
bloque pas l'hôte là-dessus : **D-pad d'abord**, et « taper une case » devient la
première entrée du journal des manques — donc un ticket avec une raison.

### Ce qu'il ne fait PAS, et qui revient à la tranche

L'état du jeu reste **local à l'hôte** : les PV sont des variables, la
comptabilité est maison. **Aucun contrat d'état du moteur n'est utilisé** — ni
`blueprint`, ni `data`, ni event de dégât.

C'est délibéré. La tranche de combat (`2026-08-08_17-58`) remplacera cette
comptabilité par le contrat du moteur, et **la friction de ce remplacement est la
mesure**. Livrer les deux d'un coup reviendrait à valider le contrat avec le code
écrit pour lui.

### Ce que l'arène doit prouver au passage

Les couches de collision, en situation réelle plutôt qu'en test :

| | couche | masque |
|---|---|---|
| décor, bords du terrain | `wall` | — |
| assaillants | `enemy` | `wall` |
| héros | `player` | `wall` |
| défenses posées | `tower` | — |
| projectiles | — | `enemy` |

Lisible à l'écran : les assaillants se traversent entre eux et traversent le
héros (le contact n'est pas un mur), tout le monde est arrêté par les bords, et
un tir ignore son tireur sans qu'on nomme personne.

Et l'ordonnanceur, dont `every()` **n'a aucun client** aujourd'hui : la
production de ressource, la cadence de tir de chaque défense, le rythme des
vagues.

### Où il vit

`src/arena/`, frère de `src/container-kingdom/`, avec sa propre entrée dans
`vite.config.js` — comme la démo et le catalogue. La racine `src/index.html` est
occupée par Container Kingdom : ce ticket **n'y touche pas** (consigné dans
`200-ideas/git-kingdom_second-engine-consumer.md`).

**Il n'importe que `src/engine/index.js`.** C'est ici que la règle de frontière
cesse d'être une affirmation pour devenir une preuve : un second consommateur
non-Docker est ce qui la démontre.

### Le dépôt séparé : plus tard, et pas trop tôt

Le but est bien de l'isoler un jour pour garder Container Kingdom propre. Mais
tant que le moteur bouge plusieurs fois par jour, une frontière de package coûte
un cycle de publication à chaque changement. Le signal de départ : quand l'API du
moteur cesse de bouger toutes les semaines.

En attendant : **concevoir comme si c'était déjà séparé**. Aucune dépendance
croisée, aucun asset partagé avec Container Kingdom, aucune configuration
commune autre que vite. La sortie doit rester un déplacement de dossier.

## Firewalls / risques

1. **Ne pas faire une seconde démo.** Si l'arène devient une vitrine de features,
   elle perd sa raison d'être. Le critère : **on peut y perdre**.
2. **Ne pas amender le moteur en douce.** Tout ajout au moteur passe par un
   ticket ; l'hôte se débrouille avec l'API publique ou **note le manque**.
3. **Trois manques sont déjà connus** — repérés en spécifiant, donc avant la
   première ligne. À noter au journal, **pas** à corriger ici :
   - le `Viewport` ne sait pas se **redimensionner** (taille figée à la
     construction, aucune écoute de rotation) — or « mobile ready » veut dire
     survivre à un passage en paysage ;
   - le CSS du moteur n'a pas de `image-rendering: pixelated` (seul le catalogue
     l'a), alors qu'un écran de téléphone imposera de **zoomer**
     (`ViewportTransform.scale()`) pour que des sprites de 32 px soient jouables ;
   - le déplacement vers une cible est mort et faux (`2026-07-26_14-25`).
4. **Ne pas hériter du décor de Container Kingdom.** Le contenu intégré
   (`src/engine/content/`) est au moteur, donc utilisable ; le royaume, non.
5. **Portrait sans casser le bureau** : la page doit rester lisible sur un grand
   écran, sans devenir un jeu paysage déguisé.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-11**, `080-done` compris.
- Origine : demande du 2026-08-11 ; conception arrêtée avec l'humain le même jour
  (couloirs verticaux pour le portrait, héros plutôt que curseur).
- L'analyse déjà faite sur un second consommateur :
  `200-ideas/git-kingdom_second-engine-consumer.md`.
- `vite.config.js` — `htmlEntries`, où s'ajoute l'entrée.
- `src/engine/demo/index.html` et `demo.js` — le D-pad tactile à reprendre.
- `meta/agents/engine-boundary.md` — la règle que cet hôte doit prouver.
- Suite immédiate : `2026-08-08_17-58` (tranche de combat).

## Definition of Done

- [x] `src/arena/` tourne sur `npm run dev`, avec sa propre entrée vite, et se
      **joue** : on peut y perdre, et on peut rejouer.
- [x] **Portrait** : jouable au doigt sur un écran de téléphone (largeur ~400 px),
      et lisible sur un grand écran.
- [x] Les couches font ce que le tableau ci-dessus annonce — vérifié à l'écran,
      pas seulement en test (une ligne corrigée : voir *Travail*).
- [x] `every()` porte la ressource, la cadence de tir et les vagues.
- [x] **Zéro import** hors `src/engine/index.js` — vérifiable par grep, cité au
      journal.
- [x] Aucune dépendance vers `src/container-kingdom/`, dans les deux sens.
- [x] Le **journal des manques** est déposé en candidats `100-follow-up/`, les
      trois déjà connus compris.
- [x] `npm run verify` vert ; les **quatre** hôtes sans erreur console.

## Suite

- **Cinq manques déposés** en `100-follow-up/` — dont deux qui n'avaient pas été
  devinés en spécifiant, et l'un des deux est le bug que l'humain a vu à
  l'écran. C'est très exactement ce que cet hôte devait produire.
- **La tranche de combat** (`2026-08-08_17-58`) tourne ici, et son travail est
  maintenant net : remplacer la comptabilité maison (les `Map` de PV de ce
  fichier) par le contrat d'état du moteur, et mesurer la friction.
- **Ce que le jeu n'a pas encore**, et qui n'est pas un manque du moteur : du
  son, un écran-titre, un équilibrage. À faire quand le jeu méritera d'être
  joué pour lui-même.

## Journal

### Travail

- [2026-08-11 10:35] Branche `claude/arena`. `src/arena/` — un `index.html`, un
  `arena.css`, un `arena.js`, plus une entrée dans `vite.config.js`. Le nom du
  projet `arena` a été ajouté à l'enum des projets du board, qui refusait le
  ticket : c'est ainsi qu'un sous-projet se déclare, et c'est bien qu'il faille
  le faire exprès.
- [2026-08-11 10:50] Le terrain : 4 colonnes × 10 rangées de 32 px, soit
  128 × 320 unités monde, zoomé par `ViewportTransform.scale()` pour tenir dans
  l'écran. **L'échelle se calcule sur les deux axes** : calculée sur la largeur
  seule, la première version dépassait la hauteur de la fenêtre et poussait son
  propre HUD et son pad hors de l'écran — sur un téléphone, où l'on ne peut pas
  scroller pour les retrouver.
- [2026-08-11 11:10] Les couches à l'œuvre : le héros ne heurte que les bords
  (`mask: ['wall']`), les pois ne voient que `enemy`, la requête « qu'y a-t-il
  devant cet assaillant ? » ne voit que `tower`. **Une ligne du tableau du
  ticket est tombée** : les assaillants n'ont pas de masque, parce qu'ils
  n'interrogent jamais la collision — un marcheur de couloir avance par
  affectation. Ils portent une couche pour être **trouvés**, pas pour trouver.
- [2026-08-11 11:30] Les pois sont peints sur le canvas et ne sont **pas** des
  éléments, conformément à la règle de routage écrite hier ; ils interrogent le
  monde avec `sweep()`, qui parle en rectangles.

### Vérification

`npm run verify` vert : **71 fichiers, 623 tests** — l'arène n'ajoute aucun test,
elle **est** le test. Les quatre hôtes répondent et se chargent sans erreur
console.

**Frontière prouvée par grep** : `src/arena/*.js` n'a qu'un seul `import`, celui
du baril. Aucune occurrence de `container-kingdom` dans l'arène, aucune
occurrence d'`arena` dans le moteur ou dans Container Kingdom.

**Le jeu se joue**, boucle complète mesurée en pilotant la boucle à la main :

| | |
|---|---|
| poser un tireur | 50 graines → une plante en jeu |
| production | +25 graines toutes les 5 s (`every`) |
| tir | ~2,4 pois vivants en permanence (cadence 1,4 s, vol 3,3 s) |
| tuer | score 0 → 10 → 20 sur 15 s, avec **un seul** tireur |
| perdre | à 30 s, un assaillant franchit la ligne → écran de fin |
| rejouer | le bouton remet tout à zéro, l'horloge repart |

**Trois bugs trouvés en jouant, tous côté hôte, tous instructifs** :

1. **Les assaillants ne bougeaient pas du tout.** À 14 px/s ils avancent de
   0,23 px par frame, et `Coordinates` **arrondit chaque écriture** : la position
   revenait à l'identique, indéfiniment. La banque de sous-pixels que le viewport
   tient pour le joueur n'est offerte à personne d'autre. L'hôte tient donc la
   sienne. → candidat déposé.
2. **Le héros était invisible au démarrage** — signalé par l'humain, et c'était
   bien un calcul de coordonnées. La caméra centre sa cible avec la taille du
   viewport en **pixels CSS** alors que le monde est dessiné à travers un zoom
   ×2,7 : le héros atterrissait à `y = 840` dans un cadre de 862. → candidat
   déposé ; l'arène s'en sort en ne suivant pas.
3. **`camera.moveTo(0, 0)` était ignoré** — il déplace la caméra sans cesser de
   suivre, donc la cible réécrivait la position à la frame suivante. Il faut
   deviner `follow(null)`. → candidat déposé.

Et une frayeur qui n'en était pas une : la boucle semblait morte au chargement
(0 frame en 500 ms). C'était **le piège rAF** du projet — onglet en arrière-plan.
La recipe le dit ; je l'ai rappris.

### Validation

- Fusionné sur `main` en `--no-ff` : `1992195`.
