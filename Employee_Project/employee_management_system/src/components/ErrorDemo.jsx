import React from 'react';
import { Button, Card, Space, Typography, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  WarningOutlined, 
  StopOutlined, 
  CloseCircleOutlined, 
  BugOutlined 
} from '@ant-design/icons';
import { navigateToErrorPage } from '../utils/errorUtils';

const { Title, Text } = Typography;

const ErrorDemo = () => {
  const navigate = useNavigate();

  const showError = (errorType, options = {}) => {
    navigateToErrorPage(navigate, errorType, options);
  };

  return (
    <Card title="Error Pages Demo" style={{ maxWidth: 800, margin: '24px auto' }}>
      <Title level={4}>Test Error Pages</Title>
      <Text>Click the buttons below to see different error pages in action:</Text>
      
      <Divider />
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space wrap>
          <Button 
            danger 
            type="primary" 
            icon={<CloseCircleOutlined />}
            onClick={() => showError(404, { message: "Custom 404 message: The page could not be found" })}
          >
            404 Not Found
          </Button>
          
          <Button 
            danger 
            icon={<StopOutlined />}
            onClick={() => showError(403, { message: "Custom 403 message: You don't have access to this resource" })}
          >
            403 Forbidden
          </Button>
          
          <Button 
            danger 
            icon={<BugOutlined />}
            onClick={() => showError(500, { message: "Custom 500 message: Internal server error occurred" })}
          >
            500 Server Error
          </Button>
          
          <Button 
            icon={<WarningOutlined />}
            style={{ background: '#faad14', borderColor: '#faad14', color: 'white' }}
            onClick={() => showError('warning', { 
              message: "Validation Warning", 
              details: {
                "Name": "Name is required",
                "Email": "Please enter a valid email address",
                "Password": "Password must be at least 8 characters long"
              }
            })}
          >
            Warning Page
          </Button>
        </Space>
        
        <Divider />
        
        <Button type="default" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Space>
    </Card>
  );
};

export default ErrorDemo; 