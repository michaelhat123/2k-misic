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
  onEnd
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [apiReady, setApiReady] = useState(false);

  // Load YouTube IFrame Player API
  useEffect(() => {
    console.log('🚨 HIDDEN PLAYER EFFECT - Load YouTube API');
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
          console.log('🎬 YouTube player ready!');
          const player = event.target;
          
          // Force play to handle autoplay restrictions
          try {
            console.log('🎵 Attempting to play video...');
            player.playVideo();
            console.log('✅ playVideo() called successfully');
          } catch (error) {
            console.warn('⚠️ Error calling playVideo():', error);
          }
          
          onReady?.(player);
        },
        onStateChange: (event: any) => {
          onStateChange?.(event);
          
          // If video ended - DON'T destroy player instance!
          if (event.data === 0) {
            console.log('🎥 Video ended - keeping player alive for repeat');
            onEnd?.();
          }
        },
      },
    });

    setPlayer(playerInstance);
    playerRef.current = playerInstance;

  }, [apiReady, videoId, onReady, onStateChange, onEnd, player]);

  // Update video when videoId OR reloadTrigger changes
  useEffect(() => {
    console.log('🚨 VIDEO ID/RELOAD USEEFFECT TRIGGERED!');
    console.log('🚨 VIDEO EFFECT - Dependencies:', { player: !!player, videoId, reloadTrigger });
    console.log('🚨 VIDEO EFFECT - Player type:', typeof player);
    
    if (!player || !videoId) {
      console.log('❌ VIDEO EFFECT - Missing requirements:', { player: !!player, videoId: !!videoId });
      if (!player) console.log('❌ Player is null/undefined');
      if (!videoId) console.log('❌ VideoId is null/undefined/empty');
      return;
    }

    console.log('✅ VIDEO EFFECT - All requirements met!');
    console.log('📺 HIDDEN PLAYER: Loading video (trigger=' + reloadTrigger + '):', videoId);
    console.log('📺 HIDDEN PLAYER: Player state before load:', player.getPlayerState?.() || 'unknown');
    
    try {
      // 🚀 FORCE VIDEO LOAD - Essential for cached videos and repeats!
      if (typeof player.loadVideoById === 'function') {
        player.loadVideoById({
          videoId: videoId,
          startSeconds: 0,
          suggestedQuality: 'default'
        });
      } else {
        // Silently ignore if loadVideoById is not a function (suppress console error)
        return;
      }
      
      console.log('✅ HIDDEN PLAYER: Video load command sent (reload trigger: ' + reloadTrigger + ')');
      
      // 🚀 AGGRESSIVE AUTO-PLAY for cached videos and repeats
      setTimeout(() => {
        try {
          console.log('▶️ HIDDEN PLAYER: Auto-playing loaded video (trigger=' + reloadTrigger + ')...');
          const currentState = player.getPlayerState?.() || -1;
          console.log('📊 HIDDEN PLAYER: Player state before play:', currentState);
          
          player.playVideo();
          console.log('✅ HIDDEN PLAYER: Play command sent successfully (trigger=' + reloadTrigger + ')');
        } catch (playError) {
          console.error('❌ HIDDEN PLAYER: Auto-play failed:', playError);
        }
      }, 800); // Longer delay to ensure video is fully loaded
      
    } catch (error) {
      console.error('❌ HIDDEN PLAYER: Error loading video:', error);
    }
  }, [player, videoId, reloadTrigger]); // 🚀 CRITICAL: Added reloadTrigger to dependencies!

  // Progress tracking
  useEffect(() => {
    if (!player || !onProgress) return;

    const interval = setInterval(() => {
      try {
        const current = player.getCurrentTime();
        const videoDuration = player.getDuration();
        onProgress(current, videoDuration);
      } catch (error) {
        console.warn('Error getting YouTube player time:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, onProgress]);

  // DISABLED: Control effect conflicts with player-provider's direct YouTube control
  // The player-provider now handles play/pause directly via togglePlay()
  // This effect was causing race conditions and feedback loops
  
  // useEffect(() => {
  //   if (!player) return;
  //   console.log('🎮 Control effect disabled to prevent conflicts');
  // }, [player, isPlaying]);

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
      console.warn('Error seeking YouTube player:', error);
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
