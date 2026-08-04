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
export { Application } from './Application.js';
export { Viewport } from './view/Viewport.js';
export { Camera } from './view/Camera.js';
export { Board } from './world/Board.js';
export { Area } from './world/Area.js';
export { Element } from './scene/Element.js';
export { SpriteElement } from './scene/SpriteElement.js';
export { Character } from './character/Character.js';
export { Geometry } from './scene/Geometry.js';
export { Coordinates } from './scene/Coordinates.js';
export { BoundingBox } from './scene/BoundingBox.js';

// --- Viewport subsystems (composed by Viewport) ---
export { DirectionalInput } from './view/DirectionalInput.js';
export { ViewportTransform } from './view/ViewportTransform.js';


// --- FX: particles and emitters ---
export { ParticleSystem } from './fx/ParticleSystem.js';
export { ParticleLayer } from './fx/ParticleLayer.js';
export { Emitter } from './fx/Emitter.js';
export { FxBinder } from './fx/FxBinder.js';
export { FountainSpray } from './fx/FountainSpray.js';
export { FootstepDust } from './fx/FootstepDust.js';

// --- Events: the bus, its catalogue and its envelope ---
export { EventEmitter } from './events/EventEmitter.js';
export {
  EngineEvents,
  collisionEventName,
  engineEventNames,
  makeEvent,
} from './events/EngineEvents.js';

// --- Element subsystems (composed by Element) ---
export { CollisionSystem } from './scene/CollisionSystem.js';
export { SceneGraph } from './scene/SceneGraph.js';

// --- Asking the world what is where (no need to be part of it) ---
export { queryRect, sweepRect } from './scene/WorldQuery.js';

// --- Character subsystems (composed by Character) ---
export { CharacterAnimator } from './character/CharacterAnimator.js';
export { CharacterBehavior } from './character/CharacterBehavior.js';
export { PatrolBehavior } from './character/PatrolBehavior.js';
export { FleeBehavior } from './character/FleeBehavior.js';

// --- Renderers ---
export { Renderer, DEPTH_BASE, FX_DEPTH, GROUND_FX_DEPTH } from './render/Renderer.js';
export { SpriteRenderer } from './render/SpriteRenderer.js';
export { BoardRenderer } from './render/BoardRenderer.js';
export { AreaRenderer } from './render/AreaRenderer.js';
export { ViewportRenderer } from './render/ViewportRenderer.js';
export { CharacterRenderer } from './render/CharacterRenderer.js';
export { MainCharacterRenderer } from './render/MainCharacterRenderer.js';

// --- Built-in map elements ---
export { House00 } from './content/House00.js';
export { House01 } from './content/House01.js';
export { Ground00 } from './content/Ground00.js';
export { Tree00 } from './content/Tree00.js';
export { Sunflower00 } from './content/Sunflower00.js';
export { Fountain00 } from './content/Fountain00.js';
export { Fence00H } from './content/Fence00H.js';
export { Fence00V } from './content/Fence00V.js';
export { FenceGroup00 } from './content/FenceGroup00.js';

// --- Built-in map elements: curated autonomous sprites from `map-sprites-01` ---
export * from './content/MapSprites01/index.js';

// --- Built-in map elements: curated autonomous vegetation from `map-sprites-02` ---
export * from './content/MapSprites02/index.js';

// --- Built-in map elements: the `flowers-00` sprite sheet ---
// 219 elements (flowers, mushrooms, foliage, water plants, fields, props),
// named `<Family><NN>` — see content/Flowers/index.js.
export * from './content/Flowers/index.js';

// --- Built-in character bases ---
export { Man00 } from './content/CharacterBases/Man00.js';
export { Man01 } from './content/CharacterBases/Man01.js';
export { Man02 } from './content/CharacterBases/Man02.js';
export { Man03 } from './content/CharacterBases/Man03.js';
export { Man04 } from './content/CharacterBases/Man04.js';
export { Woman00 } from './content/CharacterBases/Woman00.js';
export { Woman01 } from './content/CharacterBases/Woman01.js';
export { Woman02 } from './content/CharacterBases/Woman02.js';

// --- Tools ---
export { GameConsole } from './tools/GameConsole.js';
export { EventConsole } from './tools/EventConsole.js';
