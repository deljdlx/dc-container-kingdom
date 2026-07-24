## Résumé

- 

## Type de changement

- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] docs
- [ ] test
- [ ] chore

## Checklist qualité

- [ ] `npm run verify` passe en local
- [ ] Je n'ai pas utilisé `git add -A` ni `git add .`
- [ ] J'ai respecté la frontière app -> moteur (`src/container-kingdom/` vers `src/engine/` uniquement)

## Impact documentation

- [ ] Changement sans impact doc (pas de changement d'architecture/comportement/API/commande/convention)
- [ ] Documentation mise à jour dans ce même changement (si impact)

Documents vérifiés/mis à jour si nécessaire :

- [ ] `documentation/architecture.md`
- [ ] `documentation/engine.md`
- [ ] `documentation/container-kingdom.md`
- [ ] `documentation/development.md`
- [ ] `README.md`
- [ ] `src/engine/README.md`
- [ ] JSDoc de l'API touchée
- [ ] Règles agent à jour : source `agents/` + les 3 points d'entrée (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`)

## Vérifications exécutées

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm test`

## Notes de validation manuelle (si pertinent)

- 