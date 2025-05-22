import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, Button, Card, Space, Typography, Row, Col, message, Spin, Modal, Result, Tag,
  Skeleton, Badge, Divider, Steps, Alert, Timeline
} from 'antd';
import {
  SearchOutlined, InfoCircleOutlined, FileTextOutlined, ReloadOutlined, CheckCircleOutlined, SaveOutlined,
  HistoryOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  LoadingOutlined, UserOutlined, IdcardOutlined, AimOutlined, BarsOutlined, CommentOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import './Task_Status_Update.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const API_BASE_URL = 'http://127.0.0.1:5000';

// Map status to tag colors
const getStatusTagColor = (status) => {
  const colorMap = {
    'In Progress': 'blue',
    'Completed': 'success',
    'On Hold': 'warning',
    'Cancelled': 'error',
    'Re-assign': 'purple',
    'Re-submission': 'magenta',
    'Assigned': 'default'
  };
  return colorMap[status] || 'default';
};

// Map status to icons
const getStatusIcon = (status) => {
  const iconMap = {
    'In Progress': <ClockCircleOutlined />,
    'Completed': <CheckCircleOutlined />,
    'On Hold': <ExclamationCircleOutlined />,
    'Cancelled': <CloseCircleOutlined />,
    'Re-assign': <TeamOutlined />,
    'Re-submission': <ReloadOutlined />,
    'Assigned': <AimOutlined />
  };
  return iconMap[status] || <BarsOutlined />;
};

// Get current status step
const getStatusStep = (status) => {
  const stepMap = {
    'Assigned': 0,
    'In Progress': 1,
    'On Hold': 2,
    'Re-submission': 3,
    'Re-assign': 3,
    'Completed': 4,
    'Cancelled': 5
  };
  return stepMap[status] !== undefined ? stepMap[status] : 0;
};

// Function to format date to DD-MM-YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  return moment(dateString).format('DD-MM-YYYY');
};

const TaskStatusUpdate = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState(null);
  const [statusSaved, setStatusSaved] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch task details by taskId
  const fetchTaskDetails = async (taskId) => {
    if (!taskId) {
      message.warning('Please enter a Task ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    setStatusSaved(false);
    setSearchAttempted(true);
    setStatusHistory([]);

    try {
      const response = await axios.get(`${API_BASE_URL}/get_task_allocation/${taskId}`);
      const { data } = response;

      if (data?.success && data.taskDetails) {
        // Format dates before setting state
        const formattedTaskDetails = {
          ...data.taskDetails,
          assigned_date: formatDate(data.taskDetails.assigned_date),
          target_date: formatDate(data.taskDetails.target_date)
        };
        
        setTaskDetails(formattedTaskDetails);

        form.setFieldsValue({
          taskId,
          taskName: formattedTaskDetails.task_name,
          employeeName: formattedTaskDetails.employee_name,
          employeeId: formattedTaskDetails.employee_id,
          assignedDate: formattedTaskDetails.assigned_date,
          targetDate: formattedTaskDetails.target_date,
          taskStatus: formattedTaskDetails.status !== 'Assigned' ? formattedTaskDetails.status : undefined
        });

        message.success({
          content: 'Task details loaded successfully',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          className: 'custom-success-message'
        });
        
        // Fetch task status history
        fetchTaskStatusHistory(taskId);
      } else {
        resetTaskDetails();
        message.warning({
          content: 'Task not found. Please check the ID and try again.',
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
          duration: 4
        });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      handleAxiosError(err);
      resetTaskDetails();
    } finally {
      setLoading(false);
    }
  };

  // Fetch task status history
  const fetchTaskStatusHistory = async (taskId) => {
    setHistoryLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/get_task_status_history/${taskId}`);
      const { data } = response;
      
      if (data?.success && data.history) {
        setStatusHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch status history:', error);
      message.error('Failed to load status history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Reset task details
  const resetTaskDetails = () => {
    setTaskDetails(null);
    setUpdatedStatus(null);
    setStatusSaved(false);
    form.resetFields(['taskName', 'employeeName', 'employeeId', 'assignedDate', 'targetDate', 'taskStatus', 'reason']);
  };

  // Handle error responses from axios
  const handleAxiosError = (error) => {
    if (error.response) {
      setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      message.error(error.response.data?.message || 'Server error');
    } else if (error.request) {
      setError('No response from server. Please ensure backend is running.');
      setConnectionError(true);
      message.error('No response from server.');
    } else {
      setError(`Error: ${error.message}`);
      message.error(`Request error: ${error.message}`);
    }
  };

  // Function to check backend connection
  const checkConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      // Consider the connection successful if we get a response, even if it has an error
      if (response && (response.status === 200 || response.status === 500)) {
        setConnectionError(false);
        return true;
      } else {
        setConnectionError(true);
        return false;
      }
    } catch (error) {
      console.error('Connection check error:', error);
      // If we get a specific error response, the server is running but returned an error
      if (error.response && error.response.status) {
        setConnectionError(false);
        return true;
      } else {
        // No response means the server is not running
        setConnectionError(true);
        return false;
      }
    }
  };

  // Function to retry backend connection
  const retryConnection = async () => {
    message.loading('Trying to connect to server...');
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      // Consider the connection successful if we get a response, even if it has an error
      if (response && (response.status === 200 || response.status === 500)) {
        setConnectionError(false);
        message.success('Connected to server successfully');
      } else {
        setConnectionError(true);
        message.error('Still unable to connect to server');
      }
    } catch (err) {
      // If we get a specific error response, the server is running but returned an error
      if (err.response && err.response.status) {
        setConnectionError(false);
        message.success('Connected to server successfully');
      } else {
        // No response means the server is not running
        setConnectionError(true);
        message.error('Still unable to connect to server');
      }
    }
  };
  
  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, []);

  // Handle search by task ID
  const handleSearch = () => {
    if (taskId.trim() === '') {
      message.warning({
        content: 'Please enter a Task ID',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      });
      return;
    }
    fetchTaskDetails(taskId.trim());
  };

  // Handle form submission to update task status
  const handleFinish = async (values) => {
    if (!taskDetails) {
      message.error('No task details available. Please search for a task first.');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setStatusSaved(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/update_task_status`, {
        taskId: values.taskId,
        taskStatus: values.taskStatus,
        reason: values.reason,
        allocateBy: taskDetails?.employee_name,
        employeeId: values.employeeId,
        assignedDate: taskDetails?.assigned_date,
        targetDate: taskDetails?.target_date
      });

      const { data } = response;

      if (data?.success) {
        setUpdatedStatus(values.taskStatus);
        setSuccessModal(true);
        setStatusSaved(true);
        message.success({
          content: 'Task status updated successfully',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          className: 'custom-success-message'
        });
        form.resetFields(['reason']);
        
        // Refresh the status history to include the new update
        fetchTaskStatusHistory(values.taskId);
        
        // Start redirect timer - redirect after 5 seconds instead of 3
        // to give more time to see the updated status history
        const timer = setTimeout(() => {
          navigate('/employee');
        }, 5000);
        
        setRedirectTimer(timer);
      } else {
        const errorMessage = data?.message || 'Failed to update task status';
        message.error({
          content: errorMessage,
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        });
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Update error:', err);
      handleAxiosError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Close success modal and redirect to employee page
  const handleSuccessModalClose = () => {
    setSuccessModal(false);
    navigate('/employee');
  };

  // Render task status saved notification
  const renderStatusSavedNotification = () => {
    return (
      <>
        {/* Notification at the top center of the screen */}
        {statusSaved && (
          <div className="status-saved-notification">
            <div className="status-saved-notification-content">
              <CheckCircleOutlined className="status-saved-icon" /> Task status saved
            </div>
          </div>
        )}
        
        {/* Banner notification in the form */}
        {statusSaved && (
          <div className="status-saved-banner">
            <Badge status="success" text="Task status updated successfully" />
            <div className="redirect-message">
              Redirecting to Employee page in {Math.ceil((redirectTimer && 5000) / 1000 || 0)} seconds...
              <Button 
                type="link" 
                onClick={() => navigate('/employee')} 
                className="redirect-now-button"
              >
                Go now
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  // Function to render the task status visualization
  const renderStatusTimeline = (currentStatus) => {
    if (!currentStatus) return null;
    
    const currentStep = getStatusStep(currentStatus);
    
    return (
      <div className="status-timeline-container">
        <Divider>Current Status</Divider>
        <Steps 
          current={currentStep} 
          size="small" 
          className="status-timeline"
          status={currentStatus === 'Cancelled' ? 'error' : currentStatus === 'Completed' ? 'finish' : 'process'}
        >
          <Step title="Assigned" icon={<AimOutlined />} />
          <Step title="In Progress" icon={<ClockCircleOutlined />} />
          <Step title="On Hold" icon={<ExclamationCircleOutlined />} status={currentStatus === 'On Hold' ? 'warning' : null} />
          <Step title="Processing" icon={<ReloadOutlined />} status={(currentStatus === 'Re-submission' || currentStatus === 'Re-assign') ? 'process' : null} />
          <Step title="Completed" icon={<CheckCircleOutlined />} />
          <Step title="Cancelled" icon={<CloseCircleOutlined />} status={currentStatus === 'Cancelled' ? 'error' : null} />
        </Steps>
      </div>
    );
  };

  // Function to render status history
  const renderStatusHistory = () => {
    if (historyLoading) {
      return (
        <div className="status-history-container">
          <Divider orientation="left">
            <Title level={4} className="section-title">
              <HistoryOutlined /> Status History
            </Title>
          </Divider>
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <Spin tip="Loading status history..." />
          </div>
        </div>
      );
    }
    
    if (!statusHistory.length && taskDetails) {
      return (
        <div className="status-history-container">
          <Divider orientation="left">
            <Title level={4} className="section-title">
              <HistoryOutlined /> Status History
            </Title>
          </Divider>
          <div className="empty-history">
            <HistoryOutlined />
            <p>No status updates found for this task.</p>
            <p>Submit a new status update to start tracking history.</p>
          </div>
        </div>
      );
    }
    
    if (!statusHistory.length) {
      return null;
    }
    
    return (
      <div className="status-history-container">
        <Divider orientation="left">
          <Title level={4} className="section-title">
            <HistoryOutlined /> Status History
          </Title>
        </Divider>
        
        <Timeline mode="left" className="status-history-timeline">
          {statusHistory.map((status, index) => (
            <Timeline.Item 
              key={status.id || index}
              color={getStatusTagColor(status.task_status)}
              dot={getStatusIcon(status.task_status)}
              label={<Text type="secondary">{formatDateWithTime(status.created_at)}</Text>}
            >
              <div className="status-history-item">
                <div className="status-history-header">
                  <Tag color={getStatusTagColor(status.task_status)} className="status-history-tag">
                    {status.task_status}
                  </Tag>
                  <Text type="secondary">By {status.allocate_by || 'Unknown'}</Text>
                </div>
                <div className="status-history-reason">
                  <Text>{status.reason}</Text>
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    );
  };

  // Helper function to format date with time
  const formatDateWithTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    return moment(dateTimeString).format('DD-MM-YYYY HH:mm');
  };

  if (connectionError) {
    return (
      <div className="connection-error-container">
        <Card className="connection-error-card">
          <Result
            status="warning"
            title="Connection Error"
            subTitle="Could not connect to the backend server. Please ensure it is running."
            extra={
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={retryConnection}
                className="retry-button"
              >
                Retry Connection
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="task-status-container">
      {renderStatusSavedNotification()}
      
      <Card className="task-status-card">
        <div className="task-status-header">
          <Title level={3}>
            <FileTextOutlined className="card-icon" /> Task Status Update
          </Title>
        </div>

        <Alert
          message="Task Status Management"
          description="Search for a task by its ID to view details and update its status. You can add multiple status updates for the same task."
          type="info"
          showIcon
          icon={<InfoCircleOutlined className="info-alert-icon" />}
          className="info-alert"
          closable
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="task-status-form"
          requiredMark="optional"
        >
          {/* Task ID */}
          <div className="task-id-section">
            <Form.Item
              label={<span className="animated-label"><FileTextOutlined /> Task ID</span>}
              name="taskId"
              rules={[
                { required: true, message: 'Task ID is required' },
                { pattern: /^[A-Za-z0-9-_]+$/, message: 'Task ID can only contain letters, numbers, hyphens and underscores' }
              ]}
            >
              <Input
                value={taskId}
                className="task-id-input"
                placeholder="Enter Task ID (e.g., T123)"
                onChange={(e) => setTaskId(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                suffix={
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />} 
                    onClick={handleSearch} 
                    loading={loading}
                    className="search-button"
                  />
                }
              />
            </Form.Item>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <ExclamationCircleOutlined className="error-icon" />
              <Text type="danger">{error}</Text>
            </div>
          )}

          {/* Task Details */}
          <Spin 
            spinning={loading} 
            indicator={<LoadingOutlined className="loading-icon" style={{ fontSize: 24 }} spin />}
            tip="Loading task details..."
            className="custom-spin"
          >
            {taskDetails ? (
              <div className="task-details-wrapper fade-in">
                <Divider orientation="left">
                  <Title level={4} className="section-title">
                    <FileTextOutlined /> Task Details
                  </Title>
                </Divider>

                <div className="task-details-container">
                  <Row gutter={[16, 24]}>
                    <Col span={24}>
                      <Form.Item 
                        label={<span className="animated-label"><FileTextOutlined /> Task Name</span>} 
                        name="taskName"
                        className="highlight-field"
                      >
                        <Input readOnly className="readonly-input" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col md={12}>
                      <Row gutter={8} className="employee-field-container">
                        <Col span={12} className="employee-field">
                          <Form.Item 
                            label={<span className="animated-label"><UserOutlined /> Allocated By</span>} 
                            name="employeeName"
                          >
                            <Input readOnly className="readonly-input" />
                          </Form.Item>
                        </Col>
                        <Col span={12} className="employee-field">
                          <Form.Item 
                            label={<span className="animated-label"><IdcardOutlined /> Employee ID</span>} 
                            name="employeeId"
                          >
                            <Input readOnly className="readonly-input" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Col>
                    <Col md={12}>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Form.Item 
                            label={<span className="animated-label"><CalendarOutlined /> Allocated Date</span>} 
                            name="assignedDate"
                          >
                            <Input readOnly className="readonly-input" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            label={<span className="animated-label"><CalendarOutlined /> Target Date</span>} 
                            name="targetDate"
                          >
                            <Input readOnly className="readonly-input" />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>

                {/* Status timeline visualization */}
                {taskDetails.status && renderStatusTimeline(taskDetails.status)}
                
                {/* Status history visualization */}
                {renderStatusHistory()}

                <Divider orientation="left">
                  <Title level={4} className="section-title">
                    <HistoryOutlined /> Update Status
                  </Title>
                </Divider>

                <div className="update-status-container">
                  <Alert
                    message="Multiple Status Updates"
                    description="You can submit multiple status updates for the same task. Each update will be added to the history rather than replacing previous entries."
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                  />

                  <Form.Item
                    label={<span className="animated-label"><HistoryOutlined /> New Task Status</span>}
                    name="taskStatus"
                    rules={[{ required: true, message: 'Please select task status' }]}
                    className="status-select-container"
                  >
                    <Select 
                      placeholder="Select status" 
                      className="status-select"
                      optionLabelProp="label"
                      showSearch
                      optionFilterProp="label"
                    >
                      <Option value="In Progress" label="In Progress">
                        <div className="status-option">
                          <Badge status="processing" />
                          <ClockCircleOutlined className="status-icon blue" />
                          <span>In Progress</span>
                        </div>
                      </Option>
                      <Option value="Completed" label="Completed">
                        <div className="status-option">
                          <Badge status="success" />
                          <CheckCircleOutlined className="status-icon green" />
                          <span>Completed</span>
                        </div>
                      </Option>
                      <Option value="Re-assign" label="Re-assign">
                        <div className="status-option">
                          <Badge status="purple" />
                          <TeamOutlined className="status-icon purple" />
                          <span>Re-assign</span>
                        </div>
                      </Option>
                      <Option value="On Hold" label="On Hold">
                        <div className="status-option">
                          <Badge status="warning" />
                          <ExclamationCircleOutlined className="status-icon warning" />
                          <span>On Hold</span>
                        </div>
                      </Option>
                      <Option value="Cancelled" label="Cancelled">
                        <div className="status-option">
                          <Badge status="error" />
                          <CloseCircleOutlined className="status-icon red" />
                          <span>Cancelled</span>
                        </div>
                      </Option>
                      <Option value="Re-submission" label="Re-submission">
                        <div className="status-option">
                          <Badge status="magenta" />
                          <ReloadOutlined className="status-icon magenta" />
                          <span>Re-submission</span>
                        </div>
                      </Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={<span className="animated-label"><CommentOutlined /> Reason for Status Update</span>}
                    name="reason"
                    rules={[
                      { required: true, message: 'Please provide a reason' },
                      { min: 10, message: 'Reason should be at least 10 characters' }
                    ]}
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="Enter detailed reason for the status update" 
                      showCount 
                      maxLength={500} 
                      className="reason-textarea"
                    />
                  </Form.Item>
                </div>
              </div>
            ) : !loading && searchAttempted ? (
              <Result
                status="warning"
                icon={<FileTextOutlined className="not-found-icon" />}
                title="No Task Found"
                subTitle="The task ID you entered was not found or does not exist. Please check and try again."
                className="result-animation"
              />
            ) : !loading ? (
              <Result
                icon={<FileTextOutlined className="search-icon" />}
                title="No Task Selected"
                subTitle="Please enter a Task ID and click search to load task details"
                className="result-animation"
              />
            ) : null}
          </Spin>

          <Form.Item className="form-actions">
            <Space size="middle">
              <Button 
                onClick={() => {
                  form.resetFields();
                  setTaskDetails(null);
                  setError(null);
                  setTaskId('');
                  setUpdatedStatus(null);
                  setStatusSaved(false);
                  setSearchAttempted(false);
                }}
                icon={<ReloadOutlined />}
                className="reset-button"
              >
                Reset
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitLoading} 
                disabled={!taskDetails}
                icon={<SaveOutlined />}
                className="submit-button"
              >
                Update Status
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        open={successModal}
        title={<div className="success-modal-title"><CheckCircleOutlined className="success-icon" /> Status Updated</div>}
        onOk={handleSuccessModalClose}
        onCancel={handleSuccessModalClose}
        okText="Go to Employee Page"
        cancelText="Stay Here"
        className="success-modal"
        maskClosable={false}
        centered
      >
        <Result
          status="success"
          title="Task Status Updated"
          subTitle={
            <div className="success-message">
              <Paragraph>The task status has been successfully updated in the system</Paragraph>
              {updatedStatus && (
                <div className="updated-status">
                  <Text>New Status: </Text>
                  <Tag 
                    color={getStatusTagColor(updatedStatus)} 
                    icon={getStatusIcon(updatedStatus)}
                    className="status-tag"
                  >
                    {updatedStatus}
                  </Tag>
                </div>
              )}
              <Paragraph className="redirect-text">You will be redirected to the Employee page in a few seconds.</Paragraph>
            </div>
          }
        />
      </Modal>
    </div>
  );
};

export default TaskStatusUpdate;
