import React, { useState, useEffect } from 'react';
import {
  Card, Table, Typography, Tag, Button, 
  Modal, Space, Descriptions, Divider,
  Select, Form, Empty, message, Spin,
  DatePicker, Row, Col, Avatar, Tooltip,
  Input, Collapse, Badge
} from 'antd';
import {
  ClockCircleOutlined, CalendarOutlined, 
  SearchOutlined, FilterOutlined, UserOutlined,
  FieldTimeOutlined, SyncOutlined, InfoCircleOutlined,
  ReloadOutlined, DownOutlined, UpOutlined, BarsOutlined,
  ProjectOutlined, TeamOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import './TimeSheet_Summary.css';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:5000';

const { Title, Text } = Typography;
const { Option } = Select;

// Fallback demo data in case API fails
const DEMO_TIMESHEETS = [
    {
      entry_id: 1,
      employee_id: 'EMP001',
      employee_name: 'John Doe',
      entry_date: '2023-06-15',
      in_time: '09:00',
      out_time: '17:00',
      total_hours: 8,
      status: 'approved',
      approved_by: 'Manager',
      approval_date: '2023-06-16 10:30:00',
      assigned_tasks: [
        { task_id: 'TASK-001', task_name: 'Frontend Development', time_spent: 4, remarks: 'Completed UI components' },
        { task_id: 'TASK-002', task_name: 'Code Review', time_spent: 2, remarks: 'Reviewed PR #123' }
      ],
      misc_tasks: [
        { task_description: 'Team Meeting', time_spent: 1, remarks: 'Sprint planning' },
        { task_description: 'Documentation', time_spent: 1, remarks: 'Updated API docs' }
      ]
  },
  {
    entry_id: 2,
    employee_id: 'EMP001',
    employee_name: 'John Doe',
    entry_date: '2023-06-16',
    in_time: '08:30',
    out_time: '16:30',
    total_hours: 8,
    status: 'pending',
    assigned_tasks: [
      { task_id: 'TASK-003', task_name: 'Bug Fixing', time_spent: 5, remarks: 'Fixed authentication issues' },
      { task_id: 'TASK-004', task_name: 'Testing', time_spent: 2, remarks: 'Wrote unit tests' }
    ],
    misc_tasks: [
      { task_description: 'Email Response', time_spent: 1, remarks: 'Client communication' }
    ]
  },
  {
    entry_id: 3,
    employee_id: 'EMP002',
    employee_name: 'Jane Smith',
    entry_date: '2023-06-15',
    in_time: '09:15',
    out_time: '17:15',
    total_hours: 8,
    status: 'approved',
    approved_by: 'Team Lead',
    approval_date: '2023-06-16 09:45:00',
    assigned_tasks: [
      { task_id: 'TASK-005', task_name: 'UI Design', time_spent: 6, remarks: 'Created mockups for new features' }
    ],
    misc_tasks: [
      { task_description: 'Team Meeting', time_spent: 1, remarks: 'Weekly sync' },
      { task_description: 'Training', time_spent: 1, remarks: 'New tool introduction' }
    ]
  }
];

const { RangePicker } = DatePicker;

const TimeSheetSummary = () => {
  const [form] = Form.useForm();
  
  // States
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [timesheets, setTimesheets] = useState([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeSearched, setEmployeeSearched] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [error, setError] = useState(null);
  const [taskAllocations, setTaskAllocations] = useState({});
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [filterChanged, setFilterChanged] = useState(false);
  
  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
        setEmployeeLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/employees`);
        if (response.data) {
          const options = response.data.map(employee => ({
            label: `${employee.employee_name} (${employee.employee_id})`,
            value: employee.employee_id,
            name: employee.employee_name
          }));
          setEmployees(options);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        // Fallback to demo employees if API fails
        const demoEmployees = [
          { value: 'EMP001', label: 'John Doe (EMP001)', name: 'John Doe' },
          { value: 'EMP002', label: 'Jane Smith (EMP002)', name: 'Jane Smith' },
          { value: 'EMP003', label: 'Michael Johnson (EMP003)', name: 'Michael Johnson' }
        ];
        setEmployees(demoEmployees);
      } finally {
        setEmployeeLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
  // Fetch project mappings for timesheet entries
  const fetchTaskAllocations = async (employeeId) => {
    try {
      // Use the dedicated endpoint for timesheet project mappings
      const url = `${API_BASE_URL}/api/timesheet/project-mappings/${employeeId}`;
      console.log(`Fetching project mappings from: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.data.success && response.data.mappings) {
        const mappings = response.data.mappings;
        console.log(`Received project mappings for employee ${employeeId}:`, mappings);
        
        // Convert the API response format to our internal format
        const allocations = {};
        Object.keys(mappings).forEach(taskId => {
          allocations[taskId] = {
            projectId: mappings[taskId].project_id,
            projectName: mappings[taskId].project_name
          };
          
          console.log(`Mapped task ${taskId} to project ${mappings[taskId].project_id}`);
        });
        
        setTaskAllocations(allocations);
        return allocations;
      } else {
        console.warn('No project mappings found for employee', employeeId);
        return {};
      }
    } catch (error) {
      console.error('Error fetching project mappings:', error);
      
      // Fallback data - map task IDs to project IDs for demo data
      const fallbackAllocations = {
        'TASK-001': { projectId: 'PROJ-101', projectName: 'Frontend Redesign' },
        'TASK-002': { projectId: 'PROJ-101', projectName: 'Frontend Redesign' },
        'TASK-003': { projectId: 'PROJ-102', projectName: 'API Integration' },
        'TASK-004': { projectId: 'PROJ-102', projectName: 'API Integration' },
        'TASK-005': { projectId: 'PROJ-103', projectName: 'UI Refresh' },
        // Add entries matching task IDs we've seen in the timesheet
        'T595': { projectId: 'PRO354', projectName: 'Sign Language Detection' },
        'T919': { projectId: 'PRO276', projectName: 'KVB' }
      };
      
      console.log('Using fallback project mappings:', fallbackAllocations);
      setTaskAllocations(fallbackAllocations);
      return fallbackAllocations;
    }
  };
  
  // Fetch timesheet entries for an employee
  const fetchTimesheetEntries = async (employeeId, startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);
    
    try {
      // Also fetch task allocations to get project IDs
      const allocations = await fetchTaskAllocations(employeeId);
      
      let url = `${API_BASE_URL}/api/timesheet/entries/${employeeId}`;
      
      // Add date range parameters if provided
      const params = [];
      if (startDate) {
        params.push(`startDate=${startDate.format('YYYY-MM-DD')}`);
      }
      if (endDate) {
        params.push(`endDate=${endDate.format('YYYY-MM-DD')}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      console.log(`Fetching timesheet entries from: ${url}`);
      const response = await axios.get(url);
      
      if (response.data.success) {
        const entries = response.data.entries || [];
        console.log('Raw timesheet entries:', entries);
        
        // Validate the data structure and format fields if needed
        const processedEntries = entries.map(entry => {
          // Ensure in_time and out_time are properly formatted
          if (entry.in_time && typeof entry.in_time === 'string') {
            entry.in_time = entry.in_time.substring(0, 5); // Keep only HH:MM format
          }
          
          if (entry.out_time && typeof entry.out_time === 'string') {
            entry.out_time = entry.out_time.substring(0, 5); // Keep only HH:MM format
          }
          
          // Attach project information to entry if available
          if (entry.assigned_tasks && entry.assigned_tasks.length > 0) {
            // Check all assigned tasks for matching project IDs
            let foundMatch = false;
            const taskIds = entry.assigned_tasks.map(task => task.task_id).join(', ');
            console.log(`Entry ${entry.entry_id}: Looking for project IDs for tasks: ${taskIds}`);
            
            for (const task of entry.assigned_tasks) {
              const taskId = task.task_id;
              if (allocations[taskId]) {
                entry.project_id = allocations[taskId].projectId;
                entry.project_name = allocations[taskId].projectName;
                console.log(`Found project match: Task ${taskId} → Project ${entry.project_id} (${entry.project_name})`);
                foundMatch = true;
                break; // Use the first match
              }
            }
            
            if (!foundMatch) {
              console.warn(`No project found for entry ${entry.entry_id} with tasks: ${taskIds}`);
              // Leave project_id undefined, the render function will display N/A
            }
          }
          
          return entry;
        });
        
        console.log('Processed timesheet entries:', processedEntries);
        setTimesheets(processedEntries);
        setFilteredTimesheets(processedEntries);
        console.log(`Fetched ${processedEntries.length} timesheet entries`);
        return processedEntries;
      } else {
        console.error("API returned success: false", response.data);
        setError('Failed to fetch timesheet entries: ' + (response.data.error || 'Unknown error'));
        setTimesheets(DEMO_TIMESHEETS);
        setFilteredTimesheets(DEMO_TIMESHEETS.filter(t => t.employee_id === employeeId));
        return [];
      }
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      const errorMessage = error.response ? 
        `Error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}` : 
        'Failed to connect to the server. Using demo data instead.';
      
      setError(errorMessage);
      
      // Fall back to demo data
      const demoEntries = DEMO_TIMESHEETS.filter(t => t.employee_id === employeeId);
      
      // Process demo entries with task allocations (fallback data)
      const processedDemoEntries = demoEntries.map(entry => {
        if (entry.assigned_tasks && entry.assigned_tasks.length > 0) {
          const taskId = entry.assigned_tasks[0].task_id;
          if (allocations[taskId]) {
            entry.project_id = allocations[taskId].projectId;
            entry.project_name = allocations[taskId].projectName;
          }
        }
        return entry;
      });
      
      setTimesheets(processedDemoEntries);
      setFilteredTimesheets(processedDemoEntries);
      return processedDemoEntries;
    } finally {
      setLoading(false);
    }
  };
  
  // Get employee details from the Time Sheet Entry endpoint
  const fetchEmployeeDetails = async (employeeId) => {
    try {
      // Try to get employee name from the employees array first
      const employeeObj = employees.find(emp => emp.value === employeeId);
      if (employeeObj) {
        setEmployeeName(employeeObj.name);
        return employeeObj.name;
      }
      
      // If not found, try to fetch from API
      const response = await axios.get(`${API_BASE_URL}/get_employee_incomplete_tasks/${employeeId}`);
      
      if (response.data?.success && response.data.tasks && response.data.tasks.length > 0) {
        const taskWithEmployeeInfo = response.data.tasks.find(task => task.employee_name);
        
        if (taskWithEmployeeInfo && taskWithEmployeeInfo.employee_name) {
          setEmployeeName(taskWithEmployeeInfo.employee_name);
          return taskWithEmployeeInfo.employee_name;
        }
      }
      
      setEmployeeName('Unknown');
      return 'Unknown';
    } catch (error) {
      console.error('Error fetching employee details:', error);
      
      const employeeObj = employees.find(emp => emp.value === employeeId);
      if (employeeObj) {
        setEmployeeName(employeeObj.name);
        return employeeObj.name;
      }
      
      setEmployeeName('Unknown');
      return 'Unknown';
    }
  };
  
  // Handle employee selection
  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployee(employeeId);
    setFilterChanged(true);
    
    // Try to get employee name
    const employeeObj = employees.find(emp => emp.value === employeeId);
    if (employeeObj) {
      setEmployeeName(employeeObj.name);
    } else {
      setEmployeeName('');
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      setFilterChanged(true);
    }
  };
  
  // Handle filter submit
  const handleFilterSubmit = async (values) => {
    const employeeId = values.employee;
    const dateRange = values.dateRange;
    
    setLoading(true);
    setFilterChanged(false);
    
    try {
    if (employeeId) {
        setEmployeeSearched(true);
        await fetchEmployeeDetails(employeeId);
        
        // Fetch timesheet entries with date range if provided
        if (dateRange && dateRange[0] && dateRange[1]) {
          const startDate = dateRange[0];
          const endDate = dateRange[1];
          
          const entries = await fetchTimesheetEntries(employeeId, startDate, endDate);
          
          if (entries.length === 0) {
            message.warning('No timesheets found matching the selected criteria');
    } else {
            message.success(`Found ${entries.length} timesheet entries for the selected period`);
          }
        } else {
          // Fetch all entries for the employee if no date range
          const entries = await fetchTimesheetEntries(employeeId);
          
          if (entries.length === 0) {
            message.warning(`No timesheets found for employee ID: ${employeeId}`);
          } else {
            message.success(`Showing all timesheet data for employee ID: ${employeeId}`);
          }
        }
    } else {
        setEmployeeSearched(false);
        message.error('Please select an employee');
      }
    } catch (error) {
      console.error('Error in filter submit:', error);
      message.error('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
      // Collapse the filter panel after search on mobile
      if (window.innerWidth < 768) {
        setFilterExpanded(false);
      }
    }
  };
  
  // Reset filters
  const handleFilterReset = () => {
    setSelectedEmployee(null);
    setEmployeeName('');
    setDateRange([null, null]);
    setTimesheets([]);
    setFilteredTimesheets([]);
    setEmployeeSearched(false);
    setError(null);
    setFilterChanged(false);
    form.resetFields();
  };
  
  // Toggle filter panel
  const toggleFilterPanel = () => {
    setFilterExpanded(!filterExpanded);
  };
  
  // Define columns for the timesheets table
  const timesheetColumns = [
    {
      title: 'Task ID',
      key: 'task_id',
      dataIndex: ['assigned_tasks', '0', 'task_id'],
      render: (text, record) => {
        if (record.assigned_tasks && record.assigned_tasks.length > 0) {
          return (
            <Tag color="blue" className="task-id-tag">
              {record.assigned_tasks[0].task_id}
            </Tag>
          );
        }
        return <Tag color="default">N/A</Tag>;
      },
      width: '10%',
      sorter: (a, b) => {
        const aTaskId = a.assigned_tasks?.[0]?.task_id || '';
        const bTaskId = b.assigned_tasks?.[0]?.task_id || '';
        return aTaskId.localeCompare(bTaskId);
      },
    },
    {
      title: 'Task Name',
      key: 'task_name',
      dataIndex: ['assigned_tasks', '0', 'task_name'],
      render: (_, record) => {
        if (record.assigned_tasks && record.assigned_tasks.length > 0) {
          return <span className="task-name">{record.assigned_tasks[0].task_name}</span>;
        }
        return <span className="miscellaneous-task">Miscellaneous Work</span>;
      },
      width: '20%',
      sorter: (a, b) => {
        const aTaskName = a.assigned_tasks?.[0]?.task_name || 'Miscellaneous Work';
        const bTaskName = b.assigned_tasks?.[0]?.task_name || 'Miscellaneous Work';
        return aTaskName.localeCompare(bTaskName);
      },
    },
    {
      title: 'Project ID',
      key: 'project_id',
      render: (_, record) => {
        // First check if the record already has a project_id directly assigned
        if (record.project_id) {
          return <Tag color="purple" className="project-id-tag">{record.project_id}</Tag>;
        }
        
        // If not found, check all assigned tasks for a matching project ID in taskAllocations
        if (record.assigned_tasks && record.assigned_tasks.length > 0) {
          // Try each task ID in the assigned tasks
          for (const task of record.assigned_tasks) {
            const taskId = task.task_id;
            if (taskAllocations[taskId] && taskAllocations[taskId].projectId) {
    return (
                <Tag color="purple" className="project-id-tag">
                  {taskAllocations[taskId].projectId}
      </Tag>
    );
            }
          }
        }
        
        // If still not found, use a consistent N/A format
        return <Tag color="default" className="na-tag">N/A</Tag>;
      },
      width: '10%',
      sorter: (a, b) => {
        // Get project ID from record or from the first matching task in taskAllocations
        const getProjectId = (record) => {
          if (record.project_id) return record.project_id;
          
          if (record.assigned_tasks && record.assigned_tasks.length > 0) {
            for (const task of record.assigned_tasks) {
              if (taskAllocations[task.task_id]?.projectId) {
                return taskAllocations[task.task_id].projectId;
              }
            }
          }
          
          return '';
        };
        
        return getProjectId(a).localeCompare(getProjectId(b));
      },
      filters: [
        { text: 'Has Project', value: 'has-project' },
        { text: 'No Project', value: 'no-project' }
      ],
      onFilter: (value, record) => {
        const hasProject = record.project_id || 
          (record.assigned_tasks?.some(task => taskAllocations[task.task_id]?.projectId));
        
        return (value === 'has-project' && hasProject) || 
               (value === 'no-project' && !hasProject);
      },
    },
    {
      title: 'Date',
      dataIndex: 'entry_date',
      key: 'entry_date',
      render: (date) => (
        <span className="entry-date">
          <CalendarOutlined style={{ marginRight: 8 }} />
          {moment(date).format('DD MMM YYYY')}
        </span>
      ),
      width: '12%',
      sorter: (a, b) => moment(a.entry_date).diff(moment(b.entry_date)),
    },
    {
      title: 'In-Time',
      dataIndex: 'in_time',
      key: 'in_time',
      render: (time) => (
        <span className="time-tag time-in">
          <ClockCircleOutlined style={{ marginRight: 5 }} />
          {time || 'N/A'}
        </span>
      ),
      width: '10%',
    },
    {
      title: 'Out-Time',
      dataIndex: 'out_time',
      key: 'out_time',
      render: (time) => (
        <span className="time-tag time-out">
          <ClockCircleOutlined style={{ marginRight: 5 }} />
          {time || 'N/A'}
        </span>
      ),
      width: '10%',
    },
    {
      title: 'Working Hours',
      dataIndex: 'total_hours',
      key: 'total_hours',
      render: (hours) => (
        <span className="time-tag working-hours">
          <FieldTimeOutlined style={{ marginRight: 5 }} />
          {hours} hrs
        </span>
      ),
      width: '12%',
      sorter: (a, b) => a.total_hours - b.total_hours,
    },

    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<SearchOutlined />}
          onClick={() => {
            setSelectedTimesheet(record);
            setViewModalVisible(true);
          }}
          className="view-button"
        >
          View
        </Button>
      ),
      width: '8%',
      align: 'center',
    }
  ];
  
  // Update the handleSaveTimesheet function
  const handleSaveTimesheet = async () => {
    if (!selectedEmployee || filteredTimesheets.length === 0) {
      message.error('No timesheet data to save');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data to be saved - create an array of entries
      const timesheetData = filteredTimesheets.map(entry => ({
        employee_id: selectedEmployee,
        employee_name: employeeName,
        task_id: entry.assigned_tasks && entry.assigned_tasks.length > 0 ? entry.assigned_tasks[0].task_id : null,
        task_name: entry.assigned_tasks && entry.assigned_tasks.length > 0 ? entry.assigned_tasks[0].task_name : null,
        project_id: entry.project_id || null,
        entry_date: entry.entry_date,
        in_time: entry.in_time,
        out_time: entry.out_time,
        total_hours: entry.total_hours
      }));
      
      // Call API to save timesheet summary - we'll save each entry individually
      const savePromises = timesheetData.map(entry => 
        axios.post(`${API_BASE_URL}/api/timesheet-summary`, entry)
      );
      
      const results = await Promise.allSettled(savePromises);
      
      // Check if all entries were saved successfully
      const allSuccessful = results.every(result => result.status === 'fulfilled');
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      
      if (allSuccessful) {
        message.success(`All ${timesheetData.length} timesheet entries saved successfully`);
      } else {
        message.warning(`Saved ${successCount} out of ${timesheetData.length} entries`);
      }
    } catch (error) {
      console.error('Error saving timesheet summary:', error);
      message.error('An error occurred while saving timesheet summary');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div 
      className="timesheet-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* New Header Section */}
      <div className="timesheet-page-header">
        <div className="timesheet-header-icon">
          <ClockCircleOutlined />
        </div>
        <div className="timesheet-header-content">
          <h1 className="timesheet-header-title">Time Sheet Summary</h1>
          <p className="timesheet-header-subtitle">View and manage employee timesheet records</p>
        </div>
      </div>
      
      <Card className="timesheet-card" variant="borderless">
        <div className="timesheet-content">
          {/* Enhanced Filter Section */}
          <div>
            <Card className="timesheet-filter-panel" variant="borderless">
              <div className="timesheet-filter-header" onClick={toggleFilterPanel}>
                <div className="timesheet-filter-title-section">
                  <FilterOutlined className="timesheet-filter-icon" />
                  <span className="timesheet-filter-title">Filter Options</span>
                </div>
                <Button 
                  type="text" 
                  icon={filterExpanded ? <UpOutlined /> : <DownOutlined />}
                  className="timesheet-filter-toggle"
                />
              </div>
              
              <AnimatePresence>
                {filterExpanded && (
          <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
          >
            <Form 
              form={form}
              onFinish={handleFilterSubmit}
                      className="timesheet-filter-form"
              layout="horizontal"
            >
                      <div className="timesheet-filter-content">
                        <div className="timesheet-filter-inputs">
                          <div className="timesheet-filter-input-group">
                            <div className="timesheet-input-label">
                              <span className="required-asterisk">*</span>
                              <UserOutlined className="timesheet-input-icon" />
                              <span>Employee</span>
                            </div>
              <Form.Item 
                name="employee" 
                              rules={[{ required: true, message: 'Required' }]}
                              className="timesheet-form-item"
              >
                <Select
                  showSearch
                                placeholder="Select employee"
                      style={{ width: '100%' }}
                  onChange={handleEmployeeChange}
                  allowClear
                  loading={employeeLoading}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                                className="timesheet-employee-select"
                                popupClassName="timesheet-select-dropdown"
                                suffixIcon={null}
                                notFoundContent={
                                  employeeLoading ? <Spin size="small" /> : 
                                  <Empty 
                                    description="No employees found" 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                  />
                                }
                                dropdownRender={menu => (
                                  <div>
                                    <div className="timesheet-dropdown-header">
                                      <UserOutlined className="timesheet-dropdown-icon" />
                                      <span>Select Employee</span>
                                    </div>
                                    {menu}
                                  </div>
                                )}
                >
                  {employees.map(emp => (
                                  <Select.Option key={emp.value} value={emp.value} label={emp.label}>
                                    <div className="timesheet-employee-option">
                                      <Avatar 
                                        size="small" 
                                        icon={<UserOutlined />} 
                                        className="timesheet-employee-avatar" 
                                        style={{ 
                                          background: `hsla(${emp.value.charCodeAt(0) * 5}, 70%, 60%, 1)` 
                                        }}
                                      />
                                      <div className="timesheet-employee-details">
                                        <div className="timesheet-employee-name">{emp.name}</div>
                                        <div className="timesheet-employee-id">{emp.value}</div>
                                      </div>
                                    </div>
                                  </Select.Option>
                  ))}
                </Select>
              </Form.Item>
                          </div>

                          <div className="timesheet-filter-input-group">
                            <div className="timesheet-input-label">
                              <CalendarOutlined className="timesheet-input-icon" />
                              <span>Date Range</span>
                            </div>
                  <Form.Item
                    name="dateRange"
                              className="timesheet-form-item"
                  >
                    <RangePicker
                      style={{ width: '100%' }}
                      format="DD MMM YYYY"
                                placeholder={['Start date', 'End date']}
                      onChange={handleDateRangeChange}
                      allowClear
                      showToday={true}
                      showTime={false}
                                separator={<span className="timesheet-date-separator">to</span>}
                                className="timesheet-datepicker"
                                suffixIcon={<CalendarOutlined />}
                                popupClassName="timesheet-datepicker-popup"
                      ranges={{
                        'Today': [moment(), moment()],
                        'This Week': [moment().startOf('week'), moment().endOf('week')],
                        'This Month': [moment().startOf('month'), moment().endOf('month')],
                                  'Last Month': [moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month')]
                                }}
                                presets={[
                                  { label: 'Today', value: [moment(), moment()] },
                                  { label: 'Last 7 Days', value: [moment().subtract(6, 'days'), moment()] },
                                  { label: 'Last 30 Days', value: [moment().subtract(29, 'days'), moment()] },
                                  { label: 'This Month', value: [moment().startOf('month'), moment().endOf('month')] },
                                  { label: 'Last Month', value: [moment().subtract(1, 'months').startOf('month'), moment().subtract(1, 'months').endOf('month')] },
                                ]}
                                dropdownClassName="timesheet-datepicker-popup"
                    />
                  </Form.Item>
                          </div>
                        </div>

                        <div className="timesheet-filter-actions">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SearchOutlined />}
                      loading={loading}
                            className="timesheet-search-btn"
                >
                  Search
                </Button>
                <Button 
                  onClick={handleFilterReset}
                            icon={<ReloadOutlined />}
                            className="timesheet-reset-btn"
                >
                  Reset
                </Button>
                          {filteredTimesheets.length > 0 && (
                            <Button 
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              className="timesheet-save-btn"
                              onClick={handleSaveTimesheet}
                            >
                              Save
                            </Button>
                          )}
                  </div>
                      </div>
            </Form>
          </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
          
          <Spin spinning={loading}>
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="timesheet-error-alert"
                >
                  <Tag color="error" style={{ marginRight: '8px' }}>ERROR</Tag>
                  <span>{error}</span>
                  <div className="timesheet-retry-action">
                    <Button 
                      size="small" 
                      type="primary"
                      danger
                      onClick={() => {
                        if (selectedEmployee) {
                          message.info('Retrying API connection...');
                          fetchTimesheetEntries(selectedEmployee, 
                            dateRange && dateRange[0] ? dateRange[0] : null, 
                            dateRange && dateRange[1] ? dateRange[1] : null);
                        }
                      }}
                    >
                      Retry Connection
                    </Button>
                  </div>
                </motion.div>
              )}
              
                {/* Employee Info Card */}
              {filteredTimesheets.length > 0 ? (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                <Card 
                    className="timesheet-employee-info" 
                    variant="borderless"
                >
                  <Space direction="vertical" size="small">
                      {selectedEmployee ? (
                        <>
                          <Row gutter={24} align="middle">
                            <Col>
                              <Space className="timesheet-info-group">
                      <Text strong>Employee ID</Text>
                                <Tag color="purple" className="timesheet-id-tag">{selectedEmployee}</Tag>
                    </Space>
                            </Col>
                            <Col>
                              <Space className="timesheet-info-group">
                      <Text strong>Employee Name</Text>
                                <Text className="timesheet-emp-name">
                                  {employeeName || 'Unknown'}
                                </Text>
                    </Space>
                            </Col>
                            {dateRange[0] && dateRange[1] && (
                              <Col>
                                <Space className="timesheet-info-group">
                                  <Text strong>Date Range</Text>
                                  <Tag color="blue" className="timesheet-date-tag">
                                    <CalendarOutlined style={{ marginRight: 5 }} />
                                    {dateRange[0].format('DD MMM YYYY')} → {dateRange[1].format('DD MMM YYYY')}
                                  </Tag>
                                </Space>
                              </Col>
                            )}
                          </Row>
                          <Text type="secondary" className="timesheet-data-source">
                            <UserOutlined style={{ marginRight: '5px' }} />
                            {error ? 'Showing offline demo data' : 'Data fetched from timesheet API'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text strong>Employee Timesheet Summary</Text>
                          <Text>Displaying all employee timesheets</Text>
                        </>
                      )}
                  </Space>
                </Card>
                
                  <div className="timesheet-stats-container">
                    <motion.div 
                      className="timesheet-stat-card"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      whileHover={{ y: -5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}
                    >
                      <div className="timesheet-stat-icon timesheet-entries-icon">
                        <CalendarOutlined />
                      </div>
                      <div className="timesheet-stat-content">
                        <div className="timesheet-stat-title">Total Entries</div>
                        <div className="timesheet-stat-value">{filteredTimesheets.length}</div>
                      </div>
                    </motion.div>
                    <motion.div 
                      className="timesheet-stat-card"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      whileHover={{ y: -5, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}
                    >
                      <div className="timesheet-stat-icon timesheet-hours-icon">
                        <FieldTimeOutlined />
                      </div>
                      <div className="timesheet-stat-content">
                        <div className="timesheet-stat-title">Total Hours</div>
                        <div className="timesheet-stat-value">
                          {filteredTimesheets.reduce((acc, curr) => acc + parseFloat(curr.total_hours || 0), 0).toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                  >
                <Table 
                      dataSource={filteredTimesheets.map(item => ({...item, status: undefined}))} 
                  columns={timesheetColumns}
                  rowKey="entry_id"
                  size="middle"
                      pagination={{ 
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items` 
                      }}
                      className="timesheet-table"
                      loading={loading}
                      scroll={{ x: 1000 }}
                      onRow={(record) => ({
                        onClick: () => {
                          setSelectedTimesheet(record);
                          setViewModalVisible(true);
                        },
                        style: { cursor: 'pointer' }
                      })}
                      rowClassName={(record, index) => 
                        index % 2 === 0 ? 'timesheet-table-row-even' : 'timesheet-table-row-odd'
                      }
                    />
                  </motion.div>
                </motion.div>
              ) : (
                employeeSearched ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Empty 
                      description={
                        <div className="timesheet-empty-results">
                          <p>No timesheets found for the selected employee and date range</p>
                          <Button type="primary" onClick={handleFilterReset} className="timesheet-reset-filters-btn">Reset Filters</Button>
                        </div>
                      }
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    className="timesheet-empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div 
                      className="timesheet-empty-icon"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 300 }}
                    >
                      <ClockCircleOutlined />
                    </motion.div>
                    <motion.h3 
                      className="timesheet-empty-title"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      No Timesheets Selected
                    </motion.h3>
                    <motion.p 
                      className="timesheet-empty-text"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                    >
                      Select an employee and date range, then click Search to view timesheets
                    </motion.p>
                    <motion.div 
                      className="timesheet-empty-action"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Button 
                        type="primary" 
                        icon={<UserOutlined />}
                        onClick={() => {
                          const firstEmployee = employees[0]?.value;
                          if (firstEmployee) {
                            form.setFieldsValue({ employee: firstEmployee });
                            setSelectedEmployee(firstEmployee);
                            
                            // Also set a default date range for better UX
                            const today = moment();
                            const lastMonth = moment().subtract(30, 'days');
                            form.setFieldsValue({ dateRange: [lastMonth, today] });
                            setDateRange([lastMonth, today]);
                            
                            // Focus on the search button
                            setTimeout(() => {
                              const searchBtn = document.querySelector('.timesheet-search-btn');
                              if (searchBtn) searchBtn.focus();
                            }, 100);
                          }
                        }}
                        disabled={!employees.length}
                        className="timesheet-select-emp-btn"
                      >
                        Select Employee
                      </Button>
                    </motion.div>
                    <motion.div 
                      className="timesheet-empty-hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      <InfoCircleOutlined style={{ marginRight: 5 }} />
                      Timesheets provide a record of employee working hours and activities
                    </motion.div>
                  </motion.div>
                )
            )}
          </Spin>
        </div>
      </Card>
      
      {/* Timesheet Detail Modal */}
      <Modal
        title={
          <div className="modal-title">
            <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />  
            Timesheet Details
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
        className="timesheet-detail-modal"
        destroyOnClose={true}
        centered
      >
        {selectedTimesheet && (
          <motion.div 
            className="timesheet-detail-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Process selectedTimesheet object without modifying the original */}
            {(() => { 
              // Create a new object instead of modifying the constant
              const timesheet = {...selectedTimesheet};
              delete timesheet.status;
              delete timesheet.approved_by;
              delete timesheet.approval_date;
              delete timesheet.rejection_reason;
              // Use the processed timesheet in subsequent code
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Descriptions 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', color: '#1890ff', fontWeight: 600 }}>
                        <UserOutlined style={{ marginRight: 8 }} /> Basic Information
                      </div>
                    } 
                    bordered 
                    layout="vertical"
                    size="middle"
                    column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                    className="timesheet-description"
                  >
                    <Descriptions.Item 
                      label={<span style={{ display: 'flex', alignItems: 'center' }}><UserOutlined style={{ marginRight: 5 }} /> Employee</span>} 
                      span={3}
                    >
                      <Text strong>{timesheet.employee_name}</Text> <Tag color="purple" className="timesheet-id-tag">{timesheet.employee_id}</Tag>
              </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ display: 'flex', alignItems: 'center' }}><CalendarOutlined style={{ marginRight: 5 }} /> Date</span>}
                    >
                      {moment(timesheet.entry_date).format('DD MMM YYYY')}
              </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ display: 'flex', alignItems: 'center' }}><ClockCircleOutlined style={{ marginRight: 5 }} /> Work Hours</span>}
                    >
                      <span className="time-tag time-in">{timesheet.in_time}</span> to <span className="time-tag time-out">{timesheet.out_time}</span>
              </Descriptions.Item>
                    <Descriptions.Item 
                      label={<span style={{ display: 'flex', alignItems: 'center' }}><FieldTimeOutlined style={{ marginRight: 5 }} /> Total Hours</span>}
                    >
                      <span className="time-tag working-hours">{timesheet.total_hours} hrs</span>
              </Descriptions.Item>
                    
                    {/* Project Information */}
                    <Descriptions.Item 
                      label={<span style={{ display: 'flex', alignItems: 'center' }}><SearchOutlined style={{ marginRight: 5 }} /> Project</span>} 
                      span={3}
                    >
                      {(() => {
                        // First check if the timesheet has project_id directly assigned
                        if (timesheet.project_id) {
                          return (
                            <div className="project-info-container">
                              <Tag color="purple" className="project-id-tag">{timesheet.project_id}</Tag>
                              {timesheet.project_name && 
                                <span className="project-name-detail">{timesheet.project_name}</span>
                              }
                  </div>
                          );
                        }
                        
                        // Try to find project ID from assigned tasks
                        if (timesheet.assigned_tasks && timesheet.assigned_tasks.length > 0) {
                          // Check all tasks for a matching project
                          for (const task of timesheet.assigned_tasks) {
                            const taskId = task.task_id;
                            if (taskAllocations[taskId] && taskAllocations[taskId].projectId) {
                              return (
                                <div className="project-info-container">
                                  <Tag color="purple" className="project-id-tag">{taskAllocations[taskId].projectId}</Tag>
                                  {taskAllocations[taskId].projectName && 
                                    <span className="project-name-detail">{taskAllocations[taskId].projectName}</span>
                                  }
                                  <div className="task-relation-info">
                                    <Text type="secondary">From Task: <Tag color="blue" size="small">{taskId}</Tag></Text>
                  </div>
                                </div>
                              );
                            }
                          }
                        }
                        
                        // If nothing found
                        return <Tag color="default" className="na-tag">No Project Assigned</Tag>;
                      })()}
              </Descriptions.Item>
            </Descriptions>
                </motion.div>
              );
            })()}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Divider orientation="left">
                <div style={{ display: 'flex', alignItems: 'center', color: '#1890ff' }}>
                  <SearchOutlined style={{ marginRight: 8 }} /> Assigned Tasks
                </div>
              </Divider>
              
              {(() => {
                // Use the same timesheet object created above
                const timesheet = {...selectedTimesheet};
                delete timesheet.status;
                delete timesheet.approved_by;
                delete timesheet.approval_date;
                delete timesheet.rejection_reason;
                
                return timesheet.assigned_tasks && timesheet.assigned_tasks.length > 0 ? (
              <Table
                    dataSource={timesheet.assigned_tasks.map(task => ({...task, status: undefined}))}
                rowKey={(record, index) => `assigned-${index}`}
                pagination={false}
                size="small"
                className="tasks-table"
                columns={[
                  {
                    title: 'Task ID',
                    dataIndex: 'task_id',
                    key: 'task_id',
                    render: (id) => <Tag color="blue">{id}</Tag>
                  },
                  {
                    title: 'Task Name',
                    dataIndex: 'task_name',
                    key: 'task_name',
                  },
                      {
                        title: 'Project',
                        key: 'project',
                        render: (_, record) => {
                          const taskId = record.task_id;
                          if (taskAllocations[taskId] && taskAllocations[taskId].projectId) {
                            return (
                              <Tag color="purple" className="project-id-tag">
                                {taskAllocations[taskId].projectId}
                              </Tag>
                            );
                          }
                          // Enhanced N/A formatting
                          return <Tag color="default" className="na-tag">N/A</Tag>;
                        }
                  },
                  {
                    title: 'Time Spent',
                    dataIndex: 'time_spent',
                    key: 'time_spent',
                        render: (hours) => <Tag color="blue">{hours} {hours === 1 ? 'hr' : 'hrs'}</Tag>
                  },
                  {
                    title: 'Remarks',
                    dataIndex: 'remarks',
                    key: 'remarks',
                  }
                ]}
              />
            ) : (
                  <div className="no-data-message">No assigned tasks available</div>
                );
              })()}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Divider orientation="left">
                <div style={{ display: 'flex', alignItems: 'center', color: '#1890ff' }}>
                  <CalendarOutlined style={{ marginRight: 8 }} /> Miscellaneous Tasks
                </div>
              </Divider>
              
              {(() => {
                // Use the same timesheet object created above
                const timesheet = {...selectedTimesheet};
                delete timesheet.status;
                delete timesheet.approved_by;
                delete timesheet.approval_date;
                delete timesheet.rejection_reason;
                
                return timesheet.misc_tasks && timesheet.misc_tasks.length > 0 ? (
              <Table
                    dataSource={timesheet.misc_tasks.map(task => ({...task, status: undefined}))}
                rowKey={(record, index) => `misc-${index}`}
                pagination={false}
                size="small"
                className="tasks-table"
                columns={[
                  {
                    title: 'Task Description',
                    dataIndex: 'task_description',
                    key: 'task_description',
                        render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
                  },
                  {
                    title: 'Time Spent',
                    dataIndex: 'time_spent',
                    key: 'time_spent',
                        render: (hours) => <Tag color="green">{hours} {hours === 1 ? 'hr' : 'hrs'}</Tag>
                  },
                  {
                    title: 'Remarks',
                    dataIndex: 'remarks',
                    key: 'remarks',
                  }
                ]}
              />
            ) : (
                  <div className="no-data-message">No miscellaneous tasks available</div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </Modal>
    </motion.div>
  );
};

export default TimeSheetSummary; 