import { message } from 'antd';

/**
 * Custom message utility functions for the application.
 * Provides enhanced message displays with custom styling and animations.
 */
const MessageUtils = {
  /**
   * Initializes the message API context - must be called in component
   * @returns The message API instance and context holder
   */
  useMessageApi: () => {
    return message.useMessage();
  },

  /**
   * Display a success message
   * @param {Object} messageApi - The message API instance
   * @param {string} content - The message content
   * @param {number} duration - Duration in seconds (default: 3)
   */
  success: (messageApi, content, duration = 3) => {
    messageApi.success(content, duration);
  },

  /**
   * Display an error message
   * @param {Object} messageApi - The message API instance
   * @param {string} content - The message content
   * @param {number} duration - Duration in seconds (default: 4)
   */
  error: (messageApi, content, duration = 4) => {
    messageApi.error(content, duration);
  },

  /**
   * Display a warning message
   * @param {Object} messageApi - The message API instance
   * @param {string} content - The message content
   * @param {number} duration - Duration in seconds (default: 4)
   */
  warning: (messageApi, content, duration = 4) => {
    messageApi.warning(content, duration);
  },

  /**
   * Display an info message
   * @param {Object} messageApi - The message API instance
   * @param {string} content - The message content
   * @param {number} duration - Duration in seconds (default: 3)
   */
  info: (messageApi, content, duration = 3) => {
    messageApi.info(content, duration);
  },

  /**
   * Display a loading message that can be manually dismissed
   * @param {Object} messageApi - The message API instance
   * @param {string} content - The message content
   * @returns {Function} - Function to close the loading message
   */
  loading: (messageApi, content = 'Loading...') => {
    return messageApi.loading(content, 0);
  },

  /**
   * Display a loading message with auto-dismiss on promise resolution
   * @param {Object} messageApi - The message API instance
   * @param {Promise} promise - The promise to await
   * @param {Object} options - Options for the messages
   * @param {string} options.loadingMessage - Loading message content
   * @param {string} options.successMessage - Success message content
   * @param {string} options.errorMessage - Error message content
   * @returns {Promise} - The original promise result
   */
  withLoading: async (messageApi, promise, options) => {
    const {
      loadingMessage = 'Loading...',
      successMessage = 'Operation completed successfully',
      errorMessage = 'Operation failed'
    } = options || {};

    const hide = messageApi.loading(loadingMessage, 0);

    try {
      const result = await promise;
      hide();
      messageApi.success(successMessage);
      return result;
    } catch (error) {
      hide();
      messageApi.error(errorMessage || error.message);
      throw error;
    }
  }
};

export default MessageUtils; 