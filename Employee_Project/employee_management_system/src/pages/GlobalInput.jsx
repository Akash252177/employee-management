import React from 'react';
import { Input } from 'antd';
import './globalStyles.css'; // Optional if you need general input styles

const GlobalInput = (props) => {
  return (
    <Input
      {...props}
      className={`custom-input ${props.className || ''}`}
    />
  );
};

export default GlobalInput;
