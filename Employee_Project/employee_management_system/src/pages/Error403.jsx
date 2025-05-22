import React from 'react';
import { Result, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import './ErrorPages.css';

const Error403 = () => {
  const location = useLocation();
  const customMessage = location.state?.message;

  return (
    <div className="error-page-container">
      <Result
        status="403"
        title="403"
        subTitle={customMessage || "Sorry, you are not authorized to access this page."}
        extra={
          <Link to="/">
            <Button type="primary">Back Home</Button>
          </Link>
        }
        className="animated-result"
      />
    </div>
  );
};

export default Error403; 