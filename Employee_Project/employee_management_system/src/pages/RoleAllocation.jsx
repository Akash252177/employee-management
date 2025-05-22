import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import {
  Form,
  Input,
  Typography,
  Button,
  DatePicker,
  Card,
  message,
  notification,
  Spin,
  Row,
  Col,
  Tooltip,
  Select,
  Skeleton,
  Breadcrumb,
  Space,
  Tag,
  Divider,
  Table,
  Avatar,
  Badge,
  Empty,
  Statistic,
  Tabs,
  Modal
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  UserOutlined, 
  ApartmentOutlined, 
  CalendarOutlined, 
  TeamOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  EditOutlined,
  CopyOutlined,
  ClusterOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './RoleAllocation.css';
import _ from 'lodash';

const { Title } = Typography;
const { Option } = Select;


const api = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  timeout: 10000
});


const ROLE_MAPPING = {
  "MD": { description: "Managing Director/ Founder", parent: "" },
  "CF": { description: "Co - Founder", parent: "MD" },
  "CEO": { description: "Chief Executive Officer", parent: "MD" },
  "CTO": { description: "Chief Technology Officer", parent: "MD" },
  "COO": { description: "Chief Operative Officer", parent: "MD" },
  "CFO": { description: "Chief Financial Officer", parent: "MD" },
  "VP": { description: "Vice President", parent: "CEO" },
  "AVP": { description: "Assistant Vice President", parent: "VP" },
  "SSA": { description: "Senior Solution Architect", parent: "AVP" },
  "SA": { description: "Solution Architect", parent: "SSA" },
  "SSE": { description: "Senior Software Engineer", parent: "SA" },
  "SE": { description: "Software Engineer", parent: "SSE" },
  "TRN": { description: "Traniee", parent: "SSE" },
  "INTRN": { description: "Internship Trainee", parent: "SSE" }
};

// Helper function to get role description
const getRoleDescription = (roleId) => {
  return ROLE_MAPPING[roleId]?.description || '';
};

// Helper function to get parent role
const getParentRole = (roleId) => {
  return ROLE_MAPPING[roleId]?.parent || '';
};

// Optimized animation variants with reduced complexity and duration
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

const successAnimation = {
  initial: { scale: 0.9 },
  animate: { scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
};

// Configure message settings
message.config({
  maxCount: 2, // Allow 2 messages at a time
  duration: 3, // 3 seconds display time
  top: 72, // Position from top for better visibility
});

// Fallback debounce function in case lodash import fails
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};


const RoleAllocation = () => {
  const [form] = Form.useForm();
  const [employeeName, setEmployeeName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [reportingRoleLoading, setReportingRoleLoading] = useState(false);
  const [employeesWithRole, setEmployeesWithRole] = useState([]);
  const [parentRole, setParentRole] = useState('');
  const [parentRoleId, setParentRoleId] = useState('');
  const [animateSuccess, setAnimateSuccess] = useState(false);
  const [errorMessageShown, setErrorMessageShown] = useState(false);
  const [isEmployeeValid, setIsEmployeeValid] = useState(null);
  const [isRoleValid, setIsRoleValid] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [autoFilledReporting, setAutoFilledReporting] = useState(false);
  const [recentAllocations, setRecentAllocations] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [showAllocations, setShowAllocations] = useState(false);
  const [allocationStats, setAllocationStats] = useState({
    total: 0,
    recent: 0,
    pending: 0
  });
  const [selectedReportingEmployeeId, setSelectedReportingEmployeeId] = useState('');
  const navigate = useNavigate();
  const reportingRoleIdRef = useRef(null);
  const [employeeCurrentRole, setEmployeeCurrentRole] = useState('');
  const [roleCompatibilityError, setRoleCompatibilityError] = useState(null);
  const [isMdRoleSelected, setIsMdRoleSelected] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAllocationId, setCurrentAllocationId] = useState(null);
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesListLoading, setEmployeesListLoading] = useState(false);

  // Add this function to fetch all employees
  const fetchEmployees = async () => {
    setEmployeesListLoading(true);
    try {
      const response = await api.get('/api/employees');
      if (response.data && Array.isArray(response.data)) {
        // Map the API response to the format expected by the employee select
        setEmployeesList(response.data.map(employee => ({
          id: employee.employee_id,
          name: employee.employee_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
        })));
      } else {
        console.error('Invalid response format from API:', response.data);
        message.error('Failed to load employees data');
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      message.error('Could not load employees list');
    } finally {
      setEmployeesListLoading(false);
    }
  };

  // Set default date and fetch employees on component mount
  useEffect(() => {
    form.setFieldsValue({ allocatedDate: moment() });
    fetchEmployees(); // Load employees for dropdown
  }, [form]);

  // Effect hook to fetch recent allocations with a ref to prevent double fetching
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchRecentAllocations();
      initialFetchDone.current = true;
    }
  }, []);

  // In the useEffect section, add code to handle loading existing allocation for editing
  useEffect(() => {
    // Check if we're in edit mode by looking for allocation_id in URL params
    const allocationId = searchParams.get('allocation_id');
    
    if (allocationId) {
      setIsEditMode(true);
      setCurrentAllocationId(allocationId);
      loadAllocationData(allocationId);
    }
  }, [searchParams]);

  // Optimized function to fetch recent allocations with Promise.all for parallel requests
  const fetchRecentAllocations = async () => {
    setLoadingAllocations(true);
    try {
      // Make parallel API calls for better performance
      const [allocationsRes, statsRes] = await Promise.all([
        api.get('/api/role_allocations?limit=10'),
        api.get('/api/role_allocations_stats')
      ]);
      
      // Map the response data to match our table structure
      const allocationsData = allocationsRes.data.allocations.map(allocation => ({
        key: allocation.id.toString(),
        employeeId: allocation.employee_id,
        employeeName: allocation.employee_name,
        roleId: allocation.role_id,
        roleName: allocation.role_name,
        allocatedDate: allocation.allocated_date,
        reportingPerson: allocation.reporting_person || 'N/A'
      }));
      
      setRecentAllocations(allocationsData);
      
      // Use data from parallel request
      setAllocationStats({
        total: statsRes.data.total || 0,
        recent: statsRes.data.recent || 0,
        pending: statsRes.data.pending || 0,
        roleDistribution: statsRes.data.roleDistribution || [],
        trend: statsRes.data.trend || []
      });
      
      // Make sure to set loading to false after data is set
      setLoadingAllocations(false);
      setShowAllocations(true);
    } catch (error) {
      console.error('Failed to fetch recent allocations:', error);
      
      // Fallback to mock data if API fails
      const mockData = [
        {
          key: '1',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          roleId: 'CEO',
          roleName: 'Chief Executive Officer',
          allocatedDate: '2023-06-15',
          reportingPerson: 'N/A'
        },
        {
          key: '2',
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          roleId: 'CTO',
          roleName: 'Chief Technology Officer',
          allocatedDate: '2023-06-20',
          reportingPerson: 'EMP001, John Doe, Chief Executive Officer'
        },
        {
          key: '3',
          employeeId: 'EMP003',
          employeeName: 'Robert Johnson',
          roleId: 'SSE',
          roleName: 'Senior Software Engineer',
          allocatedDate: '2023-07-05',
          reportingPerson: 'EMP002, Jane Smith, Chief Technology Officer'
        }
      ];
      
      setRecentAllocations(mockData);
      setAllocationStats({
        total: 15,
        recent: 3,
        pending: 2
      });
      setLoadingAllocations(false);
    }
  };

  // Memoized function to fetch employee name
  const fetchEmployeeName = useCallback(async (employeeId) => {
    try {
      const res = await api.get(`/get_employee_name/${employeeId}`);
      return res.data.name || '';
    } catch (error) {
      console.error('Unable to fetch employee name:', error);
      return '';
    }
  }, []);

  // Memoized function to fetch role name
  const fetchRoleName = useCallback(async (roleId) => {
    try {
      // Check local mapping first using helper function
      const roleDescription = getRoleDescription(roleId);
      if (roleDescription) {
        return roleDescription;
      }
      
      // If not in local mapping, try API
      const res = await api.get(`/get_role_name/${roleId}`);
      return res.data.roleDescription || res.data.roleName || '';
    } catch (error) {
      console.error('Unable to fetch role name:', error);
      return '';
    }
  }, []);

  // Memoized function to fetch employees by role with batch API call
  const fetchEmployeesByRole = useCallback(async (roleId) => {
    try {
      // Make a single API call that returns all necessary data
      const res = await api.get(`/get_employees_by_role/${roleId}?include=role,status`);
      
      const employees = res.data.employees || [];
      if (employees.length > 0) {
        // Data is already included in the response, no need for additional API calls
        return employees.map(employee => ({
          ...employee,
          employeeId: employee.employee_id || employee.id,
          name: employee.employee_name || employee.name,
          roleId: employee.role?.roleId || '',
          roleName: employee.role?.roleName || '',
          reportingPerson: employee.status?.reporting_person || '',
          joiningDate: employee.status?.joining_date || ''
        }));
      }
      return employees;
    } catch (error) {
      console.error('Failed to get employees by role ID:', error);
      return [];
    }
  }, []);

  // Function to check role compatibility
  const checkRoleCompatibility = (employeeRoleId, newRoleId) => {
    // If no current role, any role is compatible
    if (!employeeRoleId) return true;
    
    // If we're in edit mode, only check if the role is being changed
    if (isEditMode && employeeRoleId === newRoleId) {
      return true;
    }
    
    // Cannot assign the same role again (for new allocations)
    if (employeeRoleId === newRoleId) {
      return { 
        isCompatible: false, 
        message: `Employee already has the role ${newRoleId}`
      };
    }
    
    // Define role hierarchy/levels for validation based exactly on the spreadsheet
    const roleLevels = {
      "MD": 1,   // Top level - Managing Director/ Founder
      "CF": 2,   // Level 2 - Co-Founder (reports to MD)
      "CEO": 2,  // Level 2 - Chief Executive Officer (reports to MD)
      "CTO": 2,  // Level 2 - Chief Technology Officer (reports to MD)
      "COO": 2,  // Level 2 - Chief Operative Officer (reports to MD)
      "CFO": 2,  // Level 2 - Chief Financial Officer (reports to MD)
      "VP": 3,   // Level 3 - Vice President (reports to CEO)
      "AVP": 4,  // Level 4 - Assistant Vice President (reports to VP)
      "SSA": 5,  // Level 5 - Senior Solution Architect (reports to AVP)
      "SA": 6,   // Level 6 - Solution Architect (reports to SSA)
      "SSE": 7,  // Level 7 - Senior Software Engineer (reports to SA)
      "SE": 8,   // Level 8 - Software Engineer (reports to SSE)
      "TRN": 9,  // Level 9 - Trainee (reports to SSE)
      "INTRN": 9 // Level 9 - Internship Trainee (reports to SSE)
    };

    // If role is not in the mapping, we can't validate
    if (!roleLevels[employeeRoleId] || !roleLevels[newRoleId]) {
      return true;
    }

    // Create a direct path map based on the actual parent-child relationships
    const directReportingMap = {
      "CF": "MD",
      "CEO": "MD",
      "CTO": "MD",
      "COO": "MD",
      "CFO": "MD",
      "VP": "CEO",
      "AVP": "VP",
      "SSA": "AVP",
      "SA": "SSA",
      "SSE": "SA",
      "SE": "SSE",
      "TRN": "SSE",
      "INTRN": "SSE"
    };

    // Check if this is a direct promotion based on the reporting structure
    if (directReportingMap[newRoleId] === employeeRoleId) {
      // Direct promotion is allowed (e.g., SSE can be promoted to SA)
      return true;
    }

    // Check if new role is at a lower or same level (higher number means lower level)
    // We allow assigning roles at the same level or lower level
    if (roleLevels[newRoleId] >= roleLevels[employeeRoleId]) {
      return true;
    }
    
    // Get specific allowed role transitions based on the hierarchy
    const isValidHierarchyTransition = checkHierarchyValidity(employeeRoleId, newRoleId, directReportingMap);
    if (isValidHierarchyTransition) {
      return true;
    }
    
    // Otherwise, the role is higher in hierarchy (not allowed)
    return { 
      isCompatible: false, 
      message: `Cannot assign ${newRoleId} (${ROLE_MAPPING[newRoleId].description}) to an employee who currently has ${employeeRoleId} (${ROLE_MAPPING[employeeRoleId].description}). The new role has a higher hierarchical level.`
    };
  };

  // Helper function to check specific hierarchical validity
  const checkHierarchyValidity = (currentRole, newRole, directReportingMap) => {
    // Special case promotions that are allowed despite level differences
    const allowedPromotions = {
      // Example: Allow SE to be promoted directly to SA (skipping SSE)
      // "SE": ["SA"]
    };
    
    // Check if this is a special allowed promotion
    if (allowedPromotions[currentRole] && allowedPromotions[currentRole].includes(newRole)) {
      return true;
    }

    // Check if the employee can follow the career path
    // This allows for valid career progressions, e.g., SE -> SSE -> SA
    let nextRoleInPath = directReportingMap[currentRole]; // Get the next role up
    
    // If the new role is the immediate next role in career path, it's valid
    if (nextRoleInPath === newRole) {
      return true;
    }
    
    return false;
  };

  // Updated handle function for employee selection using Select component
  const handleEmployeeSelect = async (value) => {
    if (!value) {
      setEmployeeName('');
      setIsEmployeeValid(null);
      setEmployeeCurrentRole('');
      setRoleCompatibilityError(null);
      return;
    }
    
    setEmployeeLoading(true);
    try {
      // Find selected employee from the list
      const selectedEmployee = employeesList.find(emp => emp.id.toString() === value.toString());
      
      if (selectedEmployee) {
        // Employee found in the list, use the name directly
        setEmployeeName(selectedEmployee.name);
        setIsEmployeeValid(true);
        
        try {
          // Fetch current role
          const roleRes = await api.get(`/get_employee_role/${value}`);
          const currentRoleId = roleRes.data.roleId;
          setEmployeeCurrentRole(currentRoleId);
          
          // Update role compatibility if role ID is already selected
          const selectedRoleId = form.getFieldValue('roleId');
          if (selectedRoleId) {
            const compatibility = checkRoleCompatibility(currentRoleId, selectedRoleId);
            if (compatibility !== true) {
              setRoleCompatibilityError(compatibility.message);
              message.warning({
                content: compatibility.message,
                icon: <InfoCircleOutlined style={{ color: '#faad14' }} />
              });
            } else {
              setRoleCompatibilityError(null);
            }
          }
        } catch (error) {
          console.error('Failed to get employee current role:', error);
        }

        // Show success message
        if (!errorMessageShown) {
          message.success({
            content: 'Employee selected successfully',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
          });
        }
      } else {
        // If not found in the list (unlikely with Select), make a direct API call
        try {
          const nameRes = await api.get(`/get_employee_name/${value}`);
          if (nameRes.data && nameRes.data.name) {
            setEmployeeName(nameRes.data.name);
            setIsEmployeeValid(true);
            
            // Fetch current role
            try {
              const roleRes = await api.get(`/get_employee_role/${value}`);
              const currentRoleId = roleRes.data.roleId;
              setEmployeeCurrentRole(currentRoleId);
              
              // Check compatibility with already selected role
              const selectedRoleId = form.getFieldValue('roleId');
              if (selectedRoleId) {
                const compatibility = checkRoleCompatibility(currentRoleId, selectedRoleId);
                if (compatibility !== true) {
                  setRoleCompatibilityError(compatibility.message);
                  message.warning({
                    content: compatibility.message,
                    icon: <InfoCircleOutlined style={{ color: '#faad14' }} />
                  });
                } else {
                  setRoleCompatibilityError(null);
                }
              }
            } catch (error) {
              console.error('Failed to get employee current role:', error);
            }
          } else {
            setEmployeeName('');
            setIsEmployeeValid(false);
            setEmployeeCurrentRole('');
            showErrorMessage('Invalid Employee ID. Please try again.');
          }
        } catch (error) {
          console.error('Failed to get employee name:', error);
          setEmployeeName('');
          setIsEmployeeValid(false);
          setEmployeeCurrentRole('');
          showErrorMessage('Invalid Employee ID. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unable to process employee selection:', error);
      setEmployeeName('');
      setIsEmployeeValid(false);
      setEmployeeCurrentRole('');
      showErrorMessage('Error processing employee selection.');
    } finally {
      setEmployeeLoading(false);
    }
  };

  // Add this function to load existing allocation data
  const loadAllocationData = async (allocationId) => {
    setLoading(true);
    try {
      const response = await api.get(`/get_role_allocation/${allocationId}`);
      const allocationData = response.data;
      
      if (allocationData) {
        // Populate the form with existing data
        form.setFieldsValue({
          employeeId: allocationData.employee_id,
          roleId: allocationData.role_id,
          reportingRoleId: allocationData.reporting_role_id || '',
          reportingPerson: allocationData.reporting_person || '',
          allocatedDate: allocationData.allocated_date ? moment(allocationData.allocated_date) : moment()
        });
        
        // Manually trigger the handlers to load additional data and validate
        await handleEmployeeSelect(allocationData.employee_id);
        await handleRoleIdChange({ target: { value: allocationData.role_id } });
        
        if (allocationData.reporting_role_id) {
          await handleReportingRoleIdChange({ target: { value: allocationData.reporting_role_id } });
        }
        
        // Update role compatibility states
        if (allocationData.role_id === 'MD') {
          setIsMdRoleSelected(true);
        }
        
        message.success({
          content: 'Loaded existing role allocation for editing',
          icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />
        });
      } else {
        message.error('Failed to load allocation data');
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Error loading allocation data:', error);
      message.error('Failed to load allocation data');
      setIsEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Update the onFinish function to handle both create and update operations
  const onFinish = async (values) => {
    // With the new dropdown selection, employee ID should be in the form values
    if (!values.employeeId) {
      notification.error({
        message: 'Employee Required',
        description: 'Please select an employee before submitting the form',
        placement: 'topRight',
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
      return;
    }
    
    // Only check role compatibility for new allocations, not for edits
    if (roleCompatibilityError && !isEditMode) {
      notification.error({
        message: 'Role Compatibility Error',
        description: roleCompatibilityError,
        placement: 'topRight',
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
      return;
    }
    
    try {
      setLoading(true);
      setFormSubmitted(true);
      
      // Employee ID is now directly in the form values
      const payload = {
        ...values,
        allocatedDate: values.allocatedDate.format('YYYY-MM-DD'),
        employeeName: employeeName,
        roleName: roleName,
        parentRole: values.roleId === 'MD' ? '' : parentRole,
        reportingRoleId: values.roleId === 'MD' ? '' : values.reportingRoleId,
        reportingPerson: values.roleId === 'MD' ? 'N/A - Top Level Position' : values.reportingPerson
      };

      let response;
      let successMessage;
      
      if (isEditMode) {
        // Update existing allocation
        payload.allocation_id = currentAllocationId;
        response = await api.put('/update_role_allocation', payload);
        successMessage = 'Role allocation updated successfully!';
      } else {
        // Create new allocation
        response = await api.post('/allocate_role', payload);
        successMessage = 'Role allocated successfully!';
      }
      
      // Show success animation
      setAnimateSuccess(true);
      
      // After successful allocation, refresh the recent allocations
      fetchRecentAllocations();

      // Reset form after delay for better UX
      setTimeout(() => {
        form.resetFields();
        setEmployeeName('');
        setRoleName('');
        setEmployeesWithRole([]);
        setParentRole('');
        setParentRoleId('');
        setIsEmployeeValid(null);
        setIsRoleValid(null);
        setFormSubmitted(false);
        setEmployeeCurrentRole('');
        setRoleCompatibilityError(null);
        setIsEditMode(false);
        setCurrentAllocationId(null);
        form.setFieldsValue({ allocatedDate: moment() });
        setAnimateSuccess(false);
        setShowAllocations(true);  // Show allocations after successful submission
        
        // Navigate to home
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Failed to process role allocation:', error);
      setFormSubmitted(false);
      
      // Use notification for better error visibility
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to process role allocation. Please try again.',
        placement: 'topRight',
        duration: 5,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    } finally {
      setLoading(false);
    }
  };

  // Form reset handler
  const onReset = () => {
    form.resetFields();
    setEmployeeName('');
    setRoleName('');
    setEmployeesWithRole([]);
    setParentRole('');
    setParentRoleId('');
    setIsEmployeeValid(null);
    setIsRoleValid(null);
    setAutoFilledReporting(false);
    setEmployeeCurrentRole('');
    setRoleCompatibilityError(null);
    setIsEditMode(false);
    setCurrentAllocationId(null);
    form.setFieldsValue({ allocatedDate: moment() });
    
    // Focus on the employee dropdown field after reset
    if (form) {
      setTimeout(() => {
        const employeeSelect = form.getFieldInstance('employeeId');
        if (employeeSelect) {
          employeeSelect.focus();
        }
      }, 100);
    }
  };

  // Display error message only once
  const showErrorMessage = useCallback((errorMsg) => {
    if (!errorMessageShown) {
      setErrorMessageShown(true);
      message.error({
        content: errorMsg,
        onClose: () => setErrorMessageShown(false),
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    }
  }, [errorMessageShown]);

  // Handle reporting role ID change
  const handleReportingRoleIdChange = async (e) => {
    const reportingRoleId = e.target.value.trim().toUpperCase();
    form.setFieldsValue({ reportingRoleId: reportingRoleId });
    
    if (!reportingRoleId) {
      setEmployeesWithRole([]);
      form.setFieldsValue({ reportingPerson: '' });
      setAutoFilledReporting(false);
      return;
    }
    
    setReportingRoleLoading(true);
    try {
      // Check local mapping first
      const roleDescription = getRoleDescription(reportingRoleId);
      
      // Determine which role description to use
      let finalRoleDescription = roleDescription;
      
      if (!finalRoleDescription) {
        // Try API if not in local mapping
        const apiRoleDescription = await fetchRoleName(reportingRoleId);
        finalRoleDescription = apiRoleDescription;
      }
      
      if (finalRoleDescription) {
        // Store parent role information
        setParentRoleId(reportingRoleId);
        setParentRole(finalRoleDescription);
      } else {
        setParentRoleId('');
        setParentRole('');
        showErrorMessage('Invalid Role ID. Please try again.');
      }
    } catch (error) {
      console.error('Unable to process reporting role ID:', error);
      setEmployeesWithRole([]);
      form.setFieldsValue({ reportingPerson: '' });
      showErrorMessage('Failed to process Role ID.');
    } finally {
      setReportingRoleLoading(false);
    }
  };

  // Handle role ID change with debounced auto-fill functionality
  const handleRoleIdChange = useMemo(() => 
    debounce(async (e) => {
      const roleId = e.target.value.trim().toUpperCase();
      form.setFieldsValue({ roleId: roleId });
      
      // Update MD role selection state
      setIsMdRoleSelected(roleId === 'MD');

      if (!roleId) {
        setRoleName('');
        setIsRoleValid(null);
        setRoleCompatibilityError(null);
        return;
      }

    setRoleLoading(true);
    try {
      // Check local mapping first
      const roleDescription = getRoleDescription(roleId);
      const parentRole = getParentRole(roleId);
      
      if (roleDescription) {
        setRoleName(roleDescription);
        setIsRoleValid(true);
        
        // Check compatibility with employee's current role
        if (employeeCurrentRole) {
          const compatibility = checkRoleCompatibility(employeeCurrentRole, roleId);
          if (compatibility !== true) {
            setRoleCompatibilityError(compatibility.message);
            message.warning({
              content: compatibility.message,
              icon: <InfoCircleOutlined style={{ color: '#faad14' }} />
            });
          } else {
            setRoleCompatibilityError(null);
          }
        }
        
        // Special handling for MD role - clear reporting role fields
        if (roleId === 'MD') {
          // MD has no reporting role
          form.setFieldsValue({ 
            reportingRoleId: '',
            reportingPerson: 'N/A - Top Level Position'
          });
          
          // Show info message
          message.info({
            content: 'Managing Director is the top level position with no reporting role.',
            icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
            duration: 3
          });
          
          setParentRoleId('');
          setParentRole('');
          setEmployeesWithRole([]);
        }
        // Auto-fill reporting role ID based on parent role for non-MD roles
        else if (parentRole) {
          setAutoFilledReporting(true);
          form.setFieldsValue({ reportingRoleId: parentRole });
          // Trigger the reporting role ID change event to populate parent role info
          await handleReportingRoleIdChange({ target: { value: parentRole } });
          
          // After a short delay, focus on the reporting role ID field
          setTimeout(() => {
            if (reportingRoleIdRef.current) {
              reportingRoleIdRef.current.focus();
            }
            
            // Reset the auto-filled flag after 3 seconds
            setTimeout(() => {
              setAutoFilledReporting(false);
            }, 3000);
          }, 100);
        }
        
        // Only show success message if no error message is shown
        if (!errorMessageShown && !roleCompatibilityError) {
          message.success({
            content: 'Valid Role ID',
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
          });
        }
      } else {
        // Try the API if not in local mapping
        const apiRoleDescription = await fetchRoleName(roleId);
        
        if (apiRoleDescription) {
          setRoleName(apiRoleDescription);
          setIsRoleValid(true);
          
          // Check compatibility with employee's current role
          if (employeeCurrentRole) {
            const compatibility = checkRoleCompatibility(employeeCurrentRole, roleId);
            if (compatibility !== true) {
              setRoleCompatibilityError(compatibility.message);
              message.warning({
                content: compatibility.message,
                icon: <InfoCircleOutlined style={{ color: '#faad14' }} />
              });
            } else {
              setRoleCompatibilityError(null);
            }
          }
          
          // Only show success message if no error message is shown
          if (!errorMessageShown && !roleCompatibilityError) {
            message.success({
              content: 'Valid Role ID',
              icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
            });
          }
        } else {
          setRoleName('');
          setIsRoleValid(false);
          setRoleCompatibilityError(null);
          showErrorMessage('Invalid Role ID. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unable to fetch role description:', error);
      setRoleName('');
      setIsRoleValid(false);
      setRoleCompatibilityError(null);
      showErrorMessage('Invalid Role ID. Please try again.');
    } finally {
      setRoleLoading(false);
    }
  }, 500), [form, employeeCurrentRole, errorMessageShown, roleCompatibilityError, fetchRoleName, showErrorMessage]);

  // HandleReportingRoleIdChange is defined above

  // Update the handle function to also set the selected employee
  const handleSelectReportingEmployee = (employee) => {
    // Create detailed reporting person text for the selected employee
    const reportingPersonText = `${employee.employeeId}, ${employee.name}${employee.roleName ? ', ' + employee.roleName : ''}`;
    form.setFieldsValue({ reportingPerson: reportingPersonText });
    
    // Set the selected employee ID
    setSelectedReportingEmployeeId(employee.employeeId);
    
    // Show a success message to confirm selection
    message.success({
      content: `Selected ${employee.name} as reporting person`,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      duration: 2
    });
  };

  // Use memo to determine if form can be submitted
  const canSubmit = useMemo(() => {
    return isEmployeeValid && isRoleValid && !roleCompatibilityError;
  }, [isEmployeeValid, isRoleValid, roleCompatibilityError]);

  // Get status for input fields
  const getEmployeeStatus = useMemo(() => {
    if (isEmployeeValid === null) return '';
    return isEmployeeValid ? 'success' : 'error';
  }, [isEmployeeValid]);

  const getRoleStatus = useMemo(() => {
    if (isRoleValid === null) return '';
    return isRoleValid ? 'success' : 'error';
  }, [isRoleValid]);

  // Memoize the employees list options
  const employeeOptions = useMemo(() => 
    employeesList.map(employee => (
      <Option key={employee.id} value={employee.id}>
        <Space>
          <Avatar size="small">{employee.name.charAt(0)}</Avatar>
          <span>{employee.name} ({employee.id})</span>
        </Space>
      </Option>
    ))
  , [employeesList]);

  // Memoize the filtered employee list
  const filteredEmployeesWithRole = useMemo(() => 
    employeesWithRole.filter(emp => emp.roleId && emp.name)
  , [employeesWithRole]);

  // Standard table component using Ant Design Table
  const VirtualTable = useMemo(() => ({ columns, dataSource, ...props }) => {
    // Don't render if no data
    if (!dataSource || dataSource.length === 0) {
      return <Empty description="No data available" />;
    }
    
    return (
      <Table
        {...props}
        columns={columns}
        dataSource={dataSource}
        pagination={dataSource.length > 10 ? { pageSize: 10 } : false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    );
  }, []);

  // Memoize table columns to prevent unnecessary re-renders
  const allocationsColumns = useMemo(() => [
    {
      title: 'Employee',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 250,
      fixed: 'left',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar style={{ backgroundColor: '#1890ff', flex: 'none' }} icon={<UserOutlined />} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {record.employeeName}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>{text}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'roleId',
      key: 'roleId',
      width: 200,
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Tag color="blue" style={{ width: 'fit-content' }}>{text}</Tag>
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.roleName}
          </span>
        </div>
      ),
    },
    {
      title: 'Date Allocated',
      dataIndex: 'allocatedDate',
      key: 'allocatedDate',
      render: (text) => {
        const date = moment(text);
        const isRecent = moment().diff(date, 'days') <= 7;
        return (
          <Space>
            {isRecent && <Badge status="success" />}
            {date.format('DD MMM YYYY')}
          </Space>
        );
      },
    },
    {
      title: 'Reports To',
      dataIndex: 'reportingPerson',
      key: 'reportingPerson',
      render: (text) => {
        if (text === 'N/A') {
          return <Tag color="green">Top Level</Tag>;
        }
        const parts = text.split(',');
        return parts.length > 1 ? (
          <Space>
            <Tag color="purple">{parts[0]}</Tag>
            <span>{parts[1]}</span>
          </Space>
        ) : text;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space>
          <Button 
            type="link"
            onClick={() => navigate(`/role-allocation?allocation_id=${record.key}`)}
            icon={<EditOutlined />}
          >
            Edit
          </Button>
          <Button 
            type="link"
            danger
            onClick={() => handleDelete(record)}
            icon={<CloseCircleOutlined />}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ]);

  const RoleDistributionCard = React.memo(({ role, index }) => (
    <Col xs={24} sm={12} md={6} key={role.role_id}>
      <Card 
        className="role-distribution-card" 
        size="small" 
        hoverable
      >
        <Statistic
          title={
            <Tooltip title={ROLE_MAPPING[role.role_id]?.description || role.role_id}>
              <Tag color={['blue', 'green', 'purple', 'orange', 'cyan'][index % 5]}>
                {role.role_id}
              </Tag>
            </Tooltip>
          }
          value={role.count}
          valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
        />
        <div className="role-count-label">Allocations</div>
      </Card>
    </Col>
  ));

  // Performance optimized main component render
  return (
    <div className="role-allocation-container modern-management-section">
      {/* Removed motion wrapper for better performance */}
      {/* Breadcrumb Navigation - removed motion for performance */}
      <div className="page-breadcrumb modern-breadcrumb">
        <Breadcrumb
          items={[
            {
              title: (
                <>
                  <HomeOutlined /> Home
                </>
              ),
              href: '/'
            },
            {
              title: 'Role Allocation'
            }
          ]}
        />
      </div>
      
      {/* New Product Creation-like Header - removed motion for performance */}
      <div className="product-creation-style-header">
        <ApartmentOutlined className="product-creation-header-icon" />
        <div className="product-creation-header-content">
          <span className="product-creation-header-text">
            {isEditMode ? 'Edit Role Allocation' : 'Role Allocation'}
          </span>
          <p className="product-creation-header-description">
            Assign roles to employees and define the organizational structure
          </p>
        </div>
        {isEditMode && (
          <Tag color="blue" className="edit-mode-tag" style={{ marginLeft: 'auto' }}>
            <EditOutlined /> Editing Mode
          </Tag>
        )}
      </div>
      
      {/* Info Banner (optional) - optimized animation */}
      {formSubmitted && animateSuccess && (
        <div className="product-creation-success-notification" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <div className="product-creation-success-icon-wrapper">
            <CheckCircleOutlined className="product-creation-success-icon" />
          </div>
          <span>{isEditMode ? 'Role updated successfully!' : 'Role allocated successfully!'}</span>
        </div>
      )}

      <motion.div
        className="modern-card-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card 
          className="modern-card form-card"
          variant="outlined"
          hoverable
        >
          <div className="card-header">
            <div className="card-header-left">
              <UserOutlined className="card-header-icon" />
              <span className="card-header-title">Employee Role Details</span>
            </div>
            <div className="card-header-right">
              <Tooltip title="Fill in the details to allocate a role to an employee">
                <InfoCircleOutlined className="help-icon" />
              </Tooltip>
            </div>
          </div>
          
          <Form 
            form={form} 
            onFinish={onFinish}
            layout="vertical"
            className="modern-form"
            requiredMark="optional"
          >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <motion.div variants={slideUp}>
                <Form.Item
                  label={
                    <Space className="form-label-wrapper">
                      <UserOutlined className="form-label-icon" />
                      <span className="form-label-text">Select Employee</span>
                    </Space>
                  }
                  name="employeeId"
                  rules={[{ required: true, message: 'Please select an employee' }]}
                  className="form-item employee-selector-container"
                  validateStatus={getEmployeeStatus}
                  help={getEmployeeStatus === 'error' ? 'Invalid Employee' : null}
                >
                  <Select
                    showSearch
                    placeholder="Select an employee"
                    optionFilterProp="children"
                    onChange={handleEmployeeSelect}
                    loading={employeesListLoading}
                    className="role-allocation-employee-select modern-select"
                    size="large"
                    disabled={formSubmitted}
                    filterOption={(input, option) => {
                      if (!option || !option.value) return false;
                      // Find the employee with this ID
                      const employee = employeesList.find(emp => emp.id.toString() === option.value.toString());
                      if (!employee) return false;
                      
                      // Check if input matches employee name or ID
                      return (
                        employee.name.toLowerCase().includes(input.toLowerCase()) || 
                        employee.id.toString().toLowerCase().includes(input.toLowerCase())
                      );
                    }}
                    popupClassName="role-allocation-employee-select-dropdown"
                    suffixIcon={<UserOutlined className="select-suffix-icon" />}
                  >
                    {employeeOptions}
                  </Select>
                </Form.Item>
              </motion.div>
              
              {employeeName ? (
                <motion.div 
                  className="info-display employee-info-display"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <span className="info-label">Selected Employee:</span>
                  <span className="info-value">{employeeName}</span>
                </motion.div>
              ) : employeeLoading ? (
                <Skeleton.Input active size="small" style={{ width: '100%' }} />
              ) : null}
              {employeeCurrentRole && (
                <motion.div 
                  className="info-display employee-role-display employee-current-role"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <span className="info-label">Current Role:</span>
                  <span className="info-value employee-role-value">
                    <Tag color="orange">{employeeCurrentRole}</Tag> {getRoleDescription(employeeCurrentRole)}
                  </span>
                </motion.div>
              )}
              {roleCompatibilityError && (
                <motion.div 
                  className="info-display compatibility-error-display"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                  <span className="compatibility-error">{roleCompatibilityError}</span>
                </motion.div>
              )}
            </Col>
            
            <Col xs={24} sm={12}>
              <motion.div variants={slideUp}>
                <Form.Item
                  label={
                    <Space className="form-label-wrapper">
                      <ApartmentOutlined className="form-label-icon" />
                      <span className="form-label-text">Role ID</span>
                    </Space>
                  }
                  name="roleId"
                  rules={[{ required: true, message: 'Please enter the Role ID' }]}
                  className="form-item"
                  validateStatus={getRoleStatus}
                  help={getRoleStatus === 'error' ? 'Invalid Role ID' : null}
                >
                  <Input
                    prefix={<ApartmentOutlined className="site-form-item-icon" />}
                    placeholder="Enter Role ID (e.g., MD, CEO, CTO)"
                    onChange={handleRoleIdChange}
                    className="custom-input role-id-input modern-input"
                    style={{ textTransform: 'uppercase' }}
                    suffix={roleLoading ? <Spin size="small" /> : isRoleValid ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
                    size="large"
                    disabled={formSubmitted}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      if (reportingRoleIdRef.current) {
                        reportingRoleIdRef.current.focus();
                      }
                    }}
                  />
                </Form.Item>
              </motion.div>
              
              {roleName ? (
                <motion.div 
                  className="info-display role-description-display role-info-panel"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <span className="info-label">Role Description:</span>
                  <span className="info-value role-description-value">{roleName}</span>
                </motion.div>
              ) : roleLoading ? (
                <Skeleton.Input active size="small" style={{ width: '100%' }} />
              ) : null}
            </Col>
          </Row>

          <Divider className="section-divider">
            <Space className="divider-content">
              <CalendarOutlined />
              <span>Allocation Details</span>
            </Space>
          </Divider>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <motion.div variants={slideUp}>
                <Form.Item
                  label={
                    <Space className="form-label-wrapper">
                      <CalendarOutlined className="form-label-icon" />
                      <span className="form-label-text">Allocated Date</span>
                    </Space>
                  }
                  name="allocatedDate"
                  rules={[{ required: true, message: 'Please select the Allocated Date' }]}
                  className="form-item"
                >
                  <DatePicker
                    format="DD-MM-YYYY"
                    className="custom-datepicker allocation-date-picker modern-datepicker"
                    style={{ width: '100%' }}
                    prefix={<CalendarOutlined className="site-form-item-icon" />}
                    size="large"
                    suffixIcon={<CalendarOutlined className="calendar-suffix-icon" />}
                    disabled={formSubmitted}
                    placeholder="Select date"
                  />
                </Form.Item>
              </motion.div>
            </Col>
            
            <Col xs={24} sm={12}>
              <motion.div variants={slideUp}>
                <Form.Item
                  label={
                    <Space className="form-label-wrapper">
                      <ApartmentOutlined className="form-label-icon" />
                      <span className="form-label-text">Reporting Role ID</span>
                      {isMdRoleSelected && (
                        <Tag color="blue" className="optional-tag">Not Applicable</Tag>
                      )}
                    </Space>
                  }
                  name="reportingRoleId"
                  className="form-item"
                >
                  <Input
                    ref={reportingRoleIdRef}
                    prefix={<ApartmentOutlined className="site-form-item-icon" />}
                    placeholder={isMdRoleSelected ? 'Not applicable for MD role' : 'Enter Reporting Role ID'}
                    onChange={handleReportingRoleIdChange}
                    className={`custom-input reporting-role-input modern-input ${autoFilledReporting ? 'auto-filled' : ''} ${isMdRoleSelected ? 'reporting-field-disabled' : ''}`}
                    style={{ textTransform: 'uppercase' }}
                    suffix={
                      reportingRoleLoading ? (
                        <Spin size="small" />
                      ) : autoFilledReporting ? (
                        <InfoCircleOutlined style={{ color: '#52c41a' }} />
                      ) : isMdRoleSelected ? (
                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      ) : null
                    }
                    size="large"
                    disabled={formSubmitted || isMdRoleSelected}
                  />
                </Form.Item>
              </motion.div>
              
              {isMdRoleSelected && (
                <motion.div 
                  className="top-level-role-note"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <InfoCircleOutlined className="top-level-role-icon" />
                  <span className="top-level-role-text">
                    Managing Director is a top-level position with no reporting requirements.
                  </span>
                </motion.div>
              )}
              
              {parentRole && !isMdRoleSelected && (
                <motion.div 
                  className="info-display parent-role-display reporting-hierarchy"
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <span className="info-label">Parent Role:</span>
                  <span className="info-value parent-role-value">
                    {parentRoleId && <Tag color="purple">{parentRoleId}</Tag>} {parentRole}
                  </span>
                </motion.div>
              )}
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24}>
              <motion.div variants={slideUp}>
                <Form.Item
                  label={
                    <Space className="form-label-wrapper">
                      <TeamOutlined className="form-label-icon" />
                      <span className="form-label-text">Reporting Person/Role</span>
                    </Space>
                  }
                  name="reportingPerson"
                  className="form-item"
                >
                  {isMdRoleSelected ? (
                    <div className="reporting-field-container disabled-reporting-field">
                      <TeamOutlined className="reporting-field-icon" />
                      <span className="reporting-field-text">N/A - Top Level Position</span>
                    </div>
                  ) : employeesWithRole.length > 0 ? (
                    <div className="reporting-person-details">
                      {employeesWithRole.length === 1 ? (
                        // Single employee display with details
                        <div className="single-employee-card reporting-employee-details">
                          <Row gutter={16} align="middle">
                            <Col xs={24} sm={6}>
                              <Avatar 
                                size={64} 
                                icon={<UserOutlined />} 
                                style={{ backgroundColor: '#1890ff' }} 
                              />
                              <div className="employee-id">{employeesWithRole[0].employeeId}</div>
                            </Col>
                            <Col xs={24} sm={18}>
                              <div className="employee-name">{employeesWithRole[0].name}</div>
                              {employeesWithRole[0].roleName && (
                                <div className="employee-role">
                                  <Tag color="blue">{employeesWithRole[0].roleId || parentRoleId}</Tag> {employeesWithRole[0].roleName}
                                </div>
                              )}
                              {employeesWithRole[0].reportingPerson && (
                                <div className="employee-reporting">
                                  <span className="reporting-label">Reports to:</span> {employeesWithRole[0].reportingPerson}
                                </div>
                              )}
                              {employeesWithRole[0].joiningDate && (
                                <div className="employee-joining">
                                  <CalendarOutlined /> Joined: {employeesWithRole[0].joiningDate}
                                </div>
                              )}
                            </Col>
                          </Row>
                          <Input 
                            type="hidden"
                            value={`${employeesWithRole[0].employeeId}, ${employeesWithRole[0].name}, ${employeesWithRole[0].roleName || parentRole}`}
                          />
                        </div>
                      ) : (
                        // Multiple employees display with detailed cards
                        <div className="multiple-employees-container multiple-reporting-options">
                          <div className="role-header">
                            <Tag color="purple">{parentRoleId}</Tag> {parentRole}
                          </div>
                          <div className="employees-list">
                            {employeesWithRole.map((employee, index) => (
                              <Card 
                                key={employee.employeeId} 
                                size="small" 
                                className={`employee-card ${selectedReportingEmployeeId === employee.employeeId ? 'employee-card-selected' : ''}`}
                                hoverable
                                onClick={() => handleSelectReportingEmployee(employee)}
                              >
                                <Row gutter={12} align="middle">
                                  <Col xs={24} sm={6}>
                                    <Badge dot={selectedReportingEmployeeId === employee.employeeId}>
                                      <Avatar 
                                        icon={<UserOutlined />} 
                                        style={{ 
                                          backgroundColor: selectedReportingEmployeeId === employee.employeeId ? '#52c41a' : '#1890ff' 
                                        }} 
                                      />
                                    </Badge>
                                    <div className="employee-card-id">{employee.employeeId}</div>
                                  </Col>
                                  <Col xs={24} sm={18}>
                                    <div className="employee-card-name">{employee.name}</div>
                                    {employee.roleName && (
                                      <div className="employee-card-role">
                                        <Tag color={selectedReportingEmployeeId === employee.employeeId ? 'success' : 'blue'}>
                                          {employee.roleId || parentRoleId}
                                        </Tag>
                                      </div>
                                    )}
                                    {employee.reportingPerson && (
                                      <div className="employee-card-reporting">
                                        <span className="reporting-card-label">Reports to:</span> {employee.reportingPerson}
                                      </div>
                                    )}
                                  </Col>
                                </Row>
                              </Card>
                            ))}
                          </div>
                          <Input 
                            type="hidden" 
                            value={`${parentRoleId} - ${parentRole} | Multiple Employees`}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    // No employees found - show standard input
                    <div className="reporting-field-container">
                      <TeamOutlined className="reporting-field-icon" />
                      <span className="reporting-field-text placeholder">Reporting information will appear here</span>
                    </div>
                  )}
                </Form.Item>
              </motion.div>
            </Col>
          </Row>

          <div className="form-footer">
            <div className="divider-container">
              <Divider>
                <CheckCircleOutlined className="divider-icon" />
                <span className="divider-text">Complete the form to allocate a role</span>
              </Divider>
            </div>
            
            <motion.div 
              className="modern-button-group"
              variants={slideUp}
            >
              <motion.div
                whileHover={{ scale: canSubmit ? 1.03 : 1 }}
                whileTap={{ scale: canSubmit ? 0.97 : 1 }}
                initial={animateSuccess ? "initial" : {}}
                animate={animateSuccess ? "animate" : {}}
                variants={successAnimation}
                className="primary-button-container"
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  disabled={!canSubmit || formSubmitted}
                  className="modern-primary-button"
                  size="large"
                >
                  {formSubmitted ? 'Saving...' : isEditMode ? 'Update Role' : 'Allocate Role'}
                </Button>
              </motion.div>
              
              {isEditMode ? (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="secondary-button-container"
                >
                  <Button
                    htmlType="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setCurrentAllocationId(null);
                      form.resetFields();
                      form.setFieldsValue({ allocatedDate: moment() });
                      navigate('/role-allocation');
                    }}
                    icon={<CloseCircleOutlined />}
                    className="modern-cancel-button"
                    size="large"
                    disabled={formSubmitted}
                  >
                    Cancel Edit
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="secondary-button-container"
                >
                  <Button
                    htmlType="button"
                    onClick={onReset}
                    icon={<ReloadOutlined />}
                    className="modern-secondary-button"
                    size="large"
                    disabled={formSubmitted}
                  >
                    Clear Form
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
          </Form>
        </Card>
      </motion.div>

      {/* Modern Role Allocation Dashboard */}
      <AnimatePresence>
        {(showAllocations || recentAllocations.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="dashboard-container"
          >
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-icon-container">
                  <BarChartOutlined className="section-icon" />
                </div>
                <div className="section-title-container">
                  <h3 className="section-title">Role Allocation Dashboard</h3>
                  <p className="section-description">View recent role allocations and statistics</p>
                </div>
              </div>
            </div>
            
            <Card 
              className="modern-dashboard-card"
              variant="outlined"
              extra={
                <Space>
                  <Select 
                    placeholder="Filter by Role"
                    style={{ width: 150 }}
                    allowClear
                    onChange={(value) => {
                      // Filter by selected role
                      if (value) {
                        setLoadingAllocations(true);
                        api.get(`/api/role_allocations?role_id=${value}`)
                          .then(res => {
                            const allocationsData = res.data.allocations.map(allocation => ({
                              key: allocation.id.toString(),
                              employeeId: allocation.employee_id,
                              employeeName: allocation.employee_name,
                              roleId: allocation.role_id,
                              roleName: allocation.role_name,
                              allocatedDate: allocation.allocated_date,
                              reportingPerson: allocation.reporting_person || 'N/A'
                            }));
                            setRecentAllocations(allocationsData);
                            setLoadingAllocations(false);
                          })
                          .catch(err => {
                            console.error('Error filtering roles:', err);
                            setLoadingAllocations(false);
                          });
                      } else {
                        // Reset filter
                        fetchRecentAllocations();
                      }
                    }}
                  >
                    {Object.keys(ROLE_MAPPING).map(roleId => (
                      <Option key={roleId} value={roleId}>
                        {roleId} - {ROLE_MAPPING[roleId].description}
                      </Option>
                    ))}
                  </Select>
                  <Button 
                    type="default" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchRecentAllocations}
                    loading={loadingAllocations}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Space>
              }
            >
              <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                  <Statistic 
                    title="Total Allocations" 
                    value={allocationStats.total} 
                    prefix={<TeamOutlined />} 
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic 
                    title="Recent Allocations" 
                    value={allocationStats.recent} 
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                    suffix={<Badge count="New" style={{ backgroundColor: '#52c41a' }} />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic 
                    title="Pending Allocations" 
                    value={allocationStats.pending} 
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>

                    {/* Tabbed Dashboard Section */}
      <div className="dashboard-tabs-section">
        <Card className="dashboard-tabs-card">
          <Tabs
            defaultActiveKey="distribution"
            type="card"
            size="large"
            className="custom-tabs"
            tabBarExtraContent={
              <Tooltip title="View all role allocations">
                <Button 
                  type="primary" 
                  icon={<EyeOutlined />} 
                  size="middle"
                  onClick={() => navigate('/role-allocations-list')}
                >
                  View All
                </Button>
              </Tooltip>
            }
            items={[
              {
                key: 'distribution',
                label: (
                  <span className="tab-label">
                    <BarChartOutlined /> Distribution
                  </span>
                ),
                children: (
                  <div className="role-distribution-section">
                    <Row gutter={16} className="role-distribution-row">
                      {allocationStats.roleDistribution && allocationStats.roleDistribution.length > 0 ? (
                        allocationStats.roleDistribution.map((role, index) => (
                          <Col xs={24} sm={12} md={6} key={role.role_id}>
                            <Card 
                              className="role-distribution-card" 
                              size="small" 
                              hoverable
                            >
                              <Statistic
                                title={
                                  <Tooltip title={ROLE_MAPPING[role.role_id]?.description || role.role_id}>
                                    <Tag color={['blue', 'green', 'purple', 'orange', 'cyan'][index % 5]}>
                                      {role.role_id}
                                    </Tag>
                                  </Tooltip>
                                }
                                value={role.count}
                                valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                              />
                              <div className="role-count-label">Allocations</div>
                            </Card>
                          </Col>
                        ))
                      ) : (
                        <Col span={24}>
                          <Empty description="No distribution data available" />
                        </Col>
                      )}
                    </Row>
                  </div>
                ),
              },
              {
                key: 'hierarchy',
                label: (
                  <span className="tab-label">
                    <ApartmentOutlined /> Hierarchy
                  </span>
                ),
                children: (
                  <div className="role-hierarchy-section">
                    <div className="hierarchy-controls">
                      <Input.Search 
                        placeholder="Search roles" 
                        allowClear 
                        onSearch={(value) => {
                          // Search functionality would go here
                          message.info(`Searching for: ${value}`);
                        }} 
                        style={{ width: 250, marginBottom: 16 }}
                      />
                      <Select
                        placeholder="Filter by level"
                        style={{ width: 180, marginLeft: 16 }}
                        allowClear
                        options={[
                          { value: 'top', label: 'Top Level' },
                          { value: 'middle', label: 'Middle Management' },
                          { value: 'team', label: 'Team Level' }
                        ]}
                      />
                    </div>
                    
                    <Table 
                      dataSource={Object.keys(ROLE_MAPPING).map(roleId => ({
                        key: roleId,
                        roleId: roleId,
                        roleDescription: ROLE_MAPPING[roleId].description,
                        parentRole: ROLE_MAPPING[roleId].parent || 'None',
                        parentDescription: ROLE_MAPPING[roleId].parent ? 
                          ROLE_MAPPING[ROLE_MAPPING[roleId].parent]?.description || '' : 
                          'Top Level',
                        level: !ROLE_MAPPING[roleId].parent ? 'Top Level' : 
                          ['VP', 'AVP', 'SSA'].includes(roleId) ? 'Middle Management' : 'Team Level'
                      }))}
                      virtual
                      scroll={{ y: 400 }}
                      rowHeight={65}
                      columns={[
                        {
                          title: 'Role ID',
                          dataIndex: 'roleId',
                          key: 'roleId',
                          render: (text) => <Tag color="blue">{text}</Tag>,
                          sorter: (a, b) => a.roleId.localeCompare(b.roleId)
                        },
                        {
                          title: 'Role Description',
                          dataIndex: 'roleDescription',
                          key: 'roleDescription',
                          sorter: (a, b) => a.roleDescription.localeCompare(b.roleDescription)
                        },
                        {
                          title: 'Reports To',
                          dataIndex: 'parentRole',
                          key: 'parentRole',
                          render: (text, record) => (
                            <Space>
                              {text !== 'None' ? 
                                <Tag color="purple">{text}</Tag> : 
                                <Tag color="green">None</Tag>
                              }
                              <span>{record.parentDescription}</span>
                            </Space>
                          ),
                          filters: [
                            { text: 'Top Level', value: 'None' },
                            ...Object.keys(ROLE_MAPPING)
                              .filter(role => Object.values(ROLE_MAPPING).some(r => r.parent === role))
                              .map(role => ({ text: role, value: role }))
                          ],
                          onFilter: (value, record) => record.parentRole === value,
                          sorter: (a, b) => a.parentRole.localeCompare(b.parentRole)
                        },
                        {
                          title: 'Level',
                          dataIndex: 'level',
                          key: 'level',
                          render: (text) => {
                            let color = 'default';
                            if (text === 'Top Level') color = 'gold';
                            else if (text === 'Middle Management') color = 'geekblue';
                            else if (text === 'Team Level') color = 'green';
                            
                            return <Tag color={color}>{text}</Tag>;
                          },
                          filters: [
                            { text: 'Top Level', value: 'Top Level' },
                            { text: 'Middle Management', value: 'Middle Management' },
                            { text: 'Team Level', value: 'Team Level' }
                          ],
                          onFilter: (value, record) => record.level === value
                        }
                      ]}
                      pagination={{ 
                        pageSize: 8, 
                        showSizeChanger: true, 
                        pageSizeOptions: ['8', '16', '24'],
                        showTotal: (total) => `Total ${total} roles` 
                      }}
                      size="middle"
                      className="hierarchy-table"
                      bordered
                    />
                  </div>
                ),
              },
              {
                key: 'visualization',
                label: (
                  <span className="tab-label">
                    <ClusterOutlined /> Visualization
                  </span>
                ),
                children: (
                  <div className="role-visualization-section">
                    <div className="visualization-container">
                      <div className="org-chart">
                        <div className="org-chart-node org-chart-root">
                          <Avatar size={64} style={{ backgroundColor: '#1890ff' }}>MD</Avatar>
                          <div className="org-chart-title">Managing Director</div>
                        </div>
                        <div className="org-chart-level">
                          {['CEO', 'CTO', 'COO', 'CFO'].map(role => (
                            <div className="org-chart-node" key={role}>
                              <Avatar size={48} style={{ backgroundColor: '#52c41a' }}>{role}</Avatar>
                              <div className="org-chart-title">{ROLE_MAPPING[role]?.description}</div>
                            </div>
                          ))}
                        </div>
                        <div className="org-chart-level">
                          <div className="org-chart-node">
                            <Avatar size={40} style={{ backgroundColor: '#722ed1' }}>VP</Avatar>
                            <div className="org-chart-title">Vice President</div>
                          </div>
                        </div>
                        <div className="org-chart-level">
                          <div className="org-chart-node">
                            <Avatar size={36} style={{ backgroundColor: '#faad14' }}>AVP</Avatar>
                            <div className="org-chart-title">Assistant Vice President</div>
                          </div>
                        </div>
                        <div className="org-chart-level">
                          <div className="org-chart-node">
                            <Avatar size={32} style={{ backgroundColor: '#13c2c2' }}>SSA</Avatar>
                            <div className="org-chart-title">Senior Solution Architect</div>
                          </div>
                        </div>
                        <div className="org-chart-level">
                          <div className="org-chart-node">
                            <Avatar size={32} style={{ backgroundColor: '#fa541c' }}>SA</Avatar>
                            <div className="org-chart-title">Solution Architect</div>
                          </div>
                        </div>
                        <div className="org-chart-level">
                          <div className="org-chart-node">
                            <Avatar size={32} style={{ backgroundColor: '#eb2f96' }}>SSE</Avatar>
                            <div className="org-chart-title">Senior Software Engineer</div>
                          </div>
                        </div>
                        <div className="org-chart-level">
                          <div className="org-chart-node">
                            <Avatar size={32} style={{ backgroundColor: '#7cb305' }}>SE</Avatar>
                            <div className="org-chart-title">Software Engineer</div>
                          </div>
                        </div>
                        <div className="org-chart-level">
                          <div className="org-chart-node">
                            <Avatar size={32} style={{ backgroundColor: '#096dd9' }}>TRN</Avatar>
                            <div className="org-chart-title">Trainee</div>
                          </div>
                        </div>
                      </div>
                      <div className="visualization-note">
                        <InfoCircleOutlined /> This is a simplified visualization of your organization's hierarchy.
                      </div>
                    </div>
                  </div>
                ),
              }
            ]}
          />
        </Card>
      </div>

              <Divider style={{ margin: '24px 0' }}>
                <span className="divider-text">
                  <EyeOutlined /> Recent Allocations
                </span>
              </Divider>
              
              <div className="recent-allocations">
                {loadingAllocations ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : recentAllocations.length > 0 ? (
                  <VirtualTable 
                    dataSource={recentAllocations} 
                    columns={allocationsColumns} 
                    rowKey="key"
                    size="small"
                    className="allocations-table"
                  />
                ) : (
                  <Empty description="No allocations found" />
                )}
              </div>
              
              {/* View All button */}
              <div className="view-all-section">
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  onClick={() => navigate('/role-allocations-list')}
                >
                  View All Allocations
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default RoleAllocation;