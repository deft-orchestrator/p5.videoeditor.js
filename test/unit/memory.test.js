import { jest } from '@jest/globals';
import MemoryManager from '../../src/utils/MemoryManager.js';

describe('MemoryManager', () => {
  let memoryManager;
  let consoleLogSpy;

  beforeEach(() => {
    memoryManager = new MemoryManager();
    // Spy on console.log before each test to keep test output clean
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore the original console.log after each test
    consoleLogSpy.mockRestore();
  });

  test('should be instantiated with an empty cache', () => {
    expect(memoryManager.cache.size).toBe(0);
    expect(memoryManager.enabled).toBe(true);
  });

  test('should add and retrieve an asset from the cache', () => {
    const asset = { id: 'test-image', data: '...' };
    memoryManager.addAsset('asset1', asset);
    expect(memoryManager.cache.size).toBe(1);
    expect(memoryManager.getAsset('asset1')).toBe(asset);
  });

  test('should return undefined for a non-existent asset key', () => {
    expect(memoryManager.getAsset('non-existent-key')).toBeUndefined();
  });

  test('should clear only unused assets from the cache', () => {
    memoryManager.addAsset('asset_to_keep_1', 'data1');
    memoryManager.addAsset('asset_to_remove', 'data2');
    memoryManager.addAsset('asset_to_keep_2', 'data3');

    memoryManager.clearUnusedAssets(['asset_to_keep_1', 'asset_to_keep_2']);

    expect(memoryManager.cache.size).toBe(2);
    expect(memoryManager.getAsset('asset_to_remove')).toBeUndefined();
    expect(memoryManager.getAsset('asset_to_keep_1')).toBe('data1');
  });

  test('should not clear any assets if all are marked as active', () => {
    memoryManager.addAsset('asset1', 'data1');
    memoryManager.addAsset('asset2', 'data2');

    memoryManager.clearUnusedAssets(['asset1', 'asset2']);

    expect(memoryManager.cache.size).toBe(2);
  });

  test('should clear all assets from the cache when clearAll is called', () => {
    memoryManager.addAsset('asset1', 'data1');
    memoryManager.addAsset('asset2', 'data2');

    memoryManager.clearAll();

    expect(memoryManager.cache.size).toBe(0);
  });

  test('should not add assets to the cache when disabled', () => {
    memoryManager.disable();
    memoryManager.addAsset('asset1', 'data1');
    expect(memoryManager.cache.size).toBe(0);
  });

  test('should not clear assets from the cache when disabled', () => {
    memoryManager.addAsset('asset1', 'data1');
    memoryManager.addAsset('asset2', 'data2');

    memoryManager.disable();
    memoryManager.clearUnusedAssets(['asset1']);

    expect(memoryManager.cache.size).toBe(2);
  });
});
