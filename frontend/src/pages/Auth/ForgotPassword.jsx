// ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetLink('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      if (data.emailDeliveryFailed && data.resetLink) {
        setSuccess('Email delivery failed (SMTP block). Use the link below to reset your password:');
        setResetLink(data.resetLink);
      } else {
        setSuccess('Password reset instructions sent to your email!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">ShelterSeek</div>
          <p className="auth-subtitle">
            Enter your email to reset your password
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            {success}
            {resetLink && (
              <div style={{ marginTop: '10px' }}>
                <a href={resetLink} style={{ color: '#d72d6e', fontWeight: 'bold', textDecoration: 'underline' }}>
                  Reset Password Now
                </a>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span> Sending Reset Link...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/" className="auth-link">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;