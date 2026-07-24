# Recipe — vérifier au navigateur

Pour valider un rendu / un comportement de jeu (pas seulement `npm run verify`).

## Étapes

1. **Lancer** `npm run dev` (ou un port frais : `npx vite --port 54xx --strictPort`
   — un service worker en cache peut servir la mauvaise app sur un port réutilisé).
2. Ouvrir la **démo moteur** : `http://localhost:<port>/engine/demo/`
   (⚠️ l'URL **doit finir par `/`**, sinon le fallback SPA sert l'app).
3. **Debug visuel** : ajouter `?debug=1` → zones de **collision (jaune)** et
   **trigger (cyan)**, bounding boxes, et **magenta au contact**.
4. Contrôler **0 erreur console**.

## Le piège rAF (important)

La game loop tourne sur `requestAnimationFrame` : **rAF est en pause quand
l'onglet est en arrière-plan** → joueur et PNJ **gèlent**, et une sonde qui
`await` un rAF **timeout**. Pour vérifier de façon déterministe, **piloter la
boucle à la main** :

1. Exposer temporairement le viewport dans `src/engine/demo/demo.js` :
   `window.__vp = viewport;` — **à RETIRER avant de committer** (0 résidu de debug).
2. Dans la console (ou via l'automation), avancer la boucle :
   ```js
   const vp = window.__vp;
   let t = performance.now();
   vp.moving = 1; vp.direction = 'down'; vp.getCharacter().setDirection('down');
   for (let i = 0; i < 40; i++) { t += 16; vp.update(t); } // ~40 frames à 16 ms
   ```
   `vp.update(t)` est **le même chemin** que celui appelé par rAF → vérification
   fidèle.

Voir aussi `../../documentation/development.md` et [`agents/workflow.md`](../../agents/workflow.md).
