import {
  describe,
  beforeEach,
  afterEach,
  test,
  expect,
  jest,
} from '@jest/globals';
import ErrorHandler from '../../src/utils/ErrorHandler.js';

describe('ErrorHandler', () => {
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    // Spy on console methods to check if they are called, but also allow them to execute
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original console methods after each test
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  test('critical() should throw an error and log to console.error', () => {
    const errorMessage = 'Something went terribly wrong';

    // Expect the function to throw an error
    expect(() => {
      ErrorHandler.critical(errorMessage);
    }).toThrow(`[p5.videoeditor.js] ${errorMessage}`);

    // Expect console.error to have been called
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      `[p5.videoeditor.js] Critical Error: ${errorMessage}`
    );
  });

  test('warning() should log to console.warn and not throw an error', () => {
    const warnMessage = 'This is just a friendly warning';

    // Expect the function NOT to throw an error
    expect(() => {
      ErrorHandler.warning(warnMessage);
    }).not.toThrow();

    // Expect console.warn to have been called
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      `[p5.videoeditor.js] Warning: ${warnMessage}`
    );
  });

  test('showUserFriendlyError() should log to console.error', () => {
    const error = new Error('A simple error');
    ErrorHandler.showUserFriendlyError(error);

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      `[p5.videoeditor.js] An error occurred: ${error.message}`
    );
  });
});
