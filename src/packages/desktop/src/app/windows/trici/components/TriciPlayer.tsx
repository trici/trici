import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import { IFocusSession } from '@trici/models';

interface TriciPlayerProps {
  selectedSession: IFocusSession | null;
  onTimeUpdate?: (currentTime: number) => void;
}

// Define the handle type
export interface TriciPlayerHandle {
  seekToTimestamp: (timestamp: number) => void;
}

export const TriciPlayer = forwardRef<TriciPlayerHandle, TriciPlayerProps>(({ selectedSession, onTimeUpdate }, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const [currentSessionStartTime, setCurrentSessionStartTime] = useState<number>(0);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // Method to seek to a specific timestamp
  const seekToTimestamp = (timestamp: number) => {
    if (!playerRef.current || !selectedSession || !timestamp) return;

    // Calculate seconds from the start of the video
    const sessionStartTime = selectedSession.startTime;
    const seekTimeSeconds = (timestamp - sessionStartTime) / 1000;

    // Seek to the calculated time
    if (seekTimeSeconds >= 0) {
      playerRef.current.currentTime(seekTimeSeconds);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    seekToTimestamp,
  }));

  // Initialize video.js - only once
  useEffect(() => {
    // Cleanup function to dispose player
    const disposePlayer = () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
        setPlayerInitialized(false);
      }
    };

    // Only initialize once the DOM is ready and the element exists
    if (!videoRef.current) return disposePlayer;

    // Create player instance
    const player = videojs(
      videoRef.current,
      {
        controls: true,
        fluid: false,
        preload: 'auto',
        aspectRatio: '16:9',
        playbackRates: [1, 2, 4, 6, 8],
        controlBar: {
          volumePanel: false,
          pictureInPictureToggle: false,
        },
      },
      () => {
        // Player is ready
        console.log('Player is ready');

        // Set initial playback rate
        player.playbackRate(4);
        setPlayerInitialized(true);
      },
    );

    playerRef.current = player;

    // Clean up on unmount
    return disposePlayer;
  }, []);

  // Update video duration when it becomes available
  useEffect(() => {
    if (!playerRef.current || !playerInitialized) return;

    const handleDurationChange = () => {
      try {
        if (playerRef.current && typeof playerRef.current.duration === 'function') {
          const duration = playerRef.current.duration();
          if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
            setVideoDuration(duration * 1000); // Convert to ms
            console.log('Video duration set:', duration * 1000, 'ms');
          }
        }
      } catch (e) {
        console.warn('Error getting video duration:', e);
      }
    };

    playerRef.current.on('durationchange', handleDurationChange);
    playerRef.current.on('loadedmetadata', handleDurationChange);

    return () => {
      if (playerRef.current) {
        playerRef.current.off('durationchange', handleDurationChange);
        playerRef.current.off('loadedmetadata', handleDurationChange);
      }
    };
  }, [playerInitialized]);

  // Set up time update listener whenever currentSessionStartTime changes
  useEffect(() => {
    if (!playerRef.current || !playerInitialized || !selectedSession) return;

    // Remove any existing timeupdate listeners to prevent duplicates
    playerRef.current.off('timeupdate');

    // Add time update event listener
    playerRef.current.on('timeupdate', () => {
      if (onTimeUpdate && currentSessionStartTime > 0) {
        // Convert video time (in seconds) to timestamp
        const currentTime = playerRef.current?.currentTime();
        if (typeof currentTime === 'number') {
          const videoTimeMs = currentTime * 1000;
          const sessionDuration = selectedSession.endTime - selectedSession.startTime;

          // Use the actual video duration if available, otherwise fall back to session duration
          const actualVideoDuration = videoDuration || sessionDuration;

          // Calculate the timestamp based on the ratio of session duration to video duration
          const adjustedTimestamp = currentSessionStartTime + videoTimeMs * (sessionDuration / actualVideoDuration);

          // Only send updates if the timestamp is valid
          if (adjustedTimestamp >= currentSessionStartTime) {
            onTimeUpdate(adjustedTimestamp);
          }
        }
      }
    });
  }, [currentSessionStartTime, onTimeUpdate, playerInitialized, selectedSession, videoDuration]);

  // Update video source when session changes
  useEffect(() => {
    if (!playerRef.current || !selectedSession) return;

    const timestamp = selectedSession.startTime;
    setCurrentSessionStartTime(timestamp);
    setVideoDuration(null); // Reset video duration when changing sessions

    const recordingStorageLocation = window.bridgeApi.userDataDirectoryCheckResult.recordingsDir.path;
    const focusSessionRecordingsDir = `${recordingStorageLocation}/${timestamp}`;

    // Use the playlist file instead of individual segments
    const playlistUrl = `${focusSessionRecordingsDir}/${timestamp}.m3u8`;

    console.log('Loading video source:', playlistUrl);

    // Update video source with the playlist
    playerRef.current.src({
      src: playlistUrl,
      type: 'application/x-mpegURL', // This is the MIME type for HLS playlists
    });

    // Ensure player is ready
    playerRef.current.ready(() => {
      console.log('Player ready with new source');
    });
  }, [selectedSession]);

  return (
    <div className="relative aspect-video w-full">
      <div data-vjs-player className="h-full max-h-full w-full">
        <video ref={videoRef} className="video-js vjs-big-play-centered">
          <p className="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a web browser that supports HTML5
            video
          </p>
        </video>
      </div>
    </div>
  );
});
