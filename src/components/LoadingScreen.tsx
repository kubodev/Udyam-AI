import { useState, useEffect } from 'react';

const STATUS_MESSAGES = [
  'Opening the workspace…',
  'Loading your business file…',
  'Checking documents…',
  'Almost ready…',
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
      <div className="udyam-loader-card">
        <div className="udyam-loader-brand">
          <img
            src="/logo.png"
            alt="UdyamAI"
            style={{
              height: '4.5rem',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '0.4rem',
            }}
          />
          <span className="udyam-loader-tag">Business companion</span>
        </div>

        <div className="udyam-loader-bar-wrap">
          <div className="udyam-loader-bar-track">
            <div className="udyam-loader-bar-pill" />
          </div>
        </div>

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
