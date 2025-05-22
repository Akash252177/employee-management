import React from 'react';
import { Button, message, Space } from 'antd';
import MessageUtils from '../utils/messageUtils';

/**
 * MessageDemo component that demonstrates the use of our custom MessageUtils
 * This demonstrates how to use the MessageUtils in any component
 */
const MessageDemo = () => {
  const [messageApi, contextHolder] = MessageUtils.useMessageApi();

  // Success message
  const showSuccess = () => {
    MessageUtils.success(messageApi, 'Operation completed successfully');
  };

  // Error message
  const showError = () => {
    MessageUtils.error(messageApi, 'An error occurred during operation');
  };

  // Warning message
  const showWarning = () => {
    MessageUtils.warning(messageApi, 'This action may have consequences');
  };

  // Info message
  const showInfo = () => {
    MessageUtils.info(messageApi, 'Here is some helpful information');
  };

  // Loading message with a callback on close
  const showLoading = () => {
    const hide = MessageUtils.loading(messageApi, 'Action in progress...');
    // Dismiss the loading message after 2.5 seconds and show a success message
    setTimeout(() => {
      hide();
      MessageUtils.success(messageApi, 'Loading completed!');
    }, 2500);
  };

  // Promise-based loading with automatic error handling
  const showLoadingWithPromise = () => {
    // Simulate an API call that resolves after 2.5 seconds
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        // Change to reject() to see error handling
        resolve({ success: true, data: 'Operation result' });
      }, 2500);
    });

    // MessageUtils will handle loading, success, and error states
    MessageUtils.withLoading(messageApi, promise, {
      loadingMessage: 'Loading with promise...',
      successMessage: 'Promise resolved successfully!',
      errorMessage: 'Promise operation failed!'
    });
  };

  return (
    <div className="message-demo-container" style={{ padding: '20px', background: '#f5f7fa', borderRadius: '8px' }}>
      <h2>Message Component Demo</h2>
      <p>Click the buttons below to see our styled message notifications</p>
      
      {contextHolder}
      
      <Space wrap>
        <Button type="primary" onClick={showSuccess}>Success</Button>
        <Button danger onClick={showError}>Error</Button>
        <Button type="default" onClick={showWarning}>Warning</Button>
        <Button type="dashed" onClick={showInfo}>Info</Button>
        <Button type="primary" ghost onClick={showLoading}>Loading</Button>
        <Button type="primary" onClick={showLoadingWithPromise}>Promise Loading</Button>
      </Space>
    </div>
  );
};

export default MessageDemo; 