import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  Card, 
  Input, 
  Select, 
  Button,
  Breadcrumb,
  Skeleton,
  Tag,
  Tooltip,
  message
} from "antd";
import { 
  SearchOutlined, 
  HomeOutlined,
  ApartmentOutlined,
  TeamOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  LockOutlined,
  EditOutlined
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import "./EmployeeRole.css"; // Reusing the same CSS file

const { Option } = Select;

const RoleInformation = () => {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  
  // Form data state
  const [roleData, setRoleData] = useState({
    role_id: "",
    roleName: "",
    parentRole: "",
    roleType: "",
    status: "active",
  });

  // Refs for GSAP animations
  const pageRef = useRef(null);
  const headerRef = useRef(null);
  const formCardRef = useRef(null);

  // Role information data
  const roleInfo = [
    { id: "MD", description: "Managing Director / Founder", parentId: "", roleType: "Administration" },
    { id: "CF", description: "Co - Founder", parentId: "MD", roleType: "Administration" },
    { id: "CEO", description: "Chief Executive Officer", parentId: "MD", roleType: "Human Resource" },
    { id: "CTO", description: "Chief Technology Officer", parentId: "MD", roleType: "Technical" },
    { id: "COO", description: "Chief Operative Officer", parentId: "MD", roleType: "Sales" },
    { id: "CFO", description: "Chief Financial Officer", parentId: "MD", roleType: "Finance" },
    { id: "VP", description: "Vice President", parentId: "CEO", roleType: "Technical" },
    { id: "AVP", description: "Assistant Vice President", parentId: "VP", roleType: "Technical" },
    { id: "SSA", description: "Senior Solution Architect", parentId: "AVP", roleType: "Technical" },
    { id: "SA", description: "Solution Architect", parentId: "SSA", roleType: "Technical" },
    { id: "SSE", description: "Senior Software Engineer", parentId: "SA", roleType: "Technical" },
    { id: "SE", description: "Software Engineer", parentId: "SSE", roleType: "Technical" },
    { id: "TRN", description: "Trainee", parentId: "SSE", roleType: "Technical" },
    { id: "INTRN", description: "Internship Trainee", parentId: "SSE", roleType: "Technical" }
  ];

  // Get unique role types for filter dropdown
  const roleTypeOptions = useCallback(() => {
    const types = [...new Set(roleInfo.map(role => role.roleType))];
    return types.map(type => ({
      value: type,
      label: type
    }));
  }, []);

  // Options for role ID dropdown
  const roleOptions = useCallback(() => 
    roleInfo.map(role => ({
      value: role.id,
      label: `${role.id} - ${role.description}`
    })), 
  []);

  // Initialize form data when role ID changes
  const handleRoleSelect = useCallback((roleId) => {
    const selectedRole = roleInfo.find(role => role.id === roleId);
    if (selectedRole) {
      setRoleData({
        role_id: selectedRole.id,
        roleName: selectedRole.description,
        parentRole: selectedRole.parentId || "",
        roleType: selectedRole.roleType,
        status: "active", // Default to active
      });
    }
  }, [roleInfo]);

  // Enhanced GSAP animations to include form
  const initializeAnimations = useCallback(() => {
    const timeline = gsap.timeline();
    
    // Page entrance
    timeline.fromTo(
      pageRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" }
    );
    
    // Header animation
    timeline.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }
    );
    
    // Form card animation
    timeline.fromTo(
      formCardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      "-=0.3"
    );
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setRoleData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Save changes
  const handleSaveChanges = useCallback(() => {
    // Validate form
    if (!roleData.role_id) {
      message.error("Please select a Role ID");
      return;
    }

    if (!roleData.roleName) {
      message.error("Role Description is required");
      return;
    }

    if (!roleData.roleType) {
      message.error("Role Type is required");
      return;
    }

    // Determine if this is an update or new role
    const isUpdate = true; // In a real app, we would check if this role exists in the database
    const endpoint = isUpdate ? '/update_employee_role' : '/add_employee_role';
    const method = isUpdate ? 'PUT' : 'POST';

    // Prepare payload
    const payload = {
      role_id: roleData.role_id,
      roleDescription: roleData.roleName,
      parentRole: roleData.parentRole || '',
      roleType: roleData.roleType,
      status: roleData.status || 'active'
    };

    // Simulate API call
    message.loading({ 
      content: (
        <span>
          <span style={{ color: isUpdate ? '#faad14' : '#52c41a', fontWeight: 'bold' }}>
            {isUpdate ? 'PUT' : 'POST'}
          </span>
          {' '}{endpoint} - Saving changes...
        </span>
      ), 
      key: "saveMessage" 
    });
    
    // Log the payload - in a real app this would be sent to the API
    console.log('Sending to API:', {
      endpoint,
      method,
      payload
    });
    
    // Simulate delay for API response
    setTimeout(() => {
      message.success({ 
        content: (
          <span>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            Role information saved successfully via {method} to {endpoint}
          </span>
        ), 
        key: "saveMessage", 
        duration: 4
      });
    }, 1500);
  }, [roleData]);

  // Reset form data
  const handleReset = useCallback(() => {
    setRoleData({
      role_id: "",
      roleName: "",
      parentRole: "",
      roleType: "",
      status: "active",
    });
    message.info("Form has been reset");
  }, []);

  // Simulate initial page loading
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) {
        setPageLoading(false);
      }
    }, 800);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Run animations on page load
  useEffect(() => {
    if (!pageLoading) {
      initializeAnimations();
    }
  }, [pageLoading, initializeAnimations]);

  if (pageLoading) {
    return (
      <div className="employee-role-page loading-container">
        <Skeleton active paragraph={{ rows: 1 }} className="breadcrumb-skeleton" />
        <Skeleton active paragraph={{ rows: 1 }} className="header-skeleton" />
        <Card className="role-card">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="employee-role-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      ref={pageRef}
    >
      {/* Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="page-breadcrumb"
      >
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
              title: (
                <>
                  <TeamOutlined /> Employees
                </>
              ),
              href: '/employees'
            },
            {
              title: 'Role Information'
            }
          ]}
        />
      </motion.div>
      
      {/* Custom Header */}
      <motion.div
        className="employee-status-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        ref={headerRef}
      >
        <ApartmentOutlined className="header-icon" />
        <span className="header-text">Role Information</span>
        <Link to="/employee-role" className="view-role-info-btn">
          <Button type="primary" icon={<ApartmentOutlined />}>
            Manage Roles
          </Button>
        </Link>
      </motion.div>

      {/* Role Information Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        ref={formCardRef}
        className="role-information-container"
      >
        <Card 
          className="employee-card" 
          bordered={false}
          style={{ 
            marginBottom: '24px', 
            borderRadius: '16px', 
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)' 
          }}
        >
          <div className="employee-form">
            <div className="form-section-header">
              <EditOutlined /> Basic Role Information
            </div>
            
            <div className="ant-row" style={{ marginBottom: '24px' }}>
              <div className="ant-col ant-col-xs-24 ant-col-sm-12" style={{ paddingRight: '16px' }}>
                <div className="form-label">
                  <ApartmentOutlined />
                  <span>Role ID</span>
                  <span className="required-mark">*</span>
                </div>
                <Select
                  value={roleData.role_id || undefined}
                  onChange={(value) => handleRoleSelect(value)}
                  placeholder="Select role ID"
                  className="custom-select"
                  options={roleOptions()}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  listHeight={250}
                  style={{ width: '100%' }}
                  size="large"
                  dropdownStyle={{ borderRadius: '8px', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)' }}
                  suffixIcon={<ApartmentOutlined style={{ color: roleData.role_id ? '#1890ff' : '#d9d9d9' }} />}
                />
                <div className="field-helper-text">Select a role to view its details</div>
              </div>

              <div className="ant-col ant-col-xs-24 ant-col-sm-12" style={{ paddingLeft: '16px' }}>
                <div className="form-label">
                  <ApartmentOutlined />
                  <span>Role Description</span>
                  <span className="required-mark">*</span>
                </div>
                <Input
                  value={roleData.roleName}
                  onChange={(e) => handleInputChange('roleName', e.target.value)}
                  className="custom-input enhanced-input"
                  style={{ width: '100%' }}
                  size="large"
                  placeholder="Role description will appear here"
                  prefix={<EditOutlined style={{ color: '#1890ff', opacity: 0.6 }} />}
                />
                <div className="field-helper-text">Detailed description of the role</div>
              </div>
            </div>

            <div className="form-section-header">
              <TeamOutlined /> Role Hierarchy & Classification
            </div>
            
            <div className="ant-row" style={{ marginBottom: '24px' }}>
              <div className="ant-col ant-col-xs-24 ant-col-sm-12" style={{ paddingRight: '16px' }}>
                <div className="form-label">
                  <TeamOutlined />
                  <span>Reports To</span>
                </div>
                <Select
                  value={roleData.parentRole || undefined}
                  onChange={(value) => handleInputChange('parentRole', value)}
                  placeholder="Select parent role"
                  className="custom-select"
                  options={roleOptions()}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  listHeight={250}
                  style={{ width: '100%' }}
                  size="large"
                  suffixIcon={<TeamOutlined style={{ color: roleData.parentRole ? '#1890ff' : '#d9d9d9' }} />}
                />
                <div className="field-helper-text">The role this position reports to</div>
              </div>

              <div className="ant-col ant-col-xs-24 ant-col-sm-12" style={{ paddingLeft: '16px' }}>
                <div className="form-label">
                  <ApartmentOutlined />
                  <span>Role Type</span>
                  <span className="required-mark">*</span>
                </div>
                <Select
                  value={roleData.roleType || undefined}
                  onChange={(value) => handleInputChange('roleType', value)}
                  placeholder="Select role type"
                  className="custom-select enhanced-select"
                  style={{ width: '100%' }}
                  options={roleTypeOptions()}
                  size="large"
                  dropdownRender={(menu) => (
                    <div>
                      <div style={{ padding: '8px 12px', color: '#1890ff', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>
                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                        Select Department Type
                      </div>
                      {menu}
                    </div>
                  )}
                />
                <div className="field-helper-text">Department or functional area</div>
              </div>
            </div>

            <div className="form-section-header">
              <LockOutlined /> Status Configuration
            </div>
            
            <div className="ant-row" style={{ marginBottom: '30px' }}>
              <div className="ant-col ant-col-xs-24 ant-col-sm-12" style={{ paddingRight: '16px' }}>
                <div className="form-label">
                  <LockOutlined />
                  <span>Status</span>
                </div>
                <Select
                  value={roleData.status || "active"}
                  onChange={(value) => handleInputChange('status', value)}
                  className="custom-select status-select"
                  style={{ width: '100%' }}
                  size="large"
                  suffixIcon={roleData.status === "active" ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <LockOutlined style={{ color: '#ff4d4f' }} />}
                >
                  <Option value="active">
                    <div className="status-option">
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      <Tag color="green" style={{ fontSize: '14px', padding: '2px 10px' }}>Active</Tag>
                      <span className="status-description">Role is currently in use</span>
                    </div>
                  </Option>
                  <Option value="inactive">
                    <div className="status-option">
                      <LockOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                      <Tag color="red" style={{ fontSize: '14px', padding: '2px 10px' }}>Inactive</Tag>
                      <span className="status-description">Role is disabled</span>
                    </div>
                  </Option>
                </Select>
                <div className="field-helper-text">Current status of this role</div>
              </div>
            </div>

            <div className="role-divider"></div>

            <div className="button-container">
              <Button 
                className="reset-button"
                onClick={handleReset}
                icon={<ReloadOutlined />}
                size="large"
              >
                Reset Form
              </Button>
              <Button 
                type="primary"
                className="save-button"
                onClick={() => handleSaveChanges()}
                icon={<SaveOutlined />}
                size="large"
              >
                Save Changes
              </Button>
            </div>
            
            <div className="api-info-section">
              <div className="api-info-title">
                <InfoCircleOutlined /> API Endpoints
              </div>
              <div className="api-endpoint">
                <span className="http-method">GET</span> /api/employee_roles
              </div>
              <div className="api-endpoint">
                <span className="http-method post">POST</span> /add_employee_role
              </div>
              <div className="api-endpoint">
                <span className="http-method put">PUT</span> /update_employee_role
              </div>
            </div>
          </div>
        </Card>
      </motion.div>


      
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
        </div>
      </motion.footer>
    </motion.div>
  );
};

export default RoleInformation; 