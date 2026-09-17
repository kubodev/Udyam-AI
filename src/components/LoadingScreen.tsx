import { useState, useEffect } from 'react';

const STATUS_MESSAGES = [
  'Initializing intelligent copilot…',
  'Syncing business telemetry…',
  'Calibrating financial insights…',
  'Securing workspace session…',
];

export default function LoadingScreen() {
  const [statusIndex, setStatusIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        setFade(true);
      }, 250);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="udyam-loader-screen">
      {/* Background ambient glow effects */}
      <div className="udyam-loader-glow udyam-loader-glow--primary" />
      <div className="udyam-loader-glow udyam-loader-glow--accent" />

      {/* Main Core Container */}
      <div className="udyam-loader-card">
        {/* Orbital animation structure */}
        <div className="udyam-orb-wrapper">
          {/* Outer rotating gradient ring */}
          <div className="udyam-orb-ring udyam-orb-ring--outer" />

          {/* Middle counter-rotating dashed ring */}
          <div className="udyam-orb-ring udyam-orb-ring--middle" />

          {/* Orbiting particle */}
          <div className="udyam-orb-satellite">
            <span className="udyam-satellite-dot" />
          </div>
          <div className="udyam-orb-satellite udyam-orb-satellite--lag">
            <span className="udyam-satellite-dot udyam-satellite-dot--cyan" />
          </div>

          {/* Central glowing core badge */}
          <div className="udyam-orb-core">
            <div className="udyam-orb-core-inner">
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.7))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Brand identity */}
        <div className="udyam-loader-brand">
          <img
            src="/logo.png"
            alt="Udiyam AI"
            style={{
              height: '3.5rem',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 16px rgba(51, 208, 119, 0.3))',
              marginBottom: '0.25rem',
            }}
          />
          <span className="udyam-loader-tag">BUSINESS COPILOT</span>
        </div>

        {/* Futuristic glowing progress bar */}
        <div className="udyam-loader-bar-wrap">
          <div className="udyam-loader-bar-track">
            <div className="udyam-loader-bar-pill" />
          </div>
        </div>

        {/* Dynamic status micro-copy with smooth fade */}
        <div className="udyam-loader-status-box">
          <p
            className={`udyam-loader-status ${fade ? 'udyam-loader-status--in' : 'udyam-loader-status--out'}`}
          >
            {STATUS_MESSAGES[statusIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
