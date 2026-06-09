// Signup.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: basic info, 2: OTP verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('traveller');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      if (data.emailDeliveryFailed && data.otp) {
        setSuccess(`OTP generated: ${data.otp} (Email delivery failed, using fallback)`);
        setOtp(data.otp.split(''));
      } else {
        setSuccess('OTP sent to your email!');
      }
      setResendTimer(60);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndSignup = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Verify OTP first
      const otpRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString })
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok || !otpData.success) {
        throw new Error(otpData.message || 'Invalid OTP');
      }

      // Then create account
      const signupRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, accountType })
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok || !signupData.success) {
        throw new Error(signupData.message || 'Signup failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      
      // Redirect to appropriate login page based on account type
      setTimeout(() => {
        if (accountType === 'traveller') {
          navigate('/traveler-login');
        } else if (accountType === 'host') {
          navigate('/host-login');
        } else {
          navigate('/LoginSelection');
        }
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      await sendOtp();
    } else {
      await verifyOtpAndSignup();
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    await sendOtp();
  };


  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthClass = () => {
    if (passwordStrength <= 2) return 'strength-weak';
    if (passwordStrength <= 3) return 'strength-fair';
    if (passwordStrength <= 4) return 'strength-good';
    return 'strength-strong';
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">ShelterSeek</div>
          <p className="auth-subtitle">
            {step === 1 ? 'Create your account and start your journey' : 'Verify your email to complete registration'}
          </p>
        </div>

        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : 'inactive'}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : 'inactive'}`}>2</div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
                {password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div className={`strength-fill ${getPasswordStrengthClass()}`}></div>
                    </div>
                    <span>Password strength: {getPasswordStrengthText()}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Account Type</label>
                <div className="account-type-selector">
                  <div 
                    className={`account-type-option ${accountType === 'traveller' ? 'selected' : ''}`}
                    onClick={() => setAccountType('traveller')}
                  >
                    <span className="account-type-icon">🧳</span>
                    <div className="account-type-label">Traveller</div>
                    <div className="account-type-desc">Find and book accommodations</div>
                  </div>
                  <div 
                    className={`account-type-option ${accountType === 'host' ? 'selected' : ''}`}
                    onClick={() => setAccountType('host')}
                  >
                    <span className="account-type-icon">🏠</span>
                    <div className="account-type-label">Host</div>
                    <div className="account-type-desc">List and manage properties</div>
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span> Sending OTP...
                  </>
                ) : (
                  'Send OTP & Create Account'
                )}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

             
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Enter 6-digit code</label>
                <div className="otp-container">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      className="otp-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength="1"
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span> Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </button>

              <div className="resend-otp">
                {resendTimer > 0 ? (
                  <span>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button type="button" className="resend-link" onClick={resendOtp}>
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
        </form>

        <div className="auth-footer">
          {step === 1 ? (
            <>
              Already have an account? <Link to="/LoginSelection" className="auth-link">Sign in</Link>
            </>
          ) : (
            <button 
              type="button" 
              className="auth-button secondary" 
              onClick={() => setStep(1)}
            >
              Back to Registration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
