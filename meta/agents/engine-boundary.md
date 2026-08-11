# Frontière moteur & repères d'architecture

## Frontière (impérative)

- Les dépendances vont **app → moteur uniquement**. Le moteur (`src/engine/`)
  **n'importe jamais** rien de `src/container-kingdom/`.
- Importer le moteur **uniquement** depuis le baril **`src/engine/index.js`** —
  jamais un fichier interne. Y exporter toute nouvelle classe publique.
- Les chemins d'assets du moteur se configurent via `setAssetsBase(...)` — rien de
  spécifique à Container Kingdom en dur dedans.

C'est ce qui rend le moteur réutilisable ; la démo `src/engine/demo/` le prouve
(elle pilote le moteur sans rien de Container Kingdom).

## Routage du rendu (impératif par défaut)

**Le DOM porte ce qui est vivant et/ou persistant ; ce qui est temporaire par
conception passe par le canvas.** Le critère est la **durée de vie voulue**, pas
la taille ni le nombre : ce que le joueur peut retrouver, ramasser ou tuer est un
`Element` ; un projectile, une explosion, une étincelle sont peints sur une
`FxSurface`.

Ce que ça coûte de l'ignorer : le layout du navigateur franchit le budget d'une
frame vers **1 000 éléments DOM**. Ce que ça coûte de l'appliquer : le canvas
occupe **un cran de profondeur fixe**, donc un projectile passe toujours au-dessus
du décor.

C'est un **défaut, pas une police** — un objet temporaire qui doit vraiment
s'intercaler dans la profondeur peut rester un `Element`. Détail et mesures :
`documentation/engine.md` §5.

## Repères d'architecture (moteur)

- `Element` = nœud de scene-graph ; `Board`/`Area` = tuilage streamé **7×7** autour
  du joueur ; `Viewport` = game loop `requestAnimationFrame` (registre de
  behaviors) ; `Camera` suit une cible (découplée du perso) ; `Renderer/*` = rendu
  DOM, profondeur par algorithme du peintre (`z = DEPTH_BASE + offsetY + height`).
- **Collisions** : broad phase (bbox agrégée) + narrow phase (**zones de collision**
  du détecteur vs zones de la cible), détection pure + réconciliation par diff.
  Zones **collision** (bloquent) vs **trigger** (émettent des events).
- **Personnages** : `Character` animé, IA déléguée à des **behaviors**
  interchangeables (`PatrolBehavior`, `FleeBehavior`, `CharacterBehavior`) tickés
  par la game loop. Déplacement via `Character.moveBlocked(dx, dy, isBlocked)`.
- Éléments intégrés : `SpriteElement` déclaratifs (`static descriptor`).

Détail complet : **`documentation/engine.md`** et **`documentation/architecture.md`**.
