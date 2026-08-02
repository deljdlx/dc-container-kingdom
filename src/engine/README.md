# 🗺️ Mini RPG engine

A small, framework-free engine that renders a tiled RPG-style map — a scrolling
board, positioned elements, animated characters, collisions and events — into a
DOM container. It has **no knowledge of the app that embeds it** (no Docker /
Container Kingdom concepts); Container Kingdom is just one host application.

Two standalone local pages ship with the engine:

- [Autonomous demo](http://localhost:5173/engine/demo/) (source: [`engine/demo/`](demo/))
- [Sprites catalog](http://localhost:5173/engine/catalog/)

The catalog now supports family jump links, combinable filters (text + kind +
zones), sorting, and URL-shareable state through query params (`q`, `kind`,
`zone`, `sort`).

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
  (`SceneGraph`, `CollisionSystem`, `Geometry`), plus `Board`, `Area`,
  `Viewport`, `Character`, `Application` and the `Renderer/` classes.
- `events/` — the bus: `EventEmitter` (revocable subscriptions, `onAny`) and
  `EngineEvents` (the catalogue of names and the payload envelope).
- `map/Elements/` — built-in sprites (houses, trees, fences, fountain),
  `MapSprites01/` (curated autonomous trees from `map-sprites-01`: conifers,
  leafy trees, dead trees, saplings),
  `MapSprites02/` (first vegetation lot from `map-sprites-02`: upper-left tree
  silhouettes, stumps and small shrubs),
  `Flowers/` (the whole `flowers-00` sheet: 219 plants, mushrooms, fields and
  props, named `<Family><NN>`) and `CharacterBases/` (eight ready-to-use bases
  from the shared `characters-00.png` sprite sheet).
- `tools/` — helpers such as `GameConsole` and `EventConsole` (a live view of the
  event bus, mounted by the demo under `?debug=1`).
- `css/`, `images/` — engine styles and sprite sheets.

## Configuring asset paths

Sprite sheets resolve to `engine/images/…` by default. To serve them from a
different location (a sub-path, a CDN, a bundler's asset dir), set the base once
before creating the `Application`:

```js
import { setAssetsBase, Application } from '../engine/index.js';

setAssetsBase('/static/rpg-engine/images'); // or 'https://cdn.example.com/rpg'
const app = new Application('#viewport', 900, 900);
```

Engine **CSS** already uses paths relative to `engine/css/`, so it stays portable
as long as `css/` and `images/` move together.
