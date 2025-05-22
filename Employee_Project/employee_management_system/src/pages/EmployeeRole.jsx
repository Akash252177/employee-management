import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  Button, 
  message, 
  Row, 
  Col, 
  Card, 
  Select, 
  Form, 
  Typography, 
  Input, 
  Breadcrumb,
  notification,
  Tooltip,
  Tag,
  Skeleton,
  Divider,
  Space,
  Alert,
  Modal
} from "antd";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { 
  DownOutlined, 
  UpOutlined, 
  SaveOutlined, 
  ReloadOutlined, 
  AppstoreOutlined, 
  BarsOutlined,
  HomeOutlined,
  ApartmentOutlined,
  InfoCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  PlusOutlined
} from "@ant-design/icons";
import "./EmployeeRole.css";

const { Option } = Select;
const { Title, Text } = Typography;

// Create memoized role card component for better performance
const RoleCard = React.memo(({ role, selectedRoleId, onSelect }) => {
  return (
    <motion.div 
      className="role-card"
      whileHover={{ 
        y: -5,
        boxShadow: "0 8px 16px rgba(24, 144, 255, 0.15)"
      }}
      whileTap={{ 
        y: -2,
        boxShadow: "0 8px 16px rgba(24, 144, 255, 0.2)",
        scale: 0.98
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(role.id)}
      key={role.id}
    >
      <div className="role-id-wrapper">
        <div className="role-id">{role.id}</div>
        <motion.div 
          className="role-select-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: role.id === selectedRoleId ? 1 : 0 }}
        >
          <CheckCircleOutlined />
        </motion.div>
      </div>
      <div className="role-content">
        <div className="role-description" title={role.description}>
          {role.description}
        </div>
        <div className="role-metadata">
          <div className="role-metadata-item">
            <span className="metadata-label">Reports to:</span>
            <span className="metadata-value">
              {role.parentId ? role.parentId : "-"}
            </span>
          </div>
          <div className="role-metadata-item">
            <span className="metadata-label">Type:</span>
            <span className="metadata-value" data-type={role.roleType}>{role.roleType}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Create memoized role list item component for better performance
const RoleListItem = React.memo(({ role, onSelect }) => {
  // Helper function to convert role type to CSS class name
  const getTypeClass = (type) => {
    return type ? `type-${type.toLowerCase().replace(/\s+/g, '-')}` : '';
  };

  return (
    <motion.div
      key={role.id}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ 
        backgroundColor: "#f0f7ff", 
        x: 4
      }}
      className="role-list-item"
      onClick={() => onSelect(role.id)}
    >
      <div className="role-list-id">{role.id}</div>
      <div className="role-list-description">{role.description}</div>
      <div className="role-list-parent">{role.parentId || "-"}</div>
      <div className="role-list-type">
        <span className={`role-type-badge ${getTypeClass(role.roleType)}`}>{role.roleType}</span>
      </div>
    </motion.div>
  );
});

// Enhanced animation variants for framer motion - optimized for performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.3,
      staggerChildren: 0.03
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.2,
      when: "afterChildren",
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "tween" }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.1 }
  }
};

// Optimized motion components with reduced props
const MotionCard = ({ children, ...props }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    {...props}
  >
    {children}
  </motion.div>
);

const EmployeeRole = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState({
    role_id: "",
    roleName: "",
    parentRole: "",
    roleType: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");
  const [showRoleTable, setShowRoleTable] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Search and filter state
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list view toggle

  // Role mappings
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

  // Table columns structure
  const roleColumns = [
    { 
      title: '#', 
      dataIndex: 'index', 
      key: 'index', 
      width: 50,
      fixed: 'left'
    },
    { 
      title: 'Role Id', 
      dataIndex: 'id', 
      key: 'id', 
      width: 100,
      fixed: 'left'
    },
    { 
      title: 'Role Description', 
      dataIndex: 'description', 
      key: 'description', 
      width: 250,
      ellipsis: true
    },
    { 
      title: 'Parent Role ID', 
      dataIndex: 'parentId', 
      key: 'parentId', 
      width: 150 
    },
    { 
      title: 'Role Type', 
      dataIndex: 'roleType', 
      key: 'roleType', 
      width: 150 
    },
  ];

  // Prepare data for table display
  const tableData = useMemo(() => {
    return roleInfo.map((role, index) => ({
      ...role,
      index: index + 1,
      key: index
    }));
  }, []);

  // Filtered data based on search text and filter type
  const filteredTableData = useMemo(() => {
    return tableData.filter(role => {
      // Filter by search text (check in ID, description, and parent ID)
      const matchesSearch = searchText === "" || 
        role.id.toLowerCase().includes(searchText.toLowerCase()) ||
        role.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (role.parentId && role.parentId.toLowerCase().includes(searchText.toLowerCase()));
      
      // Filter by role type
      const matchesType = filterType === "" || role.roleType === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [tableData, searchText, filterType]);

  // Memoize options for better performance
  const roleOptions = useMemo(() => 
    roleInfo.map(role => ({
      value: role.id,
      label: `${role.id} - ${role.description}`
    })), 
  [roleInfo]);

  // Get unique role types for filter dropdown
  const roleTypeOptions = useMemo(() => {
    const types = [...new Set(roleInfo.map(role => role.roleType))];
    return types.map(type => ({
      value: type,
      label: type
    }));
  }, [roleInfo]);

  // Refs for GSAP animations
  const pageRef = useRef(null);
  const headerRef = useRef(null);
  const roleMasterRef = useRef(null);
  const formCardRef = useRef(null);
  const buttonsRef = useRef(null);
  const formInputsRef = useRef([]);

  // Memoized callbacks
  const handleInputChange = useCallback((field, value) => {
    // Handle null or undefined values gracefully
    const safeValue = value === null || value === undefined ? "" : value;
    
    setRoleData(prev => ({
      ...prev,
      [field]: safeValue,
    }));
    
    // Clear specific error when field is edited
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  // Memoized search and filter handlers
  const handleSearchChange = useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  const handleFilterChange = useCallback((value) => {
    setFilterType(value || "");
  }, []);
  
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === "grid" ? "list" : "grid");
  }, []);

  const toggleRoleTable = useCallback(() => {
    setAnimating(true);
    setShowRoleTable(prev => !prev);
    
    // Reset animation state after animation completes
    setTimeout(() => setAnimating(false), 300);
    
    // Reset search and filter when hiding the table
    if (showRoleTable) {
      setSearchText("");
      setFilterType("");
    }
  }, [showRoleTable]);

  // Handle role selection
  const handleRoleSelect = useCallback((roleId) => {
    // Highlight selected role card with pulse animation
    gsap.to(`.role-card[data-role-id="${roleId}"]`, {
      boxShadow: "0 0 15px rgba(24, 144, 255, 0.5)",
      borderColor: "#1890ff",
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to(`.role-card[data-role-id="${roleId}"]`, {
          boxShadow: "0 8px 16px rgba(24, 144, 255, 0.15)",
          duration: 0.5
        });
      }
    });
    
    // Update role data
    handleInputChange("role_id", roleId);
  }, [handleInputChange]);
  
  // Optimized validation with memoization
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!roleData.role_id || roleData.role_id.trim() === "") {
      newErrors.role_id = "Role ID is required.";
    }
    
    if (!roleData.roleName || roleData.roleName.trim() === "") {
      newErrors.roleName = "Role Description is required.";
    }
    
    if (!roleData.roleType || roleData.roleType.trim() === "") {
      newErrors.roleType = "Role Type is required.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [roleData.role_id, roleData.roleName, roleData.roleType]);

  // Initialize GSAP animations
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
    
    // Role master card animation
    timeline.fromTo(
      roleMasterRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      "-=0.2"
    );
    
    // Form card animation
    timeline.fromTo(
      formCardRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
      "-=0.3"
    );
    
    // Form inputs staggered animation
    timeline.fromTo(
      ".form-item",
      { opacity: 0, y: 15 },
      { 
        opacity: 1, 
        y: 0, 
        stagger: 0.05, 
        duration: 0.5, 
        ease: "power2.out" 
      },
      "-=0.4"
    );
    
    // Buttons animation
    timeline.fromTo(
      buttonsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.2"
    );
  }, []);
  
  // Animate form fields on focus
  const setupFieldAnimations = useCallback(() => {
    const inputs = gsap.utils.toArray("input, .ant-select");
    
    inputs.forEach(input => {
      input.addEventListener("focus", () => {
        gsap.to(input, { 
          y: -3, 
          boxShadow: "0 4px 8px rgba(24, 144, 255, 0.1)", 
          borderColor: "#1890ff",
          duration: 0.3, 
          ease: "power2.out" 
        });
      });
      
      input.addEventListener("blur", () => {
        gsap.to(input, { 
          y: 0, 
          boxShadow: "none", 
          borderColor: "#d9d9d9",
          duration: 0.3, 
          ease: "power2.out" 
        });
      });
    });
  }, []);
  
  // Run animations on page load
  useEffect(() => {
    if (!pageLoading) {
      initializeAnimations();
      setupFieldAnimations();
    }
    
    // Cleanup animation event listeners
    return () => {
      const inputs = gsap.utils.toArray("input, .ant-select");
      inputs.forEach(input => {
        input.removeEventListener("focus", () => {});
        input.removeEventListener("blur", () => {});
      });
    };
  }, [pageLoading, initializeAnimations, setupFieldAnimations]);

  // Improved form submission with GSAP animations
  const handleSubmit = useCallback(async () => {
    // Double-check validation to be safe
    if (!validateForm()) {
      // Error animation for invalid fields
      gsap.to(".ant-form-item-has-error", {
        x: [-5, 5, -4, 4, 0],
        duration: 0.4,
        ease: "power2.inOut",
        backgroundColor: "rgba(255, 77, 79, 0.05)",
        borderColor: "#ff4d4f"
      });
      
      setTimeout(() => {
        gsap.to(".ant-form-item-has-error", {
          backgroundColor: "transparent",
          borderColor: "#d9d9d9",
          duration: 0.8
        });
      }, 800);
      
      message.error("Please fill all required fields.");
      return;
    }

    // Form submit animation
    gsap.to(formCardRef.current, {
      scale: 0.98,
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
      duration: 0.3,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1,
      onComplete: async () => {
        setLoading(true);
        
        try {
          // Rest of the submission code remains the same
          // Check if role already exists
          const checkRes = await fetch("http://127.0.0.1:5000/api/employee_roles", {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          });
          
          if (!checkRes.ok) {
            throw new Error(`Failed to fetch roles: ${checkRes.status} ${checkRes.statusText}`);
          }

          const roles = await checkRes.json();
          const existingRole = roles.find(role => role.role_id === roleData.role_id);

          const endpoint = existingRole
            ? "http://127.0.0.1:5000/update_employee_role"
            : "http://127.0.0.1:5000/add_employee_role";

          const method = existingRole ? "PUT" : "POST";
          
          // Prepare payload with clean data (trim strings)
          const payload = {
            role_id: roleData.role_id.trim(),
            roleDescription: roleData.roleName.trim(),        
            parentRole: roleData.parentRole.trim(),
            roleType: roleData.roleType.trim(),
            status: roleData.status
          };

          const res = await fetch(endpoint, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload),
          });

          // Handle error responses
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`Error ${res.status}: ${errorText}`);
            
            try {
              // Try to parse as JSON if possible
              const errorData = JSON.parse(errorText);
              throw new Error(errorData.error || `Request failed with status ${res.status}`);
            } catch (e) {
              // If not JSON or parsing failed, throw the original error
              throw new Error(errorText || `Request failed with status ${res.status}`);
            }
          }

          const data = await res.json();

          // Set success message
          setShowSuccessMessage(true);
          
          message.success({
            content: existingRole ? "Role updated successfully!" : "Role added successfully!",
            className: 'success-message-animation'
          });
          
          // Success animation
          gsap.to(formCardRef.current, {
            boxShadow: "0 0 30px rgba(82, 196, 26, 0.4)",
            borderColor: "#52c41a",
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
              // Fade out form with staggered effect
              gsap.to(".form-item", {
                opacity: 0,
                y: -15,
                stagger: 0.03,
                duration: 0.4,
                ease: "power2.in",
                onComplete: () => {
                  // Navigate to employees page after animation completes
                  setTimeout(() => {
                    navigate("/employees");
                  }, 400);
                }
              });
            }
          });
        } catch (error) {
          console.error("Error saving role info:", error);
          
          // Error animation
          gsap.to(formCardRef.current, {
            x: [-5, 5, -5, 5, 0],
            duration: 0.4,
            ease: "power2.inOut",
            borderColor: "#ff4d4f"
          });
          
          setTimeout(() => {
            gsap.to(formCardRef.current, {
              borderColor: "#d9d9d9",
              duration: 0.8
            });
          }, 500);
          
          message.error({
            content: error.message || "Something went wrong while saving the role.",
            className: 'error-message-animation'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  }, [validateForm, roleData, token, navigate]);

  const handleReset = useCallback(() => {
    // Animate form reset
    const timeline = gsap.timeline();
    
    timeline.to(".form-item", {
      backgroundColor: "rgba(250, 173, 20, 0.05)",
      borderColor: "#faad14",
      duration: 0.3,
      stagger: 0.02,
      ease: "power2.inOut",
    });
    
    timeline.to(".form-item", {
      backgroundColor: "transparent",
      borderColor: "#d9d9d9",
      duration: 0.4,
      stagger: 0.01,
      delay: 0.1,
      ease: "power2.out",
      onComplete: () => {
        // Reset form data
        setRoleData({
          role_id: "",
          roleName: "",
          parentRole: "",
          roleType: "",
          status: "active",
        });
        
        // Clear any validation errors
        setErrors({});
        
        // Provide visual feedback that form was reset
        const formElement = document.querySelector('.employee-form');
        if (formElement) {
          formElement.classList.add('form-reset-animation');
          setTimeout(() => {
            formElement.classList.remove('form-reset-animation');
          }, 500);
        }
      }
    });
    
    // Animate reset button
    gsap.fromTo(
      ".reset-button",
      { scale: 0.95 },
      { scale: 1, duration: 0.4, ease: "back.out(1.7)" }
    );
  }, []);

  // Virtualized grid/list rendering - simplified for performance
  const renderRoleGrid = useMemo(() => {
    if (filteredTableData.length === 0) {
      return null;
    }
    
    return (
      <motion.div
        key="grid-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="role-cards-container">
          {filteredTableData.map(role => (
            <RoleCard 
              key={role.id} 
              role={role} 
              selectedRoleId={roleData.role_id} 
              onSelect={handleRoleSelect} 
              data-role-id={role.id}
            />
          ))}
        </div>
        {filteredTableData.length > 0 && (
          <div className="results-count">
            Showing {filteredTableData.length} role{filteredTableData.length !== 1 ? 's' : ''}
          </div>
        )}
      </motion.div>
    );
  }, [filteredTableData, roleData.role_id, handleRoleSelect]);

  const renderRoleListItems = useMemo(() => {
    return filteredTableData.map(role => (
      <RoleListItem 
        key={role.id} 
        role={role} 
        onSelect={handleRoleSelect} 
      />
    ));
  }, [filteredTableData, handleRoleSelect]);

  // Virtualized grid/list rendering - simplified for performance
  const renderRoleList = useMemo(() => {
    if (filteredTableData.length === 0) {
      return null;
    }
    
    return (
      <motion.div
        key="list-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="role-table-container"
      >
        <div className="role-table-header">
          <div className="header-cell header-id">ID</div>
          <div className="header-cell header-description">Description</div>
          <div className="header-cell header-parent">Parent</div>
          <div className="header-cell header-type">Type</div>
        </div>
        <div className="role-table-body">
          {filteredTableData.map(role => (
            <motion.div
              key={role.id}
              className="role-table-row"
              onClick={() => handleRoleSelect(role.id)}
              whileHover={{ backgroundColor: "#f0f7ff" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              data-role-id={role.id}
            >
              <div className="table-cell cell-id">{role.id}</div>
              <div className="table-cell cell-description">{role.description}</div>
              <div className="table-cell cell-parent">{role.parentId || "-"}</div>
              <div className={`table-cell cell-type type-${role.roleType.toLowerCase().replace(/\s+/g, '-')}`}>
                {role.roleType}
              </div>
            </motion.div>
          ))}
        </div>
        {filteredTableData.length > 0 && (
          <div className="results-count">
            Showing {filteredTableData.length} role{filteredTableData.length !== 1 ? 's' : ''}
          </div>
        )}
      </motion.div>
    );
  }, [filteredTableData, handleRoleSelect]);

  // Find role info by ID - memoized
  const findRoleInfo = useCallback((roleId) => {
    return roleInfo.find(role => role.id === roleId) || null;
  }, [roleInfo]);

  // Defer non-critical animations using requestAnimationFrame
  useEffect(() => {
    if (roleData.role_id) {
      const selectedRole = findRoleInfo(roleData.role_id);
      if (selectedRole) {
        setRoleData(prev => ({
          ...prev,
          roleName: selectedRole.description,
          parentRole: selectedRole.parentId || "",
          roleType: selectedRole.roleType
        }));
      }
    }
  }, [roleData.role_id, findRoleInfo]);

  // Simulate initial page loading - optimized to avoid performance issues
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

  // Clear success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

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
      {/* Breadcrumb Navigation - Updated to use items prop */}
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
              title: 'Role Management'
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
        <span className="header-text">Role Management</span>
      </motion.div>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            className="success-notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <div className="success-icon-wrapper">
              <CheckCircleOutlined className="success-icon" />
            </div>
            <span>Role saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Role Master Section */}
      <motion.div 
        className="role-master-section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        ref={roleMasterRef}
      >
        <Card 
          className="role-master-card"
          title={
            <div className="role-master-header">
              <span className="role-master-icon"><ApartmentOutlined /></span>
              <span>Role Master</span>
              <Link to="/role-information">
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  className="add-role-button"
                >
                  Add Role
                </Button>
              </Link>
            </div>
          }
        >
          <div className="role-filter-bar">
            <Input
              placeholder="Search roles..." 
              className="role-search"
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={handleSearchChange}
              onPressEnter={() => handleSearchChange({ target: { value: searchText } })}
            />
            <div className="filter-section">
              <Select 
                placeholder="Filter by type"
                className="role-filter"
                allowClear
                value={filterType || undefined}
                onChange={handleFilterChange}
                options={roleTypeOptions}
                popupMatchSelectWidth={false}
                title="Filter roles by their type"
              />
              <Button 
                icon={viewMode === "grid" ? <BarsOutlined /> : <AppstoreOutlined />}
                onClick={toggleViewMode}
                className="view-toggle-btn"
                type="text"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {filteredTableData.length > 0 ? (
              viewMode === "grid" ? renderRoleGrid : renderRoleList
            ) : (
              <motion.div 
                className="no-roles-found"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ExclamationCircleOutlined />
                <div>
                  <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                    No roles match your criteria
                  </Text>
                  <Text type="secondary">
                    Try changing your search or filter settings
                  </Text>
                </div>
                <Button 
                  onClick={() => {
                    setSearchText('');
                    setFilterType('');
                  }}
                  type="link"
                  icon={<ReloadOutlined />}
                >
                  Reset Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
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

export default EmployeeRole;