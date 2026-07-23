# 🗺️ Mini RPG engine

A small, framework-free engine that renders a tiled RPG-style map — a scrolling
board, positioned elements, animated characters, collisions and events — into a
DOM container. It has **no knowledge of the app that embeds it** (no Docker /
Container Kingdom concepts); Container Kingdom is just one host application.

## Boundary

- Dependencies flow **app → engine only**. The engine imports nothing from
  `container-kingdom/`.
- The engine owns its assets under `engine/css/` and `engine/images/`.
- Everything a host needs is re-exported from **`engine/index.js`** — import from
  there, never reach into individual files.

## Usage

```js
import { Application, House00, Man00 } from '../engine/index.js';

const app = new Application('#viewport', 900, 900);
const area = app.getViewport().getBoard().getAreaAt(0, 0);

area.addElement(150, 150, new House00());
area.addElement(300, 300, new Man00());

app.getViewport().render();
```

Load the engine styles once in the host page:

```html
<link rel="stylesheet" href="engine/css/reset.css">
<link rel="stylesheet" href="engine/css/_variables.css">
<link rel="stylesheet" href="engine/css/map.css">
<link rel="stylesheet" href="engine/css/character.css">
<!-- optional: engine/css/map-debug.css to visualise grid & bounding boxes -->
```

## Structure

- `map/` — core: `Element` (scene node) and its composed subsystems
  (`SceneGraph`, `CollisionSystem`, `EventEmitter`, `Geometry`), plus `Board`,
  `Area`, `Viewport`, `Character`, `Application` and the `Renderer/` classes.
- `map/Elements/` — built-in sprites (houses, trees, fences, fountain, flowers)
  and `CharacterBases/` (character sprite sheets).
- `tools/` — helpers such as `GameConsole`.
- `css/`, `images/` — engine styles and sprite sheets.

## Known limitation

Sprite image paths are currently hard-coded relative to the serving root
(`engine/images/…`). To embed the engine under a different base path, that would
need to become configurable — a good next step toward full portability.
