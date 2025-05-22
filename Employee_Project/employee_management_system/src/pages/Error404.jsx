import React from 'react';
import { Result, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import './ErrorPages.css';

const Error404 = () => {
  const location = useLocation();
  const customMessage = location.state?.message;

  return (
    <div className="error-page-container">
      <Result
        status="404"
        title="404"
        subTitle={customMessage || "Sorry, the page you visited does not exist."}
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

export default Error404; 