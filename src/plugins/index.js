import { BlurEffectPlugin } from './BlurEffectPlugin.js';
import { CrossFadeTransitionPlugin } from './CrossFadeTransitionPlugin.js';
import { FadeInEffectPlugin } from './FadeInEffectPlugin.js';
import { FadeOutEffectPlugin } from './FadeOutEffectPlugin.js';
import { WiggleEffectPlugin } from './WiggleEffectPlugin.js';

/**
 * @namespace BuiltInPlugins
 * @description A collection of the default plugins included with the library.
 * This array is automatically loaded by the Timeline at initialization.
 */
export const builtInPlugins = [
  // GPU Effects
  BlurEffectPlugin,

  // CPU Effects
  FadeInEffectPlugin,
  FadeOutEffectPlugin,
  WiggleEffectPlugin,

  // Transitions
  CrossFadeTransitionPlugin,
];