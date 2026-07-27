# Git Kingdom — un second consommateur du moteur

> Idée explorée le 2026-07-27, **non engagée** : elle servait d'exemple à la
> discussion sur le nommage des tickets. Consignée ici pour ne pas reperdre
> l'analyse. Quatre tickets avaient été créés puis retirés du backlog (voir
> `375d52d`) — l'historique git les restitue si l'idée revient.

- **Origine** : discussion du 2026-07-27 sur les groupes de tickets.
- **Idée** : une seconde application sur le même moteur — visualiser des dépôts
  git publics comme Container Kingdom visualise des conteneurs Docker.
- **Ce que ça vaut** : ce serait le **premier vrai test de la frontière moteur**.
  Elle tient aujourd'hui — hors `demo/` et `catalog/`, la seule occurrence de
  « Docker » dans `src/engine/` est un commentaire affirmant qu'il n'y en a pas.
  Un second consommateur transformerait cette affirmation en preuve.

## Ce que l'analyse a déjà établi

- **Emplacement** : `src/git-kingdom/` dans ce dépôt, sans extraire le moteur en
  package npm — versioning et publication coûtent cher tant que les deux
  applications vivent ensemble.
- **Obstacle 1** : `src/index.html` est occupé par Container Kingdom (son HTML à
  la racine de `src/`, son JS dans `src/container-kingdom/`). Deux applications
  ne peuvent pas tenir cette place. **Ce point a une valeur propre**, même sans
  Git Kingdom : la racine ferait un bon seuil vers la démo et le catalogue, qu'il
  faut aujourd'hui connaître par cœur pour trouver.
- **Obstacle 2** : le mock est câblé globalement (`dockerMockPlugin()` dans
  `vite.config.js`) et n'intercepte que `/api/docker/*`.
- **Contrainte** : l'API GitHub plafonne à 60 req/h en anonyme, et un dépôt
  public ne peut pas cacher de jeton. Le cache serait une contrainte de départ,
  pas un raffinement.

## La question qui resterait à trancher

Container Kingdom est vivant parce que Docker fournit des métriques **qui
bougent**. Un dépôt git est essentiellement **statique** : ce qui bouge, c'est
l'activité (commits, PR, issues), à l'échelle du jour. Sans réponse à « qu'est-ce
qui anime la carte ? », le royaume serait figé — et on perdrait précisément ce
qui fait l'intérêt du premier. Trois axes : rejouer l'historique, faire de
l'activité la métrique vivante, ou assumer un atlas statique.
