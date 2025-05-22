import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Form, Input, Button, DatePicker, Select, message, 
  Row, Col, Spin, Typography, Divider, Breadcrumb, Card, Skeleton, Tag
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  IdcardOutlined, 
  BankOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { gsap } from 'gsap';
import './Client_Creation.css';

const { TextArea } = Input;
const { Title, Text } = Typography;

const ClientCreation = () => {
  const [form] = Form.useForm();
  const [usedClientIds, setUsedClientIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [clientId, setClientId] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Refs for GSAP animations
  const formCardRef = useRef(null);
  const headerRef = useRef(null);
  const formItemsRef = useRef(null);
  const buttonsRef = useRef(null);
  
  const navigate = useNavigate();

  // Generate random client ID
  const generateRandomClientId = useCallback(() => {
    let randomId;
    do {
      randomId = `clnt${Math.floor(Math.random() * 900) + 100}`; // Generates numbers from 100 to 999
    } while (usedClientIds.has(randomId));
    
    return randomId;
  }, [usedClientIds]);

  // Generate client ID immediately
  useEffect(() => {
    const newClientId = generateRandomClientId();
    setClientId(newClientId);
    
    // Show form after a delay for animation
    const timer = setTimeout(() => {
      setFormVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [generateRandomClientId]);

  // Set form values after form is visible
  useEffect(() => {
    if (formVisible && clientId) {
      form.setFieldsValue({ 
        clientId: clientId
      });
      
      // Initialize animations after form is visible
      initializeAnimations();
    }
  }, [formVisible, clientId, form]);
  
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
      ".client-form-item",
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
      content: "Client added successfully!",
      className: 'success-message-animation'
    });
  }, []);

  const handleSubmit = useCallback(async (values) => {
    setLoading(true);
    
    // Show immediate feedback while processing
    message.loading({
      content: "Processing client data...",
      key: "clientSubmission",
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
        const clientData = { ...values };

        // Send data to backend
        const response = await fetch('http://127.0.0.1:5000/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });

        if (!response.ok) {
          throw new Error('Failed to create client');
        }

        // Update the used client ID to the set
        setUsedClientIds(prev => new Set([...prev, values.clientId]));
        
        // Close the loading message
        message.destroy("clientSubmission");
        
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
          const nextClientId = generateRandomClientId();
          setClientId(nextClientId);
          form.setFieldsValue({ clientId: nextClientId });
        });
      } catch (error) {
        console.error('Error creating client:', error);
        
        // Close loading message and show error
        message.destroy("clientSubmission");
        message.error({
          content: 'Failed to create client. Please try again.',
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
  }, [form, generateRandomClientId, showSuccessNotification]);

  const handleReset = useCallback(() => {
    // Reset form animation
    gsap.fromTo(
      ".client-form-item",
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
          const nextClientId = generateRandomClientId();
          setClientId(nextClientId);
          form.setFieldsValue({ clientId: nextClientId });
          message.info('Form has been reset');
        }
      }
    );
  }, [form, generateRandomClientId]);

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
          <TeamOutlined /> Clients
        </>
      ),
      href: '/clients'
    },
    {
      title: 'Client Creation'
    }
  ], []);

  // Loading state
  if (!formVisible) {
    return (
      <div className="client-form-container client-form-loading-container">
        <Skeleton active paragraph={{ rows: 1 }} className="client-form-breadcrumb-skeleton" />
        <Skeleton active paragraph={{ rows: 1 }} className="client-form-header-skeleton" />
        <Card className="client-form-card">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="client-form-container">
      {/* Breadcrumb Navigation */}
      <div className="client-form-page-breadcrumb">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      {/* Header */}
      <div className="client-form-status-header" ref={headerRef}>
        <BankOutlined className="client-form-header-icon" />
        <span className="client-form-header-text">Client Creation</span>
      </div>

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="client-form-success-notification">
          <div className="client-form-success-icon-wrapper">
            <CheckCircleOutlined className="client-form-success-icon" />
          </div>
          <span>Client information saved successfully!</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="client-form-info-banner">
        <InfoCircleOutlined className="client-form-info-banner-icon" />
        <div>
          <div className="client-form-info-banner-title">Create a New Client</div>
          <div className="client-form-info-banner-description">
            Enter client details to create a new client. Fields marked with an asterisk (*) are required.
            Client ID is auto-generated and cannot be changed.
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="client-form-card" ref={formCardRef}>
        <Form
          form={form}
          layout="vertical"
          name="client_creation"
          onFinish={handleSubmit}
          className="client-form"
          initialValues={{ clientId }}
          validateTrigger={['onBlur']}
          ref={formItemsRef}
        >
          {/* Basic Info Section */}
          <div className="client-form-role-info-header">
            <div className="client-form-role-icon"><InfoCircleOutlined /></div>
            <span className="client-form-role-info-title">Basic Information</span>
          </div>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <IdcardOutlined />
                    <span>Client ID</span>
                  </div>
                }
                name="clientId"
                required
                className="client-form-item"
              >
                <Input 
                  disabled 
                  className="client-form-custom-input client-form-disabled-input"
                  prefix={<IdcardOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <BankOutlined />
                    <span>Client Name</span>
                  </div>
                }
                name="clientName"
                required
                rules={[{ required: true, message: 'Please enter Client Name!' }]}
                className="client-form-item"
              >
                <Input 
                  placeholder="Enter Client Name" 
                  className="client-form-custom-input"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <FileTextOutlined />
                    <span>Client Description</span>
                  </div>
                }
                name="clientDescription"
                required
                rules={[{ required: true, message: 'Please enter Client Description!' }]}
                className="client-form-item"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter Client Description" 
                  className="client-form-custom-input client-form-medium-textarea"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <HomeOutlined />
                    <span>Client Address</span>
                  </div>
                }
                name="clientAddress"
                required
                rules={[{ required: true, message: 'Please enter Client Address!' }]}
                className="client-form-item"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter Client Address" 
                  className="client-form-custom-input client-form-medium-textarea"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <MailOutlined />
                    <span>Client Communication Email ID</span>
                  </div>
                }
                name="communicationEmail"
                required
                rules={[
                  { required: true, message: 'Please enter Communication Email ID!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
                className="client-form-item"
              >
                <Input 
                  placeholder="Enter Communication Email ID" 
                  className="client-form-custom-input"
                  prefix={<MailOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="client-form-section-divider" />

          {/* Contact Person Section */}
          <div className="client-form-role-info-header">
            <div className="client-form-role-icon"><UserOutlined /></div>
            <span className="client-form-role-info-title">Person to Contact</span>
          </div>
          
          <div className="client-form-technical-section-intro">
            <BulbOutlined className="client-form-tech-intro-icon" />
            <Text>Provide contact information for the primary person who will handle communications.</Text>
          </div>
          
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <UserOutlined />
                    <span>Name</span>
                  </div>
                }
                name="contactName"
                required
                rules={[{ required: true, message: 'Please enter Name!' }]}
                className="client-form-item"
              >
                <Input 
                  placeholder="Enter Name" 
                  className="client-form-custom-input"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <TeamOutlined />
                    <span>Designation</span>
                  </div>
                }
                name="contactDesignation"
                required
                rules={[{ required: true, message: 'Please enter Designation!' }]}
                className="client-form-item"
              >
                <Input 
                  placeholder="Enter Designation" 
                  className="client-form-custom-input"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <PhoneOutlined />
                    <span>Mobile Number</span>
                  </div>
                }
                name="contactMobile"
                required
                rules={[{ required: true, message: 'Please enter Mobile Number!' }]}
                className="client-form-item"
              >
                <Input 
                  placeholder="Enter Mobile Number" 
                  className="client-form-custom-input"
                  prefix={<PhoneOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <MailOutlined />
                    <span>Email ID</span>
                  </div>
                }
                name="contactEmail"
                required
                rules={[
                  { required: true, message: 'Please enter Email ID!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
                className="client-form-item"
              >
                <Input 
                  placeholder="Enter Email ID" 
                  className="client-form-custom-input"
                  prefix={<MailOutlined />}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item 
                label={
                  <div className="client-form-label">
                    <UserOutlined />
                    <span>Reporting To</span>
                  </div>
                }
                name="reportingTo"
                required
                rules={[{ required: true, message: 'Please enter Reporting To!' }]}
                className="client-form-item"
              >
                <Input 
                  placeholder="Enter Reporting To" 
                  className="client-form-custom-input"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>
          
          {/* Form buttons */}
          <div className="client-form-button-container" ref={buttonsRef}>
            <button 
              className="client-form-reset-button ant-btn"
              onClick={handleReset}
              disabled={loading}
              title="Reset all form fields"
            >
              <ReloadOutlined /> Reset
            </button>
            <button 
              className="client-form-save-button ant-btn ant-btn-primary"
              onClick={animateFormSubmit}
              disabled={loading}
              title="Save client information"
            >
              {loading ? <span className="client-form-loading-icon"></span> : <SaveOutlined />} Save
            </button>
          </div>
        </Form>
      </div>

      {/* Footer */}
      <div className="client-form-page-footer">
        <div className="client-form-footer-content">
          <div className="client-form-footer-left">
            <span>Employee Management System</span>
          </div>
          <div className="client-form-footer-right">
            <Button type="text" icon={<QuestionCircleOutlined />} className="client-form-help-button">Help</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCreation;