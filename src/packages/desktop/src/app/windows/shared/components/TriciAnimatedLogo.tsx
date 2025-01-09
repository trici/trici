import React, { useEffect } from 'react';

export const TriciAnimatedLogo: React.FC<{ onAnimationComplete: () => void }> = ({ onAnimationComplete }) => {
  useEffect(() => {
    setTimeout(() => {
      onAnimationComplete();
    }, 4000);
  });
  return (
    <svg width="300" height="300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(57, 9)">
        <circle cx="0" cy="0" r="3" fill="#0075ea">
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1 0.05; 1 1; 1 0.05"
            keyTimes="0; 0.05; 1"
            dur="0.4s"
            repeatCount="2"
            begin="0.2s"
          />
        </circle>
      </g>
      <g transform="translate(95, 9)">
        <circle cx="0" cy="0" r="3" fill="#0075ea">
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1 0.05; 1 1; 1 0.05"
            keyTimes="0; 0.05; 1"
            dur="0.4s"
            repeatCount="2"
            begin="0.2s"
          />
        </circle>
      </g>
      <text x="10" y="50" fontSize="60" fontFamily="OpenSans" fill="#0075ea" letterSpacing="-3" opacity={0}>
        trici
        <animate attributeName="opacity" values="0;1;" begin={'2.5'} dur="0.5s" fill="freeze" />
      </text>
      <path
        id="smile"
        d="M55,55 Q77,70 98,55"
        stroke="#ffd100"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0 48 2 48"
        strokeDashoffset="25"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0 48 2 48; 0 40 15 40; 0 30 30 30; 0 20 60 20; 0 10 90 10; 0 1 99 1"
          dur="0.5s"
          fill="freeze"
          begin={'1.5s'}
        />
        {/* <animate attributeName="stroke-dashoffset" values="25; 0" dur="3s" fill="freeze" /> */}
        <animate attributeName="stroke-dashoffset" from="25" to="10" dur="0.5s" begin={'1.5s'} fill="freeze" />
      </path>
    </svg>
  );
};
