import React, { useState, useRef } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Contact.css';

const REASONS = [
  'General Inquiry',
  'Booking Issue',
  'Payment Problem',
  'Report a Listing',
  'Host Onboarding',
  'Account / Login Help',
  'Refund Request',
  'Partnership / Business',
  'Feedback & Suggestions',
  'Other',
];

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    subject: '',
    message: '',
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(selectedFile.type)) {
      setStatus({ type: 'error', msg: 'Only images (JPEG, PNG, WEBP) and PDF files are allowed.' });
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', msg: 'File must be under 10MB.' });
      return;
    }
    setFile(selectedFile);
    setStatus(null);
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview('pdf');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.reason || !form.message) {
      setStatus({ type: 'error', msg: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('attachment', file);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/contact`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed');

      setStatus({ type: 'success', msg: data.message });
      setForm({ name: '', email: '', phone: '', reason: '', subject: '', message: '' });
      removeFile();
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-page">
      <Navbar />

      {/* Hero */}
      <section className="ct-hero">
        <div className="ct-hero-bg" />
        <div className="ct-hero-content">
          <span className="ct-hero-badge">Support & Contact</span>
          <h1>We're here to help</h1>
          <p>Have a question, issue, or just want to say hello? Send us a message and we'll get back to you within 24–48 hours.</p>
        </div>
      </section>

      <div className="ct-main">

        {/* Info Cards */}
        <div className="ct-info-grid">
          {[
            { icon: '📧', title: 'Email Us', val: 'shelterseekrooms@gmail.com', sub: 'We reply within 24–48 hrs' },
            { icon: '⏰', title: 'Support Hours', val: 'Mon – Sat, 9am – 7pm IST', sub: '24/7 for urgent issues' },
            { icon: '📍', title: 'Based In', val: 'India 🇮🇳', sub: 'Serving travelers nationwide' },
          ].map((c, i) => (
            <div className="ct-info-card" key={i}>
              <div className="ct-info-icon">{c.icon}</div>
              <h4>{c.title}</h4>
              <p className="ct-info-val">{c.val}</p>
              <p className="ct-info-sub">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="ct-form-wrapper">
          <div className="ct-form-header">
            <h2>Send us a message</h2>
            <p>Fill in the details below and we'll reach out to you.</p>
          </div>

          {status && (
            <div className={`ct-alert ct-alert-${status.type}`}>
              <span>{status.type === 'success' ? '✅' : '❌'}</span>
              {status.msg}
            </div>
          )}

          <form className="ct-form" onSubmit={handleSubmit} noValidate>
            {/* Row 1 */}
            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-name">Full Name <span className="ct-req">*</span></label>
                <input
                  id="ct-name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="ct-field">
                <label htmlFor="ct-email">Email Address <span className="ct-req">*</span></label>
                <input
                  id="ct-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-phone">Phone Number <span className="ct-opt">(optional)</span></label>
                <input
                  id="ct-phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 99999 00000"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="ct-field">
                <label htmlFor="ct-reason">Reason for Contact <span className="ct-req">*</span></label>
                <select
                  id="ct-reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                >
                  <option value="">— Select a reason —</option>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject */}
            <div className="ct-field ct-field-full">
              <label htmlFor="ct-subject">Subject <span className="ct-opt">(optional)</span></label>
              <input
                id="ct-subject"
                name="subject"
                type="text"
                placeholder="Brief subject of your message"
                value={form.subject}
                onChange={handleChange}
              />
            </div>

            {/* Message */}
            <div className="ct-field ct-field-full">
              <label htmlFor="ct-message">Your Message <span className="ct-req">*</span></label>
              <textarea
                id="ct-message"
                name="message"
                rows={6}
                placeholder="Please describe your query or issue in detail..."
                value={form.message}
                onChange={handleChange}
                required
              />
              <span className="ct-char-count">{form.message.length} characters</span>
            </div>

            {/* File Upload */}
            <div className="ct-field ct-field-full">
              <label>Attachment <span className="ct-opt">(optional — image or PDF, max 10MB)</span></label>
              <div
                className={`ct-dropzone ${dragOver ? 'ct-dropzone-active' : ''} ${file ? 'ct-dropzone-filled' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                {!file ? (
                  <div className="ct-drop-placeholder">
                    <div className="ct-drop-icon">📎</div>
                    <p>Drag & drop a file here, or <span className="ct-drop-link">browse</span></p>
                    <p className="ct-drop-hint">JPEG, PNG, WEBP, PDF — up to 10MB</p>
                  </div>
                ) : (
                  <div className="ct-file-preview">
                    {filePreview === 'pdf' ? (
                      <div className="ct-pdf-icon">📄</div>
                    ) : (
                      <img src={filePreview} alt="preview" className="ct-img-preview" />
                    )}
                    <div className="ct-file-info">
                      <p className="ct-file-name">{file.name}</p>
                      <p className="ct-file-size">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      className="ct-remove-file"
                      onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    >✕</button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {/* Submit */}
            <button type="submit" className="ct-submit-btn" disabled={loading} id="contact-submit">
              {loading ? (
                <><span className="ct-spinner" /> Sending...</>
              ) : (
                <>Send Message <span className="ct-arrow">→</span></>
              )}
            </button>
          </form>
        </div>

        {/* FAQ */}
        <div className="ct-faq">
          <h3>Frequently Asked Questions</h3>
          <div className="ct-faq-grid">
            {[
              { q: 'How do I cancel a booking?', a: 'Go to "Booked History" in your account, find your booking, and use the cancellation option. Refunds follow our policy.' },
              { q: 'How long do refunds take?', a: 'Refunds are typically processed within 5–7 business days depending on your bank or payment method.' },
              { q: 'Can I list my property?', a: 'Yes! Sign up as a host and submit your listing. Our team reviews it within 2–3 business days.' },
              { q: 'What if my OTP doesn\'t arrive?', a: 'Check your spam folder. If still missing, use "Resend OTP" or contact us with your email address.' },
            ].map((f, i) => (
              <div className="ct-faq-item" key={i}>
                <h5>❓ {f.q}</h5>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default Contact;
