const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const fetch = require('node-fetch');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage — contacts folder, accept images + PDFs (raw)
const contactStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    return {
      folder: 'shelterseek/contact-attachments',
      resource_type: isPDF ? 'raw' : 'image',
      allowed_formats: isPDF ? ['pdf'] : ['jpeg', 'jpg', 'png', 'webp'],
      public_id: `contact-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`
    };
  }
});

const contactUpload = multer({
  storage: contactStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (JPEG, PNG, WEBP) and PDFs are allowed'));
  }
});

// POST /api/contact
router.post('/', contactUpload.single('attachment'), async (req, res) => {
  try {
    const { name, email, phone, reason, subject, message } = req.body;

    if (!name || !email || !reason || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, reason and message are required.' });
    }

    // Build attachment section for email
    let attachmentSection = '';
    if (req.file) {
      const fileUrl = req.file.path || req.file.secure_url;
      const fileName = req.file.originalname || 'attachment';
      attachmentSection = `
        <div style="margin-top: 20px; padding: 14px 18px; background: #fff8e1; border-left: 4px solid #f59e0b; border-radius: 8px;">
          <p style="margin: 0 0 6px; font-weight: 700; color: #92400e;">📎 Attachment</p>
          <p style="margin: 0; font-size: 14px;">
            <strong>File:</strong> ${fileName}<br/>
            <a href="${fileUrl}" target="_blank" style="color: #d72d6e; word-break: break-all;">${fileUrl}</a>
          </p>
        </div>
      `;
    }

    // Send email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return res.status(500).json({ success: false, message: 'Email service not configured.' });
    }

    const emailHtml = `
      <div style="
        max-width: 600px;
        margin: auto;
        font-family: 'Segoe UI', Arial, sans-serif;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 6px 24px rgba(0,0,0,0.08);
      ">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #d72d6e, #7c3aed); padding: 32px 36px; color: #fff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">📬 New Contact Form Submission</h1>
          <p style="margin: 8px 0 0; opacity: 0.85; font-size: 15px;">ShelterSeek — Contact Us</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 36px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; width: 35%;">
                <span style="font-weight: 700; color: #333; font-size: 14px;">👤 Name</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555; font-size: 14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-weight: 700; color: #333; font-size: 14px;">📧 Email</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555; font-size: 14px;">
                <a href="mailto:${email}" style="color: #d72d6e;">${email}</a>
              </td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-weight: 700; color: #333; font-size: 14px;">📞 Phone</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555; font-size: 14px;">${phone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-weight: 700; color: #333; font-size: 14px;">🏷️ Reason</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555; font-size: 14px;">${reason}</td>
            </tr>
            ${subject ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="font-weight: 700; color: #333; font-size: 14px;">📌 Subject</span>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555; font-size: 14px;">${subject}</td>
            </tr>
            ` : ''}
          </table>

          <!-- Message -->
          <div style="margin-top: 24px;">
            <p style="font-weight: 700; color: #333; font-size: 14px; margin-bottom: 10px;">💬 Message</p>
            <div style="
              background: #f8f9fc;
              border-left: 4px solid #d72d6e;
              border-radius: 8px;
              padding: 16px 20px;
              color: #444;
              font-size: 15px;
              line-height: 1.7;
              white-space: pre-wrap;
            ">${message}</div>
          </div>

          ${attachmentSection}
        </div>

        <!-- Footer -->
        <div style="padding: 20px 36px; background: #f8f9fc; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; font-size: 12px; color: #888;">
            Submitted on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST via ShelterSeek Contact Form
          </p>
        </div>
      </div>
    `;

    let resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'ShelterSeek <onboarding@resend.dev>',
        to: ['shelterseekrooms@gmail.com'],
        reply_to: email,
        subject: `[Contact] ${reason}${subject ? ` — ${subject}` : ''} | From ${name}`,
        html: emailHtml
      })
    });

    let resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.warn('Primary email sending to shelterseekrooms@gmail.com failed, trying fallback to sumukeshmopuram1@gmail.com. Error details:', resendData);
      
      // Attempt to send to sumukeshmopuram1@gmail.com (Resend free plan owner)
      const fallbackRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'ShelterSeek <onboarding@resend.dev>',
          to: ['sumukeshmopuram1@gmail.com'],
          reply_to: email,
          subject: `[Contact Fallback] ${reason}${subject ? ` — ${subject}` : ''} | From ${name}`,
          html: `
            ${emailHtml}
          `
        })
      });

      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        console.error('Fallback email sending to sumukeshmopuram1@gmail.com also failed:', fallbackData);
        return res.status(500).json({ success: false, message: 'Failed to send email. Please try again.' });
      }
      
      resendData = fallbackData;
    }

    // Send acknowledgement to the user
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'ShelterSeek <onboarding@resend.dev>',
          to: [email],
          subject: '✅ We received your message — ShelterSeek',
          html: `
            <div style="max-width: 520px; margin: auto; font-family: 'Segoe UI', Arial, sans-serif; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="background: linear-gradient(135deg, #d72d6e, #7c3aed); padding: 28px 32px; color: #fff;">
                <h2 style="margin: 0; font-size: 22px;">Thanks for reaching out, ${name}! 🙏</h2>
              </div>
              <div style="padding: 28px 32px; color: #444; font-size: 15px; line-height: 1.7;">
                <p>We've received your message and our team will get back to you within <strong>24–48 hours</strong>.</p>
                <p><strong>Your query:</strong> ${reason}${subject ? ` — ${subject}` : ''}</p>
                <p>In the meantime, feel free to explore our platform and find amazing stays across India.</p>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="${process.env.FRONTEND_URL || 'https://shelterseek-navy.vercel.app'}" style="background: #d72d6e; color: #fff; padding: 12px 28px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 14px;">Explore ShelterSeek</a>
                </div>
              </div>
              <div style="padding: 16px 32px; background: #f8f9fc; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #888;">— Team ShelterSeek 💖 | shelterseekrooms@gmail.com</p>
              </div>
            </div>
          `
        })
      });
    } catch (ackErr) {
      console.warn('Acknowledgement email failed (non-critical):', ackErr.message);
    }

    res.json({ success: true, message: 'Message sent successfully! We\'ll get back to you soon.' });

  } catch (err) {
    console.error('Contact route error:', err);
    res.status(500).json({ success: false, message: err.message || 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
