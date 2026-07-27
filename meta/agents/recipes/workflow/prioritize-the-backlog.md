# Recipe — prioriser le backlog

**Quand** : quand l'ordre du backlog ne reflète plus la réalité — typiquement
après une salve de créations, ou quand choisir la tâche suivante devient
arbitraire. **Pas** à chaque création : un ticket naît à `500`
([ticket-create](ticket-create.md)), et hiérarchiser est un acte séparé.

La priorité vit dans le **nom de fichier** (`projet_priorité_titre.md`, voir
[`../../../README.md`](../../../README.md)). La changer, c'est un `git mv` — du
bookkeeping de board, à committer au fil de l'eau.

## Le principe : le coût du non-fait, pas l'envie

Un backlog se classe par **ce que coûte de ne jamais le faire**, pas par ce qui
serait agréable à faire. C'est le même critère qui filtre les candidats
([follow-up-triage](follow-up-triage.md)) — appliqué ici pour ordonner plutôt que
pour trier.

## Les bandes (pour que les nombres veuillent dire quelque chose)

| Bande | Ce qu'elle signifie |
|---|---|
| `000`–`099` | **Ça saigne** — sécurité, perte de données, ou défaut que l'utilisateur subit à chaque usage. |
| `100`–`399` | **Ça coûte** — bloque d'autres travaux, ou dette qui grossit à chaque semaine qui passe. |
| `400`–`599` | **Valeur nette, pas urgente.** `500` = valeur de naissance, non priorisé. |
| `600`–`999` | **Utile un jour** — et candidat à l'élagage au tri suivant. |

**Numéroter clairsemé** (`010`, `020`, `110`…) : insérer un ticket ne doit pas
obliger à en renommer dix.

## Les questions, dans cet ordre

La **première qui discrimine** tranche — on ne les pose pas toutes.

1. **Qui paie ?** Un défaut que subit l'**utilisateur** passe devant un défaut que
   subit le développeur ou l'agent.
2. **Qu'est-ce qui casse si on ne le fait jamais ?** Une réponse vague (« ce
   serait mieux ») range le ticket dans les bandes basses, pas hautes.
3. **Est-ce que ça grossit ?** Une coquille d'API publique, une dette qui se
   propage à chaque nouvel appel coûte **plus cher plus tard**. Ce qui grossit
   monte.
4. **Est-ce que ça débloque ?** Un ticket prérequis d'un autre porte la valeur
   des deux.
5. **À égalité seulement** : le moins cher passe devant.

### Ce qui ne décide pas

- **L'ancienneté** : un vieux ticket n'est pas prioritaire, il est vieux.
- **La facilité** : sinon le haut du backlog se remplit de trivialités bien
  classées pendant que le vrai problème attend.
- **Qui l'a écrit** : un agent **ne se priorise pas lui-même** — il pose `500` et
  laisse trancher ([ticket-create](ticket-create.md)).

## La condition d'arrêt

**On classe la tête, pas la liste.** Ce qui compte, c'est que les **trois à cinq
premiers** soient les bons ; le reste peut rester à `500` sans dommage. Un
backlog entièrement ordonné est un backlog qu'on a passé plus de temps à ranger
qu'à vider.

## Une priorité se périme

Elle date du jour où elle a été posée. Elle se **relit** au tri des candidats
([follow-up-triage](follow-up-triage.md)), qui est déjà le rendez-vous récurrent
du board — pas dans un rituel de plus. Un ticket qui traîne en bande basse depuis
deux tris n'est pas mal classé : il est **de trop**.
