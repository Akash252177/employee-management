import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Button, Spin, Card, Avatar, Divider, Tag, Badge, Progress, 
  Dropdown, Menu, message, Tabs, Row, Col, Typography, Space, Statistic, Empty, Table, Collapse, Timeline,
  Form, Input, Select, DatePicker, Modal, Upload, Image
} from "antd";
import { 
  ArrowLeftOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, TeamOutlined, 
  IdcardOutlined, GlobalOutlined, TrophyOutlined, ContactsOutlined, CalendarOutlined,
  HeartOutlined, CheckCircleFilled, DownloadOutlined, FilePdfOutlined, FileExcelOutlined,
  ProjectOutlined, ScheduleOutlined, ClockCircleOutlined, BarChartOutlined, AuditOutlined,
  InfoCircleOutlined, BankOutlined, ApartmentOutlined, SafetyCertificateOutlined, SolutionOutlined,
  SyncOutlined, CloseOutlined, ExclamationOutlined, EditOutlined, SaveOutlined, UndoOutlined,
  PlusOutlined, LoadingOutlined, CameraOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from "framer-motion";
import "./ViewEmployeeDetails.css";
import moment from 'moment';

// Define custom moment parser for DD-MM-YYYY format
moment.createFromInputFallback = function(config) {
  // Try to parse as DD-MM-YYYY format
  const value = config._i;
  if (typeof value === 'string' && value.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const parts = value.split('-');
    const dateObj = moment([parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0])]);
    if (dateObj.isValid()) {
      config._d = dateObj.toDate();
      return;
    }
  }
  // Default fallback
  config._d = new Date(NaN);
};

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Panel } = Collapse;

// Animation variants for Framer Motion
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.4 } }
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  hover: { y: -5, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)", transition: { duration: 0.3 } }
};

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const itemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  hover: { x: 5, color: "#1890ff", transition: { duration: 0.2 } }
};

const btnVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  hover: { scale: 1.05, boxShadow: "0 5px 10px rgba(0, 0, 0, 0.15)" },
  tap: { scale: 0.95 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function ViewEmployeeDetails() {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState([]);
  const [formRef] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        console.log(`Fetching employee with ID: ${employeeId}`);
        const response = await axios.get(`http://127.0.0.1:5000/api/employees/${employeeId}`);
        const { data } = response;
        
        console.log('Raw response:', response);
        console.log('Employee data received:', data);
        console.log('Data type:', typeof data);
        console.log('Keys available in data:', Object.keys(data));

        // Process employee data to handle all possible field names
        const employeeData = processEmployeeData(data);
        console.log('Transformed employee data:', employeeData);
        setEmployee(employeeData);
      } catch (err) {
        console.error("Error fetching employee:", err);
        // Log additional error details
        if (err.response) {
          console.error("Error response data:", err.response.data);
          console.error("Error response status:", err.response.status);
          console.error("Error response headers:", err.response.headers);
        } else if (err.request) {
          console.error("Error request:", err.request);
        } else {
          console.error("Error message:", err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchAssignments = async () => {
      try {
        console.log(`Fetching assignments for employee with ID: ${employeeId}`);
        const { data } = await axios.get(`http://127.0.0.1:5000/api/employee-assignments/${employeeId}`);
        console.log('Assignment data received:', data);
        setAssignments(data);
      } catch (err) {
        console.error("Error fetching employee assignments:", err);
        // Set default assignments object with empty arrays
        setAssignments({
          role_allocations: [],
          task_allocations: [],
          total_monthly_hours: 0,
          active_projects_count: 0,
          active_tasks_count: 0
        });
        message.error("Failed to load assignment data. Using default view.");
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchEmployee();
    fetchAssignments();
  }, [employeeId]);

  useEffect(() => {
    if (employee && !editData) {
      setEditData({
        ...employee,
        dob: employee.dob ? moment(employee.dob) : null,
        doj: employee.doj ? moment(employee.doj) : null
      });
    }
  }, [employee]);

  const handleBackToEmployees = () => {
    navigate('/employees');
  };

  // Function to handle exporting employee data
  const handleExport = async (format) => {
    try {
      setDownloading(true);
      message.loading({
        content: `Preparing ${format.toUpperCase()} export...`,
        key: 'exportMessage',
        duration: 0
      });
      
      // Make a request to download the file
      const response = await axios({
        url: `http://127.0.0.1:5000/api/export-employee/${employeeId}/${format}`,
        method: 'GET',
        responseType: 'blob', // Important for file downloads
        timeout: 30000 // Increase timeout to 30 seconds
      });
      
      console.log('Export response:', response);
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `employee_${employeeId}_${format}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({
        content: `${format.toUpperCase()} export completed!`,
        key: 'exportMessage',
        duration: 2
      });
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response:', error.response);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Try to read the blob as text to see any error message
        try {
          const blobText = await error.response.data.text();
          console.error('Error response data:', blobText);
        } catch (e) {
          console.error('Could not parse error response data');
        }
      }
      
      message.error({
        content: `Failed to export as ${format}. Please try again.`,
        key: 'exportMessage'
      });
    } finally {
      setDownloading(false);
    }
  };

  // Function to get role color
  const getRoleColor = (roleName) => {
    if (!roleName) return '#bfbfbf';
    
    const roleLower = roleName.toLowerCase();
    if (roleLower.includes('director') || roleLower.includes('founder')) return '#cf1322';
    if (roleLower.includes('chief') || roleLower.includes('cto') || roleLower.includes('ceo')) return '#d4380d';
    if (roleLower.includes('senior') || roleLower.includes('solution')) return '#fa8c16';
    if (roleLower.includes('software') || roleLower.includes('engineer')) return '#1890ff';
    if (roleLower.includes('trainee') || roleLower.includes('internship')) return '#52c41a';
    if (roleLower === 'unassigned') return '#bfbfbf';
    return '#108ee9';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active') return 'success';
    if (statusLower === 'inactive') return 'error';
    if (statusLower === 'onboarding') return 'processing';
    if (statusLower === 'leave') return 'warning';
    return 'default';
  };

  // Format date in a more readable way
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Handle different date formats
      let date;
      if (typeof dateStr === 'string') {
        // Try different format patterns
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
          // YYYY-MM-DD format
          date = new Date(dateStr);
        } else if (dateStr.match(/^\d{2}-\d{2}-\d{4}/)) {
          // DD-MM-YYYY format
          const [day, month, year] = dateStr.split('-');
          date = new Date(`${year}-${month}-${day}`);
        } else {
          // Try direct parse as fallback
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        return dateStr; // Return original if parsing failed
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateStr;
    }
  };

  // Function to get project status color
  const getProjectStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active' || statusLower === 'in progress') return '#52c41a';
    if (statusLower === 'completed') return '#1890ff';
    if (statusLower === 'on hold') return '#faad14';
    if (statusLower === 'cancelled') return '#f5222d';
    return '#bfbfbf';
  };

  // Function to get task status icon and color
  const getTaskStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed') return <CheckCircleFilled style={{ color: '#52c41a' }} />;
    if (statusLower === 'in progress') return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    if (statusLower === 'pending') return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    if (statusLower === 'cancelled') return <CloseOutlined style={{ color: '#f5222d' }} />;
    return <ExclamationOutlined style={{ color: '#bfbfbf' }} />;
  };

  // Handle editing employee data
  const handleEdit = () => {
    setEditMode(true);
    // Convert string dates to moment objects for DatePicker
    setEditData({
      ...employee,
      dob: employee.dob ? moment(employee.dob) : null,
      doj: employee.doj ? moment(employee.doj) : null
    });
    
    // Reset form with current values to ensure fields are populated
    setTimeout(() => {
      formRef.setFieldsValue({
        employee_name: employee.employee_name,
        employee_id: employee.employee_id,
        email: employee.email,
        mobile: employee.mobile,
        dob: employee.dob ? moment(employee.dob) : null,
        doj: employee.doj ? moment(employee.doj) : null,
        gender: employee.gender,
        nationality: employee.nationality,
        maritalStatus: employee.maritalStatus,
        spouseName: employee.spouseName,
        qualification: employee.qualification,
        joiningLocation: employee.joiningLocation,
        role_name: employee.role_name || employee.roleName,
        status: employee.status,
        fatherName: employee.fatherName,
        motherName: employee.motherName,
        permanentAddress: employee.permanentAddress,
        communicationAddress: employee.communicationAddress,
        altMobile: employee.altMobile,
        emergencyContactPerson: employee.emergencyContactPerson || employee.emergencyName,
        emergencyMobile: employee.emergencyMobile,
        emergencyRelationship: employee.emergencyRelationship
      });
    }, 0);
  };

  // Handle saving employee data
  const handleSave = async () => {
    try {
      setSaving(true);
      // Validate form
      const formValues = await formRef.validateFields();
      
      // Create simplified data object for API
      const simplifiedData = {};
      
      // Copy only the fields that have changed or are essential
      const fieldsToSend = [
        'employee_name', 'employee_id', 'email', 'mobile', 'gender', 
        'nationality', 'maritalStatus', 'role_name', 'status',
        'permanentAddress', 'communicationAddress', 'altMobile', 
        'emergencyContactPerson', 'emergencyMobile', 'emergencyRelationship',
        'fatherName', 'motherName', 'spouseName', 'qualification', 'joiningLocation'
      ];
      
      fieldsToSend.forEach(field => {
        // Use form values first, then fall back to editData
        if (formValues[field] !== undefined) {
          simplifiedData[field] = formValues[field];
        } else if (editData[field] !== undefined) {
          simplifiedData[field] = editData[field];
        }
      });
      
      // Handle date fields specifically
      if (editData.dob && moment.isMoment(editData.dob)) {
        simplifiedData.dob = editData.dob.format('YYYY-MM-DD');
      }
      
      if (editData.doj && moment.isMoment(editData.doj)) {
        simplifiedData.doj = editData.doj.format('YYYY-MM-DD');
      }
      
      console.log('Sending simplified data:', simplifiedData);
      
      // IMPORTANT: If file upload is needed, we'll handle it separately
      // First, update the employee data as JSON
      const dataJson = JSON.stringify(simplifiedData);
      
      try {
        // First update the employee role if it has changed
        if (formValues.role_name && formValues.role_name !== employee.role_name) {
          console.log('Updating role name:', formValues.role_name);
          const roleResponse = await fetch(`http://127.0.0.1:5000/update_employee_role/${employeeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              roleDescription: formValues.role_name
            })
          });
          
          if (!roleResponse.ok) {
            throw new Error('Failed to update role');
          }
        }

        // Then update other employee data
        console.log('Sending employee data update as JSON');
        const dataResponse = await fetch(`http://127.0.0.1:5000/api/employees/${employeeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: dataJson
        });
        
        if (!dataResponse.ok) {
          const errorText = await dataResponse.text();
          throw new Error(`Employee update failed: ${dataResponse.status} - ${errorText}`);
        }
        
        // The data update succeeded
        console.log('Employee data updated successfully');
        
        if (imageFile) {
          try {
            // Now handle image separately if available
            console.log('Attempting image upload separately...');
            message.success('Employee data updated, uploading profile image...');
            
            // Create a separate FormData just for the image
            const imageFormData = new FormData();
            imageFormData.append('profilePic', imageFile);
            
            // Send the image in a separate request
            // The endpoint likely needs to be adapted to match your backend
            const imageResponse = await fetch(`http://127.0.0.1:5000/api/employees/${employeeId}/profile-image`, {
              method: 'POST',
              body: imageFormData
            });
            
            if (!imageResponse.ok) {
              console.warn('Image upload failed, but employee data was updated successfully');
              message.warning('Profile data updated but image upload failed.');
            } else {
              console.log('Image uploaded successfully');
              message.success('Profile image updated successfully');
            }
          } catch (imageError) {
            console.error('Error uploading image:', imageError);
            message.warning('Employee data updated but profile image upload failed.');
          }
        }
        
        // Refresh the employee data
        await refreshEmployeeData();
      } catch (updateError) {
        console.error('Error updating employee data:', updateError);
        message.error(updateError.message || 'Failed to update employee data');
      }
    } catch (error) {
      console.error('Error in form validation:', error);
      message.error('Please check the form for errors');
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to refresh employee data after update
  const refreshEmployeeData = async () => {
    try {
      const { data } = await axios.get(`http://127.0.0.1:5000/api/employees/${employeeId}`);
      console.log('Refreshed employee data:', data);
      
      // Process and update component state
      const employeeData = processEmployeeData(data);
      setEmployee(employeeData);
      
      // Update form with new values
      formRef.setFieldsValue({
        ...employeeData,
        role_name: employeeData.role_name || employeeData.roleName
      });
      
      // Reset image-related state
      setImageFile(null);
      setImagePreview('');
      setFileList([]);
      
      // Exit edit mode
      setEditMode(false);
      
      return true;
    } catch (refreshError) {
      console.error('Error refreshing employee data:', refreshError);
      message.warning('Please reload the page to see updated data');
      return false;
    }
  };
  
  // NOTE: The refreshEmployeeData function is now used instead of handleUpdateSuccess

  // Function to process employee data from API
  const processEmployeeData = (data) => {
    // Help debugging
    console.log('Processing employee data:', data);
    
    // Use the getField helper function defined above
    const getField = (fieldNames, defaultValue = '') => {
      if (!data) return defaultValue;
      // Handle arrays of possible field names
      if (Array.isArray(fieldNames)) {
        for (const name of fieldNames) {
          if (data[name] !== undefined && data[name] !== null && data[name] !== '')
            return data[name];
        }
        return defaultValue;
      }
      // Handle single field name
      return data[fieldNames] !== undefined && data[fieldNames] !== null && data[fieldNames] !== '' 
        ? data[fieldNames] 
        : defaultValue;
    };

    return {
      // Add a debugging property to track all fields
      _originalData: { ...data },
      
      // Core fields
      employee_id: getField(['employee_id', 'employeeId', 'id']),
      employee_name: getField(['name', 'employee_name', 'employeeName']) || 
        ((getField(['firstName', 'first_name']) + ' ' + getField(['lastName', 'last_name'])).trim()),
      role_name: getField(['roleName', 'role_name', 'roleDescription', 'role', 'position'], 'Unassigned'),
      roleName: getField(['roleName', 'role_name', 'roleDescription', 'role', 'position'], 'Unassigned'),
      profile_photo: getField(['profile_photo', 'profilePic', 'profile_pic', 'photo', 'avatar']),
      
      // Personal information
      dob: getField(['dob', 'dateOfBirth', 'date_of_birth', 'birth_date']),
      gender: getField(['gender', 'sex']),
      nationality: getField(['nationality', 'country']),
      maritalStatus: getField(['maritalStatus', 'marital_status']),
      spouseName: getField(['spouseName', 'spouse_name', 'spouse']),
      
      // Contact information
      mobile: getField(['mobile', 'phone', 'phoneNumber', 'phone_number', 'contact_number']),
      altMobile: getField(['altMobile', 'alt_mobile', 'alternate_mobile', 'alternatePhone', 'secondary_phone']),
      email: getField(['email', 'emailAddress', 'email_address']),
      
      // Address fields - handle various naming conventions
      permanentAddress: getField(['permanentAddress', 'permanent_address', 'address', 'primary_address']),
      communicationAddress: getField(['communicationAddress', 'communication_address', 'current_address', 'mailing_address', 'correspondence_address']),
      address: getField(['address', 'primary_address']),
      
      // Qualifications
      qualification: getField(['qualification', 'qualifications', 'education', 'degree']),
      department: getField(['department', 'dept', 'team']),
      
      // Emergency contact fields
      emergencyContactPerson: getField(['emergencyContactPerson', 'emergency_contact_person', 'emergencyName', 'emergency_name', 'emergency_contact']),
      emergencyMobile: getField(['emergencyMobile', 'emergency_mobile', 'emergencyContact', 'emergency_contact_no', 'emergencyPhone', 'emergency_phone']),
      emergencyName: getField(['emergencyName', 'emergency_name', 'emergencyContactPerson', 'emergency_contact_person', 'emergency_contact']),
      emergencyRelationship: getField(['emergencyRelationship', 'emergency_relationship', 'relation', 'emergency_relation']),
      
      // Family information
      motherName: getField(['motherName', 'mother_name', 'mother']),
      fatherName: getField(['fatherName', 'father_name', 'father']),
      
      // Professional details
      joiningLocation: getField(['joiningLocation', 'joining_location', 'location', 'office']),
      doj: getField(['doj', 'joining_date', 'dateOfJoining', 'date_of_joining', 'hire_date', 'start_date']),
      created_at: getField(['created_at', 'createdAt', 'creation_date', 'registration_date']),
      status: getField(['status', 'employee_status', 'active_status'], 'Active'),
    };
  };

  // Function to handle file preview
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };
  
  // Handle file change in the upload component
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    
    // If there's a file and it's done uploading or is a local file
    if (newFileList.length > 0) {
      const lastFile = newFileList[newFileList.length - 1];
      
      if (lastFile.originFileObj) {
        // Set the file for actual form submission
        setImageFile(lastFile.originFileObj);
        
        // Create preview URL
        getBase64(lastFile.originFileObj, (url) => {
          setImagePreview(url);
          setImageUploading(false);
        });
      } else if (lastFile.url) {
        // If we already have a URL (from server)
        setImagePreview(lastFile.url);
      }
    } else {
      // If no files, clear the preview and file
      setImageFile(null);
      setImagePreview('');
    }
  };
  
  // Set upload state when entering edit mode (without animation)
  useEffect(() => {
    if (editMode && employee && employee.profile_photo) {
      const photoUrl = employee.profile_photo.startsWith('http') 
        ? employee.profile_photo 
        : `http://127.0.0.1:5000/uploads/${employee.profile_photo}`;
        
      // Initialize the file list with the existing photo immediately (no animations)
      setTimeout(() => {
        setFileList([{
          uid: '-1',
          name: 'profile.jpg',
          status: 'done',
          url: photoUrl
        }]);
      }, 0);
    } else if (!editMode) {
      // Reset file list when exiting edit mode
      setFileList([]);
    }
  }, [editMode, employee]);
  
  // Convert file to base64 for preview
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  
  // Handle canceling edit
  const handleCancel = () => {
    // Reset form and exit edit mode
    setEditData({
      ...employee,
      dob: employee.dob ? moment(employee.dob) : null,
      doj: employee.doj ? moment(employee.doj) : null
    });
    // Reset image related state
    setImageFile(null);
    setImagePreview('');
    setFileList([]);
    setPreviewOpen(false);
    setPreviewImage('');
    setEditMode(false);
  };
  
  // Handle form field changes
  const handleChange = (field, value) => {
    console.log(`Updating field ${field} with value:`, value);
    setEditData(prevData => {
      const newData = {
        ...prevData,
        [field]: value
      };
      console.log('Updated edit data:', newData);
      return newData;
    });
  };

  if (loading) {
    return (
      <div className="employee-loading-container">
        <Spin size="large" />
        <p>Loading employee details...</p>
      </div>
    );
  }
  
  if (!employee) {
    return (
      <div className="employee-error-container">
        <p className="employee-error-text">Employee not found</p>
        <Button type="primary" onClick={handleBackToEmployees} icon={<ArrowLeftOutlined />}>
          Back to Employees
        </Button>
      </div>
    );
  }

  // Render personal info section with edit functionality
  const renderPersonalInfo = () => {
    console.log("Rendering personal info with data:", {
      dob: employee.dob,
      gender: employee.gender,
      nationality: employee.nationality,
      maritalStatus: employee.maritalStatus,
      spouseName: employee.spouseName,
      email: employee.email,
      mobile: employee.mobile,
      altMobile: employee.altMobile,
      permanentAddress: employee.permanentAddress,
      communicationAddress: employee.communicationAddress,
      fatherName: employee.fatherName,
      motherName: employee.motherName,
      emergencyContactPerson: employee.emergencyContactPerson,
      emergencyName: employee.emergencyName,
      emergencyMobile: employee.emergencyMobile,
      emergencyRelationship: employee.emergencyRelationship
    });

    return (
      <div className="tab-content">
        {editMode ? (
          <Form form={formRef} layout="vertical" initialValues={editData}>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card className="info-card" title={
                  <div className="info-card-title">
                    <UserOutlined /> Basic Information
                  </div>
                }>
                  <Form.Item label="Date of Birth" name="dob">
                    <DatePicker 
                      format="YYYY-MM-DD" 
                      style={{ width: '100%' }}
                      onChange={(date) => handleChange('dob', date)}
                    />
                  </Form.Item>
                  <Form.Item label="Gender" name="gender">
                    <Select 
                      onChange={(value) => handleChange('gender', value)}
                      options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Other', label: 'Other' }
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="Nationality" name="nationality">
                    <Input onChange={(e) => handleChange('nationality', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Marital Status" name="maritalStatus">
                    <Select 
                      onChange={(value) => handleChange('maritalStatus', value)}
                      options={[
                        { value: 'Single', label: 'Single' },
                        { value: 'Married', label: 'Married' },
                        { value: 'Divorced', label: 'Divorced' },
                        { value: 'Widowed', label: 'Widowed' }
                      ]}
                    />
                  </Form.Item>
                  {editData?.maritalStatus === 'Married' && (
                    <Form.Item label="Spouse Name" name="spouseName">
                      <Input onChange={(e) => handleChange('spouseName', e.target.value)} />
                    </Form.Item>
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="info-card" title={
                  <div className="info-card-title">
                    <PhoneOutlined /> Contact Details
                  </div>
                }>
                  <Form.Item label="Email" name="email">
                    <Input onChange={(e) => handleChange('email', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Mobile" name="mobile">
                    <Input onChange={(e) => handleChange('mobile', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Alternate Mobile" name="altMobile">
                    <Input onChange={(e) => handleChange('altMobile', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Permanent Address" name="permanentAddress">
                    <Input.TextArea 
                      rows={3} 
                      onChange={(e) => handleChange('permanentAddress', e.target.value)} 
                    />
                  </Form.Item>
                  <Form.Item label="Communication Address" name="communicationAddress">
                    <Input.TextArea 
                      rows={3} 
                      onChange={(e) => handleChange('communicationAddress', e.target.value)} 
                    />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="info-card" title={
                  <div className="info-card-title">
                    <TeamOutlined /> Family Information
                  </div>
                }>
                  <Form.Item label="Father's Name" name="fatherName">
                    <Input onChange={(e) => handleChange('fatherName', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Mother's Name" name="motherName">
                    <Input onChange={(e) => handleChange('motherName', e.target.value)} />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="info-card" title={
                  <div className="info-card-title">
                    <SafetyCertificateOutlined /> Emergency Contact
                  </div>
                }>
                  <Form.Item label="Contact Person" name="emergencyContactPerson">
                    <Input onChange={(e) => handleChange('emergencyContactPerson', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Emergency Mobile" name="emergencyMobile">
                    <Input onChange={(e) => handleChange('emergencyMobile', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Relationship" name="emergencyRelationship">
                    <Input onChange={(e) => handleChange('emergencyRelationship', e.target.value)} />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
          </Form>
        ) : (
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <InfoCard 
                title="Basic Information" 
                icon={<UserOutlined />}
                items={[
                  { label: "Date of Birth", value: formatDate(employee.dob), icon: <CalendarOutlined /> },
                  { label: "Gender", value: employee.gender || 'Not specified', icon: <UserOutlined /> },
                  { label: "Nationality", value: employee.nationality || 'Not specified', icon: <GlobalOutlined /> },
                  { label: "Marital Status", value: employee.maritalStatus || 'Not specified', icon: <HeartOutlined /> },
                  { label: "Spouse Name", value: employee.spouseName || 'Not Given', icon: <UserOutlined /> }
                ]}
              />
            </Col>
            <Col xs={24} md={12}>
              <InfoCard 
                title="Contact Details" 
                icon={<PhoneOutlined />}
                items={[
                  { 
                    label: "Email", 
                    value: employee.email, 
                    icon: <MailOutlined />,
                    isLink: true,
                    href: `mailto:${employee.email}` 
                  },
                  { label: "Mobile", value: employee.mobile, icon: <PhoneOutlined /> },
                  { label: "Alternate Mobile", value: employee.altMobile || 'Not provided', icon: <PhoneOutlined /> },
                  { label: "Permanent Address", value: employee.permanentAddress || employee.address || 'Not provided', icon: <HomeOutlined /> },
                  { label: "Communication Address", value: employee.communicationAddress || employee.address || 'Not provided', icon: <HomeOutlined /> }
                ]}
              />
            </Col>
            <Col xs={24} md={12}>
              <InfoCard 
                title="Family Information" 
                icon={<TeamOutlined />}
                items={[
                  { label: "Father's Name", value: employee.fatherName || 'Not provided', icon: <UserOutlined /> },
                  { label: "Mother's Name", value: employee.motherName || 'Not provided', icon: <UserOutlined /> }
                ]}
              />
            </Col>
            <Col xs={24} md={12}>
              <InfoCard 
                title="Emergency Contact" 
                icon={<SafetyCertificateOutlined />}
                items={[
                  { 
                    label: "Contact Person", 
                    value: employee.emergencyContactPerson || employee.emergencyName || 'Not provided', 
                    icon: <ContactsOutlined /> 
                  },
                  { 
                    label: "Emergency Mobile", 
                    value: employee.emergencyMobile || 'Not provided', 
                    icon: <PhoneOutlined /> 
                  },
                  { 
                    label: "Relationship", 
                    value: employee.emergencyRelationship || 'Not provided', 
                    icon: <TeamOutlined /> 
                  }
                ]}
              />
            </Col>
          </Row>
        )}
      </div>
    );
  };

  // Render professional info section with edit functionality
  const renderProfessionalInfo = () => {
    // Add debug logging to see what role data is being received
    console.log("Role information in professional info tab:", {
      role_name: employee.role_name,
      roleName: employee.roleName,
      original_data: employee._originalData ? {
        role_id: employee._originalData.role_id,
        role_name: employee._originalData.role_name,
        roleName: employee._originalData.roleName
      } : 'No original data'
    });

    // Get best role value from available fields
    const displayRole = employee.role_name || employee.roleName || 'Unassigned';

    return (
      <div className="tab-content">
        {editMode ? (
          <Form form={formRef} layout="vertical" initialValues={editData}>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card className="info-card" title={
                  <div className="info-card-title">
                    <BankOutlined /> Professional Details
                  </div>
                }>
                  <Form.Item label="Qualification" name="qualification">
                    <Input onChange={(e) => handleChange('qualification', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Joining Location" name="joiningLocation">
                    <Input onChange={(e) => handleChange('joiningLocation', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Joining Date" name="doj">
                    <DatePicker 
                      format="YYYY-MM-DD" 
                      style={{ width: '100%' }}
                      onChange={(date) => handleChange('doj', date)}
                    />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="info-card" title={
                  <div className="info-card-title">
                    <ApartmentOutlined /> Role Information
                  </div>
                }>
                  <Form.Item label="Role" name="role_name">
                    <Input onChange={(e) => handleChange('role_name', e.target.value)} />
                  </Form.Item>
                  <Form.Item label="Status" name="status">
                    <Select 
                      onChange={(value) => handleChange('status', value)}
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Inactive', label: 'Inactive' },
                        { value: 'Onboarding', label: 'Onboarding' },
                        { value: 'Leave', label: 'On Leave' }
                      ]}
                    />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
          </Form>
        ) : (
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <InfoCard 
                title="Professional Details" 
                icon={<BankOutlined />}
                items={[
                  { label: "Qualification", value: employee.qualification || 'Not provided', icon: <TrophyOutlined /> },
                  { label: "Joining Location", value: employee.joiningLocation || 'Not specified', icon: <HomeOutlined /> },
                  { label: "Joining Date", value: formatDate(employee.doj), icon: <CalendarOutlined /> }
                ]}
              />
            </Col>
            <Col xs={24} md={12}>
              <InfoCard 
                title="Role Information" 
                icon={<ApartmentOutlined />}
                items={[
                  { 
                    label: "Role", 
                    value: displayRole, 
                    icon: <SolutionOutlined />,
                    isTag: true,
                    tagColor: getRoleColor(displayRole)
                  },
                  { 
                    label: "Status", 
                    value: employee.status || 'Active', 
                    icon: <SafetyCertificateOutlined />,
                    isBadge: true,
                    badgeStatus: getStatusColor(employee.status)
                  }
                ]}
              />
            </Col>
          </Row>
        )}
      </div>
    );
  };

  // Render assignments tab content
  const renderAssignments = () => (
    <div className="tab-content">
      {assignmentsLoading ? (
        <div className="assignments-loading">
          <Spin />
          <p>Loading assignment data...</p>
        </div>
      ) : assignments ? (
        (!assignments.role_allocations?.length && !assignments.task_allocations?.length) ? (
          <Empty 
            description="No project assignments found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
        <div className="assignments-container">
          {/* Stats row at the top */}
          <Row gutter={[24, 24]} className="stats-row">
            <Col xs={24} sm={8}>
              <Card className="stat-card">
                <Statistic 
                  title="Active Projects" 
                  value={assignments.active_projects_count || 0}
                  prefix={<ProjectOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="stat-card">
                <Statistic 
                  title="Active Tasks" 
                  value={assignments.active_tasks_count || 0}
                  prefix={<AuditOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="stat-card">
                <Statistic 
                  title="Monthly Hours" 
                  value={(assignments.total_monthly_hours || 0).toFixed(1)}
                  prefix={<ClockCircleOutlined />}
                  suffix="hrs"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
          
          {/* Project allocations */}
          {assignments.role_allocations?.length > 0 && (
            <div className="assignments-section">
              <Title level={4} className="section-title">
                <ProjectOutlined /> Project Allocations
              </Title>
              
              <Table 
                dataSource={assignments.role_allocations}
                rowKey="allocation_id"
                pagination={false}
                className="assignments-table"
                size="small"
              >
                <Table.Column 
                  title="Project" 
                  dataIndex="project_name" 
                  key="project_name"
                  render={(text, record) => (
                    <span className="project-name">
                      {text}
                      <Tag 
                        color={getProjectStatusColor(record.project_status)}
                        className="project-status-tag"
                      >
                        {record.project_status}
                      </Tag>
                    </span>
                  )}
                />
                <Table.Column 
                  title="Client" 
                  dataIndex="client_name" 
                  key="client_name"
                  responsive={['md']}
                />
                <Table.Column 
                  title="Duration" 
                  key="duration"
                  render={(_, record) => (
                    <span className="duration-range">
                      <ScheduleOutlined className="duration-icon" />
                      {record.start_date} 
                      {record.end_date ? ` to ${record.end_date}` : ' (Ongoing)'}
                    </span>
                  )}
                />
                <Table.Column 
                  title="Workload" 
                  dataIndex="workload_percentage" 
                  key="workload"
                  render={(value) => (
                    <Progress 
                      percent={value || 0} 
                      size="small" 
                      status="active"
                      strokeColor={value > 75 ? '#f5222d' : value > 50 ? '#faad14' : '#52c41a'}
                    />
                  )}
                  responsive={['lg']}
                />
              </Table>
            </div>
          )}
          
          {/* Task allocations */}
          {assignments.task_allocations?.length > 0 && (
            <div className="assignments-section">
              <Title level={4} className="section-title">
                <AuditOutlined /> Assigned Tasks
              </Title>
              
              <Collapse 
                defaultActiveKey={['1']} 
                className="tasks-collapse"
              >
                <Panel 
                  header={`Tasks (${assignments.task_allocations.length})`} 
                  key="1"
                  className="tasks-panel"
                >
                  <Timeline mode="left">
                    {assignments.task_allocations.map(task => (
                      <Timeline.Item 
                        key={task.task_id}
                        dot={getTaskStatusIcon(task.task_status)}
                        color={getProjectStatusColor(task.task_status)}
                      >
                        <div className="task-item">
                          <div className="task-header">
                            <strong className="task-name">{task.task_name}</strong>
                            <Tag color={getProjectStatusColor(task.task_status)}>
                              {task.task_status}
                            </Tag>
                          </div>
                          
                          <div className="task-project">
                            Project: {task.project_name || 'Unassigned'}
                          </div>
                          
                          {task.description && (
                            <div className="task-description">
                              {task.description}
                            </div>
                          )}
                          
                          <div className="task-dates">
                            <span>
                              <ScheduleOutlined /> Start: {task.start_date || 'Not set'}
                            </span>
                            <span>
                              <ClockCircleOutlined /> Due: {task.end_date || 'Not set'}
                            </span>
                            <span>
                              <BarChartOutlined /> Priority: {
                                task.priority === 1 ? 'High' : 
                                task.priority === 2 ? 'Medium' : 'Low'
                              }
                            </span>
                          </div>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Panel>
              </Collapse>
            </div>
          )}
        </div>
        )
      ) : (
        <div className="assignments-error">
          <Empty 
            description="Failed to load assignments data"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Debug helper function to show all available data
  const renderDebugInfo = () => (
    <div className="tab-content" style={{ fontSize: '12px' }}>
      <Card className="info-card" title={
        <div className="info-card-title">
          <InfoCircleOutlined /> All Available Data Fields
        </div>
      }>
        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
          <pre>{JSON.stringify(employee._originalData, null, 2)}</pre>
        </div>
      </Card>
    </div>
  );

  // Custom component for info cards with animations
  const InfoCard = ({ title, icon, items }) => (
    <motion.div 
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Card 
        className="info-card" 
        title={
          <div className="info-card-title">
            {icon} {title}
          </div>
        }
      >
        <motion.div 
          className="info-card-content"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {items.map((item, index) => (
            <motion.div 
              key={index} 
              className="info-item"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              custom={index}
              transition={{ delay: index * 0.05 }}
            >
              <div className="info-item-icon">
                <motion.div 
                  whileHover={{ scale: 1.2, color: "#1890ff" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {item.icon}
                </motion.div>
              </div>
              <div className="info-item-content">
                <div className="info-item-label">{item.label}</div>
                <motion.div 
                  className="info-item-value"
                  whileHover={{ scale: 1.02 }}
                >
                  {item.isLink && (
                    <motion.a 
                      href={item.href} 
                      className="info-item-link"
                      whileHover={{ color: "#40a9ff", fontWeight: 600 }}
                    >
                      {item.value}
                    </motion.a>
                  )}
                  {item.isTag && (
                    <Tag color={item.tagColor} className="info-item-tag">
                      {item.value}
                    </Tag>
                  )}
                  {item.isBadge && (
                    <Badge 
                      status={item.badgeStatus} 
                      text={item.value}
                      className="info-item-badge"
                    />
                  )}
                  {!item.isLink && !item.isTag && !item.isBadge && item.value}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </motion.div>
  );

  // Profile summary with edit capability
  const renderProfileSummary = () => {
    if (editMode) {
      return (
        <Card className="employee-profile-summary">
          <div className="profile-summary-content">
            <div className="profile-avatar-container">
              <Upload
                action="https://api.mocki.io/v1/upload" // Dummy URL - we handle upload manually
                listType="picture-circle"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleFileChange}
                maxCount={1}
                className="avatar-uploader"
                showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                beforeUpload={(file) => {
                  // Validation
                  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                  if (!isJpgOrPng) {
                    message.error('You can only upload JPG/PNG file!');
                    return Upload.LIST_IGNORE;
                  }
                  const isLt10M = file.size / 1024 / 1024 < 10;
                  if (!isLt10M) {
                    message.error('Image must be smaller than 10MB!');
                    return Upload.LIST_IGNORE;
                  }
                  return false; // Prevent auto upload
                }}
                customRequest={({ onSuccess }) => {
                  // Simulate immediate success response without animations
                  onSuccess("ok", null);
                }}
              >
                {fileList.length >= 1 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
              
              {/* Fixed Image preview - using proper check and div container */}
              {previewOpen && (
                <div>
                  <Image
                    src={previewImage}
                    style={{ display: 'none' }}
                    preview={{
                      visible: previewOpen,
                      onVisibleChange: (visible) => setPreviewOpen(visible),
                      afterOpenChange: (visible) => !visible && setPreviewImage('')
                    }}
                  />
                </div>
              )}
            </div>
            <div className="profile-details" style={{ flex: 1 }}>
              <Form layout="vertical" form={formRef} style={{ width: '100%' }}>
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Employee Name" name="employee_name">
                      <Input 
                        onChange={(e) => handleChange('employee_name', e.target.value)} 
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Employee ID" name="employee_id">
                      <Input 
                        onChange={(e) => handleChange('employee_id', e.target.value)} 
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Email" name="email">
                      <Input 
                        onChange={(e) => handleChange('email', e.target.value)} 
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Mobile" name="mobile">
                      <Input 
                        onChange={(e) => handleChange('mobile', e.target.value)} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </div>
          </div>
        </Card>
      );
    }
    
    return (
      <Card className="employee-profile-summary">
        <div className="profile-summary-content">
          <div className="profile-avatar-container">
            {employee.profile_photo ? (
              <Avatar 
                size={120} 
                src={employee.profile_photo.startsWith('http') 
                  ? employee.profile_photo 
                  : `http://127.0.0.1:5000/uploads/${employee.profile_photo}`}
                className="profile-avatar"
              />
            ) : (
                              <Avatar 
                  size={120}
                  className="profile-avatar"
                  style={{ 
                    backgroundColor: '#1890ff',
                    fontSize: '60px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {employee.employee_name ? employee.employee_name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
            )}
          </div>
          <div className="profile-details">
            <div className="profile-name-role">
              <Title level={2} className="profile-name">
                {employee.employee_name}
                <Badge 
                  status={getStatusColor(employee.status)} 
                  text={employee.status || 'Active'}
                  className="profile-status-badge"
                />
              </Title>
              <div className="profile-role-id">
                <Tag color={getRoleColor(employee.role_name || employee.roleName)} className="profile-role-tag">
                  {employee.role_name || employee.roleName || "Unassigned"}
                </Tag>
                <Text className="profile-id"><IdcardOutlined /> {employee.employee_id}</Text>
              </div>
            </div>
            <div className="profile-contact-quick">
              <div className="profile-quick-item">
                <MailOutlined className="quick-item-icon" />
                <a href={`mailto:${employee.email}`} className="quick-item-text">
                  {employee.email}
                </a>
              </div>
              <div className="profile-quick-item">
                <PhoneOutlined className="quick-item-icon" />
                <span className="quick-item-text">{employee.mobile}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <motion.div 
      className="employee-details-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header Section */}
      <motion.div 
        className="employee-header"
        variants={headerVariants}
        initial="initial"
        animate="animate"
      >
        <div className="employee-header-left">
          <motion.div variants={btnVariants} whileHover="hover" whileTap="tap">
            <Button 
              type="primary" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToEmployees}
              className="employee-back-button"
            >
              Back to Employees
            </Button>
          </motion.div>
        </div>
        <div className="employee-header-right">
          {editMode ? (
            <AnimatePresence mode="wait">
              <motion.div 
                className="button-group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: '8px' }}
                key="edit-mode-buttons"
              >
                <motion.div variants={btnVariants} whileHover="hover" whileTap="tap">
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                    loading={saving}
                    style={{ marginRight: 8 }}
                  >
                    Save Changes
                  </Button>
                </motion.div>
                <motion.div variants={btnVariants} whileHover="hover" whileTap="tap">
                  <Button 
                    icon={<UndoOutlined />} 
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                className="button-group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex' }}
                key="view-mode-buttons"
              >
                <motion.div variants={btnVariants} whileHover="hover" whileTap="tap">
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    style={{ marginRight: 8 }}
                  >
                    Edit Profile
                  </Button>
                </motion.div>
                
                <motion.div variants={btnVariants} whileHover="hover" whileTap="tap">
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "pdf",
                          icon: <FilePdfOutlined />,
                          label: "Export as PDF",
                          disabled: downloading,
                          onClick: () => handleExport('pdf')
                        },
                        {
                          key: "csv",
                          icon: <FileExcelOutlined />,
                          label: "Export as CSV",
                          disabled: downloading,
                          onClick: () => handleExport('csv')
                        }
                      ]
                    }}
                    placement="bottomRight"
                    trigger={['click']}
                  >
                    <Button 
                      type="default" 
                      icon={<DownloadOutlined />} 
                      className="employee-export-button"
                      loading={downloading}
                    >
                      Export Profile
                    </Button>
                  </Dropdown>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
      
      {/* Profile Summary Card */}
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        transition={{ delay: 0.2 }}
      >
        {renderProfileSummary()}
      </motion.div>
      
      {/* Tabbed Content */}
      <motion.div 
        className="employee-tabs-container"
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.4 }}
      >
        <Tabs 
          defaultActiveKey="1" 
          onChange={(key) => setActiveTab(key)}
          className="employee-tabs"
          tabBarGutter={32}
          items={[
            {
              key: "1",
              label: (
                <span className="tab-title">
                  <UserOutlined /> Personal Information
                </span>
              ),
              children: renderPersonalInfo()
            },
            {
              key: "2",
              label: (
                <span className="tab-title">
                  <BankOutlined /> Professional
                </span>
              ),
              children: renderProfessionalInfo()
            }
          ]}
        />
      </motion.div>
    </motion.div>
  );
}

export default ViewEmployeeDetails;
