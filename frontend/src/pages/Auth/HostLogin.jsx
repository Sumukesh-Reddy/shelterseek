import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/userSlice";
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const HostLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login, user } = useAuth(); // eslint-disable-line no-unused-vars

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  /* ✅ Auto-redirect if already logged in as host */
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
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
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

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

  const verifyOtpAndLogin = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const otpRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpString })
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok || !otpData.success) {
        throw new Error(otpData.message || 'Invalid OTP');
      }

      const loginResult = await login(email, password);

      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Login failed');
      }

      if (loginResult.user.accountType !== 'host') {
        throw new Error('This login is for hosts only');
      }

      dispatch(setUser(loginResult.user));
      setSuccess('Login successful! Redirecting...');
      navigate('/host_index', { replace: true });

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
      await verifyOtpAndLogin();
    }
  };

  const resendOtp = async () => {
    if (resendTimer > 0) return;
    await sendOtp();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">ShelterSeek</div>
          <p className="auth-subtitle">
            {step === 1
              ? 'Welcome back, Host! Sign in to manage your properties'
              : 'Enter the verification code sent to your email'}
          </p>
        </div>

        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <input
                type="email"
                placeholder="Email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="forgot-password-link">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>

              <button className="auth-button" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </>
          ) : (
            <>
              <div className="otp-container">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    value={digit}
                    maxLength="1"
                    className="otp-input"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>

              <button className="auth-button" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              {resendTimer > 0 ? (
                <p>Resend OTP in {resendTimer}s</p>
              ) : (
                <button type="button" onClick={resendOtp} className="resend-link">
                  Resend OTP
                </button>
              )}
            </>
          )}
        </form>

        <div className="auth-footer">
          {step === 1 ? (
            <>
              Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
              <br />
              <Link to="/traveler-login" className="auth-link">Login as Traveler instead</Link>
            </>
          ) : (
            <button 
              type="button" 
              className="auth-button secondary" 
              onClick={() => setStep(1)}
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostLogin;
