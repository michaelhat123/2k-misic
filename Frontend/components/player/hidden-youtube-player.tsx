'use client';

import React, { useEffect, useRef, useState } from 'react';

// YouTube Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface HiddenYouTubePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  reloadTrigger: number;
  onReady?: (player: any) => void;
  onStateChange?: (event: any) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

export const HiddenYouTubePlayer: React.FC<HiddenYouTubePlayerProps> = ({
  videoId,
  isPlaying,
  currentTime,
  volume,
  reloadTrigger,
  onReady,
  onStateChange,
  onProgress,
  onEnd,
  onError
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [apiReady, setApiReady] = useState(false);

  // Load YouTube IFrame Player API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    // Load YouTube API script
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);

    // Set up callback for when API is ready
    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  // Create YouTube player when API is ready and we have a video ID
  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current || player) return;

    const playerInstance = new window.YT.Player(containerRef.current, {
      width: '1',
      height: '1', 
      videoId: videoId,
      playerVars: {
        autoplay: 1, // Enable autoplay
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        loop: 0,
        cc_load_policy: 0,
        start: 0,
        enablejsapi: 1, // Enable JavaScript API
      },
      events: {
        onReady: (event: any) => {
          const player = event.target;
          
          // Force play to handle autoplay restrictions
          try {
            player.playVideo();
          } catch (error) {
            // Silent fail
          }
          
          onReady?.(player);
        },
        onError: (event: any) => {
          // Handle YouTube playback errors
          const errorCode = event.data;
          
          // Error 150: Video cannot be played in embedded players
          if (errorCode === 150 || errorCode === 101) {
            onError?.("This song can't be played");
          }
        },
        onStateChange: (event: any) => {
          onStateChange?.(event);
          
          // Handle different states more reliably
          if (event.data === 0) { // Ended
            // Let the progress tracker handle the end to avoid double calls
          } else if (event.data === 1) { // Playing
            // Playing
          } else if (event.data === 2) { // Paused
            // Paused
          }
        },
      },
    });

    setPlayer(playerInstance);
    playerRef.current = playerInstance;

  }, [apiReady, videoId, onReady, onStateChange, onEnd, player]);

  // Update video when videoId OR reloadTrigger changes
  useEffect(() => {
    if (!player || !videoId) {
      return;
    }
    
    try {
      // 🚀 FORCE VIDEO LOAD - Essential for cached videos and repeats!
      if (typeof player.loadVideoById === 'function') {
        player.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
          suggestedQuality: 'default'
        });
      } else {

        return;
      }
      
      // 🚀 AGGRESSIVE AUTO-PLAY for cached videos and repeats
      setTimeout(() => {
        try {
          const currentState = player.getPlayerState?.() || -1;
          
          player.playVideo();
        } catch (playError) {
          // Silent fail
        }
      }, 800); // Longer delay to ensure video is fully loaded
      
    } catch (error) {
      // Silent fail
    }
  }, [player, videoId, reloadTrigger]); // 🚀 CRITICAL: Added reloadTrigger to dependencies!

  // Progress tracking with better precision
  useEffect(() => {
    if (!player || !onProgress) return;

    const interval = setInterval(() => {
      try {
        const current = player.getCurrentTime();
        const videoDuration = player.getDuration();
        
        // Don't handle end here - let YouTube's proper end event handle it
        // This prevents double end calls and restart issues
        
        onProgress(current, videoDuration);
      } catch (error) {
        // Silent fail
      }
    }, 250); // More frequent updates for better precision

    return () => clearInterval(interval);
  }, [player, onProgress, onEnd]);

  // DISABLED: Control effect conflicts with player-provider's direct YouTube control
  // The player-provider now handles play/pause directly via togglePlay()
  // This effect was causing race conditions and feedback loops
  
  // Control effect disabled to prevent conflicts

  // Seek to specific time
  useEffect(() => {
    if (!player || currentTime < 0) return;

    try {
      const currentPlayerTime = player.getCurrentTime();
      const timeDiff = Math.abs(currentPlayerTime - currentTime);
      
      // Only seek if there's a significant difference (avoid infinite loops)
      if (timeDiff > 2) {
        player.seekTo(currentTime, true);
      }
    } catch (error) {
      // Silent fail
    }
  }, [player, currentTime]);

  // Don't render if no video ID
  if (!videoId) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 pointer-events-none opacity-0 z-[-1]"
      style={{ width: '1px', height: '1px', overflow: 'hidden' }}
    >
      <div 
        ref={containerRef}
        className="hidden-youtube-player"
        style={{ width: '1px', height: '1px' }}
      />
    </div>
  );
};

export default HiddenYouTubePlayer;
