import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import { IFocusSession } from '@trici/models';

interface TriciPlayerProps {
  selectedSession: IFocusSession | null;
}

export function TriciPlayer({ selectedSession }: TriciPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    if (!playerRef.current) {
      const player = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        preload: 'auto',
        aspectRatio: '16:9',
        playbackRates: [1, 2, 4, 6, 8], // Available playback speeds
        controlBar: { volumePanel: false, pictureInPictureToggle: false },
      });

      player.on('loadedmetadata', () => {
        player.playbackRate(4);
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current || !selectedSession) return;

    const timestamp = new Date(selectedSession.startTime).getTime();
    const recordingStorageLocation = window.bridgeApi.userDataDirectoryCheckResult.recordingsDir.path;
    const focusSessionRecordingsDir = `${recordingStorageLocation}/${timestamp}`;

    // Use the playlist file instead of individual segments
    const playlistUrl = `${focusSessionRecordingsDir}/${timestamp}.m3u8`;

    // Update video source with the playlist
    playerRef.current.src({
      src: playlistUrl,
      type: 'application/x-mpegURL', // This is the MIME type for HLS playlists
    });
  }, [selectedSession]);

  return (
    <div className="relative w-full">
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered">
          <p className="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a web browser that supports HTML5
            video
          </p>
        </video>
      </div>
    </div>
  );
}
