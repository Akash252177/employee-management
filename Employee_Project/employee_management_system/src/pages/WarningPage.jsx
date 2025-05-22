import React from 'react';
import { Result, Button, Alert, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { WarningOutlined } from '@ant-design/icons';
import './ErrorPages.css';

const WarningPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const customMessage = location.state?.message;
  const details = location.state?.details;

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="error-page-container">
      <Result
        status="warning"
        title="Warning"
        subTitle={customMessage || "There's an issue that requires your attention"}
        icon={<WarningOutlined className="warning-icon" />}
        extra={
          <>
            {details && (
              <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
                {typeof details === 'string' ? (
                  <Alert message={details} type="warning" showIcon />
                ) : (
                  Object.entries(details).map(([key, value]) => (
                    <Alert 
                      key={key} 
                      message={key} 
                      description={value} 
                      type="warning" 
                      showIcon 
                    />
                  ))
                )}
              </Space>
            )}
            <div className="error-actions">
              <Button type="primary" onClick={goBack}>
                Go Back
              </Button>
              <Link to="/">
                <Button>Back Home</Button>
              </Link>
            </div>
          </>
        }
        className="animated-result warning-result"
      />
    </div>
  );
};

export default WarningPage; 