/**
 * Advertisement Components for Plutus Predict
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const BannerAd = ({ placement = "homepage_banner", className = "" }) => {
  const [ad, setAd] = useState(null);
  
  useEffect(() => {
    const loadAd = async () => {
      try {
        const res = await axios.get(`${API}/ads/placement/${placement}`);
        if (res.data.ads && res.data.ads.length > 0) {
          setAd(res.data.ads[0]);
        }
      } catch (e) {
        console.log("No ads available");
      }
    };
    loadAd();
  }, [placement]);
  
  const handleClick = async () => {
    if (ad) {
      await axios.post(`${API}/ads/${ad.id}/click`);
      if (ad.click_url) window.open(ad.click_url, '_blank');
    }
  };
  
  if (!ad) return null;
  
  return (
    <div className={`ad-banner ${className}`} onClick={handleClick} style={{cursor: 'pointer'}}>
      <div className="text-xs text-[#444] text-right mb-1">Advertisement</div>
      <img 
        src={ad.media_url} 
        alt={ad.title} 
        className="w-full h-auto rounded border border-[#1F1F1F]"
        onError={(e) => e.target.style.display = 'none'}
      />
    </div>
  );
};

export const VideoAd = ({ placement = "modal_interstitial", onComplete, onSkip }) => {
  const [ad, setAd] = useState(null);
  const [canSkip, setCanSkip] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    const loadAd = async () => {
      try {
        const res = await axios.get(`${API}/ads/placement/${placement}`);
        if (res.data.ads && res.data.ads.length > 0) {
          setAd(res.data.ads.find(a => a.media_type === 'video') || res.data.ads[0]);
        }
      } catch (e) {
        onComplete?.();
      }
    };
    loadAd();
  }, [placement, onComplete]);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSkip(true);
    }
  }, [countdown]);
  
  if (!ad) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative max-w-2xl w-full">
        <video 
          src={ad.media_url} 
          autoPlay 
          onEnded={onComplete}
          className="w-full rounded"
        />
        <div className="absolute top-4 right-4">
          {canSkip ? (
            <button 
              onClick={onSkip || onComplete}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded"
            >
              Skip Ad
            </button>
          ) : (
            <div className="px-4 py-2 bg-black/50 text-white rounded">
              Skip in {countdown}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default { BannerAd, VideoAd };
