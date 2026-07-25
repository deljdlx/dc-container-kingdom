---
id: 2026-07-25_13-27
title: Recipe — auditer la cohérence des specs de workflow
type: docs
branch:
created: 2026-07-25 13:27
ready: 2026-07-25 13:30
doing:
verify:
done:
---

## Objectif

Après toute évolution du workflow (colonnes, recipes, TEMPLATE, règles agent,
fichiers d'entrée), rien ne garantit que l'ensemble reste **cohérent et à jour** :
c'est vérifié à la main (link-check, grep de chemins stale, relecture croisée), et
des références stale ont déjà survécu — ex. cette session, `project/040-doing/`
resté sans le segment `workflow/`, invisible au link-check car en prose.

On veut une **recipe de méthode agent** décrivant une **passe d'audit
reproductible** : un agent la suit pour confirmer que recipes, board README, règles
agent, fichiers d'entrée et TEMPLATE **s'accordent** (mêmes noms de colonnes,
chemins, cycle, topologie git), que **tous les liens résolvent** et qu'**aucune
référence n'est stale**. Pourquoi : garder la doc-agent auto-cohérente sans
relecture manuelle à chaque changement.

## Spécifications

Créer `meta/agents/recipes/audit-workflow-consistency.md` (recipe de méthode) et
l'indexer dans `meta/agents/recipes/README.md`. Structure :

- **Quand / but** : après toute évolution du workflow ; confirmer cohérence + à-jour.
- **Périmètre** : recipes de cycle (`recipes/workflow/*`) et de méthode (`recipes/*`),
  board (`meta/README.md`, `TEMPLATE.md`, colonnes), règles agent
  (`conventions`/`workflow`/`engine-boundary`), fichiers d'entrée (CLAUDE/AGENTS/copilot).
- **Contrôles**, chacun avec sa commande copiable quand c'est mécanique :
  1. **Liens** — tout lien markdown relatif résout (script link-check).
  2. **Références stale** — aucun chemin périmé, **y compris en prose/code-spans**
     (que le link-check ne voit pas) : anciens noms de dossier/colonne, colonnes
     sans le segment `workflow/` (grep de motifs à risque).
  3. **@imports** — les `@…` de `CLAUDE.md` pointent des fichiers existants.
  4. **Cohérence inter-fichiers** (lecture) — mêmes noms/ordre de colonnes partout ;
     cycle + topologie git sans formulation contradictoire ; entrées alignées.
  5. **TEMPLATE ↔ recipes** (lecture) — frontmatter (`ready/doing/verify/done`) et
     sections Journal correspondent aux transitions décrites.
- **Sortie** : rapport court (par contrôle : ✅/❌ + détail). Incohérence → corriger
  dans le même change, ou déposer un ticket si hors périmètre.

Les contrôles mécaniques (1–3) pourront migrer plus tard vers un script
`meta/agents/tools/` ; la recipe reste la source de vérité de la procédure.

## Contexte / liens

- Emplacement proposé : `meta/agents/recipes/` (recipe de **méthode**, à côté de
  `review-changes.md` / `verify-a-change.md`) — pas dans `recipes/workflow/` (qui
  contient les étapes du cycle).
- Artefacts à couvrir : `meta/agents/recipes/workflow/*`, `meta/workflow/TEMPLATE.md`,
  `meta/README.md`, `meta/agents/{conventions,workflow,engine-boundary}.md`,
  `CLAUDE.md` / `AGENTS.md` / `.github/copilot-instructions.md`.
- Peut s'appuyer sur un futur script dans `meta/agents/tools/` (link-check,
  grep de chemins stale) pour automatiser les contrôles mécaniques.

## Definition of Done

- [ ] Recipe `audit-workflow-consistency.md` créée dans `meta/agents/recipes/` et
      indexée dans son `README.md`.
- [ ] Couvre les 5 contrôles : liens, références stale (prose incluse), @imports,
      cohérence inter-fichiers, TEMPLATE ↔ recipes.
- [ ] Contrôles mécaniques (liens/stale/@imports) fournis en commandes copiables.
- [ ] Dogfood : la recipe passée sur le repo actuel → rapport propre (ou écarts
      corrigés / ticketés).

## Journal

### Travail

-

### Vérification

-

### Validation

-
