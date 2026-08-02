# Le payload de collision ne dit pas la même chose au début et à la fin

- **Origine** : 2026-08-02_19-30
- **Constat** : mesuré en câblant le catalogue. Sur un **début** de contact, les
  deux éléments reçoivent le **détecteur** dans `element` (`CollisionSystem`
  passe le même payload aux deux) ; sur une **fin**, chacun se reçoit **lui-même**.
  Un abonné qui lit `event.element` obtient donc deux choses différentes selon la
  phase. L'enveloppe ajoute `source`, sans ambiguïté, mais les clés historiques
  restent — et restent contradictoires. Documenté en ⚠️ dans `engine.md §9`.
- **Coût du non-fait** : aucune régression aujourd'hui (rien ne lit ces clés hors
  de la démo). Mais c'est un piège posé pour le premier système qui fera « qui a
  touché qui » — soit exactement le système de dégâts que les projectiles
  appellent. La décision : aligner les deux phases (changement de contrat, à
  écrire), ou déprécier `element`/`target` au profit de `source`/`target`.
