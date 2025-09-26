import BlurEffect from '../effects/BlurEffect.js';

/**
 * @constant BlurEffectPlugin
 * @description The plugin object that allows the BlurEffect to be registered with the editor.
 * This makes the 'blur' effect type available for use on clips.
 */
export const BlurEffectPlugin = {
  name: 'BlurEffect',
  type: 'effect',
  onLoad: (timeline) => {
    // Note: We register the class constructor, not an instance.
    // The timeline will instantiate it when a user adds the effect.
    timeline.registerEffectType('blur', BlurEffect);
  },
};