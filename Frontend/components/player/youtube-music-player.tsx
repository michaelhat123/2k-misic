'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TrackStreamData, getTrackStream, PlayTrackRequest } from '@/lib/api/youtube-music';

interface YouTubeMusicPlayerProps {
  track: PlayTrackRequest | null;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onTrackEnd: () => void;
  onError: (error: string) => void;
  volume: number;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
}

export default function YouTubeMusicPlayer({
  track,
  isPlaying,
  onPlayStateChange,
  onTrackEnd,
  onError,
  volume,
  onLoadStart,
  onLoadComplete
}: YouTubeMusicPlayerProps) {
  const [streamData, setStreamData] = useState<TrackStreamData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load stream data when track changes
  useEffect(() => {
    if (!track) {
      setStreamData(null);
      setError(null);
      return;
    }

    const loadStreamData = async () => {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();

      try {
        const data = await getTrackStream(track);
        if (data) {
          setStreamData(data);
        } else {
          setError('Could not find stream for this track');
          onError('Could not find stream for this track');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load track';
        setError(errorMessage);
        onError(errorMessage);
      } finally {
        setIsLoading(false);
        onLoadComplete?.();
      }
    };

    loadStreamData();
  }, [track, onError, onLoadStart, onLoadComplete]);

  // Handle play/pause changes
  useEffect(() => {
    if (!streamData || !iframeRef.current) return;

    // Since we can't directly control YouTube Music embedded players,
    // we'll use the iframe for display but rely on HTML5 audio for basic controls
    // This is a limitation - for full control, you'd need YouTube's official APIs
    
    if (isPlaying) {
      // Try to play if it's an actual audio stream
      if (audioRef.current && streamData.streamUrl.includes('audio')) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, streamData]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleAudioEnd = () => {
    onTrackEnd();
  };

  const handleAudioError = () => {
    setError('Audio playback failed');
    onError('Audio playback failed');
  };

  const handleAudioPlay = () => {
    onPlayStateChange(true);
  };

  const handleAudioPause = () => {
    onPlayStateChange(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-400">Loading track...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!streamData) {
    return null;
  }

  return (
    <div className="youtube-music-player">
      {/* Hidden audio element for basic controls if we have a direct stream */}
      {streamData.streamUrl.includes('audio') && (
        <audio
          ref={audioRef}
          src={streamData.streamUrl}
          onEnded={handleAudioEnd}
          onError={handleAudioError}
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          preload="metadata"
          className="hidden"
        />
      )}

      {/* YouTube Music iframe for visual display */}
      <iframe
        ref={iframeRef}
        src={streamData.streamUrl}
        width="100%"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-lg"
        title={`${streamData.artist} - ${streamData.title}`}
        style={{ display: streamData.streamUrl.includes('youtube.com') ? 'block' : 'none' }}
      />

      {/* Fallback message for YouTube Music links */}
      {streamData.streamUrl.includes('youtube.com') && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          Playing from YouTube Music - Use controls above for full functionality
        </div>
      )}
    </div>
  );
}
