# Recipe — évaluer la qualité d'un ticket

**Quand** : à la création / spécification d'un ticket, ou avant de le prendre — pour
confirmer qu'il est **actionnable**. Aussi pour reviewer le ticket d'un autre.

> ⚠️ **Une seule passe.** On évalue une fois, on conseille une fois — **pas de
> ré-évaluation** après application. Un ticket est un **bon de travail**, pas une
> œuvre : la barre est « **actionnable** », pas « parfait ». Dès qu'elle est
> atteinte → **STOP**.

## La barre : « actionnable » (condition d'arrêt)

Un ticket est **PRÊT** dès que ces trois-là tiennent — inutile d'aller plus loin :

1. **Objectif clair** : le *quoi* + le *pourquoi*.
2. **DoD vérifiable** : des critères concrets qu'on peut cocher sans ambiguïté.
3. **Frontmatter conforme** : `type` dans l'enum, titre parlant, `id` / `created`.

Le reste (specs riches, schéma, liens exhaustifs) est **bonus, à doser** selon les
enjeux — son absence ne recale pas un ticket trivial.

## Évaluer (une passe)

Parcourir la rubrique, noter chaque point **OK** / **à ajuster** :

| Critère | OK si… |
|---|---|
| Frontmatter | `type` valide, titre clair, `id` / `created` présents |
| Objectif | *quoi* + *pourquoi*, sans jargon flou |
| Spécifications | **dosées** : fonctionnel / technique présents *si la tâche le mérite* (voir [ticket-specify](workflow/ticket-specify.md)) |
| Definition of Done | critères **concrets et vérifiables** — le cœur |
| Contexte / liens | pointeurs justes (fichiers, docs), sans viser l'exhaustif |

## Sortie : un verdict + des conseils **classés**

Rendre **un** verdict et, au besoin, des suggestions triées en **deux paniers** :

- **🔴 Bloquant** — empêche de démarrer (ex. DoD non vérifiable, objectif absent).
  À corriger **avant** de prendre le ticket.
- **🟡 Optionnel** — améliorerait le ticket mais **ne bloque pas**. **N'impose aucun
  nouveau tour** : l'auteur applique ou non, puis on **avance**.

Verdict :

- **✅ Prêt** — la barre est atteinte. **On s'arrête**, même s'il reste des 🟡.
- **⚠️ À ajuster** — au moins un 🔴. Corriger **les 🔴 seulement**, puis c'est prêt —
  on **ne ré-évalue pas**.

## Anti-boucle (le garde-fou)

- **Jamais** de deuxième passe d'évaluation sur le même ticket.
- On corrige **les bloquants**, pas les optionnels, avant de démarrer.
- Un ticket « juste actionnable » est **fini**. Le raffiner davantage, c'est du
  gold-plating : ça se fait *pendant* le travail ([ticket-specify](workflow/ticket-specify.md)
  / [ticket-work](workflow/ticket-work.md)), pas en boucle ici.
