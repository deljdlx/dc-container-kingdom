/**
 * Public API of the mini RPG engine.
 *
 * A host application drives the engine through these exports and never reaches
 * into individual files. The engine knows nothing about the app that embeds it
 * (no Docker/Container Kingdom concepts) — it only renders a tiled map, its
 * elements and characters into a DOM container.
 *
 * @example
 *   import { Application, House00, Man00 } from '../engine/index.js';
 *   const app = new Application('#viewport', 900, 900);
 */

// --- Configuration ---
export { setAssetsBase, getAssetsBase, assetUrl } from './assets.js';
export { applyDebugFlag, isDebugEnabled } from './debug.js';

// --- Core ---
export { Application } from './map/Application.js';
export { Viewport } from './map/Viewport.js';
export { Camera } from './map/Camera.js';
export { Board } from './map/Board.js';
export { Area } from './map/Area.js';
export { Element } from './map/Element.js';
export { SpriteElement } from './map/SpriteElement.js';
export { Character } from './map/Character.js';
export { Geometry } from './map/Geometry.js';
export { Coordinates } from './map/Coordinates.js';
export { BoundingBox } from './map/BoundingBox.js';

// --- Element subsystems (composed by Element) ---
export { EventEmitter } from './map/EventEmitter.js';
export { CollisionSystem } from './map/CollisionSystem.js';
export { SceneGraph } from './map/SceneGraph.js';

// --- Character subsystems (composed by Character) ---
export { CharacterAnimator } from './map/CharacterAnimator.js';
export { CharacterBehavior } from './map/CharacterBehavior.js';
export { PatrolBehavior } from './map/PatrolBehavior.js';
export { FleeBehavior } from './map/FleeBehavior.js';

// --- Renderers ---
export { Renderer } from './map/Renderer/Renderer.js';
export { SpriteRenderer } from './map/Renderer/SpriteRenderer.js';
export { BoardRenderer } from './map/Renderer/BoardRenderer.js';
export { AreaRenderer } from './map/Renderer/AreaRenderer.js';
export { ViewportRenderer } from './map/Renderer/ViewportRenderer.js';
export { CharacterRenderer } from './map/Renderer/CharacterRenderer.js';
export { MainCharacterRenderer } from './map/Renderer/MainCharacterRenderer.js';

// --- Built-in map elements ---
export { House00 } from './map/Elements/House00.js';
export { House01 } from './map/Elements/House01.js';
export { Ground00 } from './map/Elements/Ground00.js';
export { Tree00 } from './map/Elements/Tree00.js';
export { Sunflower00 } from './map/Elements/Sunflower00.js';
export { Fountain00 } from './map/Elements/Fountain00.js';
export { Fence00H } from './map/Elements/Fence00H.js';
export { Fence00V } from './map/Elements/Fence00V.js';
export { FenceGroup00 } from './map/Elements/FenceGroup00.js';

// --- Built-in map elements: the `flowers-00` sprite sheet ---
// 219 elements (flowers, mushrooms, foliage, water plants, fields, props),
// named `<Family><NN>` — see map/Elements/Flowers/index.js.
export * from './map/Elements/Flowers/index.js';

// --- Built-in character bases ---
export { Man00 } from './map/Elements/CharacterBases/Man00.js';
export { Man01 } from './map/Elements/CharacterBases/Man01.js';
export { Man02 } from './map/Elements/CharacterBases/Man02.js';
export { Man03 } from './map/Elements/CharacterBases/Man03.js';
export { Man04 } from './map/Elements/CharacterBases/Man04.js';
export { Woman00 } from './map/Elements/CharacterBases/Woman00.js';
export { Woman01 } from './map/Elements/CharacterBases/Woman01.js';
export { Woman02 } from './map/Elements/CharacterBases/Woman02.js';

// --- Tools ---
export { GameConsole } from './tools/GameConsole.js';
