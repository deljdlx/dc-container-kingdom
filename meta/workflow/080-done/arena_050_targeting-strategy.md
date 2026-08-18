---
id: 2026-08-17_20-55
title: Monter le ciblage sur une stratégie interchangeable
type: refactor
branch: claude/targeting-strategy
created: 2026-08-17 20:55
ready: 2026-08-17 21:19
doing: 2026-08-17 21:20
verify: 2026-08-18 09:24
done: 2026-08-18 09:26 (merge 70390ef)
---

## Objectif

`targetInArc()` fait **trois métiers** dans une fonction :

1. **rassembler** — interroger le board, résoudre le registre de l'hôte (dépend
   du board, du DOM, de l'état de la partie) ;
2. **filtrer** — portée, cône, exception rapprochée (géométrie pure) ;
3. **choisir** — le plus proche (pure).

C'est ce nœud qui la rend **intestable**, et ce n'est pas théorique : je me suis
trompé **deux fois** sur le filtrage en deux jours — le cône trop large qui
couvrait tout le terrain (`2026-08-17_18-10`), puis le cône qui ne couvrait rien
en deçà de 80 px (`2026-08-17_19-25`). Les deux fois, il a fallu instrumenter le
navigateur pour le voir, alors que trois assertions sur des nombres auraient
suffi.

Accessoirement, « le plus proche » est **une** politique parmi d'autres, câblée en
dur : rien ne permet de viser le plus faible (pour ne pas gaspiller de tirs sur
un corps déjà mort) ou le plus coriace.

## Spécifications

### La couture

- Un module `src/arena/targeting.js`, sans aucune dépendance au DOM ni au moteur.
- **`inSight(candidate, sight)`** — l'éligibilité, en un seul endroit : portée,
  cône, exception rapprochée. C'est la pièce que j'ai ratée deux fois, elle mérite
  ses propres tests.
- **Des stratégies** qui ne font que *choisir* parmi les éligibles :
  `nearest`, `weakest`, `toughest`. Trois, parce qu'**un pattern à une seule
  implémentation n'est pas un pattern, c'est une indirection**.
- **`pickTarget(candidates, sight, strategy)`** — filtre puis choisit.

Les candidats sont des objets **plats** (`{ element, at, distance, offAxis, hp }`)
que l'hôte fabrique. C'est ce qui rend tout ça testable sans navigateur.

### Ce qui reste où

Le **rassemblage** reste dans `arena.js` : c'est lui qui connaît le board, le
masque de couche et le registre des assaillants.

Et tout cela reste **côté hôte, pas dans le moteur**. « La plus proche » ou « la
plus faible » est une règle de jeu ; le moteur ne sait pas ce qu'est un ennemi, et
la frontière dit que l'app dépend du moteur, jamais l'inverse.

### La preuve que c'est interchangeable

Une commande en jeu pour changer de stratégie. Sans elle, le pattern n'a aucun
effet observable et personne ne saurait dire s'il marche.

## Firewalls / risques

1. **Ne pas changer le comportement.** `nearest` doit reproduire exactement ce
   que fait le code d'aujourd'hui — le refactor se juge à ça.
2. **Ne pas remonter dans le moteur.** Pas de requête conique, pas de notion de
   « cible » dans `src/engine/` : rien ne l'a mesurée comme nécessaire.
3. **Ne pas inventer de stratégies sans usage.** Trois suffisent à prouver la
   couture ; une quatrième sans joueur pour la vouloir serait du décor.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : demande du 2026-08-17 (« le ciblage monté sur un pattern stratégie »).
- `src/arena/arena.js` — `targetInArc()`, `POINT_BLANK`, `stats.arc/range`.
- Les deux défauts qui motivent la testabilité : `2026-08-17_18-10`,
  `2026-08-17_19-25`.

## Definition of Done

- [x] `src/arena/targeting.js` est **pur** : aucun import du moteur ni du DOM.
- [x] `inSight` porte l'éligibilité, avec des tests sur les trois règles
      (portée, cône, rapproché) et leurs bords.
- [x] **Trois** stratégies, testées, qui choisissent différemment sur le même jeu
      de candidats.
- [x] `nearest` reproduit le comportement actuel — vérifié en jeu.
- [x] La stratégie est **changeable en jeu**, et le changement se voit.
- [x] `npm run verify` vert ; les quatre hôtes sans erreur console.

## Suite

Deux choses, dans cet ordre :

1. **`engine_060_combat-vertical-slice`** (déjà au board) — l'hôte tient encore
   ses assaillants dans une `Map` locale (`game.attackers`), et `gatherCandidates`
   en dépend. C'est ce registre parallèle que la tranche de combat doit remplacer
   par le contrat d'état du moteur ; le ciblage n'aura alors plus qu'à lire
   l'élément.
2. **Faire jouer le joueur.** Les trois stratégies sont prouvées *correctes* par
   les tests, pas *intéressantes* : mon pilote simulé vise en l'air et ne juge
   rien. Savoir si « la plus faible » vaut « la plus proche » demande une main
   humaine, pas une mesure de plus.

Pas de quatrième stratégie tant que personne n'en veut une — le ticket le disait
déjà (firewall 3).

## Journal

### Travail

- [2026-08-17 21:20] Ticket pris sur `claude/targeting-strategy` (worktree
  `/tmp/dc-container-kingdom-claude`). `100-follow-up/` non vide
  (`engine-input-always-walks`) : le tri est reporté à la prise de la tâche
  suivante, la recipe l'exige *avant* la prochaine, pas au milieu de celle-ci.
- [2026-08-17 21:42] `src/arena/targeting.js` créé — `inSight`, `pickTarget`,
  `STRATEGIES` (nearest 🎯 / weakest 💔 / toughest 🛡️), `strategyById`. Aucun
  import : ni moteur, ni DOM. Les candidats sont des objets plats
  `{ element, at, distance, offAxis, hp }`.
- [2026-08-17 21:48] `arena.js` recousu : `targetInArc()` éclatée en
  `gatherCandidates()` (interroge le board par **rectangle** — c'est ce que le
  moteur sait élaguer — et calcule `offAxis` par produit scalaire, `acos` borné
  à ±1 parce que l'arrondi peut le dépasser) et `currentTarget()` qui délègue à
  `pickTarget`. Rien de conique n'est remonté dans le moteur (firewall 2).
- [2026-08-17 21:55] La commande qui prouve la couture : `stats.strategy`, touche
  **T**, bouton `#strategy` dans le HUD, tous les deux passant par
  `cycleStrategy()`.
- [2026-08-18 09:05] **Le worktree `/tmp/…-claude` a été effacé par le nettoyeur
  de `/tmp`** avant tout commit — troisième fois sur ce projet. Travail
  reconstruit à l'identique depuis le transcript (les deux fichiers créés y sont
  en entier, les retouches d'`arena.js`/`index.html`/`arena.css` étaient des
  scripts rejouables), worktree recréé, `npm ci`, et **commit immédiat** cette
  fois — voir `## Suite` du triage à venir.
- [2026-08-18 09:12] Effet de bord du `git worktree prune` de la reconstruction :
  les enregistrements des worktrees `codex` et `copilot` (effacés eux aussi par
  `/tmp`) ont sauté, et le board doctor a immédiatement crié — leurs branches
  mergées devenaient « périmées hors worktree actif ». Enregistrements restaurés
  (`git worktree add` sur leur chemin d'origine) plutôt que branches supprimées :
  un agent ne touche pas aux branches d'un autre.

### Vérification

- [2026-08-18 09:15] `test/arena-targeting.test.js` — **19 tests** : bords de
  portée, bords de cône (30° passe, 31° non), bout portant *dans le dos*, bout
  portant qui ne dispense **pas** de la portée, les trois stratégies qui
  choisissent différemment sur le même jeu, stabilité des ex æquo, `strategyById`
  inconnu → `nearest`, et `pickTarget` qui ne rend jamais un candidat hors vue.
- [2026-08-18 09:18] `npm run verify` vert : **72 fichiers, 642 tests**.
- [2026-08-18 09:21] Navigateur, `http://localhost:5491/arena/` : le bouton HUD
  cycle `🎯 Nearest → 💔 Weakest → 🛡️ Toughest → 🎯 Nearest` et la touche **T**
  fait la même chose. Partie réelle sous `🛡️ Toughest` : score 25 → 52 → 64,
  donc `pickTarget` désigne bien des cibles et les tirs tuent, sous une stratégie
  qui n'est pas celle d'avant.
- [2026-08-18 09:23] Les **quatre hôtes** rechargés, console sans erreur :
  `/`, `/engine/demo/`, `/engine/catalog/`, `/arena/`.

### Validation

- [2026-08-18 09:22] `nearest` par défaut reproduit le comportement d'avant : la
  vague 1 est tenue sans dégât, comme au ticket précédent.
- **Non validé — et ça se dit** : l'*intérêt* des deux autres stratégies. Mon
  pilote simulé vise en l'air, il ne choisit rien ; les tests prouvent qu'elles
  désignent des cibles différentes, pas qu'un joueur y trouve son compte.
