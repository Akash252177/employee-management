import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Form, Input, DatePicker, Button, message, 
  Row, Col, Spin, Typography, Divider, Breadcrumb, Card, Skeleton
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  ProjectOutlined, 
  UserOutlined, 
  ShoppingOutlined, 
  TeamOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  IdcardOutlined,
  BankOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { gsap } from 'gsap';
import './Project_Creation.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const ProjectCreation = () => {
  const [form] = Form.useForm();
  const [generatedProjectIds, setGeneratedProjectIds] = useState(() => {
    const savedIds = localStorage.getItem('generatedProjectIds');
    return savedIds ? JSON.parse(savedIds) : [];
  });
  const [clientName, setClientName] = useState('');
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Refs for GSAP animations
  const formCardRef = useRef(null);
  const headerRef = useRef(null);
  const formItemsRef = useRef(null);
  const buttonsRef = useRef(null);
  
  const navigate = useNavigate();

  // Generate random project ID
  const generateRandomProjectId = useCallback(() => {
    let newProjectId;
    do {
      const randomPart = Math.floor(Math.random() * 900) + 100;
      newProjectId = `PRO${randomPart}`;
    } while (generatedProjectIds.includes(newProjectId));
    return newProjectId;
  }, [generatedProjectIds]);

  // Generate project ID immediately
  useEffect(() => {
    const newProjectId = generateRandomProjectId();
    setProjectId(newProjectId);
    
    // Show form after a delay for animation
    const timer = setTimeout(() => {
      setFormVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [generateRandomProjectId]);

  // Set form values after form is visible
  useEffect(() => {
    if (formVisible && projectId) {
      form.setFieldsValue({ 
        projectId: projectId
      });
      
      // Initialize entrance animations after form is visible
      initializeAnimations();
    }
  }, [formVisible, projectId, form]);
  
  // Initialize animations
  const initializeAnimations = () => {
    const timeline = gsap.timeline();
    
    // Card entrance animation
    timeline.fromTo(
      formCardRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
    )
    // Header animation removed
    .fromTo(
      ".project-form-item",
      { opacity: 0, y: 20, stagger: 0.1 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: "power2.out" },
      "-=0.2"
    ).fromTo(
      buttonsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      "-=0.1"
    );
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const showSuccessNotification = useCallback(() => {
    setShowSuccessMessage(true);
    message.success({
      content: "Project added successfully!",
      className: 'success-message-animation'
    });
  }, []);

  const handleClient_IdChange = useCallback(async (e) => {
    const clientId = e.target.value;
    form.setFieldsValue({ projectClientId: clientId });
    
    if (!clientId) {
      setClientName('');
      return;
    }

    setLoading(true);
    
    // Show immediate feedback while processing
    message.loading({
      content: "Fetching client information...",
      key: "clientLookup",
      duration: 0
    });
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/get_client_name/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch client name');
      }
      const data = await response.json();
      
      if (data && data.client_name) {
        setClientName(data.client_name);
        
        // Animate the auto-filled fields for visual feedback
        gsap.fromTo(
          ".project-form-readonly-field",
          { 
            backgroundColor: "rgba(24, 144, 255, 0.1)",
            boxShadow: "0 0 0 2px rgba(24, 144, 255, 0.2)"
          },
          { 
            backgroundColor: "transparent",
            boxShadow: "none",
            duration: 1.5,
            ease: "power2.out"
          }
        );
      } else {
        message.error({
          content: 'Client ID not found',
          className: 'error-message-animation',
          duration: 3
        });
        setClientName('');
      }
    } catch (error) {
      console.error('Error fetching client name:', error);
      message.error({
        content: 'Error fetching client data',
        className: 'error-message-animation',
        duration: 3
      });
    } finally {
      setLoading(false);
      message.destroy("clientLookup");
    }
  }, [form]);

  const handleProduct_IdChange = useCallback(async (e) => {
    const productId = e.target.value;
    form.setFieldsValue({ productId: productId });
    
    if (!productId) {
      setProductName('');
      return;
    }

    setLoading(true);
    
    // Show immediate feedback while processing
    message.loading({
      content: "Fetching product information...",
      key: "productLookup",
      duration: 0
    });
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/get_product_name/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product name');
      }
      const data = await response.json();
      
      if (data && data.product_name) {
        setProductName(data.product_name);
        
        // Animate the auto-filled fields for visual feedback
        gsap.fromTo(
          ".project-form-readonly-field",
          { 
            backgroundColor: "rgba(24, 144, 255, 0.1)",
            boxShadow: "0 0 0 2px rgba(24, 144, 255, 0.2)"
          },
          { 
            backgroundColor: "transparent",
            boxShadow: "none",
            duration: 1.5,
            ease: "power2.out"
          }
        );
      } else {
        message.error({
          content: 'Product ID not found',
          className: 'error-message-animation',
          duration: 3
        });
        setProductName('');
      }
    } catch (error) {
      console.error('Error fetching product name:', error);
      message.error({
        content: 'Error fetching product data',
        className: 'error-message-animation',
        duration: 3
      });
    } finally {
      setLoading(false);
      message.destroy("productLookup");
    }
  }, [form]);

  const handleSubmit = useCallback(async (values) => {
    setLoading(true);
    
    // Show immediate feedback while processing
    message.loading({
      content: "Processing project data...",
      key: "projectSubmission",
      duration: 0
    });
    
    // Animation before submission
    gsap.to(formCardRef.current, {
      scale: 0.98,
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      duration: 0.3,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1
    });
    
    // Use requestAnimationFrame to ensure UI updates before heavy processing
    requestAnimationFrame(async () => {
      try {
      // Format dates to DD-MM-YYYY
      const formattedReleaseDate = values.releaseDate.format('DD-MM-YYYY');
      const formattedCommittedDate = values.committedDate.format('DD-MM-YYYY');
      
      const projectData = {
          projectId: values.projectId,
        projectName: values.projectName,
        projectClientId: values.projectClientId,
        clientName: clientName,
        productId: values.productId,
        productName: productName,
        managedBy: values.managedBy,
        estimatedCost: values.estimatedCost,
        completionDays: values.completionDays,
        releaseDate: formattedReleaseDate,
        committedDate: formattedCommittedDate,
        description: values.description,
      };

      const response = await fetch('http://127.0.0.1:5000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create project');
      }

        // Update the project ID list
      setGeneratedProjectIds(prevIds => {
          const newIds = [...prevIds, values.projectId];
        localStorage.setItem('generatedProjectIds', JSON.stringify(newIds));
        return newIds;
      });

        // Close the loading message
        message.destroy("projectSubmission");
        
        // Show success notification
        showSuccessNotification();
      
        // Success animation
        const tl = gsap.timeline();
        tl.to(formCardRef.current, {
          boxShadow: "0 0 30px rgba(82, 196, 26, 0.4)",
          borderColor: "#52c41a",
          duration: 0.5,
          ease: "power2.inOut"
        });
        
        // Clear form and generate new ID in a separate animation frame
        requestAnimationFrame(() => {
          form.resetFields();
          const nextProjectId = generateRandomProjectId();
          setProjectId(nextProjectId);
          form.setFieldsValue({ projectId: nextProjectId });
          setClientName('');
          setProductName('');
          
          // Redirect after short delay for better UX
      setTimeout(() => {
            navigate('/projects');
      }, 1500);
        });
      } catch (error) {
        console.error('Error creating project:', error);
        
        // Close loading message and show error
        message.destroy("projectSubmission");
        message.error({
          content: error.message || 'Failed to create project. Please try again.',
          className: 'error-message-animation',
          duration: 5
        });
        
        // Error animation
        gsap.to(formCardRef.current, {
          x: [-5, 5, -5, 5, 0],
          duration: 0.4,
          ease: "power2.inOut"
        });
      } finally {
        setLoading(false);
      }
    });
  }, [form, generateRandomProjectId, navigate, showSuccessNotification, clientName, productName]);

  const handleReset = useCallback(() => {
    // Reset form animation
    gsap.fromTo(
      ".project-form-item",
      { 
        backgroundColor: "rgba(250, 173, 20, 0.1)" 
      },
      { 
        backgroundColor: "transparent",
        stagger: 0.05,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          form.resetFields();
          const nextProjectId = generateRandomProjectId();
          setProjectId(nextProjectId);
          form.setFieldsValue({ projectId: nextProjectId });
          setClientName('');
          setProductName('');
          message.info('Form has been reset');
        }
      }
    );
  }, [form, generateRandomProjectId]);

  const animateFormSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await handleSubmit(values);
    } catch (error) {
      message.error("Please fill all required fields.");
      
      // Highlight invalid fields with animation
      gsap.to(".ant-form-item-has-error", {
        x: [-5, 5, -3, 3, 0],
        duration: 0.4,
        ease: "power2.inOut"
      });
    }
  }, [form, handleSubmit]);

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => [
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
          <ProjectOutlined /> Projects
        </>
      ),
      href: '/projects'
    },
    {
      title: 'Project Creation'
    }
  ], []);

  // Loading state
  if (!formVisible) {
    return (
      <div className="project-form-container project-form-loading-container">
        <Skeleton active paragraph={{ rows: 1 }} className="project-form-breadcrumb-skeleton" />
        <Skeleton active paragraph={{ rows: 1 }} className="project-form-header-skeleton" />
        <Card className="project-form-card">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
            </div>
    );
  }

  return (
    <div className="project-form-container">
      {/* Breadcrumb Navigation */}
      <div className="project-form-page-breadcrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      {/* Header */}
      <div className="project-form-status-header" ref={headerRef}>
        <ProjectOutlined className="project-form-header-icon" />
        <span className="project-form-header-text">Project Creation</span>
      </div>

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="project-form-success-notification">
          <div className="project-form-success-icon-wrapper">
            <CheckCircleOutlined className="project-form-success-icon" />
          </div>
          <span>Project information saved successfully!</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="project-form-info-banner">
        <InfoCircleOutlined className="project-form-info-banner-icon" />
        <div>
          <div className="project-form-info-banner-title">Create a New Project</div>
          <div className="project-form-info-banner-description">
            Enter project details to create a new project. Fields marked with an asterisk (*) are required.
            Project ID is auto-generated and cannot be changed.
          </div>
        </div>
            </div>
          
      {/* Main Form Card */}
      <div className="project-form-card" ref={formCardRef}>
          <Form
            form={form}
            layout="vertical"
          name="project_creation"
          onFinish={handleSubmit}
          className="project-form-form"
          initialValues={{ projectId }}
          validateTrigger={['onBlur']}
          ref={formItemsRef}
        >
          {/* Basic Info Section */}
          <div className="project-form-role-info-header">
            <div className="project-form-role-icon"><InfoCircleOutlined /></div>
            <span className="project-form-role-info-title">Basic Information</span>
          </div>

            <Row gutter={24}>
            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <IdcardOutlined />
                    <span>Project ID</span>
                  </div>
                }
                    name="projectId"
                required
                className="project-form-item"
                  >
                    <Input 
                      disabled 
                  className="project-form-custom-input project-form-disabled-input"
                      prefix={<IdcardOutlined />} 
                    />
                  </Form.Item>
              </Col>
            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <ProjectOutlined />
                    <span>Project Name</span>
                  </div>
                }
                    name="projectName"
                required
                rules={[{ required: true, message: 'Please enter Project Name!' }]}
                className="project-form-item"
                  >
                    <Input 
                      placeholder="Enter Project Name" 
                  className="project-form-custom-input"
                    />
                  </Form.Item>
              </Col>

            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <BankOutlined />
                    <span>Client ID</span>
                  </div>
                }
                    name="projectClientId"
                required
                rules={[{ required: true, message: 'Please enter Client ID!' }]}
                className="project-form-item"
                  >
                    <Input 
                  placeholder="Enter Client ID" 
                  className="project-form-custom-input"
                      onChange={handleClient_IdChange}
                    />
                  </Form.Item>
              </Col>
            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <BankOutlined />
                    <span>Client Name</span>
                  </div>
                }
                className="project-form-item"
              >
                <div className="project-form-readonly-field">
                  <BankOutlined className="project-form-readonly-icon" />
                  {clientName ? clientName : <span className="project-form-empty-field">Client name will appear here</span>}
                </div>
                  </Form.Item>
              </Col>

            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <ShoppingOutlined />
                    <span>Product ID</span>
                  </div>
                }
                    name="productId"
                required
                rules={[{ required: true, message: 'Please enter Product ID!' }]}
                className="project-form-item"
                  >
                    <Input 
                      placeholder="Enter Product ID" 
                  className="project-form-custom-input"
                      onChange={handleProduct_IdChange}
                    />
                  </Form.Item>
              </Col>
            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <ShoppingOutlined />
                    <span>Product Name</span>
                  </div>
                }
                className="project-form-item"
              >
                <div className="project-form-readonly-field">
                  <ShoppingOutlined className="project-form-readonly-icon" />
                  {productName ? productName : <span className="project-form-empty-field">Product name will appear here</span>}
                </div>
                  </Form.Item>
              </Col>

            <Col span={24}>
              <Form.Item 
                label={
                  <div className="project-form-form-label">
                    <FileTextOutlined />
                    <span>Description</span>
                  </div>
                }
                name="description"
                required
                rules={[{ required: true, message: 'Please enter Description!' }]}
                className="project-form-item"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter Project Description" 
                  className="project-form-custom-input project-form-medium-textarea"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="project-form-section-divider" />

          {/* Project Details Section */}
          <div className="project-form-role-info-header">
            <div className="project-form-role-icon"><UserOutlined /></div>
            <span className="project-form-role-info-title">Project Details</span>
          </div>
          
          <div className="project-form-technical-section-intro">
            <BulbOutlined className="project-form-tech-intro-icon" />
            <Text>Provide detailed information about this project's timeline, costs, and management.</Text>
          </div>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <UserOutlined />
                    <span>Managed By</span>
                  </div>
                }
                    name="managedBy"
                required
                rules={[{ required: true, message: 'Please enter Manager Name!' }]}
                className="project-form-item"
                  >
                    <Input 
                  placeholder="Enter Manager Name" 
                  className="project-form-custom-input"
                  prefix={<UserOutlined />}
                    />
                  </Form.Item>
              </Col>
            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <DollarOutlined />
                    <span>Estimated Cost</span>
                  </div>
                }
                    name="estimatedCost"
                required
                rules={[{ required: true, message: 'Please enter Estimated Cost!' }]}
                className="project-form-item"
                  >
                    <Input
                      placeholder="Enter Estimated Cost"
                  className="project-form-custom-input"
                      prefix={<DollarOutlined />}
                    />
                  </Form.Item>
              </Col>

            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <FieldTimeOutlined />
                    <span>Completion Days</span>
                  </div>
                }
                    name="completionDays"
                required
                rules={[{ required: true, message: 'Please enter Completion Days!' }]}
                className="project-form-item"
                  >
                    <Input 
                      placeholder="Enter Completion Days" 
                  className="project-form-custom-input"
                      prefix={<FieldTimeOutlined />}
                    />
                  </Form.Item>
              </Col>
            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <CalendarOutlined />
                    <span>Release Date</span>
                  </div>
                }
                    name="releaseDate"
                required
                rules={[{ required: true, message: 'Please select Release Date!' }]}
                className="project-form-item"
                  >
                    <DatePicker 
                  className="project-form-custom-input project-form-date-picker"
                      format="DD-MM-YYYY"
                  placeholder="Select Release Date"
                  style={{ width: '100%' }}
                    />
                  </Form.Item>
              </Col>

            <Col xs={24} sm={12}>
                  <Form.Item
                label={
                  <div className="project-form-form-label">
                    <CalendarOutlined />
                    <span>Committed Date</span>
                  </div>
                }
                    name="committedDate"
                required
                rules={[{ required: true, message: 'Please select Committed Date!' }]}
                className="project-form-item"
                  >
                    <DatePicker 
                  className="project-form-custom-input project-form-date-picker"
                      format="DD-MM-YYYY"
                  placeholder="Select Committed Date"
                  style={{ width: '100%' }}
                    />
                  </Form.Item>
              </Col>
            </Row>

          {/* Form buttons */}
          <div className="project-form-button-container" ref={buttonsRef}>
            <button 
              className="project-form-reset-button ant-btn"
              onClick={handleReset}
              disabled={loading}
              title="Reset all form fields"
              >
              <ReloadOutlined /> Reset
            </button>
            <button 
              className="project-form-save-button ant-btn ant-btn-primary"
              onClick={animateFormSubmit}
              disabled={loading}
              title="Save project information"
            >
              {loading ? <span className="project-form-loading-icon"></span> : <SaveOutlined />} Save
            </button>
          </div>
          </Form>
      </div>

      {/* Footer */}
      <div className="project-form-page-footer">
        <div className="project-form-footer-content">
          <div className="project-form-footer-left">
            <span>Employee Management System</span>
          </div>
          <div className="project-form-footer-right">
            <Button type="text" icon={<QuestionCircleOutlined />} className="project-form-help-button">Help</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreation;