/**
 * Error Utility functions for handling common error scenarios
 */

/**
 * Navigate to the appropriate error page based on error type or HTTP status code
 * @param {object} navigate - React Router navigate function
 * @param {number|string} errorType - HTTP status code (403, 404, 500) or 'warning'
 * @param {object} options - Additional options like state to pass to the error page
 */
export const navigateToErrorPage = (navigate, errorType, options = {}) => {
  switch (errorType) {
    case 404:
      navigate('/error/404', { state: options });
      break;
    case 403:
      navigate('/error/403', { state: options });
      break;
    case 500:
      navigate('/error/500', { state: options });
      break;
    case 'warning':
      navigate('/warning', { state: options });
      break;
    default:
      navigate('/error/500', { state: options });
  }
};

/**
 * Handle API errors and navigate to appropriate error page
 * @param {object} error - Error object from API call
 * @param {object} navigate - React Router navigate function
 * @param {object} options - Additional options to pass
 */
export const handleApiError = (error, navigate, options = {}) => {
  if (!error.response) {
    // Network error or server not responding
    navigateToErrorPage(navigate, 500, {
      ...options,
      message: 'Unable to connect to the server'
    });
    return;
  }

  const status = error.response.status;

  switch (status) {
    case 401:
      // Unauthorized - handle login redirect
      localStorage.removeItem('authToken');
      localStorage.setItem('isAuthenticated', 'false');
      navigate('/login');
      break;
    case 403:
      navigateToErrorPage(navigate, 403, {
        ...options,
        message: error.response.data?.message || 'You do not have permission to access this resource'
      });
      break;
    case 404:
      navigateToErrorPage(navigate, 404, {
        ...options,
        message: error.response.data?.message || 'The requested resource was not found'
      });
      break;
    case 422:
      // Validation error - show warning
      navigateToErrorPage(navigate, 'warning', {
        ...options,
        message: error.response.data?.message || 'Validation error',
        details: error.response.data?.errors
      });
      break;
    default:
      navigateToErrorPage(navigate, 500, {
        ...options,
        message: error.response.data?.message || 'An unexpected error occurred'
      });
  }
}; 