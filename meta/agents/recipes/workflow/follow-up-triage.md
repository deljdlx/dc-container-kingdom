# Recipe — trier les candidats (`100-follow-up` → `000-backlog`)

**Quand** : au **démarrage d'une tâche** (première étape de
[work-a-task](work-a-task.md)) — si `100-follow-up/` n'est pas vide, on le trie
**avant** de prendre la tâche suivante.

C'est le pendant de [ticket-follow-up](ticket-follow-up.md), qui remplit le
dossier. Sans ce tri, la colonne devient une décharge — et une décharge est pire
qu'un backlog dilué : on apprend à ne plus l'ouvrir.

## Le principe : froid, groupé, comparatif

- **Groupé** : on traite **tout** le dossier en une passe, pas un candidat à la
  volée. C'est en comparant les candidats **entre eux et au backlog existant**
  qu'on peut en rejeter — pris isolément, tout candidat semble mériter sa place.
- **Froid** : le tri arrive après la clôture qui l'a produit. Celui qui vient de
  finir un ticket est enthousiaste sur ses propres pistes.
- **Court** : le déclencheur garde le dossier quasi vide, donc la passe coûte une
  minute.

## Deux portes, dans cet ordre

1. **Valeur** — « faut-il le faire ? ». C'est cette recipe.
2. **Forme** — « est-ce actionnable ? » :
   [evaluate-a-ticket](../evaluate-a-ticket.md), appliqué **seulement** aux
   candidats promus, une fois passés au `TEMPLATE`.

L'ordre compte : inutile de rendre actionnable ce qu'on va jeter.

## Statuer — chaque candidat repart avec une décision

| Critère | Décision |
|---|---|
| **Preuve** — s'appuie sur un constat vérifié (bug reproduit, mesure, gêne rencontrée) ? Un « ce serait mieux si » n'est pas une preuve. | non → **rejeté** |
| **Coût du non-fait** — qu'est-ce qui casse ou coûte si on ne le fait jamais ? | « rien de perceptible » → **rejeté** |
| **Doublon** — déjà couvert par un ticket du backlog, ou par la rubrique `Suite` d'un autre ticket ? | oui → **fusionné** |
| **Reste de DoD** — relevait en fait du ticket d'origine ? | oui → **ni promu ni rejeté** : signaler le ticket clos trop tôt |
| **Péremption** — déjà marqué « conservé » à un tri précédent ? | oui → **rejeté** |

Les quatre issues, toutes explicites :

- **Promu** — passer la note au [`TEMPLATE`](../../../workflow/TEMPLATE.md), puis
  `git mv` vers `000-backlog/` **en renommant** `projet_priorité_titre.md` : c'est
  ici, et pas avant, qu'on décide à quel projet le candidat appartient et où il se
  range. Enchaîner sur [evaluate-a-ticket](../evaluate-a-ticket.md).
- **Fusionné** — enrichir le ticket existant, supprimer la note.
- **Rejeté** — supprimer la note, motif en une ligne dans le message de commit.
- **Déporté** — l'idée est **vraie mais pas mûre**, et rien n'oblige à trancher :
  `git mv` vers `200-ideas/`. C'est la sortie honnête de ce qui ne mérite ni le
  backlog ni la corbeille. Sans elle, la règle de péremption ci-dessous finit par
  jeter des idées qu'on voulait garder — et on apprend à ne plus trier.

## Péremption : un sursis, pas deux

Un candidat qu'on ne promeut ni ne rejette est **marqué** :

```markdown
- [2026-07-26 18:31] tri : conservé
```

S'il est encore là au tri suivant, il est **rejeté**. Ne pas l'avoir choisi deux
fois *est* la réponse — pas besoin de compteur, ni du courage de jeter.

Le sursis ne vaut que pour ce qu'on **hésite à promouvoir maintenant**. Ce qu'on
veut garder *sans* trancher n'a rien à faire ici : c'est une idée, elle part en
`200-ideas/`, où aucune horloge ne tourne.

## Bookkeeping

Le tri se fait **sur `main`, depuis le tree principal**, et se commite au fil de
l'eau (c'est du bookkeeping de board — voir les règles transverses de
[work-a-task](work-a-task.md)). Un tri qui promeut, fusionne et rejette tient en
**un** commit.
