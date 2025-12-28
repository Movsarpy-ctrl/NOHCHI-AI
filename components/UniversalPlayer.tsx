import React, { useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

interface UniversalPlayerProps {
  url: string | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

declare global {
  interface Window {
    instgrm?: any;
    tiktokEmbedLoad?: any;
  }
}

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({ url, videoRef }) => {
  // Enhanced URL cleaning logic
  const getCleanUrl = (inputUrl: string | null) => {
    if (!inputUrl) return '';
    let cleaned = inputUrl.trim();
    
    // For Instagram/TikTok, strip query parameters to avoid embed errors
    if (cleaned.includes('instagram.com') || cleaned.includes('tiktok.com')) {
       cleaned = cleaned.split('?')[0];
    }
    
    // Instagram embeds often work better WITH a trailing slash
    if (cleaned.includes('instagram.com') && !cleaned.endsWith('/')) {
        cleaned += '/';
    } else if (!cleaned.includes('instagram.com')) {
        // For others, strip trailing slash to be safe (legacy logic)
        cleaned = cleaned.replace(/\/$/, '');
    }
    
    return cleaned;
  };

  const cleanUrl = getCleanUrl(url);

  useEffect(() => {
    if (!cleanUrl) return;

    let isMounted = true;

    const triggerInstgrm = () => {
        if (window.instgrm) {
            window.instgrm.Embeds.process();
        }
    };

    const initEmbeds = async () => {
      // Instagram
      if (cleanUrl.includes('instagram.com')) {
        if (!window.instgrm) {
          const script = document.createElement('script');
          script.src = '//www.instagram.com/embed.js';
          script.async = true;
          script.id = 'instagram-embed-script';
          script.onload = () => {
             if(isMounted) triggerInstgrm();
          };
          document.body.appendChild(script);
        } else {
          // Script exists, trigger process immediately
          triggerInstgrm();
        }
        
        // Safety triggers for React rendering race conditions
        setTimeout(() => { if (isMounted) triggerInstgrm(); }, 500);
        setTimeout(() => { if (isMounted) triggerInstgrm(); }, 1500);
      }

      // TikTok
      if (cleanUrl.includes('tiktok.com')) {
         if (!window.tiktokEmbedLoad) {
            const script = document.createElement('script');
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            script.id = 'tiktok-embed-script';
            script.onload = () => {
                if(isMounted && window.tiktokEmbedLoad) window.tiktokEmbedLoad();
            };
            document.body.appendChild(script);
         } else {
             setTimeout(() => {
                 if(isMounted && window.tiktokEmbedLoad) window.tiktokEmbedLoad();
             }, 100);
         }
      }
    };

    initEmbeds();

    return () => { isMounted = false; };
  }, [cleanUrl]);

  if (!cleanUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] space-y-3">
        <AlertCircle className="w-8 h-8 text-gray-600" />
        <p className="text-gray-500 italic text-sm">Предпросмотр недоступен</p>
      </div>
    );
  }

  // Helper function for YouTube ID
  const getYouTubeId = (link: string) => {
    try {
        const urlObj = new URL(link.startsWith('http') ? link : `https://${link}`);
        const path = urlObj.pathname;
        const search = urlObj.searchParams;

        // 1. Shorts
        if (path.includes('/shorts/')) {
            return path.split('/shorts/')[1].split(/[?&/]/)[0];
        }
        
        // 2. Standard Watch
        if (search.has('v')) {
            return search.get('v');
        }

        // 3. Short URL (youtu.be)
        if (urlObj.hostname.includes('youtu.be')) {
            return path.slice(1).split(/[?&/]/)[0];
        }

        // 4. Embed
        if (path.includes('/embed/')) {
            return path.split('/embed/')[1].split(/[?&/]/)[0];
        }
        
        // 5. Live
        if (path.includes('/live/')) {
             return path.split('/live/')[1].split(/[?&/]/)[0];
        }

    } catch (e) {
       // fallback
    }
    
    // Fallback Regex
    const match = link.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // --- YouTube Logic ---
  if (cleanUrl.toLowerCase().includes('youtube.com') || cleanUrl.toLowerCase().includes('youtu.be')) {
    const videoId = getYouTubeId(cleanUrl);

    if (videoId) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return (
        <div className="w-full h-full bg-black rounded-xl overflow-hidden relative">
            <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&playsinline=1&origin=${origin}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            />
        </div>
      );
    } else {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black rounded-xl border border-gray-800">
                <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                <p className="text-gray-400 text-xs">Неверная ссылка YouTube</p>
            </div>
        );
    }
  }

  // --- Instagram Logic ---
  if (cleanUrl.includes('instagram.com')) {
    return (
      <div className="w-full h-full overflow-y-auto bg-black rounded-xl flex items-center justify-center p-4">
        <div className="bg-white rounded max-w-[540px] w-full min-h-[300px] flex items-center justify-center">
            <blockquote
            className="instagram-media"
            data-instgrm-permalink={cleanUrl}
            data-instgrm-version="14"
            style={{
                background: '#FFF',
                border: '0',
                borderRadius: '3px',
                boxShadow: 'none',
                margin: '1px',
                maxWidth: '540px',
                minWidth: '326px',
                padding: '0',
                width: 'calc(100% - 2px)',
            }}
            >
            <div className="flex items-center justify-center h-40 w-full">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
            </blockquote>
        </div>
      </div>
    );
  }

  // --- TikTok Logic ---
  if (cleanUrl.includes('tiktok.com')) {
    const parts = cleanUrl.split('/');
    // Some basic ID extraction fallback
    const videoId = parts[parts.length - 1].split('?')[0] || 'tiktok-video';
    
    return (
      <div className="w-full h-full overflow-y-auto bg-black rounded-xl flex items-center justify-center p-4">
        <blockquote
          className="tiktok-embed"
          cite={cleanUrl}
          data-video-id={videoId}
          style={{ maxWidth: '605px', minWidth: '325px' }}
        >
          <section>
            <a target="_blank" href={cleanUrl} rel="noreferrer" className="text-blue-500 hover:underline">
              {cleanUrl}
            </a>
          </section>
        </blockquote>
      </div>
    );
  }

  // --- Native Video Logic (File Uploads) ---
  return (
    <video
      ref={videoRef as React.RefObject<HTMLVideoElement>}
      src={cleanUrl}
      controls
      playsInline
      className="w-full h-full object-contain bg-black rounded-xl"
    />
  );
};