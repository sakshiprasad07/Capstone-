import { useEffect, useState } from 'react';

export default function DangerBanner({ danger, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (danger) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 400);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [danger, onDismiss]);

  if (!danger) return null;

  return (
    <div className={`danger-banner ${visible ? 'show' : 'hide'}`}>
      <div className="danger-banner-content">
        <div className="danger-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="danger-text">
          <strong>⚠️ High Crime Area Detected</strong>
          <span>
            You are within {danger.distance}m of a zone with {danger.crimeCount} recorded incidents
            {danger.area && ` near ${danger.area}`}. Stay alert.
          </span>
        </div>
        <button className="danger-close" onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 400); }}>
          ✕
        </button>
      </div>
    </div>
  );
}
