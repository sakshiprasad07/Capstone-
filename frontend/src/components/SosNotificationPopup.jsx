import { useState, useEffect } from 'react';

/**
 * SosNotificationPopup - Displays a notification when a new SOS alert is assigned to the viewing police station
 * Auto-dismisses after specified duration
 */
export default function SosNotificationPopup({ sos, stationName, duration = 10000, onDismiss = null }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      if (onDismiss) {
        onDismiss();
      }
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(239, 68, 68, 0.4)',
        maxWidth: '400px',
        animation: 'slideInRight 0.3s ease-out',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '24px', marginTop: '2px', flexShrink: 0 }}>🚨</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
            EMERGENCY SOS ALERT
          </div>
          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.95 }}>
            <strong>Victim:</strong> {sos.username || 'Unknown'}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.95 }}>
            <strong>Location:</strong> {sos.latitude?.toFixed(4)}, {sos.longitude?.toFixed(4)}
          </div>
          {stationName && (
            <div
              style={{
                fontSize: '13px',
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              ✓ Assigned to {stationName}
            </div>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            marginTop: '-4px',
            flexShrink: 0
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
