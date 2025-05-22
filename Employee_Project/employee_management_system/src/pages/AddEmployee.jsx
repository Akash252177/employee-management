// AddEmployee.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  Image, 
  message, 
  Button, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Row, 
  Col, 
  Card, 
  Tag, 
  Breadcrumb,
  Typography
} from "antd";
import { 
  PlusOutlined, 
  HomeOutlined, 
  TeamOutlined, 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined, 
  IdcardOutlined, 
  UserSwitchOutlined, 
  ContactsOutlined, 
  BankOutlined,
  ApartmentOutlined,
  DownOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import moment from "moment";
import { gsap } from "gsap";
import MessageUtils from "../utils/messageUtils";
import "./AddEmployee.css";

const { Option } = Select;
const { Text } = Typography;

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const generateEmployeeId = () => {
  const randomNum = Math.floor(Math.random() * 1000);
  return `EMP${randomNum.toString().padStart(3, '0')}`;
};

const AddEmployee = () => {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState([]);
  const [loadings, setLoadings] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  
  // Refs for GSAP animations
  const formCardRef = useRef(null);
  const headerRef = useRef(null);
  const formSectionsRef = useRef([]);
  const buttonsRef = useRef(null);
  const headerIconRef = useRef(null);

  const [employee, setEmployee] = useState({
    employeeId: generateEmployeeId(),
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    nationality: "",
    permanentAddress: "",
    communicationAddress: "",
    mobile: "",
    altMobile: "", // This is optional in the database and form
    email: "",
    qualification: "",
    fatherName: "",
    motherName: "",
    maritalStatus: "",
    spouseName: "",
    emergencyName: "",
    emergencyMobile: "",
    emergencyRelationship: "",
    doj: "",
    joiningLocation: "",
  });

  // Initialize GSAP animations
  const initializeAnimations = () => {
    const timeline = gsap.timeline();
    
    // Main card entrance animation
    timeline.fromTo(
      formCardRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
    );
    
    // Header animation
    timeline.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" },
      "-=0.4"
    );
    
    // Header icon animation
    timeline.fromTo(
      headerIconRef.current,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" },
      "-=0.3"
    );
    
    // Form sections staggered animation
    timeline.fromTo(
      ".form-section",
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.5, 
        stagger: 0.15, 
        ease: "power2.out" 
      },
      "-=0.2"
    );
    
    // Button animation
    timeline.fromTo(
      buttonsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      "-=0.1"
    );
  };
  
  // Run animations when component mounts
  useEffect(() => {
    initializeAnimations();
    
    // Add animations for form fields on focus
    gsap.utils.toArray(".custom-input, .custom-select").forEach(input => {
      input.addEventListener("focus", () => {
        gsap.to(input, { y: -3, duration: 0.3, ease: "power2.out" });
      });
      
      input.addEventListener("blur", () => {
        gsap.to(input, { y: 0, duration: 0.3, ease: "power2.out" });
      });
    });
    
    return () => {
      // Cleanup event listeners
      gsap.utils.toArray(".custom-input, .custom-select").forEach(input => {
        input.removeEventListener("focus", () => {});
        input.removeEventListener("blur", () => {});
      });
    };
  }, []);

  // Enhanced message notifications using MessageUtils
  const showSuccessMessage = (content) => {
    MessageUtils.success(messageApi, content);
  };

  const showErrorMessage = (content) => {
    MessageUtils.error(messageApi, content);
  };

  const showWarningMessage = (content) => {
    MessageUtils.warning(messageApi, content);
  };

  const showInfoMessage = (content) => {
    MessageUtils.info(messageApi, content);
  };

  const handleSubmit = async () => {
    setFormSubmitted(true);
    
    // Required fields based on database schema NOT NULL constraints
    // Note: altMobile is NOT included here because it's optional
    if (!employee.firstName || !employee.lastName || !employee.dob || 
        !employee.gender || !employee.nationality || !employee.permanentAddress || 
        !employee.communicationAddress || !employee.mobile || !employee.email || 
        !employee.fatherName || !employee.motherName || !employee.maritalStatus || 
        !employee.emergencyName || !employee.emergencyMobile || 
        !employee.emergencyRelationship || !employee.doj || !employee.joiningLocation) {
      
      // Use GSAP to animate error fields
      const errorFields = gsap.utils.toArray(".ant-form-item-has-error, [aria-required='true']");
      
      gsap.timeline()
        .to(errorFields, {
          x: -10,
          duration: 0.1,
          ease: "power2.inOut"
        })
        .to(errorFields, {
          x: 10,
          duration: 0.1,
          ease: "power2.inOut"
        })
        .to(errorFields, {
          x: -7,
          duration: 0.1,
          ease: "power2.inOut"
        })
        .to(errorFields, {
          x: 7,
          duration: 0.1,
          ease: "power2.inOut"
        })
        .to(errorFields, {
          x: 0,
          duration: 0.1,
          ease: "power2.inOut",
          backgroundColor: "rgba(255, 77, 79, 0.05)",
          borderColor: "#ff4d4f"
        })
        .to(errorFields, {
          backgroundColor: "transparent",
          borderColor: "#d9d9d9",
          duration: 0.8,
          delay: 0.5
        });
      
      showErrorMessage("Please fill all required fields.");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }
    
    // Special validation for spouse name if married
    if (employee.maritalStatus === "Married" && !employee.spouseName) {
      showWarningMessage("Please enter spouse name as you selected 'Married'.");
      setErrorShake(true);
      
      // Animate the spouse field specifically
      gsap.timeline()
        .to("[name='spouseName']", {
          x: [-5, 5, -4, 4, 0],
          duration: 0.4,
          backgroundColor: "rgba(250, 173, 20, 0.1)",
          borderColor: "#faad14"
        })
        .to("[name='spouseName']", {
          backgroundColor: "transparent",
          borderColor: "#d9d9d9",
          duration: 0.8,
          delay: 0.5
        });
      
      setTimeout(() => setErrorShake(false), 500);
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
        setLoadings(true);
        
        // Show loading message using MessageUtils
        const loadingMessage = MessageUtils.loading(messageApi, "Adding employee...");
        
        const formData = new FormData();
        const employeeData = {
          ...employee,
          dob: employee.dob,
          doj: employee.doj,
          // altMobile can be empty here, it's optional
        };
        formData.append("employee", JSON.stringify(employeeData));

        if (fileList.length > 0 && fileList[0].originFileObj) {
          formData.append("profilePic", fileList[0].originFileObj);
        }

        try {
          const res = await fetch("http://127.0.0.1:5000/add_employee", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          
          // Close loading message
          loadingMessage();
          
          if (res.ok) {
            showSuccessMessage("Employee added successfully!");
            setSuccessPulse(true);
            
            // Success animation with GSAP
            const tl = gsap.timeline();
            tl.to(formCardRef.current, {
              boxShadow: "0 0 30px rgba(82, 196, 26, 0.4)",
              borderColor: "#52c41a",
              duration: 0.5,
              ease: "power2.inOut"
            });
            
            // Stagger fade out all form fields
            tl.to(".form-section", {
              opacity: 0,
              y: -20,
              stagger: 0.05,
              duration: 0.4,
              ease: "power2.in"
            });
            
            // Navigate after animations complete
            setTimeout(() => {
              navigate("/employees");
            }, 800);
          } else {
            showErrorMessage(data.error || "Failed to add employee.");
            
            // Error animation
            gsap.to(formCardRef.current, {
              x: [-5, 5, -5, 5, 0],
              duration: 0.4,
              ease: "power2.inOut",
              borderColor: "#ff4d4f",
              onComplete: () => {
                gsap.to(formCardRef.current, {
                  borderColor: "#d9d9d9",
                  duration: 0.8
                });
              }
            });
            
            setErrorShake(true);
            setTimeout(() => setErrorShake(false), 500);
          }
        } catch (error) {
          // Close loading message
          loadingMessage();
          
          showErrorMessage("Something went wrong. Check backend URL.");
          
          // Error animation
          gsap.to(formCardRef.current, {
            x: [-5, 5, -5, 5, 0],
            duration: 0.4,
            ease: "power2.inOut",
            borderColor: "#ff4d4f",
            onComplete: () => {
              gsap.to(formCardRef.current, {
                borderColor: "#d9d9d9",
                duration: 0.8
              });
            }
          });
          
          setErrorShake(true);
          setTimeout(() => setErrorShake(false), 500);
        } finally {
          setLoadings(false);
        }
      }
    });
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    const file = newFileList[0];
    if (file && file.size > 10 * 1024 * 1024) {
      showWarningMessage("File size exceeds 10MB limit.");
      return;
    }
    if (file && !["image/jpeg", "image/png"].includes(file.type)) {
      showErrorMessage("Only JPG/PNG images are allowed.");
      return;
    }
    setFileList(newFileList);
  };

  const handleReset = () => {
    // Animate form fields before reset
    gsap.to(".custom-input, .ant-select-selector, .ant-picker", {
      backgroundColor: "rgba(250, 173, 20, 0.1)",
      borderColor: "#faad14",
      duration: 0.3,
      stagger: 0.03,
      ease: "power2.inOut",
      onComplete: () => {
        // Reset form after animation completes
        form.resetFields();
        setEmployee({
          employeeId: generateEmployeeId(),
          firstName: "",
          lastName: "",
          dob: "",
          gender: "",
          nationality: "",
          permanentAddress: "",
          communicationAddress: "",
          mobile: "",
          altMobile: "",
          email: "",
          qualification: "",
          fatherName: "",
          motherName: "",
          maritalStatus: "",
          spouseName: "",
          emergencyName: "",
          emergencyMobile: "",
          emergencyRelationship: "",
          doj: "",
          joiningLocation: "",
        });
        setFileList([]);
        setFormSubmitted(false);
        
        // Animate back to normal state
        gsap.to(".custom-input, .ant-select-selector, .ant-picker", {
          backgroundColor: "white",
          borderColor: "#d9d9d9",
          duration: 0.5,
          stagger: 0.02,
          ease: "power2.out"
        });
        
        // Animate button
        gsap.fromTo(
          ".reset-button",
          { scale: 0.95 },
          { scale: 1, duration: 0.3, ease: "back.out(1.5)" }
        );
        
        // Show reset confirmation with info message
        showInfoMessage("Form has been reset successfully!");
      }
    });
  };

  // Form onFinish handler - triggered on Enter press
  const onFinish = () => {
    handleSubmit();
  };

  return (
    <div className="add-employee-page">
      {contextHolder}
      {/* Breadcrumb Navigation */}
      <div className="page-breadcrumb">
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
              title: 'Add Employee'
            }
          ]}
        />
      </div>

      {/* Custom Header */}
      <div className="employee-status-header" ref={headerRef}>
        <UserOutlined className="header-icon" ref={headerIconRef} />
        <span className="header-text">New Employee Registration</span>
      </div>

      <Card 
        className={`employee-form-card fade-in ${errorShake ? 'shake' : ''} ${successPulse ? 'pulse' : ''}`}
        ref={formCardRef}>
        <div className="form-header slide-in-down" style={{animationDelay: "0s"}}>
          <div className="header-content direct-header">
            <h2 className="header-title">Employee Profile Setup</h2>
            <p className="header-subtitle">Create new employee record in the system</p>
          </div>
          <div className="profile-upload-container">
            <Upload
              listType="picture-circle"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleFileChange}
              maxCount={1}
              beforeUpload={() => false}
              className="profile-upload-animate"
            >
              {fileList.length >= 1 ? null : (
                <div className="upload-button-content">
                  <PlusOutlined />
                  <div>Upload Photo</div>
                </div>
              )}
            </Upload>
            {previewImage && (
              <Image
                wrapperStyle={{ display: "none" }}
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (visible) => setPreviewOpen(visible),
                  afterOpenChange: (visible) => !visible && setPreviewImage(""),
                }}
                src={previewImage}
              />
            )}
          </div>
        </div>

        <Form 
          form={form}
          layout="vertical" 
          className="employee-form"
          onFinish={onFinish}
        >
          <div className="form-section slide-in-down" style={{animationDelay: "0.1s"}}>
            <h3 className="form-section-title">Basic Information</h3>
            
            <Row gutter={24}>
              <Col span={24} md={8}>
                <Form.Item 
                  name="employeeId"
                  initialValue={employee.employeeId}
                  label={
                    <div className="form-label">
                      <IdcardOutlined />
                      <span>Employee ID</span>
                    </div>
                  }
                > 
                  <Input 
                    value={employee.employeeId} 
                    onChange={(e) => setEmployee({ ...employee, employeeId: e.target.value })}
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="firstName"
                  initialValue={employee.firstName}
                  label={
                    <div className="form-label">
                      <UserOutlined />
                      <span>First Name</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter first name' }]}
                >
                  <Input
                    value={employee.firstName}
                    onChange={(e) => setEmployee({ ...employee, firstName: e.target.value })}
                    placeholder="Enter First Name"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="lastName"
                  initialValue={employee.lastName}
                  label={
                    <div className="form-label">
                      <UserOutlined />
                      <span>Last Name</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter last name' }]}
                >
                  <Input
                    value={employee.lastName}
                    onChange={(e) => setEmployee({ ...employee, lastName: e.target.value })}
                    placeholder="Enter Last Name"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={24} md={8}>
                <Form.Item 
                  name="dob"
                  initialValue={employee.dob ? moment(employee.dob, 'DD-MM-YYYY') : null}
                  label={
                    <div className="form-label">
                      <CalendarOutlined />
                      <span>Date of Birth</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please select date of birth' }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD-MM-YYYY"
                    value={employee.dob ? moment(employee.dob, 'DD-MM-YYYY') : null}
                    onChange={(date, dateString) => setEmployee({ ...employee, dob: dateString })}
                    className="custom-input date-picker"
                    popupClassName="custom-datepicker-popup"
                    suffixIcon={<CalendarOutlined style={{ fontSize: '14px', color: '#1890ff' }} />}
                    placeholder="Select date of birth"
                    variant="outlined"
                    allowClear={false}
                    size="middle"
                    showToday={true}
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="gender"
                  initialValue={employee.gender || undefined}
                  label={
                    <div className="form-label">
                      <UserSwitchOutlined />
                      <span>Gender</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please select gender' }]}
                >
                  <Select
                    placeholder="Select Gender"
                    value={employee.gender || undefined}
                    onChange={(value) => setEmployee({ ...employee, gender: value })}
                    className="custom-select"
                    suffixIcon={<DownOutlined className="select-icon" />}
                    listHeight={250}
                    virtual={true}
                    popupMatchSelectWidth={false}
                  >
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="nationality"
                  initialValue={employee.nationality}
                  label={
                    <div className="form-label">
                      <IdcardOutlined />
                      <span>Nationality</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter nationality' }]}
                >
                  <Input
                    value={employee.nationality}
                    onChange={(e) => setEmployee({ ...employee, nationality: e.target.value })}
                    placeholder="Enter Nationality"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="form-section slide-in-down" style={{animationDelay: "0.2s"}}>
            <h3 className="form-section-title">Contact Information</h3>
            
            <Row gutter={24}>
              <Col span={24} md={12}>
                <Form.Item 
                  name="permanentAddress"
                  initialValue={employee.permanentAddress}
                  label={
                    <div className="form-label">
                      <EnvironmentOutlined />
                      <span>Permanent Address</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter permanent address' }]}
                >
                  <Input.TextArea
                    rows={3}
                    value={employee.permanentAddress}
                    onChange={(e) => setEmployee({ ...employee, permanentAddress: e.target.value })}
                    placeholder="Enter Permanent Address"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={12}>
                <Form.Item 
                  name="communicationAddress"
                  initialValue={employee.communicationAddress}
                  label={
                    <div className="form-label">
                      <EnvironmentOutlined />
                      <span>Communication Address</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter communication address' }]}
                >
                  <Input.TextArea
                    rows={3}
                    value={employee.communicationAddress}
                    onChange={(e) => setEmployee({ ...employee, communicationAddress: e.target.value })}
                    placeholder="Enter Communication Address"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={24} md={8}>
                <Form.Item 
                  name="mobile"
                  initialValue={employee.mobile}
                  label={
                    <div className="form-label">
                      <PhoneOutlined />
                      <span>Mobile</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter mobile number' }]}
                >
                  <Input
                    value={employee.mobile}
                    onChange={(e) => setEmployee({ ...employee, mobile: e.target.value })}
                    placeholder="Enter Mobile Number"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="altMobile"
                  initialValue={employee.altMobile}
                  label={
                    <div className="form-label">
                      <PhoneOutlined />
                      <span>Alternate Mobile <span style={{color: '#888'}}>(Optional)</span></span>
                    </div>
                  }
                >
                  <Input
                    value={employee.altMobile}
                    onChange={(e) => setEmployee({ ...employee, altMobile: e.target.value })}
                    placeholder="Enter Alternate Mobile Number"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="email"
                  initialValue={employee.email}
                  label={
                    <div className="form-label">
                      <MailOutlined />
                      <span>Email</span>
                    </div>
                  } 
                  required
                  rules={[
                    { required: true, message: 'Please enter email address' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input
                    value={employee.email}
                    onChange={(e) => setEmployee({ ...employee, email: e.target.value })}
                    placeholder="Enter Email Address"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="form-section slide-in-down" style={{animationDelay: "0.3s"}}>
            <h3 className="form-section-title">Family Information</h3>
            
            <Row gutter={24}>
              <Col span={24} md={8}>
                <Form.Item 
                  name="fatherName"
                  initialValue={employee.fatherName}
                  label={
                    <div className="form-label">
                      <UserOutlined />
                      <span>Father's Name</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: "Please enter father's name" }]}
                >
                  <Input
                    value={employee.fatherName}
                    onChange={(e) => setEmployee({ ...employee, fatherName: e.target.value })}
                    placeholder="Enter Father's Name"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="motherName"
                  initialValue={employee.motherName}
                  label={
                    <div className="form-label">
                      <UserOutlined />
                      <span>Mother's Name</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: "Please enter mother's name" }]}
                >
                  <Input
                    value={employee.motherName}
                    onChange={(e) => setEmployee({ ...employee, motherName: e.target.value })}
                    placeholder="Enter Mother's Name"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="maritalStatus"
                  initialValue={employee.maritalStatus || undefined}
                  label={
                    <div className="form-label">
                      <UserSwitchOutlined />
                      <span>Marital Status</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please select marital status' }]}
                >
                  <Select
                    placeholder="Select Marital Status"
                    value={employee.maritalStatus || undefined}
                    onChange={(value) => setEmployee({ ...employee, maritalStatus: value })}
                    className="custom-select"
                    suffixIcon={<DownOutlined className="select-icon" />}
                    listHeight={250}
                    virtual={true}
                    popupMatchSelectWidth={false}
                  >
                    <Option value="Single">Single</Option>
                    <Option value="Married">Married</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {employee.maritalStatus === "Married" && (
              <Row gutter={24} className="spouse-field fade-in">
                <Col span={24} md={8}>
                  <Form.Item 
                    name="spouseName"
                    initialValue={employee.spouseName}
                    label={
                      <div className="form-label">
                        <UserOutlined />
                        <span>Spouse Name</span>
                      </div>
                    } 
                    required
                    rules={[{ required: true, message: 'Please enter spouse name' }]}
                  >
                    <Input
                      value={employee.spouseName}
                      onChange={(e) => setEmployee({ ...employee, spouseName: e.target.value })}
                      placeholder="Enter Spouse Name"
                      className="custom-input"
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </div>

          <div className="form-section slide-in-down" style={{animationDelay: "0.4s"}}>
            <h3 className="form-section-title">Emergency Contact</h3>
            
            <Row gutter={24}>
              <Col span={24} md={8}>
                <Form.Item 
                  name="emergencyName"
                  initialValue={employee.emergencyName}
                  label={
                    <div className="form-label">
                      <ContactsOutlined />
                      <span>Emergency Contact Name</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter emergency contact name' }]}
                >
                  <Input
                    value={employee.emergencyName}
                    onChange={(e) => setEmployee({ ...employee, emergencyName: e.target.value })}
                    placeholder="Enter Emergency Contact Name"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="emergencyMobile"
                  initialValue={employee.emergencyMobile}
                  label={
                    <div className="form-label">
                      <PhoneOutlined />
                      <span>Emergency Contact Mobile</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter emergency contact mobile' }]}
                >
                  <Input
                    value={employee.emergencyMobile}
                    onChange={(e) => setEmployee({ ...employee, emergencyMobile: e.target.value })}
                    placeholder="Enter Emergency Contact Mobile"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="emergencyRelationship"
                  initialValue={employee.emergencyRelationship}
                  label={
                    <div className="form-label">
                      <UserSwitchOutlined />
                      <span>Emergency Contact Relationship</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please enter relationship' }]}
                >
                  <Input
                    value={employee.emergencyRelationship}
                    onChange={(e) => setEmployee({ ...employee, emergencyRelationship: e.target.value })}
                    placeholder="Enter Relationship"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="form-section slide-in-down" style={{animationDelay: "0.5s"}}>
            <h3 className="form-section-title">Employment Details</h3>
            
            <Row gutter={24}>
              <Col span={24} md={8}>
                <Form.Item 
                  name="doj"
                  initialValue={employee.doj ? moment(employee.doj, 'DD-MM-YYYY') : null}
                  label={
                    <div className="form-label">
                      <CalendarOutlined />
                      <span>Date of Joining</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please select date of joining' }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="DD-MM-YYYY"
                    value={employee.doj ? moment(employee.doj, 'DD-MM-YYYY') : null}
                    onChange={(date, dateString) => setEmployee({ ...employee, doj: dateString })}
                    className="custom-input date-picker"
                    popupClassName="custom-datepicker-popup"
                    suffixIcon={<CalendarOutlined style={{ fontSize: '14px', color: '#1890ff' }} />}
                    placeholder="Select date of joining"
                    variant="outlined"
                    allowClear={false}
                    size="middle"
                    showToday={true}
                  />
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="joiningLocation"
                  initialValue={employee.joiningLocation || undefined}
                  label={
                    <div className="form-label">
                      <ApartmentOutlined />
                      <span>Joining Location</span>
                    </div>
                  } 
                  required
                  rules={[{ required: true, message: 'Please select joining location' }]}
                >
                  <Select
                    placeholder="Select Joining Location"
                    value={employee.joiningLocation || undefined}
                    onChange={(value) => setEmployee({ ...employee, joiningLocation: value })}
                    className="custom-select"
                    suffixIcon={<DownOutlined className="select-icon" />}
                    listHeight={250}
                    virtual={true}
                    popupMatchSelectWidth={false}
                  >
                    <Option value="Chennai">Chennai</Option>
                    <Option value="Coimbatore">Coimbatore</Option>
                    <Option value="Manglore">Manglore</Option>
                    <Option value="Bangalore">Bangalore</Option>
                    <Option value="Mumbai">Mumbai</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={24} md={8}>
                <Form.Item 
                  name="qualification"
                  initialValue={employee.qualification}
                  label={
                    <div className="form-label">
                      <BankOutlined />
                      <span>Qualification <span style={{color: '#888'}}>(Optional)</span></span>
                    </div>
                  }
                >
                  <Input
                    value={employee.qualification}
                    onChange={(e) => setEmployee({ ...employee, qualification: e.target.value })}
                    placeholder="Enter Qualification"
                    className="custom-input"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="button-container slide-in-down" style={{animationDelay: "0.6s"}} ref={buttonsRef}>
            <Button 
              className="reset-button"
              onClick={handleReset}
              disabled={loadings}
              type="default"
            >
              <ReloadOutlined /> Reset
            </Button>
            <Button 
              className="save-button"
              htmlType="submit"
              disabled={loadings}
              type="primary"
            >
              {loadings ? <span className="loading-icon"></span> : <SaveOutlined />} Save
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AddEmployee;