import React, { useEffect, useState, useRef } from 'react';
import './About.css';

const About = () => {
  const [travelerCount, setTravelerCount] = useState(0);
  const [hostCount, setHostCount] = useState(0);
  const [listingCount, setListingCount] = useState(0);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsVisible) return;

    const fetchUserCounts = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/users/counts`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (data.success) {
          animateCount(data.travelerCount || 10000, setTravelerCount);
          animateCount(data.hostCount || 5000, setHostCount);
          animateCount((data.travelerCount || 10000) + (data.hostCount || 5000), setListingCount);
        } else {
          animateCount(10000, setTravelerCount);
          animateCount(5000, setHostCount);
          animateCount(15000, setListingCount);
        }
      } catch {
        animateCount(10000, setTravelerCount);
        animateCount(5000, setHostCount);
        animateCount(15000, setListingCount);
      }
    };

    const animateCount = (target, setter) => {
      const duration = 2000;
      const frames = 60;
      const increment = target / frames;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) { clearInterval(timer); current = target; }
        setter(Math.round(current));
      }, duration / frames);
    };

    fetchUserCounts();
  }, [statsVisible]);

  const values = [
    {
      icon: '🔒',
      title: 'Trust & Safety',
      desc: 'Every listing is verified. Every transaction is secured. Your safety is built into every step of the journey.'
    },
    {
      icon: '🌍',
      title: 'Authentic Stays',
      desc: 'Discover accommodations that reflect real local character — from boutique guesthouses to modern city apartments.'
    },
    {
      icon: '💸',
      title: 'Fair Pricing',
      desc: 'Transparent pricing with no hidden fees. What you see is what you pay, always.'
    },
    {
      icon: '⚡',
      title: 'Instant Booking',
      desc: 'Book in seconds with real-time availability. No waiting, no back-and-forth — just seamless reservations.'
    },
    {
      icon: '🤝',
      title: 'Host Support',
      desc: 'We empower hosts with tools, analytics, and 24/7 support to help them deliver outstanding guest experiences.'
    },
    {
      icon: '♻️',
      title: 'Sustainable Travel',
      desc: 'We promote eco-friendly stays and responsible tourism to protect the destinations we all love.'
    }
  ];

  const features = [
    { icon: '🗺️', label: 'Smart Search' },
    { icon: '📅', label: 'Easy Booking' },
    { icon: '💬', label: 'AI Chatbot' },
    { icon: '🔔', label: 'Instant Alerts' },
    { icon: '🏠', label: 'Host Dashboard' },
    { icon: '📊', label: 'Analytics' },
    { icon: '🔐', label: 'Secure Payments' },
    { icon: '⭐', label: 'Verified Reviews' },
  ];

  return (
    <div className="ab-page">
      {/* Hero */}
      <section className="ab-hero">
        <div className="ab-hero-glow" />
        <div className="ab-hero-content">
          <span className="ab-badge">Est. 2025</span>
          <h1 className="ab-hero-title">Redefining How<br />India Finds a Stay</h1>
          <p className="ab-hero-sub">
            ShelterSeek is a modern accommodation platform built to connect travelers with verified, 
            quality stays across India — fast, transparent, and hassle-free.
          </p>
          <div className="ab-hero-actions">
            <a href="/" className="ab-btn-primary">Explore Listings</a>
            <a href="/contact" className="ab-btn-ghost">Get in Touch</a>
          </div>
        </div>
        <div className="ab-hero-visual">
          <div className="ab-float-card ab-fc1">
            <span className="ab-fc-icon">🏠</span>
            <div>
              <div className="ab-fc-label">Verified Listing</div>
              <div className="ab-fc-val">Cozy Studio · Hyderabad</div>
            </div>
          </div>
          <div className="ab-float-card ab-fc2">
            <span className="ab-fc-icon">⭐</span>
            <div>
              <div className="ab-fc-label">Guest Rating</div>
              <div className="ab-fc-val">4.9 / 5.0 Excellent</div>
            </div>
          </div>
          <div className="ab-float-card ab-fc3">
            <span className="ab-fc-icon">🔒</span>
            <div>
              <div className="ab-fc-label">Booking Secured</div>
              <div className="ab-fc-val">Payment Protected</div>
            </div>
          </div>
          <div className="ab-hero-orb" />
        </div>
      </section>

      {/* Stats */}
      <section className="ab-stats" ref={statsRef}>
        <div className="ab-stats-inner">
          {[
            { num: travelerCount.toLocaleString() + '+', label: 'Happy Travelers' },
            { num: hostCount.toLocaleString() + '+', label: 'Verified Hosts' },
            { num: listingCount.toLocaleString() + '+', label: 'Total Users' },
            { num: '24/7', label: 'Customer Support' },
          ].map((s, i) => (
            <div className="ab-stat" key={i}>
              <div className="ab-stat-num">{s.num}</div>
              <div className="ab-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="ab-container">

        {/* Our Story */}
        <section className="ab-story">
          <div className="ab-story-text">
            <div className="ab-section-tag">Our Story</div>
            <h2>Built by travelers,<br />for travelers</h2>
            <p>
              ShelterSeek was born out of a frustration shared by many — finding trustworthy, affordable 
              accommodation without spending hours comparing sites, worrying about scams, or dealing 
              with hidden charges.
            </p>
            <p>
              We built a platform that puts the traveler first. Clean listings, honest pricing, instant 
              booking, and real reviews — all in one place. Whether you're a student looking for 
              affordable PGs, a professional on a work trip, or a family planning a holiday, 
              ShelterSeek has something for you.
            </p>
            <div className="ab-story-pills">
              <span>✈️ Launched 2025</span>
              <span>🇮🇳 Made in India</span>
              <span>🏠 PGs, Hostels & More</span>
            </div>
          </div>
          <div className="ab-story-cards">
            <div className="ab-scard">
              <div className="ab-scard-icon">🎯</div>
              <h4>Our Mission</h4>
              <p>Make quality accommodation accessible to every traveler in India — with transparency, speed, and zero compromise on trust.</p>
            </div>
            <div className="ab-scard ab-scard-offset">
              <div className="ab-scard-icon">🔭</div>
              <h4>Our Vision</h4>
              <p>To become India's most trusted accommodation platform where every stay becomes a memorable part of the journey.</p>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section className="ab-features-section">
          <div className="ab-section-tag center">Platform</div>
          <h2 className="ab-section-title">Everything you need,<br />in one platform</h2>
          <div className="ab-features-grid">
            {features.map((f, i) => (
              <div className="ab-feature-chip" key={i}>
                <span className="ab-feature-icon">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="ab-values-section">
          <div className="ab-section-tag center">What We Stand For</div>
          <h2 className="ab-section-title">Our Core Values</h2>
          <div className="ab-values-grid">
            {values.map((v, i) => (
              <div className="ab-value-card" key={i}>
                <div className="ab-value-icon">{v.icon}</div>
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="ab-how">
          <div className="ab-section-tag center">Simple Process</div>
          <h2 className="ab-section-title">How ShelterSeek Works</h2>
          <div className="ab-steps">
            {[
              { step: '01', icon: '🔍', title: 'Search', desc: 'Enter your destination and dates to browse verified listings instantly.' },
              { step: '02', icon: '📋', title: 'Choose', desc: 'Filter by price, amenities, and ratings to find your perfect match.' },
              { step: '03', icon: '🔐', title: 'Book', desc: 'Book instantly with our secure payment gateway — no calls, no hassle.' },
              { step: '04', icon: '🏠', title: 'Stay', desc: 'Check in and enjoy your stay, backed by our 24/7 customer support.' },
            ].map((s, i) => (
              <div className="ab-step" key={i}>
                <div className="ab-step-num">{s.step}</div>
                <div className="ab-step-icon">{s.icon}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                {i < 3 && <div className="ab-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="ab-cta">
          <div className="ab-cta-inner">
            <h2>Ready to find your perfect stay?</h2>
            <p>Join thousands of travelers discovering unique, verified accommodations across India.</p>
            <div className="ab-cta-actions">
              <a href="/" className="ab-btn-primary">Browse Listings</a>
              <a href="/signup" className="ab-btn-ghost-dark">Create Free Account</a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;