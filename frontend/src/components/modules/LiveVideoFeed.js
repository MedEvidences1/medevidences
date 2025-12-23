/**
 * Live Video Feed Component for Plutus Predict
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Video } from 'lucide-react';
import { Badge } from '../ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LiveVideoFeed = ({ disasterType, location }) => {
  const [videoData, setVideoData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  
  useEffect(() => {
    const loadVideoFeed = async () => {
      try {
        setError(null);
        const res = await axios.get(`${API}/disasters/video-feed`, {
          params: { disaster_type: disasterType, location }
        });
        if (res.data.video_url) {
          setVideoData(res.data);
        }
      } catch (e) {
        console.log("No video feed available", e);
        setError("No live feed available");
      }
    };
    
    if (disasterType && location) {
      loadVideoFeed();
    }
  }, [disasterType, location]);
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  if (error) {
    return (
      <div className="bg-[#0A0A0A] rounded-lg border border-[#1F1F1F] p-4 flex items-center justify-center h-48">
        <div className="text-center text-[#888]">
          <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!videoData) {
    return (
      <div className="bg-[#0A0A0A] rounded-lg border border-[#1F1F1F] p-4 flex items-center justify-center h-48 animate-pulse">
        <div className="text-[#888]">Loading live feed...</div>
      </div>
    );
  }
  
  return (
    <div className="relative rounded-lg overflow-hidden border border-[#1F1F1F]">
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <Badge className="bg-[#FF3333] text-white animate-pulse">● LIVE</Badge>
        <Badge className="bg-[#0A0A0A]/80 text-white border border-[#1F1F1F]">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {disasterType?.toUpperCase()}
        </Badge>
      </div>
      
      <video
        ref={videoRef}
        src={videoData.video_url}
        className="w-full h-48 object-cover"
        muted={isMuted}
        loop
        playsInline
        poster={videoData.thumbnail_url}
        onClick={togglePlay}
      />
      
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={togglePlay}
            className="p-2 bg-[#0A0A0A]/80 rounded hover:bg-[#1F1F1F]"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button 
            onClick={toggleMute}
            className="p-2 bg-[#0A0A0A]/80 rounded hover:bg-[#1F1F1F]"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-xs text-white bg-[#0A0A0A]/80 px-2 py-1 rounded">
          {location}
        </div>
      </div>
    </div>
  );
};

export default LiveVideoFeed;
