# Stratégie de topologie des routes réseau

- **Origine** : 2026-07-27_17-37
- **Constat** : le bug de superposition est corrigé, mais le tracé reste une chaîne dépendante de l'ordre API (`[0]→[1]→...`) qui repasse souvent sur de longs segments.
- **Coût du non-fait** : les routes restent visuellement peu lisibles sur les grands réseaux, avec des détours inutiles qui occupent beaucoup d'espace malgré la déduplication.
