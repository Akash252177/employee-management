import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Card, Space, Typography, TimePicker, 
  message, Row, Col, Spin, Select, InputNumber, Table, DatePicker, Tag,
  Alert, Tooltip, Badge, Progress
} from 'antd';
import {
  SaveOutlined, ClockCircleOutlined, UserOutlined,
  FieldTimeOutlined, CheckCircleOutlined, CalendarOutlined,
  ImportOutlined, InfoCircleOutlined, DeleteOutlined,
  PlusOutlined, FileAddOutlined, PauseCircleOutlined, SyncOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import './Time_Sheet_Entry.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API_BASE_URL = 'http://127.0.0.1:5000';

const TimeSheetEntry = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [incompleteTasks, setIncompleteTasks] = useState([]);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [miscTasks, setMiscTasks] = useState([]);
  const [miscTaskDescription, setMiscTaskDescription] = useState('');
  const [miscTaskTimeSpent, setMiscTaskTimeSpent] = useState(1);
  const [miscTaskRemarks, setMiscTaskRemarks] = useState('');

  // States for time calculation
  const [inTime, setInTime] = useState(null);
  const [outTime, setOutTime] = useState(null);
  const [totalHours, setTotalHours] = useState(8);

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      setFetchingEmployees(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/employees`);
        if (response.data) {
          const options = response.data.map(employee => ({
            label: `${employee.employee_name} (${employee.employee_id})`,
            value: employee.employee_id,
            name: employee.employee_name
          }));
          setEmployeeOptions(options);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        message.error("Could not fetch employees. Please try again later.");
      } finally {
        setFetchingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // Set default values when component mounts
  useEffect(() => {
    const defaultInTime = moment().hour(9).minute(0);
    const defaultOutTime = moment().hour(17).minute(0);
    
    setInTime(defaultInTime);
    setOutTime(defaultOutTime);
    
    form.setFieldsValue({
      date: moment(),
      inTime: defaultInTime,
      outTime: defaultOutTime,
      totalHours: 8
    });
  }, [form]);

  // Calculate total hours when in-time or out-time changes
  useEffect(() => {
    if (inTime && outTime) {
      try {
        // Convert to minutes for calculation
        const inMinutes = inTime.hour() * 60 + inTime.minute();
        const outMinutes = outTime.hour() * 60 + outTime.minute();
        
        // Calculate difference in minutes
        let diffMinutes = outMinutes - inMinutes;
        
        // Handle negative minutes (overnight shifts)
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60; // Add 24 hours in minutes
        }
        
        // Convert minutes to hours
        const diffHours = diffMinutes / 60;
        
        // Round to 2 decimal places
        const roundedHours = Math.round(diffHours * 100) / 100;
        setTotalHours(roundedHours);
        form.setFieldsValue({ totalHours: roundedHours });
      } catch (error) {
        console.error("Error calculating hours:", error);
      }
    }
  }, [inTime, outTime, form]);

  // Fetch incomplete tasks when employee ID changes
  const fetchIncompleteTasks = async (employeeId) => {
    if (!employeeId) return;
    
    setFetchingTasks(true);
    setIncompleteTasks([]);
    setTasks([]);
    setMiscTasks([]);
    
    try {
      // Find employee name
      const employee = employeeOptions.find(emp => emp.value === employeeId);
      if (employee) {
        setSelectedEmployeeName(employee.name);
      }
      
      // Fetch incomplete tasks assigned to this employee
      const response = await axios.get(`${API_BASE_URL}/get_employee_incomplete_tasks/${employeeId}`);
      
      if (response.data?.success && response.data.tasks) {
        // Add a key for the table and default time values
        const tasksArray = response.data.tasks.map((task, index) => ({
          ...task,
          key: `incomplete-${index}`,
          timeSpent: 1, // Default time spent
          remarks: '' // Default remarks
        }));
        
        setIncompleteTasks(tasksArray);
      }
    } catch (error) {
      console.error("Error fetching incomplete tasks:", error);
      message.error("Failed to fetch incomplete tasks. Please try again.");
    } finally {
      setFetchingTasks(false);
    }
  };

  // Handle employee selection
  const handleEmployeeChange = (value) => {
    fetchIncompleteTasks(value);
  };

  // Handle time changes
  const handleInTimeChange = (time) => {
    if (time) {
      // Validate that time is not before 00:00
      const timeHour = time.hour();
      const timeMinute = time.minute();
      
      if (timeHour < 0 || (timeHour === 0 && timeMinute < 0)) {
        message.error('In-time cannot be before 00:00');
        return;
      }
    }
    
    setInTime(time);
  };

  const handleOutTimeChange = (time) => {
    if (time) {
      // Validate that time is not before 00:00
      const timeHour = time.hour();
      const timeMinute = time.minute();
      
      if (timeHour < 0 || (timeHour === 0 && timeMinute < 0)) {
        message.error('Out-time cannot be before 00:00');
        return;
      }
    }
    
    setOutTime(time);
  };

  // Add incomplete task to the timesheet
  const addIncompleteTask = (task) => {
    // Check if task is already added
    const existingTask = tasks.find(t => t.taskId === task.task_id);
    if (existingTask) {
      message.warning(`Task "${task.task_name}" is already added to the timesheet.`);
      return;
    }
    
    const newTask = {
      key: `task-${task.task_id}`,
      taskId: task.task_id,
      taskName: task.task_name,
      timeSpent: 1, // Default 1 hour
      remarks: ''
    };
    
    setTasks([...tasks, newTask]);
    message.success(`Task "${task.task_name}" added to timesheet.`);
  };

  // Add miscellaneous task
  const addMiscTask = () => {
    if (!miscTaskDescription.trim()) {
      message.warning('Please enter a task description');
      return;
    }
    
    const newMiscTask = {
      key: `misc-${Date.now()}`,
      taskDescription: miscTaskDescription,
      timeSpent: miscTaskTimeSpent,
      remarks: miscTaskRemarks
    };
    
    setMiscTasks([...miscTasks, newMiscTask]);
    setMiscTaskDescription('');
    setMiscTaskTimeSpent(1);
    setMiscTaskRemarks('');
    message.success('Miscellaneous task added successfully');
  };

  // Remove miscellaneous task
  const removeMiscTask = (taskKey) => {
    setMiscTasks(miscTasks.filter(task => task.key !== taskKey));
  };

  // Update miscellaneous task information
  const updateMiscTaskField = (taskKey, field, value) => {
    const updatedTasks = miscTasks.map(task => {
      if (task.key === taskKey) {
        return { ...task, [field]: value };
      }
      return task;
    });
    setMiscTasks(updatedTasks);
  };

  // Remove task from the timesheet
  const removeTask = (taskKey) => {
    setTasks(tasks.filter(task => task.key !== taskKey));
  };

  // Update task information
  const updateTaskField = (taskKey, field, value) => {
    const updatedTasks = tasks.map(task => {
      if (task.key === taskKey) {
        return { ...task, [field]: value };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

  // Add this function to check if total task hours exceeds working hours
  const isTotalHoursExceeded = () => {
    const assignedTasksHours = tasks.reduce((total, task) => total + (task.timeSpent || 0), 0);
    const miscTasksHours = miscTasks.reduce((total, task) => total + (task.timeSpent || 0), 0);
    const totalTaskHours = assignedTasksHours + miscTasksHours;
    
    return totalTaskHours > totalHours;
  };

  // Add this function for calculating total task hours
  const calculateTotalTaskHours = () => {
    const assignedTasksHours = tasks.reduce((total, task) => total + (task.timeSpent || 0), 0);
    const miscTasksHours = miscTasks.reduce((total, task) => total + (task.timeSpent || 0), 0);
    return (assignedTasksHours + miscTasksHours).toFixed(2);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    if (tasks.length === 0 && miscTasks.length === 0) {
      message.warning('Please add at least one task to the timesheet');
      return;
    }

    // Check if total hours exceed working hours
    if (isTotalHoursExceeded()) {
      message.error('Total task hours cannot exceed total working hours');
      return;
    }
    
    // Validate in-time
    if (values.inTime) {
      const hour = values.inTime.hour();
      const minute = values.inTime.minute();
      if (hour < 0 || (hour === 0 && minute < 0)) {
        message.error('In-time cannot be before 00:00');
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      // Format values for API
      const formattedValues = {
        employeeId: values.employeeId,
        employeeName: employeeOptions.find(emp => emp.value === values.employeeId)?.name || '',
        entryDate: values.date.format('YYYY-MM-DD'),
        inTime: values.inTime.format('HH:mm'),
        outTime: values.outTime.format('HH:mm'),
        totalHours: values.totalHours,
        assignedTasks: tasks,
        miscTasks: miscTasks,
        status: 'pending'
      };

      // Send data to backend
      console.log('Submitting:', formattedValues);
      
      const response = await axios.post(`${API_BASE_URL}/api/timesheet/submit`, formattedValues);
      
      if (response.data.success) {
        message.success('Time sheet entry saved successfully!');
        setSuccess(true);
        
        // Reset form after delay
        setTimeout(() => {
          form.resetFields();
          setInTime(null);
          setOutTime(null);
          setTotalHours(8);
          setTasks([]);
          setMiscTasks([]);
          setSuccess(false);
          setIncompleteTasks([]);
          
          // Set default times again
          const defaultInTime = moment().hour(9).minute(0);
          const defaultOutTime = moment().hour(17).minute(0);
          
          setInTime(defaultInTime);
          setOutTime(defaultOutTime);
          
          form.setFieldsValue({
            date: moment(),
            inTime: defaultInTime,
            outTime: defaultOutTime,
            totalHours: 8
          });
        }, 2000);
      } else {
        message.error('Failed to save time sheet entry. Please try again.');
      }
    } catch (error) {
      console.error('Error saving time sheet entry:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save time sheet entry. Please try again.';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Incomplete task table columns
  const incompleteTaskColumns = [
    {
      title: 'Task ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: '15%',
      render: (id) => <Tag color="blue">{id}</Tag>
    },
    {
      title: 'Task Name',
      dataIndex: 'task_name',
      key: 'task_name',
      width: '35%',
      render: (text) => <span className="timesheet-task-name">{text}</span>
    },
    {
      title: 'Status',
      dataIndex: 'task_status',
      key: 'task_status',
      width: '15%',
      render: (status) => {
        let color = 'default';
        let icon = null;
        
        if (status === 'In Progress') {
          color = 'processing';
          icon = <ClockCircleOutlined />;
        } else if (status === 'On Hold') {
          color = 'warning';
          icon = <PauseCircleOutlined />;
        } else if (status === 'Re-submission') {
          color = 'purple';
          icon = <SyncOutlined />;
        }
        
        return (
          <Tag 
            color={color}
            className="timesheet-status-tag"
            icon={icon}
          >
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: '20%',
      render: (date) => date ? 
        <span className="timesheet-date-cell">
          <CalendarOutlined className="timesheet-date-icon" /> {moment(date).format('DD-MM-YYYY HH:mm')}
        </span> : '-'
    },
    {
      title: 'Action',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<ImportOutlined />}
          onClick={() => addIncompleteTask(record)}
          className="timesheet-action-button"
        >
          Add
        </Button>
      )
    }
  ];

  // Task table columns (for assigned tasks)
  const taskColumns = [
    {
      title: 'S.No',
      key: 'index',
      width: '60px',
      render: (text, record, index) => <span className="timesheet-serial-number">{index + 1}</span>,
    },
    {
      title: 'Task ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: '15%',
      render: (id) => <Tag color="blue">{id}</Tag>
    },
    {
      title: 'Task Name',
      dataIndex: 'taskName',
      key: 'taskName',
      width: '35%',
      render: (text) => <span className="timesheet-task-name">{text}</span>
    },
    {
      title: 'Time Spent (hrs)',
      dataIndex: 'timeSpent',
      key: 'timeSpent',
      width: '15%',
      render: (hours, record) => (
        <div className="timesheet-hours-input-container">
          <InputNumber
            min={0.25}
            max={12}
            step={0.25}
            value={hours}
            onChange={(value) => updateTaskField(record.key, 'timeSpent', value)}
            style={{ width: '90px' }}
            controls={true}
            precision={2}
            parser={(value) => value.toString().replace(/[^0-9.]/g, '')}
            formatter={(value) => {
              // Remove decimal when it's a whole number
              const formattedValue = Number.isInteger(parseFloat(value)) ? 
                parseInt(value) : 
                parseFloat(value).toFixed(2);
              return `${formattedValue} ${parseFloat(value) === 1 ? 'hr' : 'hrs'}`;
            }}
            onStep={(value, info) => {
              const newValue = info.type === 'up' ? hours + 0.25 : hours - 0.25;
              updateTaskField(record.key, 'timeSpent', parseFloat(newValue.toFixed(2)));
            }}
          />
        </div>
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: '20%',
      render: (text, record) => (
        <Input
          placeholder="Add notes/remarks"
          value={text}
          onChange={(e) => updateTaskField(record.key, 'remarks', e.target.value)}
          className="timesheet-remarks-input"
          prefix={<FileAddOutlined className="timesheet-text-secondary" />}
          allowClear
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: '5%',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeTask(record.key)}
          className="timesheet-delete-button"
        />
      )
    }
  ];

  // Miscellaneous tasks table columns
  const miscTaskColumns = [
    {
      title: 'S.No',
      key: 'index',
      width: '60px',
      render: (text, record, index) => <span className="timesheet-serial-number">{index + 1}</span>,
    },
    {
      title: 'Task Description',
      dataIndex: 'taskDescription',
      key: 'taskDescription',
      width: '45%',
      render: (text, record) => (
        <Input
          placeholder="Task description"
          value={text}
          onChange={(e) => updateMiscTaskField(record.key, 'taskDescription', e.target.value)}
          allowClear
        />
      )
    },
    {
      title: 'Time Spent (hrs)',
      dataIndex: 'timeSpent',
      key: 'timeSpent',
      width: '15%',
      render: (hours, record) => (
        <div className="timesheet-hours-input-container">
          <InputNumber
            min={0.25}
            max={12}
            step={0.25}
            value={hours}
            onChange={(value) => updateMiscTaskField(record.key, 'timeSpent', value)}
            style={{ width: '90px' }}
            controls={true}
            precision={2}
            parser={(value) => value.toString().replace(/[^0-9.]/g, '')}
            formatter={(value) => {
              // Remove decimal when it's a whole number
              const formattedValue = Number.isInteger(parseFloat(value)) ? 
                parseInt(value) : 
                parseFloat(value).toFixed(2);
              return `${formattedValue} ${parseFloat(value) === 1 ? 'hr' : 'hrs'}`;
            }}
            onStep={(value, info) => {
              const newValue = info.type === 'up' ? hours + 0.25 : hours - 0.25;
              updateMiscTaskField(record.key, 'timeSpent', parseFloat(newValue.toFixed(2)));
            }}
          />
        </div>
      )
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      width: '25%',
      render: (text, record) => (
        <Input
          placeholder="Notes/remarks"
          value={text}
          onChange={(e) => updateMiscTaskField(record.key, 'remarks', e.target.value)}
          allowClear
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: '5%',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeMiscTask(record.key)}
          className="timesheet-delete-button"
        />
      )
    }
  ];

  return (
    <div className="timesheet-container">
      <Card className="timesheet-card">
        <div className="timesheet-header">
          <div className="timesheet-header-content">
            <Title level={3}>
              <ClockCircleOutlined className="timesheet-title-icon" /> Time Sheet Entry
            </Title>
            <Text type="secondary" className="timesheet-header-subtitle">
              Track your daily work hours and tasks
            </Text>
          </div>
          {success && (
            <div className="timesheet-success-badge">
              <CheckCircleOutlined /> Saved
            </div>
          )}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: moment(),
            totalHours: 8
          }}
          className="timesheet-form"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
          <Form.Item
            name="employeeId"
                label="Employee ID"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select
              showSearch
              placeholder="Select an employee"
              optionFilterProp="label"
              loading={fetchingEmployees}
              options={employeeOptions}
              prefix={<UserOutlined />}
                  className="timesheet-full-width"
                  onChange={handleEmployeeChange}
              filterOption={(input, option) =>
                option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            />
          </Form.Item>
            </Col>
            <Col xs={24} md={12}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker 
                  className="timesheet-full-width"
              format="DD-MM-YYYY"
              placeholder="Select date"
              prefix={<CalendarOutlined />}
            />
          </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="inTime"
                label="In Time"
                rules={[
                  { 
                    required: true, 
                    message: 'Please select in time' 
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const hour = value.hour();
                      const minute = value.minute();
                      if (hour < 0 || (hour === 0 && minute < 0)) {
                        return Promise.reject(new Error('In-time cannot be before 00:00'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <TimePicker 
                  format="HH:mm"
                  className="timesheet-full-width timesheet-time-picker"
                  prefix={<FieldTimeOutlined className="timesheet-time-icon" />}
                  onChange={handleInTimeChange}
                  minuteStep={15}
                  disabledHours={() => [...Array(24).keys()].filter(h => h < 0)}
                  hideDisabledOptions
                  allowClear={false}
                  inputReadOnly
                  popupClassName="timesheet-time-popup"
                  placeholder="Start time"
                />
              </Form.Item>
              <div className="timesheet-time-hint">When did you start working?</div>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="outTime"
                label="Out Time"
                rules={[
                  { 
                    required: true, 
                    message: 'Please select out time' 
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const hour = value.hour();
                      const minute = value.minute();
                      if (hour < 0 || (hour === 0 && minute < 0)) {
                        return Promise.reject(new Error('Out-time cannot be before 00:00'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <TimePicker 
                  format="HH:mm"
                  className="timesheet-full-width timesheet-time-picker"
                  prefix={<FieldTimeOutlined className="timesheet-time-icon" />}
                  onChange={handleOutTimeChange}
                  minuteStep={15}
                  disabledHours={() => [...Array(24).keys()].filter(h => h < 0)}
                  hideDisabledOptions
                  allowClear={false}
                  inputReadOnly
                  popupClassName="timesheet-time-popup"
                  placeholder="End time"
                />
              </Form.Item>
              <div className="timesheet-time-hint">When did you finish working?</div>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="totalHours"
                label="Total Hours"
                rules={[{ required: true, message: 'Total hours is required' }]}
              >
                <InputNumber 
                  className="timesheet-full-width timesheet-hours-input"
                  min={0.25}
                  max={24}
                  step={0.25}
                  precision={2}
                  controls={true}
                  value={totalHours}
                  onChange={(value) => setTotalHours(value)}
                  parser={(value) => value.toString().replace(/[^0-9.]/g, '')}
                  formatter={(value) => {
                    // Remove decimal when it's a whole number
                    const formattedValue = Number.isInteger(parseFloat(value)) ? 
                      parseInt(value) : 
                      parseFloat(value).toFixed(2);
                    return `${formattedValue} ${parseFloat(value) === 1 ? 'hour' : 'hours'}`;
                  }}
                />
              </Form.Item>
              <div className="timesheet-time-hint">Total work duration</div>
            </Col>
          </Row>

          {/* Available Tasks Section */}
          {form.getFieldValue('employeeId') && (
            <div className="timesheet-available-tasks-section">
              <div className="timesheet-section-header">
                <Title level={4} className="timesheet-section-title">
                  <InfoCircleOutlined className="timesheet-section-icon" /> 
                  Available Tasks
                  {selectedEmployeeName && (
                    <span className="timesheet-employee-name"> for {selectedEmployeeName}</span>
                  )}
                </Title>
                <Space>
                  <Badge count={incompleteTasks.length} showZero style={{ backgroundColor: '#1890ff' }} overflowCount={99} />
                  <Text type="secondary">
                    {incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''} available
                  </Text>
                  <InfoCircleOutlined className="timesheet-help-icon" />
                </Space>
              </div>
              
              <Spin spinning={fetchingTasks}>
                {incompleteTasks.length > 0 ? (
                  <div className="timesheet-table-container">
                    <Table
                      dataSource={incompleteTasks}
                      columns={incompleteTaskColumns}
                      pagination={false}
                      size="small"
                      className="timesheet-available-tasks-table"
                      rowKey="key"
                      rowClassName={(record, index) => index % 2 === 0 ? 'timesheet-even-row' : 'timesheet-odd-row'}
                    />
                  </div>
                ) : (
                  <Alert
                    message="No incomplete tasks found"
                    description={
                      <div>
                        <p>There are no incomplete tasks assigned to this employee.</p>
                        <p>Use the Miscellaneous Tasks section below to add custom tasks.</p>
                      </div>
                    }
                    type="info"
                    showIcon
                    className="timesheet-empty-tasks-alert"
                  />
                )}
              </Spin>
            </div>
          )}

          {/* Assigned Tasks Section */}
          {tasks.length > 0 && (
            <div className="timesheet-assigned-tasks-section">
              <div className="timesheet-section-header">
                <Title level={4} className="timesheet-section-title">
                  <ClockCircleOutlined className="timesheet-section-icon" /> 
                  Assigned Tasks
                </Title>
                <Badge 
                  count={
                    <span className="timesheet-task-count-tag" style={{ color: isTotalHoursExceeded() ? "#ff4d4f" : "inherit" }}>
                      {tasks.reduce((total, task) => total + (task.timeSpent || 0), 0).toFixed(2)} hrs
              </span>
            }
                  style={{ backgroundColor: isTotalHoursExceeded() ? "#ff4d4f" : "#1890ff" }}
                />
              </div>

              <div className="timesheet-table-container">
                <Table
                  dataSource={tasks}
                  columns={taskColumns}
                  pagination={false}
                  size="middle"
                  className="timesheet-assigned-tasks-table"
                  rowKey="key"
                  rowClassName={(record, index) => index % 2 === 0 ? 'timesheet-even-row' : 'timesheet-odd-row'}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3} className="timesheet-summary-cell">
                          <Text strong>Total Hours</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} className="timesheet-summary-cell timesheet-hours-summary-cell">
                          <Text strong type={isTotalHoursExceeded() ? "danger" : ""}>{tasks.reduce((total, task) => total + (task.timeSpent || 0), 0).toFixed(2)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </div>
            </div>
          )}

          {/* Miscellaneous Tasks Section */}
          <div className="timesheet-misc-tasks-section">
            <div className="timesheet-section-header">
              <Title level={4} className="timesheet-section-title">
                <FileAddOutlined className="timesheet-section-icon" /> 
                Miscellaneous Tasks
              </Title>
              <Badge 
                count={
                  <span className="timesheet-task-count-tag" style={{ color: isTotalHoursExceeded() ? "#ff4d4f" : "inherit" }}>
                    {miscTasks.reduce((total, task) => total + (task.timeSpent || 0), 0).toFixed(2)} hrs
                  </span>
                }
                style={{ backgroundColor: isTotalHoursExceeded() ? "#ff4d4f" : "#faad14" }}
              />
            </div>

            <div className="timesheet-misc-task-input-card">
              <div className="timesheet-misc-task-form">
                <div className="timesheet-misc-task-field timesheet-desc-field">
                  <label><span className="timesheet-required">*</span> Task Description</label>
                  <Input
                    placeholder="Enter task description"
                    value={miscTaskDescription}
                    onChange={(e) => setMiscTaskDescription(e.target.value)}
                    autoComplete="off"
                    allowClear
                    prefix={<FileAddOutlined className="timesheet-input-icon" />}
                    className="timesheet-task-input"
                  />
                </div>
                
                <div className="timesheet-misc-task-field timesheet-hours-field">
                  <label><span className="timesheet-required">*</span> Hours</label>
                  <div className="timesheet-hours-container">
            <InputNumber 
                      min={0.25}
                      max={12}
                      step={0.25}
                      value={miscTaskTimeSpent}
                      onChange={(value) => setMiscTaskTimeSpent(value)}
                      style={{ width: '90px' }}
                      controls={true}
                      precision={2}
                      className="timesheet-task-hours-input"
                      parser={(value) => value.toString().replace(/[^0-9.]/g, '')}
                      formatter={(value) => {
                        // Remove decimal when it's a whole number
                        const formattedValue = Number.isInteger(parseFloat(value)) ? 
                          parseInt(value) : 
                          parseFloat(value).toFixed(2);
                        return `${formattedValue} ${parseFloat(value) === 1 ? 'hr' : 'hrs'}`;
                      }}
                      onStep={(value, info) => {
                        const newValue = info.type === 'up' ? miscTaskTimeSpent + 0.25 : miscTaskTimeSpent - 0.25;
                        setMiscTaskTimeSpent(parseFloat(newValue.toFixed(2)));
                      }}
                    />
                  </div>
                </div>
                
                <div className="timesheet-misc-task-field timesheet-remarks-field">
                  <label>Remarks</label>
                  <Input
                    placeholder="Add notes"
                    value={miscTaskRemarks}
                    onChange={(e) => setMiscTaskRemarks(e.target.value)}
                    allowClear
                    prefix={<InfoCircleOutlined className="timesheet-input-icon" />}
                    className="timesheet-task-input"
                  />
          </div>

                <div className="timesheet-misc-task-field timesheet-add-btn-field">
          <Button 
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addMiscTask}
                    disabled={!miscTaskDescription.trim()}
                    className="timesheet-add-task-btn"
                  >
                    Add
          </Button>
                </div>
              </div>
            </div>

            {miscTasks.length > 0 ? (
              <div className="timesheet-table-container">
                <Table
                  dataSource={miscTasks}
                  columns={miscTaskColumns}
                  pagination={false}
                  size="middle"
                  className="timesheet-misc-tasks-table"
                  rowKey="key"
                  rowClassName={(record, index) => index % 2 === 0 ? 'timesheet-even-row' : 'timesheet-odd-row'}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2} className="timesheet-summary-cell">
                          <Text strong>Total Hours</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} className="timesheet-summary-cell timesheet-hours-summary-cell">
                          <Text strong type={isTotalHoursExceeded() ? "danger" : ""}>{miscTasks.reduce((total, task) => total + (task.timeSpent || 0), 0).toFixed(2)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} colSpan={2}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </div>
            ) : (
              <Alert
                message="No miscellaneous tasks added"
                description={
                  <div>
                    <p>Use this section to add custom tasks that are not in your assigned task list.</p>
                    <p>Examples: meetings, training, documentation, administrative work, etc.</p>
                  </div>
                }
                type="info"
                showIcon
                className="timesheet-empty-tasks-alert"
              />
            )}
          </div>

          {/* Hours Summary */}
          {(tasks.length > 0 || miscTasks.length > 0) && (
            <div className="timesheet-hours-summary">
              <Alert
                message={
                  <Row gutter={24} align="middle">
                    <Col>
                      <Text strong>Total Work Hours: {totalHours}</Text>
                    </Col>
                    <Col>
                      <Text strong>Total Task Hours: {calculateTotalTaskHours()}</Text>
                    </Col>
                    <Col>
                      <Progress 
                        type="circle" 
                        percent={Math.round((parseFloat(calculateTotalTaskHours()) / totalHours) * 100)} 
                        format={() => `${calculateTotalTaskHours()}/${totalHours}`}
                        width={60}
                        status={isTotalHoursExceeded() ? "exception" : "active"}
                      />
                    </Col>
                    <Col>
                      {isTotalHoursExceeded() ? (
                        <Tag color="error" style={{ padding: '5px 12px', marginLeft: '10px' }}>Hours Exceeded</Tag>
                      ) : (
                        <Tag color="success" style={{ padding: '5px 12px', marginLeft: '10px' }}>Hours Valid</Tag>
                      )}
                    </Col>
                  </Row>
                }
                description={
                  isTotalHoursExceeded() ? 
                    "The total task hours exceed the total working hours. Please adjust your task hours." : 
                    "Task hours are within the total working hours limit."
                }
                type={isTotalHoursExceeded() ? "error" : "success"}
                showIcon
              />
            </div>
          )}

          <Form.Item className="timesheet-form-actions">
            <div className="timesheet-button-container">
              <Button 
                className="timesheet-reset-button"
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  form.resetFields();
                  setTasks([]);
                  setMiscTasks([]);
                  setIncompleteTasks([]);
                  const defaultInTime = moment().hour(9).minute(0);
                  const defaultOutTime = moment().hour(17).minute(0);
                  
                  setInTime(defaultInTime);
                  setOutTime(defaultOutTime);
                  
                  form.setFieldsValue({
                    date: moment(),
                    inTime: defaultInTime,
                    outTime: defaultOutTime,
                    totalHours: 8
                  });
                }}
              >
                Reset
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                className="timesheet-submit-button"
              >
                Save Time Sheet
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TimeSheetEntry;