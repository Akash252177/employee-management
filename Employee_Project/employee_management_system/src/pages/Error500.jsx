import React from 'react';
import { Result, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import './ErrorPages.css';

const Error500 = () => {
  const location = useLocation();
  const customMessage = location.state?.message;

  return (
    <div className="error-page-container">
      <Result
        status="500"
        title="500"
        subTitle={customMessage || "Sorry, something went wrong on the server."}
        extra={
          <div className="error-actions">
            <Button type="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Link to="/">
              <Button>Back Home</Button>
            </Link>
          </div>
        }
        className="animated-result"
      />
    </div>
  );
};

export default Error500; 