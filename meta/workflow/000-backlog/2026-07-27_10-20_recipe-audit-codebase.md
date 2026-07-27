---
id: 2026-07-27_10-20
title: Recipe — audit en profondeur de la codebase
type: docs
branch:
created: 2026-07-27 10:20
ready:
doing:
verify:
done:
---

## Objectif

Il manque la recipe symétrique des autres : `audit-workflow-consistency` audite
l'écosystème `meta/`, `review-changes` et `verify-a-change` portent sur **un
changement**. **Rien ne dit comment auditer le code lui-même.**

C'est pourtant la passe qui a produit le plus de valeur récemment : l'audit du
2026-07-26 a sorti **15 tickets**, dont plusieurs bugs réels et silencieux — une
détection de changement morte (`2026-07-26_14-19`), une fuite d'aires qui
ralentissait le jeu à mesure qu'on marche (`2026-07-26_14-18`), un sélecteur CSS
qui ne matche jamais (`2026-07-26_14-21`). Cette méthode n'existe aujourd'hui que
dans la tête de celui qui l'a menée : elle n'est **ni reproductible, ni
critiquable, ni améliorable**.

## Spécifications

### Fonctionnel — ce que la recipe produit

- Des **tickets sur le board** (et non un rapport, qui se périme le jour où il est
  écrit), classés par valeur, **chacun adossé à une preuve**.
- Les pistes incertaines partent en **candidats** `100-follow-up/`, pas en tickets :
  l'audit alimente le tri, il ne court-circuite pas la barre de valeur.
- **« Rien trouvé » est une sortie légitime** — un audit qui doit absolument
  produire des tickets en fabriquera.

### Fonctionnel — l'ossature attendue

1. **Ligne de base** — lancer `verify` d'abord : on n'audite pas un dépôt dont on
   ignore l'état. Puis **lire le board**, `000-backlog` **et** `080-done`, pour ne
   pas re-proposer ce qui est déjà ticketé ou déjà corrigé.
2. **Carte du terrain** — inventorier par **taille et centralité** (ce qui est gros
   et appelé de partout porte le risque), et repérer les pièces **sans test**.
3. **Lecture entière des pièces centrales**, plutôt qu'un `grep` généralisé : les
   défauts trouvés le 26/07 n'étaient visibles qu'en lisant le fichier **en
   entier** — un `grep` sur un symptôme supposé ne les aurait pas sortis.
4. **Balayage par familles de défauts** (checklist ci-dessous) plutôt qu'au fil de
   la lecture : c'est ce qui rend la passe reproductible.
5. **Preuve obligatoire** — rien n'entre dans un ticket sans reproduction : test
   jetable, sonde, mesure. Renvoi à [debug-empirically](../../agents/recipes/debug-empirically.md).
6. **Dépôt** — [ticket-create](../../agents/recipes/workflow/ticket-create.md) pour ce qui
   est sûr, candidat `100-follow-up/` pour le reste.
7. **Une seule passe** — anti-boucle, comme
   [evaluate-a-ticket](../../agents/recipes/evaluate-a-ticket.md) : on audite, on dépose,
   on s'arrête. Pas de ré-audit de l'audit.

### Fonctionnel — les familles de défauts

À écrire avec, pour chacune, un **exemple réel du board** (id à l'appui) plutôt
qu'un cas d'école :

| Famille | Exemple réel |
|---|---|
| **Code mort** — champs jamais assignés, branches inatteignables, arguments ignorés | `2026-07-26_14-25` (`_targetX` / `_onMoveEnd` jamais écrits) |
| **Bug silencieux** — coercition string/number, sélecteur qui ne matche jamais, appel sans argument | `2026-07-26_14-19` (`sha256()`), `14-21` (`.memory-usage`), `14-26` (`"350" + 50`) |
| **Ressource jamais rendue** — créée, jamais détachée ni annulée | `2026-07-26_14-18` (aires), `14-24` (rAF, listeners) |
| **Donnée variable dans le temps traitée comme stable** | `2026-07-26_18-00` (le libellé `Status`) |
| **Dépendance à l'historique** — même état, deux comportements selon le chemin | `2026-07-26_18-55` (bbox de collision) |
| **Duplication d'autorité** — deux endroits calculent la même chose | `2026-07-26_14-26` (index réseau) |
| **Angle mort de test** — pièce centrale non couverte, ou mock qui ne reproduit pas la variabilité du réel | `2026-07-26_14-31`, `18-35` (mock au `Status` figé) |
| **Doc qui ment** — la doc décrit un comportement que le code n'a plus | `2026-07-26_18-00` (empreinte documentée à tort) |
| **Frontière contournée** — règles d'architecture du projet non respectées | `meta/agents/engine-boundary.md` |

### Technique

- Fichier `meta/agents/recipes/audit-codebase.md` — **agnostique au projet** (aucune
  API ni chemin `src/…` en dur) ; les spécificités restent des **pointeurs** vers
  `meta/recipes/` et les règles d'architecture.
- Index à mettre à jour : `meta/agents/recipes/README.md`, section « Méthode ».
- Écrire l'articulation avec le board : audit → ticket **ou** candidat →
  [follow-up-triage](../../agents/recipes/workflow/follow-up-triage.md).
- Les exemples cités doivent être **vérifiables** (ids réels du board), dans le
  même parti pris que `ticket-follow-up` : des cas vécus, pas un gabarit.

### Risques / questions ouvertes

- **Périmètre — à trancher en *specify*** : un audit = **un sous-système** ou tout
  le dépôt ? Recommandation : un sous-système, parce qu'un audit exhaustif coûte
  cher et retrouve surtout ce qu'il a déjà trouvé.
- **Faux positifs** : le vrai danger est le ticket écrit depuis une simple lecture
  et jamais reproduit. C'est pour ça que la règle de preuve est le **cœur** de la
  recipe, pas un ornement — deux fois hier, la mesure a contredit une hypothèse
  qui semblait solide.
- **Rendement décroissant** : sans lecture préalable de `080-done`, chaque audit
  re-propose ce qui est déjà corrigé.
- **Déclencheur** : à la demande uniquement, ou périodique ? Recommandation : à la
  demande — un audit automatique produirait du bruit à trier.

## Contexte / liens

- `meta/agents/recipes/` (recipes de méthode ; voir `README.md` pour l'index)
- Recipes sœurs : `audit-workflow-consistency.md` (l'écosystème `meta/`),
  `review-changes.md` (un changement), `debug-empirically.md` (la preuve),
  `evaluate-a-ticket.md` (la barre + l'anti-boucle)
- Board : `workflow/ticket-create.md`, `workflow/follow-up-triage.md`
- Matière première : les 15 tickets de l'audit du 2026-07-26 (`000-backlog/` et
  `080-done/`), qui montrent ce que la méthode a réellement produit

## Definition of Done

- [ ] `meta/agents/recipes/audit-codebase.md` créé : court, orienté étapes,
      agnostique au projet.
- [ ] Les familles de défauts sont listées avec, pour chacune, un **exemple réel**
      du board (id vérifiable) — aucun exemple inventé.
- [ ] La règle de **preuve** est explicite (rien n'entre dans un ticket sans
      reproduction) et renvoie à `debug-empirically`.
- [ ] L'articulation avec le board est écrite : ticket vs candidat, barre de
      valeur, lecture préalable de `000-backlog` **et** `080-done`.
- [ ] Anti-boucle : une seule passe, et « rien trouvé » explicitement valable.
- [ ] Le périmètre par défaut (sous-système vs dépôt) est tranché **et justifié**.
- [ ] `meta/agents/recipes/README.md` à jour ; passe `audit-workflow-consistency`
      faite.
- [ ] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`) : ce que le ticket **ouvre**, ce
qu'il **laisse de côté** (limite, dette), les **candidats** déposés en
`100-follow-up/`. Quelques lignes ; `aucune` est une réponse valable. À la
différence du `Journal`, qui date le passé, cette rubrique regarde l'avant._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
