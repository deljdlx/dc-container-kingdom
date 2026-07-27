# Recipe — auditer la codebase en profondeur

**Quand** : **à la demande**, jamais en périodique — un audit automatique produit
du bruit, et la charge de tri retombe sur le board. Sœur de
[audit-workflow-consistency](audit-workflow-consistency.md), qui audite
l'écosystème `meta/`, et de [review-changes](review-changes.md), qui porte sur **un
changement** : celle-ci porte sur le **code lui-même**.

> ⚠️ **Une seule passe.** On audite, on dépose, on s'arrête. Pas de ré-audit de
> l'audit — et **« rien trouvé » est une sortie valable** : un audit obligé de
> produire des tickets en fabriquera.

## Ce que ça produit

Des **tickets sur le board** — pas un rapport, qui se périme le jour où il est
écrit et que personne ne relit. Ce qui est sûr devient un ticket
([ticket-create](workflow/ticket-create.md)) ; ce qui reste une intuition devient un
**candidat** en `100-follow-up/` ([ticket-follow-up](workflow/ticket-follow-up.md)),
donc soumis au tri comme n'importe quelle piste.

## Périmètre : annoncé d'avance, jamais « tout »

Choisir **un sous-système**, ou **une famille de défauts en transverse** — et
l'écrire avant de commencer. Deux raisons : un audit exhaustif coûte cher et
retrouve surtout ce qu'il a déjà trouvé ; et un périmètre annoncé rend le résultat
**falsifiable** (« j'ai regardé ça, pas ça ») au lieu de laisser croire à une
couverture totale.

## Les étapes

1. **Ligne de base** — lancer la vérification du projet (lint / build / tests). On
   n'audite pas un dépôt dont on ignore l'état : sans ça, on ne sait pas si ce
   qu'on trouve est une découverte ou un chantier en cours.
2. **Lire le board** — `000-backlog` **et** `080-done`. Sans ce passage, l'audit
   re-propose ce qui est déjà ticketé, ou pire, déjà corrigé.
3. **Carte du terrain** — inventorier par **taille** et **centralité** : ce qui est
   gros et appelé de partout porte le risque. Repérer au passage les pièces **sans
   test** — l'absence de test est un indice, pas encore un défaut.
4. **Lire les pièces centrales en entier.** Un `grep` ne trouve que les symptômes
   qu'on a déjà imaginés ; les défauts les plus coûteux se voient en lisant un
   fichier de bout en bout, parce qu'ils sont dans ce qui **manque** ou dans la
   contradiction entre deux passages éloignés.
5. **Balayer les familles** ci-dessous, une par une, plutôt qu'au fil de la
   lecture : c'est ce qui rend la passe reproductible par quelqu'un d'autre.
6. **Prouver** — voir la règle ci-dessous. C'est le cœur de la recipe.
7. **Déposer** — ticket ou candidat, classés par valeur, puis **s'arrêter**.

### Repérage — deux commandes qui font l'étape 3

Génériques (aucune hypothèse de langage), à adapter aux extensions du dépôt :

```bash
# Taille : ce qui est gros concentre le risque — lire les premiers de cette liste.
find <périmètre> -name '*.<ext>' | xargs wc -l | sort -rn | head -20

# Angle mort : les fichiers de source sans fichier de test au nom correspondant.
comm -23 \
  <(find <source> -name '*.<ext>' -exec basename {} .<ext> \; | sort) \
  <(find <tests>  -name '*.<ext>' -exec basename {} \; | sed 's/\..*//' | sort -u)
```

La centralité, elle, se lit dans les **imports** : le fichier importé par tout le
monde mérite une lecture même s'il est court.

## La règle de preuve (le cœur)

**Rien n'entre dans un ticket sans reproduction** : un test jetable, une sonde, une
mesure. Une lecture, même attentive, produit une *hypothèse* — et une hypothèse
écrite au présent dans un ticket devient un faux positif que quelqu'un ira corriger
pour rien.

Voir [debug-empirically](debug-empirically.md) pour la méthode. En pratique :

- écrire le test qui **échoue** avant correction, ou la sonde qui affiche la valeur
  fautive ;
- citer dans le ticket **la mesure**, pas l'impression (« l'enveloppe atteint 1216
  au lieu de 130 », pas « l'enveloppe semble trop grande ») ;
- si la mesure contredit l'hypothèse, **c'est la mesure qui gagne** — et le ticket
  change de sujet.

## Les familles de défauts

Chaque famille est décrite par son **symptôme**, pas par un langage ou une API. La
colonne de droite renvoie à un cas réellement rencontré dans ce dépôt : elle est
là pour prouver que la famille n'est pas théorique, et se remplace en cas de
réutilisation ailleurs.

| Famille | Symptôme à chercher | Vu ici |
|---|---|---|
| **Code mort** | champ jamais assigné, branche inatteignable, argument passé mais ignoré par la signature | `2026-07-26_14-25` |
| **Bug silencieux** | coercition involontaire (concaténation là où on attend une addition), sélecteur qui ne peut jamais matcher, appel sans argument, comparaison toujours fausse | `2026-07-26_14-19`, `14-21`, `14-26` |
| **Ressource jamais rendue** | créée à l'entrée, jamais détachée ni annulée à la sortie (nœuds, timers, écouteurs, boucles d'animation) | `2026-07-26_14-18`, `14-24` |
| **Donnée variable traitée comme stable** | une valeur qui change toute seule (libellé, horodatage, uptime) utilisée comme empreinte ou comme clé | `2026-07-26_18-00` |
| **Dépendance à l'historique** | même état, deux comportements selon le chemin parcouru pour y arriver | `2026-07-26_18-55` |
| **Duplication d'autorité** | deux endroits calculent la même chose ; ils divergeront | `2026-07-26_14-26` |
| **Angle mort de test** | pièce centrale non couverte ; **ou** double de test qui ne reproduit pas la variabilité du réel — un mock trop stable rend une famille entière de bugs invisible | `2026-07-26_14-31`, `18-35` |
| **Doc qui ment** | la doc ou la JSDoc décrit un comportement que le code n'a plus | `2026-07-26_18-00` |
| **Frontière contournée** | les règles d'architecture du projet ne sont pas respectées (dépendances à sens unique, points d'entrée imposés) | voir les règles d'architecture du dépôt |

## Trier avant de déposer

Un défaut trouvé n'est pas un ticket dû. Appliquer la même barre que
[follow-up-triage](workflow/follow-up-triage.md) :

- **preuve** — reproduit, pas supposé ;
- **coût du non-fait** — qu'est-ce qui casse si on ne le corrige jamais ? « Rien de
  perceptible » → ne pas déposer ;
- **doublon** — déjà au board (y compris en `080-done`) → ne pas déposer.

Puis classer par valeur : un ticket qui décrit un bug **mesuré** passe devant un
ticket de confort. Et dire, dans le rendu, **ce qui n'a pas été regardé**.
