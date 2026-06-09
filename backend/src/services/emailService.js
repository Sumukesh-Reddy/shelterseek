const fetch = require('node-fetch');

// Resend API - uses HTTP (no SMTP port blocking on Render)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'ShelterSeek <onboarding@resend.dev>';

/**
 * Send an email via Resend HTTP API
 * Works on Render (no SMTP port 465/587 required)
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Resend API error: ${data.message || JSON.stringify(data)}`);
  }

  return data;
};

// Send OTP email
const sendOTPEmail = async (toEmail, otp) => {
  await sendEmail({
    to: toEmail,
    subject: '🔐 Your ShelterSeek Verification Code',
    html: `
      <div style="
          max-width: 480px;
          margin: auto;
          padding: 25px;
          background: #ffffff;
          border-radius: 12px;
          font-family: Arial, Helvetica, sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          color: #333;
          line-height: 1.6;
      ">
          <h2 style="
              text-align: center;
              color: #d72d6e;
              margin-bottom: 10px;
              font-size: 24px;
          ">
              🔐 ShelterSeek Verification
          </h2>
          <p style="font-size: 15px; margin-bottom: 18px;">
              Hello 👋,<br><br>
              Use the following One-Time Password (OTP) to verify your account:
          </p>
          <div style="
              text-align: center;
              background: #ffe8f1;
              border-left: 5px solid #d72d6e;
              padding: 18px 20px;
              border-radius: 8px;
              margin: 20px 0;
          ">
              <p style="
                  font-size: 34px;
                  letter-spacing: 4px;
                  color: #d72d6e;
                  font-weight: bold;
                  margin: 0;
              ">
                  ${otp}
              </p>
              <p style="font-size: 13px; color: #777; margin-top: 8px;">
                  ⏳ Valid for 10 minutes
              </p>
          </div>
          <p style="font-size: 14px; color:#444;">
              ⚠️ Please keep this code confidential.<br>
              Do not share it with anyone for your security.
          </p>
          <p style="font-size: 13px; color:#777; margin-top: 25px; text-align: center;">
              If you did not request this verification code, you may safely ignore this email.
              <br><br>
              — Team ShelterSeek 💖
          </p>
      </div>
    `
  });
};

// Send booking confirmation email
const sendBookingConfirmationEmail = async (toEmail, bookingDetails) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  try {
    await sendEmail({
      to: toEmail,
      subject: 'Booking Confirmation - ShelterSeek',
      html: `
        <div style="
              max-width: 520px;
              margin: auto;
              padding: 25px;
              background: #ffffff;
              border-radius: 14px;
              font-family: 'Segoe UI', Arial, sans-serif;
              box-shadow: 0 6px 18px rgba(0,0,0,0.1);
              line-height: 1.5;
              color: #333;
        ">
              <h1 style="
                  color: #d72d6e;
                  text-align: center;
                  font-size: 28px;
                  margin-bottom: 5px;
              ">
                  Hello Traveler! 🏡
              </h1>
              <h2 style="
                  text-align: center;
                  color: #d72d6e;
                  font-size: 22px;
                  margin-bottom: 20px;
              ">
                  🎉 Your Booking is Confirmed!
              </h2>
              <div style="
                  background: #ffe8f1;
                  border-left: 5px solid #d72d6e;
                  padding: 15px 18px;
                  border-radius: 8px;
                  margin-bottom: 20px;
              ">
                  <p style="margin: 8px 0;"><strong>🆔 Booking ID:</strong> ${bookingDetails.bookingId}</p>
                  <p style="margin: 8px 0;"><strong>🏨 Room:</strong> ${bookingDetails.roomTitle}</p>
                  <p style="margin: 8px 0;"><strong>📅 Check-in:</strong> ${formatDate(bookingDetails.checkIn)}</p>
                  <p style="margin: 8px 0;"><strong>📅 Check-out:</strong> ${formatDate(bookingDetails.checkOut)}</p>
                  <p style="margin: 8px 0;"><strong>💰 Total Cost:</strong> 
                      <span style="color:#d72d6e; font-weight:600;">₹${bookingDetails.totalCost}</span>
                  </p>
                  <p style="margin: 8px 0;"><strong>🔖 Transaction ID:</strong> ${bookingDetails.transactionId}</p>
              </div>
              <p style="font-size: 15px; color:#555; text-align:center;">
                  Thank you for choosing <strong>ShelterSeek</strong> for your stay! 💖  
                  <br>We wish you a wonderful and memorable experience 😊
              </p>
              <div style="text-align:center; margin-top: 18px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/BookedHistory" style="
                      padding: 10px 18px;
                      background: #d72d6e;
                      color: white;
                      text-decoration: none;
                      border-radius: 8px;
                      font-size: 15px;
                      font-weight: 600;
                  ">🔍 View Booking Details</a>
              </div>
              <p style="text-align:center; margin-top:25px; color:#888; font-size:13px;">
                  Need help? Contact us anytime at  
                  <a style="color:#d72d6e;" href="mailto:shelterseekrooms@gmail.com">shelterseekrooms@gmail.com</a> 📩
              </p>
        </div>
      `
    });
  } catch (err) {
    console.warn('Booking confirmation email failed:', err.message);
    // Don't throw — booking should still succeed even if email fails
  }
};

// Send test email
const sendTestEmail = async (toEmail) => {
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    await sendEmail({
      to: toEmail,
      subject: 'Test OTP Email - ShelterSeek Working!',
      html: `<p>Your test OTP is: <strong>${testOtp}</strong></p>`
    });
    return { success: true, message: 'Test email sent!', testOtp };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

const sendManagerWelcomeEmail = async (toEmail, details = {}) => {
  const managerName = details.name || 'Manager';
  const managerUsername = details.username || '';
  const managerRole = details.role || 'Manager';
  const managerDepartment = details.department || '';
  const managerEmail = details.email || toEmail;
  const managerPassword = details.password || '';

  try {
    await sendEmail({
      to: toEmail,
      subject: 'Welcome to ShelterSeek - Manager Access',
      html: `
        <div style="
            max-width: 520px;
            margin: auto;
            padding: 24px;
            background: #ffffff;
            border-radius: 12px;
            font-family: Arial, Helvetica, sans-serif;
            box-shadow: 0 6px 18px rgba(0,0,0,0.08);
            color: #333;
            line-height: 1.6;
        ">
            <h2 style="
                text-align: center;
                color: #d72d6e;
                margin-bottom: 8px;
                font-size: 24px;
            ">
                Welcome to ShelterSeek
            </h2>
            <p style="font-size: 15px; margin-bottom: 16px;">
                Hello ${managerName},
            </p>
            <p style="font-size: 15px; margin-bottom: 16px;">
                Your manager account has been created successfully.
            </p>
            <div style="
                background: #fff1f6;
                border-left: 4px solid #d72d6e;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 18px;
            ">
                <p style="margin: 6px 0;"><strong>Role:</strong> ${managerRole}</p>
                ${managerDepartment ? `<p style="margin: 6px 0;"><strong>Department:</strong> ${managerDepartment}</p>` : ''}
                ${managerEmail ? `<p style="margin: 6px 0;"><strong>Email:</strong> ${managerEmail}</p>` : ''}
                ${managerUsername ? `<p style="margin: 6px 0;"><strong>Username:</strong> ${managerUsername}</p>` : ''}
                ${managerPassword ? `<p style="margin: 6px 0;"><strong>Password:</strong> ${managerPassword}</p>` : ''}
            </div>
            <p style="font-size: 14px; color:#555;">
                Please sign in and change this password after your first login.
            </p>
            <p style="font-size: 13px; color:#777; margin-top: 24px; text-align: center;">
                Team ShelterSeek
            </p>
        </div>
      `
    });
    return { success: true, message: 'Welcome email sent' };
  } catch (err) {
    console.warn('Manager welcome email failed:', err.message);
    return { success: false, message: err.message };
  }
};

const sendPasswordResetEmail = async (toEmail, resetLink) => {
  await sendEmail({
    to: toEmail,
    subject: '🔑 Reset Your ShelterSeek Password',
    html: `
      <div style="
          max-width: 480px;
          margin: auto;
          padding: 25px;
          background: #ffffff;
          border-radius: 12px;
          font-family: Arial, Helvetica, sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          color: #333;
          line-height: 1.6;
      ">
          <h2 style="
              text-align: center;
              color: #d72d6e;
              margin-bottom: 10px;
              font-size: 24px;
          ">
              🔑 Password Reset Request
          </h2>
          <p style="font-size: 15px; margin-bottom: 18px;">
              Hello,<br><br>
              We received a request to reset your password. Click the button below to choose a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="
                  background-color: #d72d6e;
                  color: white;
                  padding: 12px 25px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  display: inline-block;
              ">
                  Reset Password
              </a>
          </div>
          <p style="font-size: 14px; color:#555;">
              This link will expire in 1 hour.<br>
              If you didn't request this, you can safely ignore this email.
          </p>
          <p style="font-size: 13px; color:#777; margin-top: 25px; text-align: center;">
              — Team ShelterSeek 💖
          </p>
      </div>
    `
  });
};

module.exports = {
  sendOTPEmail,
  sendBookingConfirmationEmail,
  sendTestEmail,
  sendManagerWelcomeEmail,
  sendPasswordResetEmail
};