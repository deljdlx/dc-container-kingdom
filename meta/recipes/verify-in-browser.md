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
boucle à la main**.

**Sans toucher au code** : le moteur est servi en modules ES, donc le ré-importer
depuis la console rend **le même module** — et avec lui l'application courante.
Plus de `window.__vp` à poser puis à oublier :

```js
const { Application } = await import('/engine/index.js');  // racine vite = src/
const app = Application.mainInstance;
const vp = app.getViewport();
const clock = app.getClock();

let t = 100000;                        // horloge à soi : le rAF réel fausserait le dt
vp.press('down'); vp.press('right');   // en diagonale
for (let i = 0; i < 40; i++) { t += 16; vp.update(t); }   // ~40 frames à 16 ms
```

`vp.update(t)` est **le même chemin** que celui appelé par rAF → vérification
fidèle.

## L'horloge, pour observer

`app.getClock()` est la source unique du temps de jeu, et elle sert à mesurer :

```js
clock.pause();        // fige le monde — la frame se peint quand même
clock.scale(0.25);    // ralenti : tout ralentit du même facteur, particules comprises
clock.step(16);       // avancer d'une frame sans passer par le viewport
clock.now();          // temps de JEU écoulé (figé en pause) — c'est aussi le `at` des events
```

Dans la démo, `p` met en pause et `s` fait tourner l'échelle (×1 → ×0,25 → ×2) :
de quoi voir à l'œil ce qu'une mesure affirme.

Voir aussi `../documentation/development.md` et [`agents/workflow.md`](../agents/workflow.md).
