/**
 * @class ErrorHandler
 * @description Provides a centralized way to handle and display errors and warnings.
 */
class ErrorHandler {
  /**
   * Handles critical errors that might stop the execution.
   * Logs the error and throws it to stop the script.
   * @param {string} message - The error message.
   * @param {Error} [originalError] - The original error object.
   */
  static critical(message, originalError) {
    console.error(`[p5.videoeditor.js] Critical Error: ${message}`);
    if (originalError) {
      console.error('Original Error:', originalError);
    }
    throw new Error(`[p5.videoeditor.js] ${message}`);
  }

  /**
   * Handles warnings for non-critical issues.
   * Logs a warning message to the console.
   * @param {string} message - The warning message.
   */
  static warning(message) {
    console.warn(`[p5.videoeditor.js] Warning: ${message}`);
  }

  /**
   * Displays a user-friendly error message.
   * In a real UI, this might show a modal or a notification.
   * For now, it will just log a formatted error.
   * @param {Error} error - The error object to display.
   */
  static showUserFriendlyError(error) {
    // For now, just log a friendly message.
    // This can be expanded to show an overlay on the p5.js canvas.
    console.error(`[p5.videoeditor.js] An error occurred: ${error.message}`);
  }
}

export default ErrorHandler;
