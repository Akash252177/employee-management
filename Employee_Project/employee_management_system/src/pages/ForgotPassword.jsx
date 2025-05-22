import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css'; // Import the CSS file

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset previous messages
        setMessage('');
        setError('');

        // Check if the email is provided
        if (!email) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:5000/forgot_password', { email });

            // If the request is successful, show the success message
            setMessage(response.data.message);

        } catch (err) {
            // Handle any error, check for error response, otherwise use generic error message
            const errMsg = err?.response?.data?.error || 'Something went wrong!';
            setError(errMsg);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-box">
                <h2>Forgot Password</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" 
                        className="email-input"
                        placeholder="Enter your email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="submit-btn">Send OTP</button>
                </form>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default ForgotPassword;
