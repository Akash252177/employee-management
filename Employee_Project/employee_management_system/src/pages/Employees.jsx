import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input, Button, Badge, Avatar, message, Spin, Empty, Breadcrumb, Switch, Tag, Divider, Radio, Modal } from "antd";
import { SearchOutlined, UserAddOutlined, DownloadOutlined, EllipsisOutlined, MailOutlined, 
  TagOutlined, EyeOutlined, DeleteOutlined, BulbOutlined, BulbFilled, HomeOutlined, InfoCircleOutlined,
  AppstoreOutlined, UnorderedListOutlined, FilterOutlined, SortAscendingOutlined, UserOutlined, PhoneOutlined, BarsOutlined, 
  ExclamationCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from "framer-motion";
import {
  pageTransitionVariants,
  containerVariants,
  cardVariants,
  listItemVariants,
  headerVariants,
  dropdownVariants
} from '../animations/animations';
import "./Employees.css";

function Employees() {

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [theme, setTheme] = useState("default"); // default, dark-theme, glass-theme
  const [formVisible, setFormVisible] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [departments, setDepartments] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  
  // Refs for GSAP animations
  const dropdownRefs = useRef({});
  const headerRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const actionButtonsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem("employeeTheme") || "default";
    setTheme(savedTheme);
    
    // Check for saved view mode in localStorage
    const savedViewMode = localStorage.getItem("employeeViewMode") || "grid";
    setViewMode(savedViewMode);
    
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("http://127.0.0.1:5000/api/employees");
        
        // Fetch roles for each employee to make sure we have the latest role information
        const employeesWithRoles = await Promise.all(
          data.map(async (employee) => {
            try {
              const roleResponse = await axios.get(`http://127.0.0.1:5000/get_employee_role/${employee.employee_id}`);
              return {
                ...employee,
                role_name: roleResponse.data.roleName || "Unassigned"
              };
            } catch (error) {
              console.error(`Error fetching role for employee ${employee.employee_id}:`, error);
              return {
                ...employee,
                role_name: "Unassigned"
              };
            }
          })
        );
        
        const mappedEmployees = employeesWithRoles.map((item) => ({
          employee_id: item.employee_id || "N/A",
          employee_name: item.employee_name || "N/A",
          profile_photo: item.profile_photo,
          date_joined: item.date_joined || "17/03/2021",
          email: item.email || "ronald@example.com",
          phone: item.phone || "+1-202-555-0129",
          department: item.department || "Engineering",
          contract_type: item.contract_type || "Full-time",
          role_name: item.role_name || "Unassigned"
        }));
        
        setEmployees(mappedEmployees);

        // Extract unique departments for filtering
        const uniqueDepartments = [...new Set(mappedEmployees.map(emp => emp.department))];
        setDepartments(uniqueDepartments);

        // Fetch roles
        const { data: roleData } = await axios.get("http://127.0.0.1:5000/api/employee_roles");
        setRoles(roleData);
        
        // Set a flag in localStorage to prevent showing the message twice due to StrictMode
        const hasShownMessage = localStorage.getItem("employeeDataLoaded");
        if (hasShownMessage !== "true") {
          message.success({
            content: "Employee data loaded successfully",
            className: 'success-message-animation',
            key: 'employee-data-loaded' // Use a unique key to prevent duplicates
          });
          localStorage.setItem("employeeDataLoaded", "true");
          
          // Reset the flag after 2 seconds to allow future messages
          setTimeout(() => {
            localStorage.removeItem("employeeDataLoaded");
          }, 2000);
        }
        
        // Show content immediately without delay
        setFormVisible(true);
        // Initialize animations after content is visible
        initializeAnimations();
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch employee or role data. Please try again.");
        message.error({
          content: "Failed to load employee data",
          className: 'error-message-animation',
          key: 'employee-data-error' // Use a unique key to prevent duplicates
        });
        setFormVisible(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Initialize animations - simplified for better performance
  const initializeAnimations = () => {
    if (!formVisible) return;
    
    // Apply simple CSS transitions instead of heavy GSAP animations
    if (headerRef.current) {
      headerRef.current.style.opacity = "1";
      headerRef.current.style.transform = "translateY(0)";
    }
    
    if (actionButtonsRef.current) {
      actionButtonsRef.current.style.opacity = "1";
      actionButtonsRef.current.style.transform = "translateX(0)";
    }
    
    // Set item visibility directly without animations
    const items = document.querySelectorAll(viewMode === "grid" ? ".staff-card" : ".staff-list-item");
    items.forEach(item => {
      item.style.opacity = "1";
      item.style.transform = "translateY(0)";
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideAny = Object.values(dropdownRefs.current).some((ref) =>
        ref?.contains(e.target)
      );
      if (!clickedInsideAny) setShowDropdown(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Apply theme class to document body
  useEffect(() => {
    // Remove all theme classes first
    document.body.classList.remove("dark-theme", "glass-theme");
    
    // Add the current theme class if not default
    if (theme !== "default") {
      document.body.classList.add(theme);
    }
    
    // Save theme preference to localStorage
    localStorage.setItem("employeeTheme", theme);
  }, [theme]);

  // Save view mode to localStorage without animations for better performance
  useEffect(() => {
    localStorage.setItem("employeeViewMode", viewMode);
    
    // Simple display without animations to prevent lag
    if (formVisible) {
      // Simply show the items without animation
      const items = document.querySelectorAll(viewMode === "grid" ? ".staff-card" : ".staff-list-item");
      items.forEach(item => {
        item.style.opacity = "1";
        item.style.transform = "none";
        item.style.transition = "opacity 0.2s ease";
      });
    }
  }, [viewMode, formVisible]);

  const handleThemeToggle = () => {
    // Rotate between themes: default -> dark-theme -> glass-theme -> default
    const themeMap = {
      "default": "dark-theme",
      "dark-theme": "glass-theme",
      "glass-theme": "default"
    };
    
    // Set theme directly without animations
    setTheme(themeMap[theme]);
    
    message.info({
      content: `Theme changed to ${themeMap[theme].replace("-theme", "")}`,
      className: 'success-message-animation',
      key: 'theme-change' // Use a unique key to prevent duplicates
    });
  };

  const getThemeIcon = () => {
    if (theme === "dark-theme") {
      return <BulbOutlined />;
    } else if (theme === "glass-theme") {
      return <BulbFilled style={{ color: "#faad14" }} />;
    } else {
      return <BulbFilled />;
    }
  };

  const handleViewModeToggle = (e) => {
    const newMode = e.target.value;
    const container = cardsContainerRef.current;
    
    // Add fade-out animation
    if (container) {
      container.style.opacity = "0";
      container.style.transform = "translateY(20px)";
      container.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    }

    // Change view mode after fade out
    setTimeout(() => {
      setViewMode(newMode);
      
      // Add fade-in animation
      if (container) {
        container.style.opacity = "1";
        container.style.transform = "translateY(0)";
      }
    }, 300);
  };

  const handleSelectEmployee = (employeeId) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleAddEmployee = () => {
    navigate("/add-employee");
  };

  const handleExport = () => {
    message.info({
      content: "Exporting employee data...",
      className: 'success-message-animation',
      key: 'export-data' // Use a unique key to prevent duplicates
    });
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleDropdownToggle = (e, id) => {
    e.stopPropagation();
    setShowDropdown((prev) => (prev === id ? null : id));
    
    // No animations for better performance
  };

  const handleDelete = async (employee, e) => {
    e.stopPropagation();
    const { employee_id } = employee;
    if (!employee_id) return;

    // Check if employee has a role assigned
    if (employee.role_name && employee.role_name !== 'Unassigned') {
      Modal.confirm({
        title: 'Warning',
        content: `${employee.employee_name} has a role assigned (${employee.role_name}). 
                 Employees with active roles may have dependencies that prevent deletion. 
                 Do you want to proceed with attempting to delete?`,
        okText: 'Yes, continue',
        cancelText: 'Cancel',
        onOk: () => {
          setEmployeeToDelete(employee);
          setDeleteModalVisible(true);
        }
      });
    } else {
      // If no role, proceed directly
      setEmployeeToDelete(employee);
      setDeleteModalVisible(true);
    }
  };

  const handleView = (employee, e) => {
    e.stopPropagation();
    
    // Navigate directly without animations
    navigate(`/employee/${employee.employee_id}`);
  };

  const handleAddTags = (e) => {
    e.stopPropagation();
    message.info({
      content: "Add tags functionality coming soon!",
      className: 'success-message-animation',
      key: 'add-tags' // Use a unique key to prevent duplicates
    });
  };

  const handleEmailCandidate = (employee, e) => {
    e.stopPropagation();
    window.open(`mailto:${employee.email}`);
  };

  const getInitials = (name) => {
    if (!name || name === "N/A") return "NA";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (id) => {
    const colors = [
      "#1890ff", "#52c41a", "#faad14", "#f5222d", 
      "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16"
    ];
    // Use the employee ID to generate a consistent color
    const index = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getDepartmentColor = (department) => {
    const colors = {
      "Engineering": "#1890ff",
      "Marketing": "#52c41a",
      "Finance": "#722ed1",
      "HR": "#eb2f96",
      "Sales": "#faad14",
      "Design": "#13c2c2"
    };
    return colors[department] || "#8c8c8c";
  };

  const getContractTypeColor = (type) => {
    const colors = {
      "Full-time": "#52c41a",
      "Part-time": "#faad14",
      "Contract": "#1890ff",
      "Internship": "#722ed1",
      "Temporary": "#eb2f96"
    };
    return colors[type] || "#8c8c8c";
  };

  const filteredEmployees = employees.filter((emp) =>
    [emp.employee_name, emp.employee_id, emp.email, emp.department].some((val) =>
      (val || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Breadcrumb items
  const breadcrumbItems = [
    {
      title: (
        <>
          <HomeOutlined /> Home
        </>
      ),
      href: '/'
    },
    {
      title: 'Employees'
    }
  ];

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setEmployeeToDelete(null);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete || !employeeToDelete.employee_id) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(`http://127.0.0.1:5000/api/employees/${employeeToDelete.employee_id}`);
      
      // Remove the deleted employee from the state
      setEmployees(employees.filter(emp => emp.employee_id !== employeeToDelete.employee_id));
      
      message.success({
        content: `${employeeToDelete.employee_name} has been deleted successfully`,
        className: 'success-message-animation',
        key: 'delete-success' // Use a unique key to prevent duplicates
      });
      
      // Close the modal and reset the employee to delete
      setDeleteModalVisible(false);
      setEmployeeToDelete(null);
    } catch (err) {
      console.error("Error deleting employee:", err);
      
      // Enhanced error handling with specific messages
      if (err.response && err.response.data && err.response.data.message) {
        // Show the specific error message from the backend
        message.error({
          content: err.response.data.message,
          className: 'error-message-animation',
          key: 'delete-error',
          duration: 5 // Show for longer to ensure user sees it
        });
      } else if (err.response && err.response.status === 409) {
        // In case we get a 409 conflict without a specific message
        message.error({
          content: "Cannot delete this employee because they have active dependencies (roles, tasks, etc.)",
          className: 'error-message-animation',
          key: 'delete-error',
          duration: 5
        });
      } else {
        // Generic error message as fallback
        message.error({
          content: "Failed to delete employee. Please try again.",
          className: 'error-message-animation',
          key: 'delete-error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (!formVisible) {
    return (
      <div className="staff-page-wrapper">
        <div className="staff-loading-container">
          <Spin size="large" />
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  // Render grid view
  const renderGridView = () => (
    <motion.div 
      className="staff-cards-grid"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      transition={{
        staggerChildren: 0.1,
        delayChildren: 0.2
      }}
    >
      {filteredEmployees.map((employee, index) => {
        const initials = getInitials(employee.employee_name);
        const avatarColor = getRandomColor(employee.employee_id);
        
        // Determine role color based on role name
        const getRoleColor = (roleName) => {
          const roleLower = roleName.toLowerCase();
          if (roleLower.includes('director') || roleLower.includes('founder')) return '#cf1322';
          if (roleLower.includes('chief') || roleLower.includes('cto') || roleLower.includes('ceo')) return '#d4380d';
          if (roleLower.includes('senior') || roleLower.includes('solution')) return '#fa8c16';
          if (roleLower.includes('software') || roleLower.includes('engineer')) return '#1890ff';
          if (roleLower.includes('trainee') || roleLower.includes('internship')) return '#52c41a';
          if (roleLower === 'unassigned') return '#bfbfbf';
          return '#108ee9';
        };
        
        // Get appropriate role badge style
        const roleColor = getRoleColor(employee.role_name);

        return (
          <motion.div
            key={employee.employee_id}
            data-employee-id={employee.employee_id}
            className={`staff-card ${
              selectedEmployees.has(employee.employee_id) ? "staff-card-selected" : ""
            }`}
            onClick={() => handleSelectEmployee(employee.employee_id)}
            variants={cardVariants}
          >
            <div className="staff-card-header">
              <div className="staff-avatar-container">
                {employee.profile_photo ? (
                  <Avatar 
                    size={64} 
                    src={employee.profile_photo.startsWith('http') ? employee.profile_photo : `http://127.0.0.1:5000/uploads/${employee.profile_photo}`}
                    className="staff-avatar"
                  />
                ) : (
                  <Avatar 
                    size={64} 
                    style={{ backgroundColor: avatarColor }}
                    className="staff-avatar"
                  >
                    {initials}
                  </Avatar>
                )}
                <h3 className="staff-name">{employee.employee_name}</h3>
                <div className="staff-role">
                  <Tag color={roleColor} className="staff-role-tag">
                    {employee.role_name}
                  </Tag>
                </div>
              </div>
              
              <div className="staff-dropdown">
                <Button
                  type="text"
                  icon={<EllipsisOutlined />}
                  onClick={(e) => handleDropdownToggle(e, employee.employee_id)}
                  className={`staff-actions-button ${showDropdown === employee.employee_id ? 'active' : ''}`}
                />
                
                {showDropdown === employee.employee_id && (
                  <div
                    className="staff-dropdown-menu"
                    ref={(el) => (dropdownRefs.current[employee.employee_id] = el)}
                  >
                    <div className="staff-dropdown-item" onClick={(e) => handleView(employee, e)}>
                      <EyeOutlined /> View
                    </div>
                    <div className="staff-dropdown-item" onClick={(e) => handleEmailCandidate(employee, e)}>
                      <MailOutlined /> Send Email
                    </div>
                    <div className="staff-dropdown-item staff-dropdown-danger" onClick={(e) => handleDelete(employee, e)}>
                      <DeleteOutlined /> Delete
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="staff-card-content">
              <div className="staff-details">
                <div className="staff-detail-item">
                  <span className="staff-detail-label"><UserOutlined /></span>
                  <span className="staff-detail-value">{employee.employee_id}</span>
                </div>
                <div className="staff-detail-item">
                  <span className="staff-detail-label"><PhoneOutlined /></span>
                  <span className="staff-detail-value">{employee.phone}</span>
                </div>
                <div className="staff-detail-item">
                  <span className="staff-detail-label"><MailOutlined /></span>
                  <a href={`mailto:${employee.email}`} className="staff-detail-value staff-email" onClick={(e) => e.stopPropagation()}>
                    {employee.email}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="staff-card-footer">
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<EyeOutlined />}
                  onClick={(e) => handleView(employee, e)}
                  className="staff-view-details-button"
                >
                  View Profile
                </Button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );

  // Render list view
  const renderListView = () => (
    <motion.div className="staff-list-view" variants={containerVariants} initial="hidden" animate="visible">
      <div className="staff-list-header">
        <div className="staff-list-header-col staff-col-employee">Employee</div>
        <div className="staff-list-header-col staff-col-id">ID</div>
        <div className="staff-list-header-col staff-col-role">Role</div>
        <div className="staff-list-header-col staff-col-email">Email</div>
        <div className="staff-list-header-col staff-col-phone">Phone</div>
        <div className="staff-list-header-col staff-col-joined">Joined</div>
        <div className="staff-list-header-col staff-col-actions">Actions</div>
      </div>

      <div className="staff-list-body">
        {filteredEmployees.map((employee) => {
          const initials = getInitials(employee.employee_name);
          const avatarColor = getRandomColor(employee.employee_id);
          
          // Determine role color based on role name
          const getRoleColor = (roleName) => {
            const roleLower = roleName.toLowerCase();
            if (roleLower.includes('director') || roleLower.includes('founder')) return '#cf1322';
            if (roleLower.includes('chief') || roleLower.includes('cto') || roleLower.includes('ceo')) return '#d4380d';
            if (roleLower.includes('senior') || roleLower.includes('solution')) return '#fa8c16';
            if (roleLower.includes('software') || roleLower.includes('engineer')) return '#1890ff';
            if (roleLower.includes('trainee') || roleLower.includes('internship')) return '#52c41a';
            if (roleLower === 'unassigned') return '#bfbfbf';
            return '#108ee9';
          };
          
          // Format date to show as "DD MMM YYYY"
          const formatJoinDate = (dateStr) => {
            if (!dateStr) return "";
            const dateParts = dateStr.split('-');
            if (dateParts.length !== 3) return dateStr;
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);
            
            return `${day} ${months[month]} ${year}`;
          };
          
          // Get appropriate role badge style
          const roleColor = getRoleColor(employee.role_name);
          
          // Ensure full role name is displayed
          const displayRoleName = (roleName) => {
            return roleName;
          };

          return (
            <motion.div
              key={employee.employee_id}
              data-employee-id={employee.employee_id}
              className={`staff-list-item ${
                selectedEmployees.has(employee.employee_id) ? "staff-list-item-selected" : ""
              }`}
              onClick={() => handleSelectEmployee(employee.employee_id)}
              variants={listItemVariants}
            >
              <div className="staff-list-col staff-col-employee">
                {employee.profile_photo ? (
                  <Avatar 
                    size={40} 
                    src={employee.profile_photo.startsWith('http') ? employee.profile_photo : `http://127.0.0.1:5000/uploads/${employee.profile_photo}`}
                    className="staff-list-avatar"
                  />
                ) : (
                  <Avatar 
                    size={40} 
                    style={{ backgroundColor: avatarColor }}
                    className="staff-list-avatar"
                  >
                    {initials}
                  </Avatar>
                )}
                <span className="staff-list-name">{employee.employee_name}</span>
              </div>

              <div className="staff-list-col staff-col-id">{employee.employee_id}</div>
              
              <div className="staff-list-col staff-col-role">
                <Tag color={roleColor}>{displayRoleName(employee.role_name)}</Tag>
              </div>
              
              <div className="staff-list-col staff-col-email">
                <a 
                  href={`mailto:${employee.email}`} 
                  onClick={(e) => e.stopPropagation()}
                  className="staff-email-link"
                >
                  {employee.email}
                </a>
              </div>
              
              <div className="staff-list-col staff-col-phone">{employee.phone}</div>
              
              <div className="staff-list-col staff-col-joined">
                {formatJoinDate(employee.date_joined)}
              </div>
              
              <div className="staff-list-col staff-col-actions">
                <div className="staff-action-icons">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />} 
                      className="staff-action-icon"
                      onClick={(e) => handleView(employee, e)}
                      title="View Profile"
                    />
                  <Button 
                    type="text" 
                    icon={<MailOutlined />} 
                    className="staff-action-icon"
                    onClick={(e) => handleEmailCandidate(employee, e)}
                    title="Send Email"
                  />
                  <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    className="staff-action-icon staff-delete-icon"
                    onClick={(e) => handleDelete(employee, e)}
                    title="Delete Employee"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      className="staff-page-wrapper"
      initial="initial"
      animate="animate"
      variants={pageTransitionVariants}
    >
      <motion.div 
        className="staff-content-wrapper"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Breadcrumb Navigation */}
        <div className="staff-page-breadcrumb">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        
        {/* Page Title and Summary */}
        <div className="staff-header" ref={headerRef}>
          <div className="staff-title-area">
            <div className="staff-icon-title">
              <UserOutlined className="staff-header-icon" />
              <h1 className="staff-title">Employees</h1>
            </div>
            <p className="staff-description">
              Manage all employees and their roles across the organization
            </p>
          </div>
          
          <div className="staff-stats">
            <div className="staff-stat-item">
              <span className="staff-stat-value">{employees.length}</span>
              <span className="staff-stat-label">Total Employees</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="staff-action-bar" ref={actionButtonsRef}>
          <div className="staff-view-controls">
            <Radio.Group 
              value={viewMode} 
              onChange={handleViewModeToggle}
              buttonStyle="solid"
              className="staff-view-toggle"
            >
              <Radio.Button value="grid"><AppstoreOutlined /> Grid</Radio.Button>
              <Radio.Button value="list"><BarsOutlined /> List</Radio.Button>
            </Radio.Group>
            
            <Button 
              icon={getThemeIcon()} 
              onClick={handleThemeToggle}
              className="staff-theme-button"
            />
          </div>

          <div className="staff-action-right">
            <Input
              placeholder="Search employees..."
              prefix={<SearchOutlined />}
              className="staff-search-input"
              value={searchTerm}
              onChange={handleSearch}
              allowClear
            />
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleExport}
              className="staff-export-button"
            >
              Export
            </Button>
            <Button 
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleAddEmployee}
              className="staff-add-button"
            >
              Add Employee
            </Button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="staff-loading-container">
            <Spin size="large" />
            <p>Loading employee data...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="staff-error-container">
            <p className="staff-error-text">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {/* Employee Content */}
        <div className="staff-content" ref={cardsContainerRef}>
          {!loading && filteredEmployees.length === 0 ? (
            <Empty 
              description="No employees found" 
              className="staff-empty-state"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : viewMode === "grid" ? (
            renderGridView()
          ) : (
            renderListView()
          )}
        </div>

        {/* Footer */}
        <div className="staff-footer">
          <div className="staff-footer-content">
            <span className="staff-footer-text">Employee Management System</span>
            <span className="staff-footer-count">{filteredEmployees.length} of {employees.length} employees</span>
          </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteModalVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <Modal
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <span>Confirm Deletion</span>
                  </div>
                }
                open={deleteModalVisible}
                onOk={confirmDelete}
                onCancel={cancelDelete}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
                centered
              >
                {employeeToDelete && (
                  <div className="delete-modal-content">
                    <p>Are you sure you want to delete the following employee?</p>
                    <div className="delete-employee-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                        {employeeToDelete.profile_photo ? (
                          <Avatar 
                            size={48} 
                            src={employeeToDelete.profile_photo.startsWith('http') ? 
                              employeeToDelete.profile_photo : 
                              `http://127.0.0.1:5000/uploads/${employeeToDelete.profile_photo}`}
                          />
                        ) : (
                          <Avatar 
                            size={48} 
                            style={{ backgroundColor: getRandomColor(employeeToDelete.employee_id) }}
                          >
                            {getInitials(employeeToDelete.employee_name)}
                          </Avatar>
                        )}
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{employeeToDelete.employee_name}</div>
                          <div style={{ color: '#666' }}>{employeeToDelete.employee_id} - {employeeToDelete.role_name}</div>
                        </div>
                      </div>
                    </div>
                    
                    {employeeToDelete.role_name && employeeToDelete.role_name !== 'Unassigned' && (
                      <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #faad14', backgroundColor: '#fffbe6', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                          <span style={{ fontWeight: 'bold' }}>Warning</span>
                        </div>
                        <p>This employee has an active role: <strong>{employeeToDelete.role_name}</strong></p> 
                        <p>If they have active role allocations, task assignments, or timesheet entries, the deletion may fail.</p>
                        <p style={{ marginBottom: 0 }}>Consider removing these dependencies first if deletion fails.</p>
                      </div>
                    )}
                  </div>
                )}
              </Modal>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default Employees;