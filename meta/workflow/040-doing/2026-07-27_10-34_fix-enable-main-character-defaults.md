---
id: 2026-07-27_10-34
title: `enableMainCharacter()` sans arguments ne centre pas le joueur
type: fix
branch: copilot/fix-enable-main-character-defaults
created: 2026-07-27 10:34
ready: 2026-07-27 17:25
doing: 2026-07-27 17:25
verify:
done:
---

## Objectif

Corriger l'API `Viewport.enableMainCharacter()` pour qu'un appel **sans
arguments** place bien le personnage principal au centre du viewport, comme
l'annonce sa JSDoc. Aujourd'hui, l'appel sans arguments laisse `x`/`y` à
`null`, ce qui produit un état silencieusement invalide et décale la caméra.

## Spécifications

- Traiter l'absence d'arguments (`undefined`) comme le cas documenté : défaut à
  `width() / 2` et `height() / 2`.
- Ajouter une preuve automatisée qui échoue avant correction :
  `enableMainCharacter()` sans arguments doit placer le personnage au centre.
- Vérifier l'effet visible associé : la caméra suit ce point centré plutôt qu'un
  personnage à coordonnées `null`.
- Mettre à jour la doc/JSDoc seulement si le comportement retenu change.

## Contexte / liens

- Code : `src/engine/map/Viewport.js`
- Démo moteur : `src/engine/demo/demo.js` appelle aujourd'hui la méthode avec
  des coordonnées explicites, donc masque le défaut.
- Preuve mesurée pendant l'audit :

```bash
node --input-type=module -e "import { JSDOM } from 'jsdom'; const dom=new JSDOM('<div id=app></div>'); globalThis.window=dom.window; globalThis.document=dom.window.document; const { Viewport } = await import('./src/engine/map/Viewport.js'); let viewport; const app={handle(){}, getViewport(){return viewport;}}; viewport=new Viewport(app, document.querySelector('#app'), 500, 300); viewport.enableMainCharacter(); viewport.getCamera().update(); console.log(JSON.stringify({character:{x:viewport.getCharacter().x(),y:viewport.getCharacter().y()}, camera:{x:viewport.getCamera().x(),y:viewport.getCamera().y()}}));"
```

Résultat observé :

```json
{"character":{"x":null,"y":null},"camera":{"x":-226,"y":-126}}
```

Le centre attendu pour un viewport `500×300` est `x = 250`, `y = 150`.

## Definition of Done

- [ ] `Viewport.enableMainCharacter()` centre bien le joueur quand aucun argument
      n'est fourni.
- [ ] Un test couvre explicitement l'appel sans arguments.
- [ ] `npm run verify` passe.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
