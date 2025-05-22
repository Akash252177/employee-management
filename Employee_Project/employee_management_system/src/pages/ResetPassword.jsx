import React, { useState } from 'react';
import axios from 'axios';
import './ResetPassword.css';

const ResetPassword = () => {
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [email, setEmail] = useState('');  // Add state for email
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Make sure email, OTP, and newPassword are provided
        if (!email || !otp || !newPassword) {
            setError('All fields are required');
            return;
        }

        try {
            // Send OTP and newPassword to backend for verification and reset
            const response = await axios.post('http://127.0.0.1:5000/reset_password', {
                email,
                otp,
                new_password: newPassword,  // Ensure the backend is expecting "new_password"
            });
            
            setMessage(response.data.message);
            setError('');
        } catch (error) {
            setError(error.response?.data?.error || 'Something went wrong!');
            setMessage('');
        }
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-box">
                <h2>Reset Password</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email"
                        className="email-input"
                        placeholder="Enter your email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="text" 
                        className="otp-input"
                        placeholder="Enter OTP" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        className="password-input"
                        placeholder="Enter new password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="submit-btn">Reset Password</button>
                </form>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default ResetPassword;
