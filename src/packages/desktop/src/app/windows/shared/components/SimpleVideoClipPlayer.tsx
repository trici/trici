/**
 * A simple wrapper around the video element that allows for playing a video clip.
 * It takes the clip as a prop and plays it.
 * It does not have any controls.
 * It loops the clip.
 * It auto-plays the clip.
 *
 */

import React, { useEffect, useRef } from 'react';

export function SimpleVideoClipPlayer({ clipUrl }: { clipUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = clipUrl;
      videoRef.current.loop = true;
      videoRef.current.autoplay = false;
    }
  }, [clipUrl]);

  return <video ref={videoRef} />;
}
