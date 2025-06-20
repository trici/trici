import React, { useEffect, useState } from 'react';

export const VoiceRecordingIndicator: React.FC = () => {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    // Simulate audio level changes (in a real implementation, you'd get this from the audio stream)
    const audioLevelInterval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    return () => {
      clearInterval(audioLevelInterval);
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {/* Audio level visualization rings - only 2, both close to the button */}
      {[...Array(2)].map((_, i) => (
        <div
          key={`audio-${i}`}
          style={{
            position: 'absolute',
            width: `${54 + i * 10}px`, // 48px button + 6px, then +10px
            height: `${54 + i * 10}px`,
            borderRadius: '50%',
            border: `2px solid rgba(255, 255, 255, ${0.3 + (audioLevel / 100) * 0.5})`,
            animation: `audioPulse ${0.5 + i * 0.1}s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      {/* Central microphone icon with glossy 3D styling */}
      <div
        style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
          animation: 'micPulse 2s ease-in-out infinite',
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.3),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3),
            0 4px 8px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.2)
          `,
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
          }}
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(0.8);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.3;
            }
            100% {
              transform: scale(0.8);
              opacity: 0.6;
            }
          }

          @keyframes audioPulse {
            0% {
              transform: scale(0.9);
              opacity: 0.4;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
            100% {
              transform: scale(0.9);
              opacity: 0.4;
            }
          }

          @keyframes micPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow:
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                0 4px 8px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.2),
                0 0 0 0 rgba(255, 255, 255, 0.4);
            }
            50% {
              transform: scale(1.05);
              box-shadow:
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                inset 0 -2px 4px rgba(0, 0, 0, 0.3),
                0 6px 12px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.2),
                0 0 0 12px rgba(255, 255, 255, 0);
            }
          }
        `}
      </style>
    </div>
  );
};
