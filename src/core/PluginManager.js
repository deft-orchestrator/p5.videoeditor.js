/**
 * @class PluginManager
 * @description Manages the registration and validation of all plugins.
 */
export class PluginManager {
  constructor() {
    /**
     * @type {Array<object>}
     */
    this.plugins = [];
  }

  /**
   * @method register
   * @description Registers and validates a plugin.
   * @param {object} plugin - The plugin object to register.
   * @property {string} plugin.name - The name of the plugin.
   * @property {string} plugin.type - The type of the plugin (e.g., 'effect', 'transition').
   * @property {function} plugin.onLoad - The function to be called when the plugin is loaded.
   */
  register(plugin) {
    if (!plugin) {
      console.warn('Invalid plugin: Plugin object is null or undefined.');
      return;
    }

    if (typeof plugin.name !== 'string' || plugin.name.trim() === '') {
      console.warn(
        'Invalid plugin: "name" must be a non-empty string.',
        plugin
      );
      return;
    }

    if (typeof plugin.type !== 'string' || plugin.type.trim() === '') {
      console.warn(
        'Invalid plugin: "type" must be a non-empty string.',
        plugin
      );
      return;
    }

    if (typeof plugin.onLoad !== 'function') {
      console.warn('Invalid plugin: "onLoad" must be a function.', plugin);
      return;
    }

    if (this.plugins.some((p) => p.name === plugin.name)) {
      console.warn(`Plugin with name "${plugin.name}" is already registered.`);
      return;
    }

    this.plugins.push(plugin);
  }
}
