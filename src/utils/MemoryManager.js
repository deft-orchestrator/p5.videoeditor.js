/**
 * @class MemoryManager
 * @description Manages memory by caching assets and providing methods to clear unused ones.
 */
class MemoryManager {
  /**
   * @constructor
   */
  constructor() {
    this.cache = new Map();
    this.enabled = true;
  }

  /**
   * @method addAsset
   * @description Adds an asset to the cache.
   * @param {string} key - The unique key for the asset (e.g., image URL or asset ID).
   * @param {*} asset - The asset to be cached.
   */
  addAsset(key, asset) {
    if (!this.enabled) return;
    this.cache.set(key, asset);
    console.log(`Asset added to cache: ${key}`);
  }

  /**
   * @method getAsset
   * @description Retrieves an asset from the cache.
   * @param {string} key - The key of the asset to retrieve.
   * @returns {*} The cached asset, or undefined if the key does not exist.
   */
  getAsset(key) {
    return this.cache.get(key);
  }

  /**
   * @method clearUnusedAssets
   * @description Removes assets from the cache that are not present in the provided list of active asset keys.
   * @param {string[]} activeAssetKeys - An array of keys for assets that are currently active or required.
   */
  clearUnusedAssets(activeAssetKeys) {
    if (!this.enabled) return;
    const activeKeysSet = new Set(activeAssetKeys);
    let clearedCount = 0;
    for (const key of this.cache.keys()) {
      if (!activeKeysSet.has(key)) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} unused assets from cache.`);
    }
  }

  /**
   * @method clearAll
   * @description Clears the entire asset cache unconditionally.
   */
  clearAll() {
    this.cache.clear();
    console.log('Cleared all assets from cache.');
  }

  /**
   * @method enable
   * @description Enables the memory manager.
   */
  enable() {
    this.enabled = true;
  }

  /**
   * @method disable
   * @description Disables the memory manager. Caching and clearing will be skipped.
   */
  disable() {
    this.enabled = false;
  }
}

export default MemoryManager;
