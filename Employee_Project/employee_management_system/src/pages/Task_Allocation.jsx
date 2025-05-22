import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Divider, Row, Col, message, Spin, Tooltip, Space, DatePicker } from 'antd';
import { 
  IdcardOutlined, 
  FileTextOutlined, 
  ProjectOutlined, 
  ShoppingOutlined, 
  UserOutlined, 
  CalendarOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  CommentOutlined,
  FileOutlined
} from '@ant-design/icons';
import './Task_Allocation.css';
import moment from 'moment';

// Get API base URL from environment variables or use default
const API_BASE_URL = 'http://127.0.0.1:5000';

const TaskAllocation = () => {
  const [form] = Form.useForm();
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingTaskData, setFetchingTaskData] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(true);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Initialize the form with current date as assigned date when component loads
  useEffect(() => {
    form.setFieldsValue({
      assignedDate: moment() // Set current date as the default assigned date
    });
  }, [form]);

  // Format date from YYYY-MM-DD to DD-MM-YYYY for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    if (dateString.includes("-")) {
      const parts = dateString.split('-');
      // Check if it's already in DD-MM-YYYY format
      if (parts[0].length === 2) {
        return dateString;
      }
      // It's in YYYY-MM-DD format, convert it
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateString; // Return as is if not in expected format
  };

  // Parse date from DD-MM-YYYY to moment object
  const parseDateString = (dateString) => {
    if (!dateString) return null;
    // Check if the date is in DD-MM-YYYY format
    if (dateString.includes("-")) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        // Handle both DD-MM-YYYY and YYYY-MM-DD formats
        if (parts[0].length === 2) {
          return moment(`${parts[2]}-${parts[1]}-${parts[0]}`, 'YYYY-MM-DD');
        } else {
          return moment(dateString, 'YYYY-MM-DD');
        }
      }
    }
    return null;
  };

  // Format date for API submission (from moment to DD-MM-YYYY)
  const formatDateForSubmission = (momentDate) => {
    if (!momentDate) return "";
    return momentDate.format('DD-MM-YYYY');
  };

  // Handle task ID search
  const handleTaskIdSearch = async () => {
    const taskId = form.getFieldValue('taskId')?.trim();
    
    if (!taskId) {
      message.error('Please enter a Task ID');
      return;
    }

    setFetchingTaskData(true);

    
    try {
      // Call API to get task details
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
      if (!response.ok) throw new Error('Task not found');
      
      const data = await response.json();
      
      setTaskDetails(data);
      form.setFieldsValue({
        taskName: data.taskName,
        taskDescription: data.taskDescription || "No description available",
        projectId: data.projectId,
        projectName: data.projectName,
        productName: data.productName,
        clientName: data.clientName,
        initiativeDate: formatDate(data.initiativeDate),
        targetCompletionDate: formatDate(data.targetCompletionDate)
      });
      message.success('Task details loaded successfully');
    } catch (error) {
      console.error("Error fetching task details:", error);
      message.error('Task ID not found');
      resetFormExceptTaskId();
    } finally {
      setFetchingTaskData(false);
    }
  };

  // Reset all form fields except taskId
  const resetFormExceptTaskId = () => {
    const taskId = form.getFieldValue('taskId');
    form.resetFields();
    form.setFieldsValue({ 
      taskId,
      assignedDate: moment() // Maintain current date as assigned date
    });
    setTaskDetails(null);
    setEmployeeName('');
    setRoleName('');
  };

  // Clear the form completely
  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      assignedDate: moment() // Set current date as the default assigned date
    });
    setTaskDetails(null);
    setEmployeeName('');
    setRoleName('');
  };
  
  // Handle employee ID change to fetch employee and role details
  const handleEmployeeIdChange = async (e) => {
    const employeeId = e.target.value.trim();
    
    if (!employeeId) {
      setEmployeeName('');
      setRoleName('');
      form.setFieldsValue({ reportingPersonId: '' }); // Clear reporting person field
      return;
    }
    
    setEmployeeLoading(true);
    
    try {
      // Use the get_employee_status endpoint
      console.log(`Fetching employee status for: ${employeeId}`);
      const response = await fetch(`${API_BASE_URL}/get_employee_status/${employeeId}`);
      
      if (!response.ok) {
        throw new Error(`Employee not found: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received employee data:", data);
      
      // Extract just the name and role_name from the response
      setEmployeeName(data.name || 'Unknown');
      setRoleName(data.role_name || 'Not assigned');
      
      // ✅ Auto-fill the Reporting Person field
  if (data.reporting_person) {
    setTimeout(() => {
      form.setFieldsValue({ reportingPersonId: data.reporting_person });
    }, 0);
  }
      
      message.success('Employee details loaded successfully');
    } catch (error) {
      console.error("Error fetching employee details:", error);
      message.error('Employee ID not found');
      setEmployeeName('');
      setRoleName('');
      form.setFieldsValue({ reportingPersonId: '' }); // Clear on error
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Custom validator for target date to ensure it's not after task completion date
  const validateTargetDate = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }

    if (!taskDetails || !taskDetails.targetCompletionDate) {
      return Promise.resolve();
    }

    // Parse the task completion date from taskDetails
    const taskCompletionDate = parseDateString(taskDetails.targetCompletionDate);
    
    if (!taskCompletionDate) {
      return Promise.resolve();
    }

    if (value.isAfter(taskCompletionDate)) {
      return Promise.reject(new Error('Target date cannot exceed task completion date'));
    }
    
    return Promise.resolve();
  };

  // Show success animation
  const showSuccess = async () => {
    setShowSuccessAnimation(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setShowSuccessAnimation(false);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    if (!taskDetails) {
      message.error('Please search for a task first');
      return;
    }

    if (!employeeName) {
      message.error('Please enter a valid Employee ID');
      return;
    }

    if (!values.reportingPersonId) {
      message.error('Please enter a Reporting Person ID');
      return;
    }

    if (!values.assignedDate) {
      message.error('Please select an assigned date');
      return;
    }

    if (!values.targetDate) {
      message.error('Please select a target date');
      return;
    }

    // Additional validation to ensure target date doesn't exceed task completion date
    const taskCompletionDate = parseDateString(taskDetails.targetCompletionDate);
    if (taskCompletionDate && values.targetDate.isAfter(taskCompletionDate)) {
      message.error('Target date cannot exceed task completion date');
      return;
    }

    setLoading(true);
    try {
      // Format dates for submission
      const formattedAssignedDate = formatDateForSubmission(values.assignedDate);
      const formattedTargetDate = formatDateForSubmission(values.targetDate);
      
      // Prepare task allocation data - structured to match your backend API
      const allocationData = {
        taskId: values.taskId,
        taskName: values.taskName,
        taskDescription: values.taskDescription,
        projectId: values.projectId,      
        projectName: values.projectName,  
        productName: values.productName,  
        clientName: values.clientName,    
        initiativeDate: taskDetails.initiativeDate,  
        targetCompletionDate: taskDetails.targetCompletionDate, 
        employeeId: values.employeeId,
        employeeName: employeeName,
        roleName: roleName,
        reportingPersonId: values.reportingPersonId,
        assignedDate: formattedAssignedDate,
        targetDate: formattedTargetDate
      };

      console.log('Task allocation data:', allocationData);
      
      // Make the API call to allocate the task
      const response = await fetch(`${API_BASE_URL}/allocate_task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to allocate task');
      }
      
      const result = await response.json();
      await showSuccess();
      message.success(`Task ${values.taskId} successfully allocated to ${employeeName}`);
      handleReset();
    } catch (error) {
      console.error('Error allocating task:', error);
      message.error(`Failed to allocate task: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add keyboard accessibility for search button
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && document.activeElement.name === 'taskId') {
        handleTaskIdSearch();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, []);

  // Disable dates in the date picker that are after the task completion date
  const disabledDate = (current) => {
    if (!taskDetails || !taskDetails.targetCompletionDate) {
      return false;
    }
    
    const taskCompletionDate = parseDateString(taskDetails.targetCompletionDate);
    return taskCompletionDate && current && current.isAfter(taskCompletionDate, 'day');
  };

  return (
    <div className="task-allocation-container">
      {showSuccessAnimation && (
        <div className="success-overlay">
          <div className="success-checkmark">
            <svg viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
        </div>
      )}

      <div>
        <Card className="task-card" variant="outlined">
          <div className="card-header">
            <h1 className="form-title">Task Allocation</h1>
            <Tooltip title="Enter a Task ID to view task details for allocation">
              <div>
                <InfoCircleOutlined className="info-icon" aria-label="Task allocation information" />
              </div>
            </Tooltip>
          </div>
          
          <Divider className="form-divider" />
          
          {formVisible && (
            <div>
              <Form
                form={form}
                layout="vertical"
                name="task_allocation"
                className="task-form"
                requiredMark="optional"
                onFinish={handleSubmit}
              >
                <Row gutter={[24, 0]}>
                  <Col xs={24} sm={24} md={12}>
                    <div>
                      <Form.Item
                        name="taskId"
                        label="Task ID"
                        tooltip="Enter the task ID to load task details"
                        rules={[{ required: true, message: 'Task ID is required!' }]}
                      >
                        <Input 
                          placeholder="Enter Task ID (e.g. T123)" 
                          prefix={<IdcardOutlined />} 
                          className="form-input"
                          suffix={
                            <Space>
                              {fetchingTaskData && <Spin size="small" />}
                              <div>
                                <SearchOutlined 
                                  style={{ cursor: 'pointer' }} 
                                  onClick={handleTaskIdSearch}
                                  aria-label="Search task"
                                />
                              </div>
                            </Space>
                          }
                          onPressEnter={handleTaskIdSearch}
                          aria-label="Task ID input"
                        />
                      </Form.Item>
                    </div>
                  </Col>
                </Row>

                {/* Task Details Section - Only visible when task is loaded */}
                {taskDetails && (
                  <div>
                    <Divider orientation="left">
                      <span>
                        Task Details
                      </span>
                    </Divider>
                    
                    <Row gutter={[24, 16]}>
                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item name="taskName" label="Task Name">
                            <Input 
                              disabled
                              prefix={<FileTextOutlined />}
                              className="form-input"
                              aria-label="Task name"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item name="projectId" label="Project ID">
                            <Input 
                              disabled
                              prefix={<ProjectOutlined />}
                              className="form-input"
                              aria-label="Project ID"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      {/* Task Description - Full width */}
                      <Col xs={24}>
                        <div>
                          <Form.Item 
                            name="taskDescription" 
                            label="Task Description"
                            tooltip="Detailed description of the task to be performed"
                          >
                            <Input.TextArea 
                              disabled
                              prefix={<FileOutlined />}
                              className="form-input"
                              rows={3}
                              aria-label="Task description"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item name="projectName" label="Project Name">
                            <Input 
                              disabled
                              prefix={<ProjectOutlined />}
                              className="form-input"
                              aria-label="Project name"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item name="productName" label="Product Name">
                            <Input 
                              disabled
                              prefix={<ShoppingOutlined />}
                              className="form-input"
                              aria-label="Product name"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item name="clientName" label="Client Name">
                            <Input 
                              disabled
                              prefix={<UserOutlined />}
                              className="form-input"
                              aria-label="Client name"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item name="initiativeDate" label="Initiative Date">
                            <Input 
                              disabled
                              prefix={<CalendarOutlined />}
                              className="form-input"
                              aria-label="Initiative date"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item
                            name="targetCompletionDate"
                            label="Target Completion Date"
                            tooltip="This is the deadline for the entire task"
                          >
                            <Input 
                              disabled
                              prefix={<CalendarOutlined />}
                              className="form-input"
                              aria-label="Target completion date"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      {/* Employee Allocation Section */}
                      <Col span={24}>
                        <div>
                          <Divider orientation="left">Employee Assignment</Divider>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item
                            name="employeeId"
                            label="Employee ID"
                            tooltip="Enter the employee ID to assign this task to"
                            rules={[{ required: true, message: 'Please enter Employee ID!' }]}
                          >
                            <Input 
                              placeholder="Enter Employee ID (e.g. EMP001)" 
                              prefix={<UserOutlined />}
                              className="form-input"
                              onChange={handleEmployeeIdChange}
                              suffix={employeeLoading ? <Spin size="small" /> : null}
                              aria-label="Employee ID input"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item
                            name="reportingPersonId"
                            label="Reporting Person"
                            tooltip="Enter the ID of the person this employee reports to for this task"
                            rules={[{ required: true, message: 'Please enter Reporting Person ID!' }]}
                          >
                            <Input 
                              placeholder="Enter Manager ID (e.g. EMP002)" 
                              prefix={<UserOutlined />}
                              className="form-input"
                              aria-label="Reporting person input"
                            />
                          </Form.Item>
                        </div>
                      </Col>

                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item
                            name="assignedDate"
                            label="Assigned Date"
                            tooltip="Date when this task is assigned to the employee"
                            rules={[{ required: true, message: 'Please select the assigned date!' }]}
                          >
                            <DatePicker 
                              className="form-input date-picker" 
                              format="DD-MM-YYYY"
                              placeholder="Select assigned date"
                              style={{ width: '100%' }}
                              aria-label="Assigned date picker"
                            />
                          </Form.Item>
                        </div>
                      </Col>
                      
                      <Col xs={24} sm={12}>
                        <div>
                          <Form.Item
                            name="targetDate"
                            label="Target Date"
                            tooltip="Target date for employee to complete the task (cannot be after task completion date)"
                            rules={[
                              { required: true, message: 'Please select the target date!' },
                              { validator: validateTargetDate }
                            ]}
                          >
                            <DatePicker 
                              className="form-input date-picker" 
                              format="DD-MM-YYYY"
                              placeholder="Select target date"
                              style={{ width: '100%' }}
                              aria-label="Target date picker"
                              disabledDate={disabledDate}
                            />
                          </Form.Item>
                        </div>
                      </Col>
                      
                      {/* Basic Employee Details Display Section */}
                      {employeeName && (
                        <>
                          <Col xs={24} sm={12}>
                            <div 
                              className="info-display" 
                              aria-live="polite"
                            >
                              <span className="info-label">Employee Name:</span>
                              <span className="info-value">{employeeName}</span>
                            </div>
                          </Col>

                          <Col xs={24} sm={12}>
                            <div 
                              className="info-display" 
                              aria-live="polite"
                            >
                              <span className="info-label">Role:</span>
                              <span className="info-value">{roleName || 'Not assigned'}</span>
                            </div>
                          </Col>
                        </>
                      )}
                    </Row>

                    {/* Form actions - only show if employee name is available */}
                    {employeeName && (
                      <div className="form-actions">
                        <Space size="middle">
                          <div>
                            <Button 
                              type="primary" 
                              htmlType="submit" 
                              className="allocate-btn"
                              loading={loading}
                              aria-label="Allocate task button"
                            >
                              Allocate Task
                            </Button>
                          </div>
                          <div>
                            <Button 
                              htmlType="button" 
                              onClick={handleReset}
                              className="reset-btn"
                              aria-label="Reset form button"
                            >
                              Reset
                            </Button>
                          </div>
                        </Space>
                      </div>
                    )}
                  </div>
                )}
              </Form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TaskAllocation;