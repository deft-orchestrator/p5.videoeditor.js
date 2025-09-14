import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { PluginManager } from '../../src/core/PluginManager.js';

describe('PluginManager', () => {
  let pluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
  });

  test('should be instantiated correctly', () => {
    expect(pluginManager).toBeInstanceOf(PluginManager);
    expect(pluginManager.plugins).toEqual([]);
  });

  test('should register a new plugin', () => {
    const mockPlugin = { name: 'TestPlugin', type: 'test', onLoad: () => {} };
    pluginManager.register(mockPlugin);
    expect(pluginManager.plugins.length).toBe(1);
    expect(pluginManager.plugins[0]).toBe(mockPlugin);
  });

  test('should not register a plugin without a name', () => {
    const mockPlugin = { type: 'test', onLoad: () => {} };
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    pluginManager.register(mockPlugin);

    expect(pluginManager.plugins.length).toBe(0);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid plugin: "name" must be a non-empty string.',
      mockPlugin
    );

    consoleWarnSpy.mockRestore();
  });

  test('should not register a plugin without an onLoad function', () => {
    const mockPlugin = { name: 'TestPlugin', type: 'test' };
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    pluginManager.register(mockPlugin);

    expect(pluginManager.plugins.length).toBe(0);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid plugin: "onLoad" must be a function.',
      mockPlugin
    );

    consoleWarnSpy.mockRestore();
  });

  test('should not register the same plugin twice', () => {
    const mockPlugin = { name: 'TestPlugin', type: 'test', onLoad: () => {} };
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    pluginManager.register(mockPlugin);
    pluginManager.register(mockPlugin); // Attempt to register again

    expect(pluginManager.plugins.length).toBe(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Plugin with name "TestPlugin" is already registered.'
    );

    consoleWarnSpy.mockRestore();
  });
});
