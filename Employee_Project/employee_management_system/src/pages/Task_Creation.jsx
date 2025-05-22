import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, DatePicker, Select, message, Row, Col, Card, Divider, Tooltip, Space, Spin, Modal, Result, Alert, Badge, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  IdcardOutlined, 
  ShoppingOutlined, 
  CalendarOutlined, 
  ProjectOutlined,
  UserOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';
import { gsap } from 'gsap';
import './Task_Creation.css';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const TaskCreation = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingProjectData, setFetchingProjectData] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [createdTask, setCreatedTask] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [generatedTaskIds, setGeneratedTaskIds] = useState(() => {
    const savedIds = localStorage.getItem('generatedTaskIds');
    return savedIds ? JSON.parse(savedIds) : [];
  });

  // Refs for GSAP animations
  const formCardRef = useRef(null);
  const formHeaderRef = useRef(null);
  const formItemsRef = useRef(null);
  const formButtonsRef = useRef(null);
  
  const navigate = useNavigate();
  
  // API base URL - could be moved to environment variable
  const API_BASE_URL = 'http://127.0.0.1:5000';

  const generateRandomTaskId = () => {
    let newTaskId;
    do {
      const randomPart = Math.floor(Math.random() * 900) + 100;
      newTaskId = `T${randomPart}`;
    } while (generatedTaskIds.includes(newTaskId));
    return newTaskId;
  };

  useEffect(() => {
    const initialTaskId = generateRandomTaskId();
    form.setFieldsValue({ 
      taskId: initialTaskId,
      initiativeDate: null,
      targetCompletionDate: null,
      projectId: undefined
    });
    
    // Load project data when component mounts
    fetchAllProjects();
    
    // Initialize entrance animations
    const timeline = gsap.timeline();
    
    // Card entrance animation
    timeline.fromTo(
      formCardRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
    ).fromTo(
      formHeaderRef.current,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.5, ease: "back.out" }
    ).fromTo(
      ".ant-form-item",
      { opacity: 0, y: 20, stagger: 0.1 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: "power2.out" },
      "-=0.2"
    ).fromTo(
      formButtonsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
      "-=0.1"
    );
    
  }, [form]);
  
  // Fetch all projects from the database
  const fetchAllProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjectList(data);
      console.log("Projects loaded:", data.length);
    } catch (error) {
      console.error("Error fetching projects:", error);
      message.error({
        content: "Failed to load projects",
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      });
    } finally {
      setLoading(false);
    }
  };

  // This function will be called when project ID changes
  const handleProjectIdChange = (e) => {
    const projectId = e.target.value.trim();
    
    if (!projectId) {
      setProjectDetails(null);
      form.setFieldsValue({
        projectName: undefined,
        productName: undefined,
        clientName: undefined
      });
      return;
    }

    setFetchingProjectData(true);
    
    // Try to find project from already loaded list first
    const matchingProject = projectList.find(project => 
      project.projectId === projectId
    );
    
    if (matchingProject) {
      setProjectDetails(matchingProject);
      
      // Auto-fill project name, product name and client name fields from matched project
      form.setFieldsValue({
        projectName: matchingProject.projectName || 'Not available',
        productName: matchingProject.productName || 'Not available',
        clientName: matchingProject.clientName || 'Not available'
      });
      setFetchingProjectData(false);
      
      // Highlight the fields that got auto-filled with GSAP
      animateAutoFilledFields();
      
      message.success({
        content: 'Project details loaded successfully',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
      });
      return;
    }
    
    // If not found in local list, fetch from API
    fetch(`${API_BASE_URL}/api/project/${projectId}`)
      .then(response => {
        if (!response.ok) throw new Error('Project not found');
        return response.json();
      })
      .then(data => {
        setProjectDetails(data);
        form.setFieldsValue({
          projectName: data.project_name || data.projectName || 'Not available',
          productName: data.product_name || data.productName || 'Not available',
          clientName: data.client_name || data.clientName || 'Not available'
        });
        setFetchingProjectData(false);
        
        // Highlight the fields that got auto-filled with GSAP
        animateAutoFilledFields();
        
        message.success({
          content: 'Project details loaded successfully',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
        });
      })
      .catch(error => {
        console.error("Error fetching project details:", error);
        message.error({
          content: 'Project ID not found',
          icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
        });
        setProjectDetails(null);
        form.setFieldsValue({
          projectName: undefined,
          productName: undefined,
          clientName: undefined
        });
        setFetchingProjectData(false);
      });
  };

  const animateAutoFilledFields = () => {
    // Animate the auto-filled fields for visual feedback
    gsap.fromTo(
      ".auto-filled-field",
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
  };

  const handleSubmit = async (values) => {
    setSaveLoading(true);
    try {
      const newTaskId = form.getFieldValue('taskId');

      // Format dates to match backend expectations
      const taskData = {
        ...values,
        initiativeDate: values.initiativeDate?.format('YYYY-MM-DD'),
        targetCompletionDate: values.targetCompletionDate?.format('YYYY-MM-DD'),
      };

      // For development/debug purposes
      console.log("Task data to be submitted:", taskData);
      
      // Animation before submission
      gsap.to(formCardRef.current, {
        scale: 0.98,
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
        duration: 0.3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1
      });
      
      // Make API request to create the task
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(taskData),
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to create task');
      }

      // Store the new task ID in local storage
      setGeneratedTaskIds((prevIds) => {
        const newIds = [...prevIds, newTaskId];
        localStorage.setItem('generatedTaskIds', JSON.stringify(newIds));
        return newIds;
      });

      // Set the created task and show the success modal
      setCreatedTask({
        ...taskData,
        taskId: newTaskId
      });
      setSuccessModalVisible(true);
      
      message.success({
        content: 'Task created successfully!',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
      });
      
      // Success animation
      const tl = gsap.timeline();
      tl.to(formCardRef.current, {
        boxShadow: "0 0 30px rgba(82, 196, 26, 0.4)",
        borderColor: "#52c41a",
        duration: 0.5,
        ease: "power2.inOut"
      });
      
    } catch (error) {
      console.error("Error creating task:", error);
      message.error({
        content: `Error: ${error.message}`,
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
      });
      
      // Error animation
      gsap.to(formCardRef.current, {
        x: [-5, 5, -5, 5, 0],
        duration: 0.4,
        ease: "power2.inOut"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = () => {
    // Reset form animation
    gsap.fromTo(
      ".ant-form-item-control-input",
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
          form.setFieldsValue({ taskId: generateRandomTaskId() });
          setProjectDetails(null);
          message.info('Form has been reset');
        }
      }
    );
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
    
    // After success modal closes, prepare form for new entry
    form.resetFields();
    form.setFieldsValue({ taskId: generateRandomTaskId() });
    setProjectDetails(null);
    setCreatedTask(null);
  };

  const renderSuccessModalFooter = () => {
    return [
      <Button key="add-another" onClick={handleSuccessModalClose}>
        Create Another Task
      </Button>,
      <Button 
        key="view-tasks" 
        type="primary" 
        onClick={() => navigate('/tasks')}
      >
        View All Tasks
      </Button>
    ];
  };

  return (
    <div className="task-creation-container">
      <Card 
        className="task-card" 
        variant="outlined" 
        ref={formCardRef}
        bordered={false}
      >
        <div className="card-header" ref={formHeaderRef}>
          <Title level={3} className="form-title">
            <PlusCircleOutlined /> Task Creation
          </Title>
          <Tooltip title="Enter task details to create a new task">
            <InfoCircleOutlined className="info-icon" />
          </Tooltip>
        </div>
        
        <Alert
          message="Create a New Task"
          description="Fill in the details below to create a new task. Project details will be auto-populated when you enter a valid Project ID."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          className="info-alert"
          closable
        />
        
        <Form
          form={form}
          layout="vertical"
          name="task_creation"
          onFinish={handleSubmit}
          className="task-form"
          requiredMark="optional"
          ref={formItemsRef}
          size="large"
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="taskId"
                label={<span><IdcardOutlined /> Task ID</span>}
                tooltip="Auto-generated unique task identifier"
                rules={[{ required: true, message: 'Task ID is required!' }]}
              >
                <Input 
                  disabled 
                  prefix={<IdcardOutlined style={{ color: '#1890ff' }} />} 
                  className="form-input"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="taskName"
                label={<span><FileTextOutlined /> Task Name</span>}
                tooltip="Enter a descriptive name for the task"
                rules={[
                  { required: true, message: 'Please enter Task Name!' },
                  { min: 3, message: 'Task name must be at least 3 characters' },
                  { max: 100, message: 'Task name cannot exceed 100 characters' }
                ]}
              >
                <Input 
                  placeholder="Enter Task Name" 
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                  className="form-input"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="projectId"
                label={<span><ProjectOutlined /> Project ID</span>}
                tooltip="Enter a valid Project ID to auto-populate project details"
                rules={[{ required: true, message: 'Please enter Project ID!' }]}
              >
                <Input 
                  placeholder="Enter Project ID" 
                  prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
                  className="form-input"
                  suffix={
                    fetchingProjectData && <Spin size="small" />
                  }
                  onChange={handleProjectIdChange}
                  onBlur={handleProjectIdChange}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="projectName"
                label={<span><ProjectOutlined /> Project Name</span>}
                tooltip="This will be auto-filled based on Project ID"
              >
                <Input 
                  disabled
                  prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
                  className="form-input auto-filled-field"
                  placeholder="Auto-filled from Project ID"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="productName"
                label={<span><ShoppingOutlined /> Product Name</span>}
                tooltip="This will be auto-filled based on Project ID"
              >
                <Input 
                  disabled
                  prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
                  className="form-input auto-filled-field"
                  placeholder="Auto-filled from Project ID"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="clientName"
                label={<span><UserOutlined /> Client Name</span>}
                tooltip="This will be auto-filled based on Project ID"
              >
                <Input 
                  disabled
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                  className="form-input auto-filled-field"
                  placeholder="Auto-filled from Project ID"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="initiativeDate"
                label={<span><CalendarOutlined /> Task Initiative Date</span>}
                tooltip="Select the date when the task starts"
                rules={[{ required: true, message: 'Please select an initiative date!' }]}
              >
                <DatePicker 
                  className="form-input date-picker" 
                  format="DD-MM-YYYY"
                  suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
                  placeholder="Select Initiative Date"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="targetCompletionDate"
                label={<span><CalendarOutlined /> Task Target Completion Date</span>}
                tooltip="Select the target date for task completion"
                rules={[{ required: true, message: 'Please select a target completion date!' }]}
              >
                <DatePicker 
                  className="form-input date-picker" 
                  format="DD-MM-YYYY"
                  suffixIcon={<CalendarOutlined style={{ color: '#1890ff' }} />}
                  placeholder="Select Target Completion Date"
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="taskDescription"
                label={<span><FileTextOutlined /> Task Description</span>}
                tooltip="Provide a detailed description of the task"
                rules={[
                  { required: true, message: 'Please enter a description!' },
                  { min: 10, message: 'Description must be at least 10 characters' }
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Enter Task Description" 
                  className="form-textarea"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="form-actions" ref={formButtonsRef}>
            <Space size="middle">
              <Button 
                onClick={handleReset} 
                className="reset-btn"
                icon={<ReloadOutlined />}
                size="large"
              >
                Reset Form
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="save-btn"
                icon={<SaveOutlined />}
                loading={saveLoading}
                size="large"
              >
                Save Task
              </Button>
            </Space>
          </div>
        </Form>
      </Card>

      {/* Success Modal */}
      <Modal
        title={<span><CheckCircleOutlined style={{ color: '#52c41a' }} /> Task Created Successfully</span>}
        open={successModalVisible}
        onCancel={handleSuccessModalClose}
        footer={renderSuccessModalFooter()}
        width={600}
        centered
        destroyOnClose
      >
        {createdTask && (
          <Result
            status="success"
            title={`Task ${createdTask.taskId} has been created`}
            subTitle={
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div><strong>Task Name:</strong> {createdTask.taskName}</div>
                  </Col>
                  <Col span={12}>
                    <div><strong>Project:</strong> {createdTask.projectName}</div>
                  </Col>
                  <Col span={12}>
                    <div><strong>Client:</strong> {createdTask.clientName}</div>
                  </Col>
                  <Col span={12}>
                    <div><strong>Start Date:</strong> {createdTask.initiativeDate}</div>
                  </Col>
                  <Col span={12}>
                    <div><strong>Target Date:</strong> {createdTask.targetCompletionDate}</div>
                  </Col>
                  <Col span={24}>
                    <Tag color="blue">Ready for Allocation</Tag>
                  </Col>
                </Row>
              </div>
            }
          />
        )}
      </Modal>
    </div>
  );
};

export default TaskCreation;