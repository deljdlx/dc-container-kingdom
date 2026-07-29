# `LogEntry.ansiToHex()` — du code mort qui fabrique du HTML

- **Origine** : `2026-07-29_08-26`
- **Constat** : `ansiToHex(str)` (60 lignes dans `LogEntry.js`) convertit les
  séquences ANSI en `<span style="…">` par concaténation de chaînes. Vérifié au
  `grep` : elle n'est **appelée nulle part**. Le rendu des couleurs, aujourd'hui,
  consiste à **supprimer** les séquences ANSI, pas à les traduire.
- **Coût du non-fait** : ce n'est pas du code mort ordinaire. Il **fabrique du
  HTML à partir du texte brut d'un conteneur** — exactement le trou qu'on vient
  de fermer. Rebranché un jour par quelqu'un qui veut « remettre les couleurs »,
  il le rouvre en une ligne, et les tests de `2026-07-29_08-26` ne le verraient
  pas : ils portent sur le chemin réellement emprunté.
- **Piste** : le supprimer, ou le réécrire en produisant des **nœuds** (un `span`
  par segment, texte en `textContent`) si l'on veut vraiment les couleurs ANSI —
  auquel cas c'est une fonctionnalité, pas un nettoyage, et elle mérite son
  ticket.
