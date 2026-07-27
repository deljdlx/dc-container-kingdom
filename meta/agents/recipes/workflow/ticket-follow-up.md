# Recipe — clore par une vision de la suite (`## Suite`)

**Quand** : à la **clôture** d'un ticket, pendant la review
([ticket-validate](ticket-validate.md)). Aussi dès qu'une piste émerge en cours de
route ([ticket-work](ticket-work.md)) — on la dépose, on ne dérive pas.

Un ticket ne regarde que vers l'arrière : l'`Objectif` dit l'intention de départ,
la `DoD` est le contrat, le `Journal` raconte ce qui s'est passé. La rubrique
**`## Suite`** est la seule qui regarde vers l'avant — pour que le prochain qui
ouvre le sujet ne reparte pas de zéro.

> Le mot anglais est *follow-up* : c'est le même mécanisme, rubrique **`## Suite`**
> côté ticket, dossier **`100-follow-up/`** côté board.

## 1. Répondre à « et ensuite ? »

Renseigner `## Suite` **à chaque clôture**, en trois angles (aucun n'est
obligatoire, l'ensemble doit tenir en quelques lignes) :

- **Ce que ça ouvre** — piste entrevue, amélioration possible, question restée
  sans réponse.
- **Ce qu'on laisse de côté** — périmètre écarté, limite de la vérification,
  dette acceptée. C'est ce qui se perd le plus vite.
- **Ce qui a été déposé** — les candidats écrits en `100-follow-up`, s'il y en a.

**`aucune` est une réponse valable** — elle dit « on y a réfléchi », pas « on a
oublié ». Une rubrique vide, elle, ne dit rien.

> **La rubrique n'est pas le journal.** Le journal date ce qui s'est passé ; la
> rubrique décrit ce qui reste devant. Si une ligne raconte du passé, elle va dans
> le journal.

## 2. Déposer un candidat — l'exception, pas la règle

**Le résultat par défaut de cette étape est du texte**, pas un ticket. La plupart
des suites vivent très bien dans la rubrique : elles y sont lisibles par le
prochain, sans encombrer le backlog.

Déposer un **candidat** dans `100-follow-up/` seulement quand la piste demande une
décision (la faire ou non) qu'on ne peut pas prendre maintenant. Un candidat est
une **note**, pas un ticket — pas de frontmatter, c'est ce qui les distingue :

> **Une direction n'est pas un candidat.** Si ce qui émerge est une envie large
> (« et si on faisait X ? ») plutôt qu'une piste précise issue d'un constat, ça va
> en **`200-ideas/`**, pas ici — `100-follow-up/` **périme**, et jetterait au
> deuxième tri ce qu'on voulait garder.

```markdown
# Titre court de la piste

- **Origine** : 2026-07-26_18-00
- **Constat** : ce qu'on a observé (fait vérifié, pas intuition).
- **Coût du non-fait** : ce qui casse ou coûte si on ne le fait jamais.
```

Nommer le fichier **`YYYY-MM-DD_HH-MM_titre.md`** — un candidat garde la forme
datée, justement parce qu'il n'est **pas** un ticket : ni projet ni priorité ne
sont encore décidés, et c'est le tri qui tranchera. La promotion devient donc un
`git mv` **qui renomme** au format `projet_priorité_titre.md` — voir
[follow-up-triage](follow-up-triage.md).

## 3. Les trois interdits

- **Pas de follow-up « méta »** — « vérifier que le suivi précédent a bien été
  fait », « auditer l'audit ». S'il faut du suivi pour du suivi, c'est que la
  tâche n'était pas finie.
- **Pas de travail non terminé** sorti en follow-up. Ce qui relève de la `DoD`
  reste dans le ticket : « je crée un follow-up » ne doit jamais devenir la façon
  de clore un ticket à moitié fait.
- **Pas de traitement dans la foulée** : une suite se dépose. La traiter, c'est
  dériver hors du périmètre du ticket courant.

## 4. Où écrire, et sur quelle branche

- La rubrique `## Suite` fait partie du ticket → elle se remplit **là où le ticket
  est clos**, sur `main` (voir la topologie git de
  [work-a-task](work-a-task.md)).
- Un candidat se crée **sur `main`, depuis le tree principal** — jamais depuis la
  branche du ticket, sinon il n'arrive sur le board qu'au merge.
- Référencer les autres tickets par leur **`id`** (`2026-07-26_14-19`), **jamais**
  par un chemin de colonne : le chemin change à chaque transition, l'`id` non.
