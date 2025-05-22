import React, { useState, useCallback, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Typography, 
  Select, 
  DatePicker, 
  message, 
  Button, 
  Space, 
  Spin,
  Row,
  Col,
  Card,
  notification,
  Skeleton,
  Tag,
  Alert,
  Divider,
  Breadcrumb,
  Tooltip,
  Timeline
} from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { 
  UserOutlined, 
  CalendarOutlined, 
  IdcardOutlined, 
  AuditOutlined,
  SaveOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  InfoCircleOutlined,
  HomeOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
  UpCircleOutlined,
  TrophyOutlined,
  HistoryOutlined,
  DownOutlined,
  SwapOutlined,
  FlagOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import './EmployeeStatusPage.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Configure Axios with the base URL of your Flask backend
axios.defaults.baseURL = 'http://127.0.0.1:5000';

const EmployeeStatusPage = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [doj, setDoj] = useState(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [statusDate, setStatusDate] = useState(moment());
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [idSearched, setIdSearched] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [formTouched, setFormTouched] = useState(false);
  
  // New state for position tracking
  const [currentPosition, setCurrentPosition] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [positionHistory, setPositionHistory] = useState([]);
  const [positionChangeDate, setPositionChangeDate] = useState(moment());
  const [isPositionChange, setIsPositionChange] = useState(false);
  
  // Position options
  const positionOptions = [
    { value: 'Managing Director / Founder', label: 'Managing Director / Founder', color: '#722ed1' },
    { value: 'Co-Founder', label: 'Co-Founder', color: '#722ed1' },
    { value: 'Chief Executive Officer', label: 'Chief Executive Officer', color: '#531dab' },
    { value: 'Chief Technology Officer', label: 'Chief Technology Officer', color: '#531dab' },
    { value: 'Chief Operative Officer', label: 'Chief Operative Officer', color: '#531dab' },
    { value: 'Chief Financial Officer', label: 'Chief Financial Officer', color: '#531dab' },
    { value: 'Vice President', label: 'Vice President', color: '#9254de' },
    { value: 'Assistant Vice President', label: 'Assistant Vice President', color: '#9254de' },
    { value: 'Senior Solution Architect', label: 'Senior Solution Architect', color: '#f759ab' },
    { value: 'Solution Architect', label: 'Solution Architect', color: '#eb2f96' },
    { value: 'Senior Software Engineer', label: 'Senior Software Engineer', color: '#fa8c16' },
    { value: 'Software Engineer', label: 'Software Engineer', color: '#fa541c' },
    { value: 'Trainee', label: 'Trainee', color: '#52c41a' },
    { value: 'Internship Trainee', label: 'Internship Trainee', color: '#a0d911' },
  ];
  
  // Enhanced status options with additional data
  const statusOptions = [
    { 
      value: 'Active', 
      color: '#52c41a', 
      icon: <CheckCircleOutlined />, 
      description: 'Employee is currently working'
    },
    { 
      value: 'Resigned', 
      color: '#1890ff', 
      icon: <CloseCircleOutlined />, 
      description: 'Employee has resigned'
    },
    { 
      value: 'Terminated', 
      color: '#ff4d4f', 
      icon: <ExclamationCircleOutlined />, 
      description: 'Employee has been terminated'
    },
    { 
      value: 'OnHold', 
      color: '#faad14', 
      icon: <PauseCircleOutlined />, 
      description: 'Employee status is on hold'
    }
  ];

  // Simulate initial page loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Add confirmation dialog when navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (formTouched && name) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formTouched, name]);

  const fetchDetails = useCallback(async (id) => {
    if (!id) {
      setError("Please enter an Employee ID");
      return;
    }
    
    setLoading(true);
    setError(null);
    setIdSearched(true);
    setShowSuccessMessage(false);
    
    try {
      const res = await axios.get(`http://127.0.0.1:5000/get_employee_status/${id}`);
      if (res.data && res.data.name) {
        setShowSuccessMessage(true);
        setName(res.data.name);
        
        // Properly parse the joining date
        setDoj(res.data.joining_date ? moment(res.data.joining_date, 'DD/MM/YYYY') : null);
        setRole(res.data.role_name || 'Not assigned');
        setStatus(res.data.status || '');
        
        // Set position if available from API
        setCurrentPosition(res.data.position || '');
        setNewPosition(res.data.position || '');
        
        // Set position history if available
        if (res.data.position_history && Array.isArray(res.data.position_history)) {
          setPositionHistory(res.data.position_history);
        } else {
          // Create a default history entry if none exists
          if (res.data.position) {
            setPositionHistory([{
              position: res.data.position,
              date: res.data.joining_date || moment().format('DD/MM/YYYY'),
              remarks: 'Initial position'
            }]);
          } else {
            setPositionHistory([]);
          }
        }
        
        // Properly parse the status date - Fix for the invalid date issue
        if (res.data.status_date) {
          const parsedDate = moment(res.data.status_date, 'DD/MM/YYYY');
          // Ensure the date is valid before setting it
          if (parsedDate.isValid()) {
            setStatusDate(parsedDate);
          } else {
            // If date from API is invalid, set today's date as fallback
            setStatusDate(moment());
            console.warn('Invalid status date received from API, using current date as fallback');
          }
        } else {
          // If no status date is provided, set today's date
          setStatusDate(moment());
        }
        
        setRemarks(res.data.remarks || '');
        setFormTouched(false);
      } else {
        setError("No employee found with this ID. Please check and try again.");
        notification.warning({
          message: 'Employee Not Found',
          description: 'No employee found with this ID. Please check and try again.',
          placement: 'topRight',
          duration: 4,
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
        });
        setName('');
        setDoj(null);
        setRole('');
        setStatus('');
        setStatusDate(moment());
        setRemarks('');
        setCurrentPosition('');
        setNewPosition('');
        setPositionHistory([]);
      }
    } catch (err) {
      console.error('API error occurred:', err);
      setError("Failed to fetch employee details. Please try again later.");
      notification.error({
        message: 'Error',
        description: 'Failed to fetch employee details. Please try again later.',
        placement: 'topRight',
        duration: 4,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
      setName('');
      setDoj(null);
      setRole('');
      setStatus('');
      setStatusDate(moment());
      setRemarks('');
      setCurrentPosition('');
      setNewPosition('');
      setPositionHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get position rank for comparison
  const getPositionRank = (positionValue) => {
    return positionOptions.findIndex(option => option.value === positionValue);
  };

  // Determine if position change is a promotion, demotion, or lateral move
  const getPositionChangeType = (oldPosition, newPosition) => {
    const oldRank = getPositionRank(oldPosition);
    const newRank = getPositionRank(newPosition);
    
    if (oldRank === -1 || newRank === -1) return 'change'; // Can't determine
    
    if (newRank < oldRank) return 'promotion'; // Lower index = higher position
    if (newRank > oldRank) return 'demotion';
    return 'lateral'; // Same level
  };

  // Get text description for position change type
  const getPositionChangeDescription = (changeType) => {
    switch(changeType) {
      case 'promotion': return 'Promoted';
      case 'demotion': return 'Changed';
      case 'lateral': return 'Moved';
      default: return 'Changed';
    }
  };

  const handleSave = async () => {
    if (!employeeId || (!status && !isPositionChange) || (!statusDate && !positionChangeDate)) {
      message.warning({
        content: 'Please fill all required fields.',
        className: 'custom-message-warning',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      });
      return;
    }

    // Additional validation for dates
    if ((statusDate && !statusDate.isValid()) || (positionChangeDate && !positionChangeDate.isValid())) {
      message.warning({
        content: 'Please select valid dates.',
        className: 'custom-message-warning',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      });
      return;
    }
    
    // If position change, validate new position
    if (isPositionChange && !newPosition) {
      message.warning({
        content: 'Please select a new position.',
        className: 'custom-message-warning',
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      });
      return;
    }

    setSaveLoading(true);
    
    try {
      // If this is a position change
      if (isPositionChange) {
        // In a real implementation, you would call an API endpoint to update position
        // For now, let's simulate success
        
        // Determine if this is a promotion, demotion, or lateral move
        const changeType = getPositionChangeType(currentPosition, newPosition);
        
        // Create a new position history entry
        const newHistoryEntry = {
          from: currentPosition,
          to: newPosition,
          date: positionChangeDate.format('DD/MM/YYYY'),
          changeType: changeType,
          remarks: remarks || `${getPositionChangeDescription(changeType)} from ${currentPosition || 'None'} to ${newPosition}`
        };
        
        // Update position history
        const updatedHistory = [...positionHistory, newHistoryEntry];
        
        notification.success({
          message: changeType === 'promotion' ? 'Promotion Recorded' : 'Position Updated',
          description: `Position successfully changed from ${currentPosition || 'None'} to ${newPosition}`,
          placement: 'topRight',
          duration: 4,
          icon: changeType === 'promotion' ? 
            <TrophyOutlined style={{ color: '#52c41a' }} /> : 
            <UpCircleOutlined style={{ color: '#52c41a' }} />
        });
        
        // In a real implementation, you would save this updated history to the backend
        console.log('Position history to save:', updatedHistory);
        console.log('New position to save:', newPosition);
        
        // Update UI state
        setCurrentPosition(newPosition);
        setPositionHistory(updatedHistory);
        setIsPositionChange(false);
        setFormTouched(false);
        
        // Add a small delay before navigating for better UX
        setTimeout(() => {
          navigate('/employees');
        }, 800);
      } else {
        // Regular status update
        const payload = {
          status,
          statusDate: statusDate.format('DD/MM/YYYY'),
          remarks,
        };

        await axios.post(`http://127.0.0.1:5000/update_employee_status/${employeeId}`, payload);
        notification.success({
          message: 'Success',
          description: 'Employee status updated successfully!',
          placement: 'topRight',
          duration: 4,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
        
        setFormTouched(false);
        
        // Add a small delay before navigating for better UX
        setTimeout(() => {
          navigate('/employees');
        }, 800);
      }
    } catch (err) {
      console.error('Save error:', err);
      notification.error({
        message: 'Error',
        description: 'Failed to update employee information. Please try again.',
        placement: 'topRight',
        duration: 4,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = () => {
    // Create a reset animation effect
    setIdSearched(false);
    setError(null);
    setShowSuccessMessage(false);
    setFormTouched(false);
    
    setTimeout(() => {
      setEmployeeId('');
      setName('');
      setDoj(null);
      setRole('');
      setStatus('');
      setStatusDate(moment());
      setRemarks('');
    }, 300);
  };

  // Handle employee ID input change and fetch data when user finishes typing
  const handleEmployeeIdChange = (e) => {
    const id = e.target.value.trim();
    setEmployeeId(id);
    
    // Clear any existing error when user starts typing a new ID
    if (error) {
      setError(null);
    }
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If ID is not empty, set a timeout to fetch details after user stops typing
    if (id) {
      const timeout = setTimeout(() => {
        fetchDetails(id);
      }, 800); // 800ms delay
      
      setSearchTimeout(timeout);
    } else {
      // If ID is empty, clear the form
      setIdSearched(false);
      setName('');
      setDoj(null);
      setRole('');
      setStatus('');
      setStatusDate(moment());
      setRemarks('');
    }
  };

  // Handle form field changes
  const handleFormChange = () => {
    if (name) {
      setFormTouched(true);
    }
  };

  // Find current status object
  const currentStatusOption = statusOptions.find(opt => opt.value === status) || {};

  // Get color for position badge
  const getPositionColor = (positionValue) => {
    const position = positionOptions.find(option => option.value === positionValue);
    return position ? position.color : '#8c8c8c';
  };

  if (pageLoading) {
    return (
      <div className="employee-status-container loading-container">
        <Skeleton active paragraph={{ rows: 1 }} className="breadcrumb-skeleton" />
        <Skeleton active paragraph={{ rows: 1 }} className="header-skeleton" />
        <Card className="employee-card">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="employee-status-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="page-breadcrumb"
      >
        <Breadcrumb>
          <Breadcrumb.Item href="/">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/employees">
            <TeamOutlined /> Employees
          </Breadcrumb.Item>
          <Breadcrumb.Item>Status Update</Breadcrumb.Item>
        </Breadcrumb>
      </motion.div>
      
      {/* Custom Header */}
      <motion.div
        className="employee-status-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <UserOutlined className="header-icon" />
        <span className="header-text">Employee Status Update</span>
      </motion.div>
      
      {/* Error Notification */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="error-notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <CloseCircleOutlined className="error-icon" /> {error}
            <Button 
              type="text" 
              icon={<CloseOutlined />} 
              className="close-error-btn"
              onClick={() => setError(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner */}
      <AnimatePresence>
        {!idSearched && idSearched !== undefined && (
          <motion.div 
            className="info-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InfoCircleOutlined className="info-banner-icon" />
            <div className="info-banner-content">
              <div className="info-banner-title">Update Employee Status</div>
              <div className="info-banner-description">Enter an Employee ID to retrieve employee details and update their status.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            className="success-notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="success-icon-wrapper">
              <CheckCircleOutlined className="success-icon" />
            </div>
            <span>Employee ID found!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="employee-card">
        <div className="employee-card-header">
          <div className="card-header-icon">
            <UserOutlined />
          </div>
          <div className="card-header-content">
            <h2 className="card-header-title">Employee Information</h2>
            <p className="card-header-subtitle">Update status and track position changes</p>
          </div>
        </div>
        <Form layout="vertical" className="employee-form" onChange={handleFormChange}>
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Form.Item 
                  label={<Text strong><IdcardOutlined /> Employee ID</Text>}
                  required
                  className="form-item"
                  help={error ? <div className="error-text">{error}</div> : null}
                  validateStatus={error ? "error" : ""}
                >
                  <Input
                    placeholder="Enter Employee ID"
                    value={employeeId}
                    onChange={handleEmployeeIdChange}
                    className="custom-input"
                    allowClear
                    prefix={<IdcardOutlined className="site-form-item-icon" />}
                    suffix={loading && <Spin size="small" />}
                    size="large"
                    autoFocus
                  />
                </Form.Item>
              </motion.div>
            </Col>
            
            <Col xs={24} sm={12}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Form.Item 
                  label={<Text strong><UserOutlined /> Name</Text>}
                  className="form-item"
                >
                  <Input
                    value={name}
                    disabled
                    className="custom-input disabled-input"
                    prefix={<UserOutlined className="site-form-item-icon" />}
                    size="large"
                  />
                </Form.Item>
              </motion.div>
            </Col>
          </Row>

          <AnimatePresence>
            {idSearched && (
              <motion.div
                className="form-detail-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
              >
                {name && (
                  <div className="section-title-container">
                    <motion.div 
                      className="section-header"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <div className="section-header-icon">
                        <UserOutlined />
                      </div>
                      <Text className="section-header-text">Employee Details</Text>
                      {employeeId && (
                        <Tag color="#1890ff" className="employee-id-tag">
                          ID: {employeeId}
                        </Tag>
                      )}
                    </motion.div>
                  </div>
                )}
                
                <Row gutter={24}>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      label={<Text strong><CalendarOutlined /> Date of Joining</Text>}
                      className="form-item"
                    >
                      <DatePicker
                        value={doj}
                        disabled
                        format="DD/MM/YYYY"
                        className="custom-datepicker disabled-input"
                        style={{ width: '100%' }}
                        suffixIcon={<CalendarOutlined />}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      label={<Text strong><AuditOutlined /> Role Name</Text>}
                      className="form-item"
                    >
                      <Input
                        value={role}
                        disabled
                        className="custom-input disabled-input"
                        prefix={<AuditOutlined className="site-form-item-icon" />}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Position Information */}
                {name && (
                  <div className="section-title-container">
                    <motion.div 
                      className="section-header"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25, duration: 0.4 }}
                    >
                      <div className="section-header-icon position-icon">
                        <TrophyOutlined />
                      </div>
                      <Text className="section-header-text">Position Information</Text>
                      {currentPosition && (
                        <Tag color={getPositionColor(currentPosition)} className="current-position-tag">
                          Current Position: {currentPosition}
                        </Tag>
                      )}
                      <div className="toggle-position-change">
                        <Button 
                          type={isPositionChange ? "primary" : "default"}
                          size="small" 
                          icon={<UpCircleOutlined />}
                          onClick={() => setIsPositionChange(!isPositionChange)}
                          className={isPositionChange ? "position-change-active" : ""}
                        >
                          {isPositionChange ? "Cancel Position Change" : "Update Position"}
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
                
                {/* Position Change Form */}
                <AnimatePresence>
                  {isPositionChange && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="position-change-section"
                    >
                      <Card className="position-change-card">
                        <Row gutter={24}>
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<Text strong><UpCircleOutlined /> New Position</Text>}
                              required
                              className="form-item"
                            >
                              <Select
                                value={newPosition}
                                onChange={(value) => {
                                  setNewPosition(value);
                                  setFormTouched(true);
                                }}
                                className="enhanced-select"
                                placeholder="Select New Position"
                                disabled={!employeeId}
                                size="large"
                              >
                                {positionOptions.map((option) => (
                                  <Option 
                                    key={option.value} 
                                    value={option.value}
                                    className="position-option"
                                  >
                                    <div className="position-option-row">
                                      <Tag color={option.color} className="position-tag">
                                        {option.label}
                                      </Tag>
                                      {currentPosition === option.value && (
                                        <span className="current-indicator">(Current)</span>
                                      )}
                                    </div>
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          
                          <Col xs={24} sm={12}>
                            <Form.Item 
                              label={<Text strong><CalendarOutlined /> Date of Position Change</Text>}
                              required
                              className="form-item"
                            >
                              <DatePicker
                                value={positionChangeDate}
                                onChange={(date) => {
                                  setPositionChangeDate(date);
                                  setFormTouched(true);
                                }}
                                format="DD/MM/YYYY"
                                placeholder="Select Date"
                                disabled={!employeeId}
                                className="custom-datepicker"
                                style={{ width: '100%' }}
                                suffixIcon={<CalendarOutlined />}
                                defaultValue={moment()}
                                size="large"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        
                        <Form.Item 
                          label={<Text strong><InfoCircleOutlined /> Position Change Remarks</Text>}
                          className="form-item"
                        >
                          <TextArea
                            rows={2}
                            value={remarks}
                            onChange={(e) => {
                              setRemarks(e.target.value);
                              setFormTouched(true);
                            }}
                            className="custom-textarea"
                            placeholder="Enter remarks about the position change..."
                            disabled={!employeeId}
                          />
                        </Form.Item>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Position History */}
                {currentPosition && positionHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="position-history-section"
                  >
                    <div className="position-history-header">
                      <HistoryOutlined /> Position History
                    </div>
                    <div className="position-history-timeline">
                      <Timeline mode="left">
                        {positionHistory.map((item, index) => (
                          <Timeline.Item 
                            key={index} 
                            color={getPositionColor(item.to || item.position)}
                            label={item.date}
                          >
                            {item.to ? (
                              <div className="timeline-item-content">
                                <div className="timeline-item-title">
                                  {item.changeType === 'promotion' ? (
                                    <>
                                      <Tag color="#52c41a" icon={<TrophyOutlined />} className="change-type-tag promotion-tag">
                                        Promotion
                                      </Tag>
                                      From <Tag color={getPositionColor(item.from)}>{item.from}</Tag> to <Tag color={getPositionColor(item.to)}>{item.to}</Tag>
                                    </>
                                  ) : item.changeType === 'demotion' ? (
                                    <>
                                      <Tag color="#faad14" icon={<DownOutlined />} className="change-type-tag demotion-tag">
                                        Change
                                      </Tag>
                                      From <Tag color={getPositionColor(item.from)}>{item.from}</Tag> to <Tag color={getPositionColor(item.to)}>{item.to}</Tag>
                                    </>
                                  ) : (
                                    <>
                                      <Tag color="#1890ff" icon={<SwapOutlined />} className="change-type-tag lateral-tag">
                                        Move
                                      </Tag>
                                      From <Tag color={getPositionColor(item.from)}>{item.from}</Tag> to <Tag color={getPositionColor(item.to)}>{item.to}</Tag>
                                    </>
                                  )}
                                </div>
                                {item.remarks && <div className="timeline-item-remarks">{item.remarks}</div>}
                              </div>
                            ) : (
                              <div className="timeline-item-content">
                                <div className="timeline-item-title">
                                  <Tag color="#1890ff" icon={<FlagOutlined />} className="change-type-tag">
                                    Initial Position
                                  </Tag>
                                  <Tag color={getPositionColor(item.position)}>{item.position}</Tag>
                                </div>
                                {item.remarks && <div className="timeline-item-remarks">{item.remarks}</div>}
                              </div>
                            )}
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </div>
                  </motion.div>
                )}

                {name && (
                  <div className="section-title-container">
                    <motion.div 
                      className="section-header"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <div className="section-header-icon">
                        <InfoCircleOutlined />
                      </div>
                      <Text className="section-header-text">Status Information</Text>
                    </motion.div>
                  </div>
                )}

                <Row gutter={24}>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      label={<Text strong><CheckCircleOutlined /> Status</Text>}
                      required={!isPositionChange}
                      className="form-item"
                    >
                      <div className="enhanced-status-select-container">
                        {status && (
                          <motion.div 
                            className="current-status-indicator"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            <Tag color={currentStatusOption.color} className="current-status-tag">
                              Current Status: {status}
                            </Tag>
                          </motion.div>
                        )}
                        
                        <Select
                          value={status}
                          onChange={(value) => {
                            setStatus(value);
                            setFormTouched(true);
                            // Auto-set status date to today if not already set or if invalid
                            if (!statusDate || !statusDate.isValid()) {
                              setStatusDate(moment());
                            }
                          }}
                          className="enhanced-select"
                          placeholder="Select Status"
                          disabled={!employeeId || isPositionChange}
                          optionLabelProp="label"
                          optionFilterProp="label"
                          popupClassName="enhanced-status-dropdown"
                          size="large"
                        >
                          {statusOptions.map((option) => (
                            <Option 
                              key={option.value} 
                              value={option.value} 
                              label={option.value}
                              className="status-option"
                            >
                              <div className="status-option-row">
                                <div className="status-option-icon" style={{ color: option.color }}>
                                  {option.icon}
                                </div>
                                <div className="status-option-content">
                                  <div className="status-option-title" style={{ color: option.color }}>
                                    {option.value}
                                  </div>
                                  <div className="status-option-description">
                                    {option.description}
                                  </div>
                                </div>
                                {status === option.value && (
                                  <div className="status-selected-mark">✓</div>
                                )}
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </Form.Item>
                  </Col>
                  
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      label={<Text strong><CalendarOutlined /> Date of Status Update</Text>}
                      required={!isPositionChange}
                      className="form-item"
                    >
                      <DatePicker
                        value={statusDate}
                        onChange={(date) => {
                          setStatusDate(date);
                          setFormTouched(true);
                        }}
                        format="DD/MM/YYYY"
                        placeholder="Select Date"
                        disabled={!employeeId || isPositionChange}
                        className="custom-datepicker"
                        style={{ width: '100%' }}
                        suffixIcon={<CalendarOutlined />}
                        // Ensure today's date is used as default
                        defaultValue={moment()}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row>
                  <Col span={24}>
                    <Form.Item 
                      label={<Text strong><InfoCircleOutlined /> Remarks</Text>}
                      className="form-item"
                    >
                      <TextArea
                        rows={4}
                        value={remarks}
                        onChange={(e) => {
                          setRemarks(e.target.value);
                          setFormTouched(true);
                        }}
                        className="custom-textarea"
                        placeholder={isPositionChange ? "Enter remarks about the position change..." : "Enter remarks about the status change..."}
                        disabled={!employeeId}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <motion.div 
                  className="button-group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Space>
                    <Button
                      type="default"
                      onClick={handleReset}
                      disabled={!employeeId}
                      className="reset-button"
                      icon={<UndoOutlined />}
                      size="large"
                    >
                      Reset
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleSave}
                      disabled={!employeeId || ((!status || !statusDate) && (!isPositionChange || !newPosition || !positionChangeDate))}
                      loading={saveLoading}
                      className="save-button"
                      icon={isPositionChange ? <TrophyOutlined /> : <SaveOutlined />}
                      size="large"
                    >
                      {isPositionChange ? "Save Position Change" : "Save Status Change"}
                    </Button>
                  </Space>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </Form>
        
        {!idSearched && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <IdcardOutlined />
            </div>
            <h3 className="empty-state-title">Enter Employee ID</h3>
            <p className="empty-state-text">Enter an employee ID above to view their details and update their status or position</p>
          </div>
        )}
      </Card>
      
      <motion.footer 
        className="page-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="footer-content">
          <div className="footer-left">
            <span>Employee Management System</span>
          </div>
          <div className="footer-right">
            <Tooltip title="Need help?">
              <Button type="text" icon={<QuestionCircleOutlined />} className="help-button">Help</Button>
            </Tooltip>
          </div>
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default EmployeeStatusPage;