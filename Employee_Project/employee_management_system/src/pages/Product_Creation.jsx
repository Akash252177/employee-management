import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Form, Input, Button, DatePicker, Select, message, 
  Row, Col, Spin, notification, Tooltip,
  Typography, Divider, Breadcrumb, Card, Skeleton, Tag
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  IdcardOutlined, 
  ShoppingOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined,
  ToolOutlined,
  CodeOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  HomeOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  DownOutlined,
  TagOutlined,
  FileTextOutlined,
  BulbOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { gsap } from 'gsap';
import './Product_Creation.css';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const ProductCreation = () => {
  // Use a local state approach first, before initializing the form
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [generatedProductIds, setGeneratedProductIds] = useState(() => {
    const savedIds = localStorage.getItem('generatedProductIds');
    return savedIds ? JSON.parse(savedIds) : [];
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Refs for GSAP animations
  const formCardRef = useRef(null);
  const headerRef = useRef(null);
  const formItemsRef = useRef(null);
  const buttonsRef = useRef(null);

  const navigate = useNavigate();
  const [form] = Form.useForm();

  const generateRandomProductId = useCallback(() => {
    let newProductId;
    do {
      const randomPart = Math.floor(Math.random() * 900) + 100;
      newProductId = `P${randomPart}`;
    } while (generatedProductIds.includes(newProductId));
    return newProductId;
  }, [generatedProductIds]);

  // Generate product ID immediately 
  useEffect(() => {
    const newProductId = generateRandomProductId();
    setProductId(newProductId);
    
    // Show form after a delay for animation
    const timer = setTimeout(() => {
      setFormVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [generateRandomProductId]);

  // Set form values after form is visible
  useEffect(() => {
    if (formVisible && productId) {
      form.setFieldsValue({ 
        productId: productId,
        dateOfProduct: null,
        productstatus: "active", 
        productFramework: undefined
      });
      
      // Initialize entrance animations after form is visible
      initializeAnimations();
    }
  }, [formVisible, productId, form]);

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
      ".product-form-item",
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
      content: "Product added successfully!",
      className: 'success-message-animation'
    });
  }, []);

  const handleSubmit = useCallback(async (values) => {
    setLoading(true);
    
    // Show immediate feedback while processing
    message.loading({
      content: "Processing product data...",
      key: "productSubmission",
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
        const newProductId = values.productId;
  
        const productData = {
          ...values,
          dateOfProduct: values.dateOfProduct.format('YYYY-MM-DD'),
        };
  
        const response = await fetch('http://127.0.0.1:5000/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create product');
        }
  
        // Update stored IDs
        setGeneratedProductIds((prevIds) => {
          const newIds = [...prevIds, newProductId];
          localStorage.setItem('generatedProductIds', JSON.stringify(newIds));
          return newIds;
        });
  
        // Close the loading message
        message.destroy("productSubmission");
  
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
          const nextProductId = generateRandomProductId();
          setProductId(nextProductId);
          form.setFieldsValue({ 
            productId: nextProductId,
            productstatus: "active"
          });
        });
      } catch (error) {
        console.error("Error saving product:", error);
        
        // Close loading message and show error
        message.destroy("productSubmission");
        message.error({
          content: error.message || "Something went wrong while saving the product.",
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
  }, [form, generateRandomProductId, showSuccessNotification]);

  const handleReset = useCallback(() => {
    // Reset form animation
    gsap.fromTo(
      ".product-form-item",
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
          const nextProductId = generateRandomProductId();
          setProductId(nextProductId);
          form.setFieldsValue({ 
            productId: nextProductId,
            productstatus: "active"
          });
          message.info('Form has been reset');
        }
      }
    );
  }, [form, generateRandomProductId]);

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

  // Product status options
  const statusOptions = useMemo(() => [
    { value: 'active', label: <><Tag color="green">Active</Tag></> },
    { value: 'inactive', label: <><Tag color="red">Inactive</Tag></> },
    { value: 'pending', label: <><Tag color="orange">Pending</Tag></> },
    { value: 'archived', label: <><Tag color="default">Archived</Tag></> }
  ], []);

  // Framework options with grouping
  const frameworkOptions = useMemo(() => [
    {
      label: 'Web Frameworks',
      options: [
        { value: 'React', label: 'React' },
        { value: 'Angular', label: 'Angular' },
        { value: 'Vue.js', label: 'Vue.js' },
        { value: 'PHP', label: 'PHP' },
        { value: 'Node.js', label: 'Node.js' }
      ]
    },
    {
      label: 'Mobile Frameworks',
      options: [
        { value: 'Android', label: 'Android' },
        { value: 'IOS', label: 'iOS' },
        { value: 'Flutter', label: 'Flutter' },
        { value: 'React Native', label: 'React Native' }
      ]
    },
    {
      label: 'Enterprise Frameworks',
      options: [
        { value: 'J2EE', label: 'J2EE' },
        { value: '.NET', label: '.NET' },
        { value: 'Spring Boot', label: 'Spring Boot' },
        { value: 'Core Java', label: 'Core Java' }
      ]
    }
  ], []);

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
          <TeamOutlined /> Employees
        </>
      ),
      href: '/employees'
    },
    {
      title: 'Product Creation'
    }
  ], []);

  // Loading state
  if (!formVisible) {
    return (
      <div className="product-form-container product-form-loading-container">
        <Skeleton active paragraph={{ rows: 1 }} className="product-form-breadcrumb-skeleton" />
        <Skeleton active paragraph={{ rows: 1 }} className="product-form-header-skeleton" />
        <Card className="product-form-card">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="product-form-container">
      {/* Breadcrumb Navigation */}
      <div className="product-form-page-breadcrumb">
        <Breadcrumb
          items={breadcrumbItems}
        />
      </div>
      
      {/* Header */}
      <div className="product-form-status-header" ref={headerRef}>
        <ShoppingOutlined className="product-form-header-icon" />
        <span className="product-form-header-text">Product Creation</span>
      </div>

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="product-form-success-notification">
          <div className="product-form-success-icon-wrapper">
            <CheckCircleOutlined className="product-form-success-icon" />
          </div>
          <span>Product information saved successfully!</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="product-form-info-banner">
        <InfoCircleOutlined className="product-form-info-banner-icon" />
        <div>
          <div className="product-form-info-banner-title">Create a New Product</div>
          <div className="product-form-info-banner-description">
            Enter product details to create a new product. Fields marked with an asterisk (*) are required.
            Product ID is auto-generated and cannot be changed.
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="product-form-card" ref={formCardRef}>
        <Form
          form={form}
          layout="vertical"
          name="product_creation"
          onFinish={handleSubmit}
          className="product-form"
          initialValues={{ productId, productstatus: 'active' }}
          validateTrigger={['onBlur']}
          ref={formItemsRef}
        >
          {/* Basic Info Section */}
          <div className="product-form-role-info-header">
            <div className="product-form-role-icon"><InfoCircleOutlined /></div>
            <span className="product-form-role-info-title">Basic Information</span>
          </div>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <IdcardOutlined />
                    <span>Product ID</span>
                  </div>
                }
                name="productId"
                required
                className="product-form-item"
              >
                <Input 
                  disabled 
                  className="product-form-custom-input product-form-disabled-input"
                  prefix={<IdcardOutlined />}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <ShoppingOutlined />
                    <span>Product Name</span>
                  </div>
                }
                name="productName"
                required
                rules={[
                  { required: true, message: 'Please enter Product Name!' },
                  { min: 3, message: 'Product name must be at least 3 characters' }
                ]}
                className="product-form-item"
              >
                <Input 
                  placeholder="Enter Product Name" 
                  className="product-form-custom-input"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <CalendarOutlined />
                    <span>Date of Product</span>
                  </div>
                }
                name="dateOfProduct"
                required
                rules={[{ required: true, message: 'Please select a date!' }]}
                className="product-form-item"
              >
                <DatePicker 
                  className="product-form-custom-input product-form-date-picker" 
                  format="DD-MM-YYYY"
                  placeholder="Select Date"
                  style={{ width: '100%' }}
                  suffixIcon={<CalendarOutlined />}
                  disabledDate={(current) => current && current > new Date()}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <TagOutlined />
                    <span>Product Status</span>
                  </div>
                }
                name="productstatus"
                required
                rules={[{ required: true, message: 'Please select a status!' }]}
                className="product-form-item"
              >
                <Select 
                  placeholder="Select Product Status"
                  className="product-form-custom-select"
                  options={statusOptions}
                  suffixIcon={<DownOutlined className="product-form-select-icon" />}
                  optionLabelProp="label"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <FileTextOutlined />
                    <span>Product Description</span>
                  </div>
                }
                name="productDescription"
                required
                rules={[
                  { required: true, message: 'Please enter a description!' },
                  { min: 10, message: 'Description must be at least 10 characters' }
                ]}
                className="product-form-item"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter Product Description" 
                  className="product-form-custom-input product-form-medium-textarea"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="product-form-section-divider" />

          {/* Technical Details Section */}
          <div className="product-form-role-info-header">
            <div className="product-form-role-icon"><ToolOutlined /></div>
            <span className="product-form-role-info-title">Technical Details</span>
          </div>

          <div className="product-form-technical-section-intro">
            <BulbOutlined className="product-form-tech-intro-icon" />
            <Text>Provide comprehensive technical information to help developers understand the product specifications.</Text>
          </div>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <ToolOutlined />
                    <span>Technical Details</span>
                  </div>
                }
                name="productTechnical"
                required
                rules={[
                  { required: true, message: 'Please enter technical details!' },
                  { min: 10, message: 'Technical details must be at least 10 characters' }
                ]}
                className="product-form-item"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter Technical Details" 
                  className="product-form-custom-input product-form-medium-textarea"
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <CodeOutlined />
                    <span>Specification</span>
                  </div>
                }
                name="productSpecification"
                required
                rules={[
                  { required: true, message: 'Please enter a specification!' },
                  { min: 10, message: 'Specification must be at least 10 characters' }
                ]}
                className="product-form-item"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter Specification" 
                  className="product-form-custom-input product-form-medium-textarea"
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider className="product-form-section-divider" />

          {/* Framework Section */}
          <div className="product-form-role-info-header">
            <div className="product-form-role-icon"><CodeOutlined /></div>
            <span className="product-form-role-info-title">Framework</span>
          </div>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item 
                label={
                  <div className="product-form-label">
                    <CodeOutlined />
                    <span>Framework</span>
                  </div>
                }
                name="productFramework"
                required
                rules={[{ required: true, message: 'Please select a framework!' }]}
                className="product-form-item"
              >
                <Select 
                  placeholder="Select Framework"
                  className="product-form-custom-select"
                  options={frameworkOptions}
                  suffixIcon={<DownOutlined className="product-form-select-icon" />}
                  showSearch
                  optionFilterProp="label"
                  listHeight={250}
                  virtual={false}
                  dropdownMatchSelectWidth={true}
                />
              </Form.Item>
            </Col>
          </Row>
          
          {/* Form buttons */}
          <div className="product-form-button-container" ref={buttonsRef}>
            <button 
              className="product-form-reset-button ant-btn"
              onClick={handleReset}
              disabled={loading}
              title="Reset all form fields"
            >
              <ReloadOutlined /> Reset
            </button>
            <button 
              className="product-form-save-button ant-btn ant-btn-primary"
              onClick={animateFormSubmit}
              disabled={loading}
              title="Save product information"
            >
              {loading ? <span className="product-form-loading-icon"></span> : <SaveOutlined />} Save
            </button>
          </div>
        </Form>
      </div>

      {/* Footer */}
      <div className="product-form-page-footer">
        <div className="product-form-footer-content">
          <div className="product-form-footer-left">
            <span>Employee Management System</span>
          </div>
          <div className="product-form-footer-right">
            <Button type="text" icon={<QuestionCircleOutlined />} className="product-form-help-button">Help</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCreation;