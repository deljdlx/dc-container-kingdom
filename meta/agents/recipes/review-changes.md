# Recipe — reviewer un changement

Reviewer un diff / une branche / une PR (par ex. le travail d'un autre agent).

## Étapes

1. **Cerner le périmètre** : `git status`, `git diff`, ou la branche / PR visée
   (`git log --oneline main..<branche>`, `git diff main...<branche> --stat`).
   ⚠️ **Ne pas reviewer pendant que l'agent bosse encore** — s'assurer que le
   working tree est **propre** et que le commit final est présent (sinon on juge un
   état intermédiaire).
2. **Conformité aux règles** (voir [../conventions.md](../conventions.md) et
   [../engine-boundary.md](../engine-boundary.md)) :
   - frontière app → moteur respectée, import moteur via `src/engine/index.js` ;
   - code/JSDoc en anglais, commits/description en français ;
   - **une branche dédiée** (pas `main`), Conventional Commits ;
   - **pas** de mention d'assistance IA, **pas** de `git add -A` ;
   - **doc à jour** si l'archi/API/commandes/conventions ont changé.
3. **Qualité intrinsèque** : correction, découplage / SOLID, pas de code mort ni de
   doublon (ex. réinventer un mock qui existe déjà), tests sur le critique.
4. **Vérifier que ça passe** : `npm run verify` vert ; navigateur si pertinent.
5. **Rapporter franchement** : ce qui est bien, les écarts (avec fichier:ligne), et
   — utile — **si un écart vient de l'agent ou d'un flou dans nos docs** (auquel cas
   corriger la doc/recipe, pas seulement le code).
