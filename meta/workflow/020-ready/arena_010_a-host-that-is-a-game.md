---
id: 2026-08-11_08-55
title: Un quatrième hôte, qui est un jeu et pas une vitrine
type: feat
branch:
created: 2026-08-11 08:55
ready: 2026-08-11 10:30
doing:
verify:
done:
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

- [ ] `src/arena/` tourne sur `npm run dev`, avec sa propre entrée vite, et se
      **joue** : on peut y perdre, et on peut rejouer.
- [ ] **Portrait** : jouable au doigt sur un écran de téléphone (largeur ~400 px),
      et lisible sur un grand écran.
- [ ] Les couches font ce que le tableau ci-dessus annonce — vérifié à l'écran,
      pas seulement en test.
- [ ] `every()` porte la ressource, la cadence de tir et les vagues.
- [ ] **Zéro import** hors `src/engine/index.js` — vérifiable par grep, cité au
      journal.
- [ ] Aucune dépendance vers `src/container-kingdom/`, dans les deux sens.
- [ ] Le **journal des manques** est déposé en candidats `100-follow-up/`, les
      trois déjà connus compris.
- [ ] `npm run verify` vert ; les **quatre** hôtes sans erreur console.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
