# Recipe — vérifier un changement

« Terminé » = **vérifié**, pas « ça devrait marcher ».

## Étapes

1. **Vérif automatisée** — `npm run verify` (lint + build + tests) doit passer.
2. **Validation runtime** quand c'est pertinent (rendu, gameplay, comportement
   temps-réel) : valider dans le vrai contexte. Si le système a une **boucle
   temps-réel** dont le timing gêne la vérification, le **piloter de façon
   déterministe** (avancer la boucle à la main) plutôt que subir le timing —
   exemple concret dans [../../recipes/verify-in-browser.md](../../recipes/verify-in-browser.md).
3. **Nettoyer** — retirer tout hook / log temporaire de debug (0 résidu).
4. **Rapporter fidèlement** — un test qui échoue se dit, une étape sautée se dit ;
   ne pas annoncer « fait » sans preuve.
