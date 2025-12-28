import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  Upload, 
  LayoutDashboard, 
  Wand2, 
  ChevronRight, 
  Settings,
  HelpCircle,
  FileVideo,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  Search,
  Music2,
  Eye,
  Heart,
  MessageCircle,
  Aperture,
  StopCircle,
  Globe,
  ScanEye,
  Moon,
  Sun,
  Flag,
  History as HistoryIcon,
  Map as MapIcon
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from './components/BrandIcons';
import { AnalysisState, AppView, EngagementMetrics, HistoryItem, StylePassport } from './types';
import { GeminiService } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { ScriptGenerator } from './components/ScriptGenerator';
import { UniversalPlayer } from './components/UniversalPlayer';
import { History } from './components/History';
import { SuggestionMap } from './components/SuggestionMap';

const gemini = new GeminiService();

type Theme = 'dark' | 'light' | 'chechen';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('upload');
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Platform Selection State
  const [selectedPlatform, setSelectedPlatform] = useState<'youtube' | 'tiktok' | 'instagram'>('instagram');
  
  // Analysis Method State
  const [analysisMethod, setAnalysisMethod] = useState<'vision' | 'search'>('vision');

  // Inputs State
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    views: 0,
    likes: 0,
    comments: 0
  });

  const [analysis, setAnalysis] = useState<AnalysisState>({
    isAnalyzing: false,
    passport: null,
    videoUrl: null,
    error: null,
  });

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('analysis_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('analysis_history', JSON.stringify(history));
  }, [history]);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  // Ref for the player container to crop the stream
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived state for layout
  const isYouTubeShorts = videoUrlInput.toLowerCase().includes('/shorts/');

  // Apply Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handlePlatformChange = (platform: 'youtube' | 'tiktok' | 'instagram') => {
    setSelectedPlatform(platform);
    // Clear inputs when switching platform context to prevent confusion
    setVideoUrlInput('');
    setAnalysis(prev => ({ ...prev, videoUrl: null, error: null }));
  };

  const addToHistory = (passport: StylePassport, url: string | null, platform: string) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      passport,
      videoUrl: url,
      platform: platform
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
  };

  const processVideoData = async (base64: string, type: string, url: string) => {
    setAnalysis(prev => ({ ...prev, isAnalyzing: true, error: null, videoUrl: url }));
    try {
      // Pass existing metrics to the analysis
      const result = await gemini.analyzeVideo(base64, type, metrics);
      setAnalysis(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        passport: result 
      }));
      addToHistory(result, url.startsWith('blob:') ? null : url, selectedPlatform); // Don't save blob URLs permanently
      setView('dashboard');
    } catch (err) {
      setAnalysis(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err instanceof Error ? err.message : "Анализ не удался" 
      }));
    }
  };

  const processSearchAnalysis = async () => {
    if (!videoUrlInput) return;
    setAnalysis(prev => ({ ...prev, isAnalyzing: true, error: null, videoUrl: videoUrlInput }));
    try {
      const result = await gemini.analyzeViaSearch(videoUrlInput, selectedPlatform);
      setAnalysis(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        passport: result 
      }));
      addToHistory(result, videoUrlInput, selectedPlatform);
      setView('dashboard');
    } catch (err) {
      setAnalysis(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err instanceof Error ? err.message : "Поиск не дал результатов" 
      }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const videoUrl = URL.createObjectURL(file);
      await processVideoData(base64, file.type, videoUrl);
    };
    reader.readAsDataURL(file);
  };

  const startScreenCapture = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
         throw new Error("Ваш браузер не поддерживает захват экрана.");
      }

      recordedChunksRef.current = [];
      
      // OPTIMIZATION: Limit frameRate and resolution to prevent lag
      // Downgraded to 720p (1280x720) to significantly reduce CPU load and twitching
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
            width: { ideal: 1280, max: 1280 },
            height: { ideal: 720, max: 720 },
            frameRate: { ideal: 24, max: 30 } 
        },
        audio: true,
        // @ts-ignore
        preferCurrentTab: true,
        selfBrowserSurface: "include" 
      });

      const [track] = stream.getVideoTracks();
      if (playerContainerRef.current && 'CropTarget' in window && (track as any).cropTo) {
          try {
            // @ts-ignore
            const cropTarget = await window.CropTarget.fromElement(playerContainerRef.current);
            // @ts-ignore
            await track.cropTo(cropTarget);
          } catch (e) {
            console.warn("Region capture failed", e);
          }
      }

      // Optimize codec selection for performance
      let mimeType = 'video/webm';
      const types = [
          'video/webm; codecs=h264', // Hardware accelerated usually
          'video/webm; codecs=vp9',  // Better compression
          'video/webm; codecs=vp8',
          'video/mp4'
      ];
      
      for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) {
              mimeType = type;
              break;
          }
      }

      const mediaRecorder = new MediaRecorder(stream, { 
          mimeType,
          videoBitsPerSecond: 1000000 // Limit bitrate ~1Mbps (Reduced from 2.5)
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          stream.getTracks().forEach(track => track.stop());
          processVideoData(base64, mimeType, videoUrl);
        };
      };

      mediaRecorder.start(1000); // Slice chunks every second
      setIsRecording(true);

    } catch (err) {
      console.error("Error starting capture:", err);
      let errorMessage = "Не удалось начать захват.";
      if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
              errorMessage = "Доступ к экрану запрещен. Пожалуйста, разрешите доступ в браузере.";
          } else if (err.name === 'NotFoundError') {
              errorMessage = "Не найдено устройство для записи.";
          }
      }
      setAnalysis(prev => ({...prev, error: errorMessage}));
    }
  };

  const stopScreenCapture = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex h-screen text-[var(--text-main)] overflow-hidden transition-colors duration-500">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border)] flex flex-row bg-[var(--bg-sidebar)] z-20 shadow-xl relative transition-all duration-500">
        
        {/* Ornamental Strip (Only visible in Chechen Theme via CSS var opacity) */}
        <div className="w-[30px] h-full chechen-pattern border-r border-yellow-500/50 flex-shrink-0 transition-opacity duration-500" style={{ opacity: 'var(--pattern-opacity)' }}></div>

        <div className="flex-1 flex flex-col h-full">
            {/* Branding Section */}
            <div className="p-6 flex items-center gap-3 transition-all duration-300">
                {/* Dynamic Logo Container */}
                <div className={`
                    relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0
                    border-2 transition-all duration-500 shadow-lg flex items-center justify-center
                    ${theme === 'chechen' ? 'border-[#FFD700] shadow-yellow-500/20 bg-[#00733E]' : ''}
                    ${theme === 'light' ? 'border-black shadow-black/20 bg-white' : ''}
                    ${theme === 'dark' ? 'border-white shadow-white/20 bg-black' : ''}
                `}>
                    <img 
                      src={theme === 'chechen' 
                        ? "https://cdn1.ozone.ru/s3/multimedia-u/6369251886.jpg" // Герб Чечни
                        : "https://sun9-38.vkuserphoto.ru/s/v1/ig2/faSaElRNSizCT1dO7N-1U9w4Ytw1SlbwjbQlvBryOOD4I64jbMKtmrEfSQArb5pjOSelDIMurTNFSuYE19b3S3Fm.jpg?quality=95&as=32x35,48x53,72x79,108x119,160x176,240x263,360x395,480x527,540x593,640x702,720x790,1080x1185,1280x1405,1440x1580,1458x1600&from=bu&u=mQ7PLcA5Ls0FAdpK_70J8GiCeCywOZOBRwt_Fp2c3dw&cs=1080x0" // Абстрактный GINSU логотип
                      }
                      alt="Logo"
                      className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
                      onError={(e) => {
                          // Fallback
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML = '<svg class="w-6 h-6 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
                          }
                      }}
                    />
                </div>
                
                {/* Dynamic App Name */}
                <span className={`font-bold text-xl tracking-tight transition-colors duration-500 ${theme === 'chechen' ? 'text-[#FFD700]' : 'text-[var(--text-main)]'}`}>
                    {theme === 'chechen' ? 'NOHCHI-AI' : 'GINSU'}
                </span>
            </div>

            <nav className="flex-1 px-0.5 py-6 space-y-2">
            <SidebarItem 
                icon={<Upload className="w-5 h-5" />} 
                label="Загрузка и Анализ" 
                active={view === 'upload'} 
                onClick={() => setView('upload')}
                theme={theme}
            />
            <SidebarItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label="Дашборд Удержания" 
                active={view === 'dashboard'} 
                disabled={!analysis.passport}
                onClick={() => setView('dashboard')}
                theme={theme}
            />
            <SidebarItem 
                icon={<Wand2 className="w-5 h-5" />} 
                label="Генератор Сценариев" 
                active={view === 'generate'} 
                disabled={!analysis.passport}
                onClick={() => setView('generate')}
                theme={theme}
            />
            <SidebarItem 
                icon={<HistoryIcon className="w-5 h-5" />} 
                label="История и Сравнение" 
                active={view === 'history'} 
                onClick={() => setView('history')}
                theme={theme}
            />
             <SidebarItem 
                icon={<MapIcon className="w-5 h-5" />} 
                label="Карта Предложений" 
                active={view === 'roadmap'} 
                onClick={() => setView('roadmap')}
                theme={theme}
            />
            </nav>

            <div className="border-t border-[var(--border)]"></div>

            <div className="p-4 space-y-2">
            <SidebarItem icon={<Settings className="w-5 h-5" />} label="Настройки" theme={theme} />
            <SidebarItem icon={<HelpCircle className="w-5 h-5" />} label="Поддержка" theme={theme} />
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto">
        <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-8 bg-[var(--bg-main)]/50 backdrop-blur-md sticky top-0 z-10 transition-colors duration-500">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span className={theme === 'chechen' ? 'text-[var(--text-main)]' : ''}>Лаборатория</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--text-main)] font-medium">
              {view === 'upload' ? 'Загрузка' : 
               view === 'dashboard' ? 'Аналитика' : 
               view === 'generate' ? 'Генерация' : 
               view === 'history' ? 'История' : 'Карта'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Theme Switcher */}
            <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1.5 rounded-full border border-[var(--border)]">
                <button 
                    onClick={() => setTheme('light')}
                    className={`w-4 h-4 rounded-full bg-gray-100 border border-gray-300 transition-transform hover:scale-110 ${theme === 'light' ? 'ring-2 ring-blue-500 scale-110' : ''}`}
                    title="Светлая тема"
                />
                <button 
                    onClick={() => setTheme('dark')}
                    className={`w-4 h-4 rounded-full bg-gray-900 border border-gray-700 transition-transform hover:scale-110 ${theme === 'dark' ? 'ring-2 ring-blue-500 scale-110' : ''}`}
                    title="Темная тема"
                />
                <button 
                    onClick={() => setTheme('chechen')}
                    className={`w-4 h-4 rounded-full bg-gradient-to-b from-[#00733E] via-white to-[#E3001B] border border-yellow-500 transition-transform hover:scale-110 ${theme === 'chechen' ? 'ring-2 ring-yellow-400 scale-110' : ''}`}
                    title="Чеченская тема"
                />
            </div>

            <div className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border)] uppercase tracking-widest">
              API: <span className="text-green-500">ГОТОВ</span>
            </div>
            <div className={`w-8 h-8 rounded-full shadow-lg ${theme === 'chechen' ? 'bg-[#00733E] border-2 border-[#FFD700]' : 'bg-gradient-to-tr from-[var(--accent)] to-purple-500'}`} />
          </div>
        </header>

        <div className="p-8">
          {view === 'upload' && (
            <div className="max-w-5xl mx-auto space-y-8 py-8">
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text-main)] drop-shadow-sm">
                  Анализ Виральности
                </h1>
                <p className="text-[var(--text-muted)]">
                  Вставьте ссылку, запустите плеер и выберите метод анализа.
                </p>
              </div>

              {/* Main Analysis Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl space-y-8 relative overflow-hidden transition-all duration-500">
                {analysis.isAnalyzing && !isRecording && (
                   <div className="absolute inset-0 z-50 bg-[var(--bg-main)]/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                      <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin" />
                      <div className="text-center">
                        <p className="text-[var(--text-main)] font-bold text-lg">Обработка Данных...</p>
                        <p className="text-[var(--text-muted)] text-sm">AI анализирует контент и метрики</p>
                      </div>
                   </div>
                )}

                {/* Top Section: Platform & URL */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     {/* Platform Tabs */}
                    <div className="grid grid-cols-3 gap-2 p-1 bg-[var(--bg-input)] rounded-2xl border border-[var(--border)]">
                      <button 
                        onClick={() => handlePlatformChange('instagram')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${selectedPlatform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'}`}
                      >
                        <InstagramIcon className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Insta</span>
                      </button>
                      <button 
                        onClick={() => handlePlatformChange('tiktok')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${selectedPlatform === 'tiktok' ? 'bg-[#00f2ea] text-black font-bold shadow-lg shadow-[#00f2ea]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'}`}
                      >
                        <Music2 className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">TikTok</span>
                      </button>
                      <button 
                        onClick={() => handlePlatformChange('youtube')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${selectedPlatform === 'youtube' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'}`}
                      >
                        <YoutubeIcon className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">YouTube</span>
                      </button>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-muted)] uppercase ml-2">Ссылка на видео</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input 
                          type="url" 
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder={`Вставьте ссылку...`}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                        />
                      </div>
                    </div>

                    {/* Metrics Inputs */}
                    <div className="grid grid-cols-3 gap-3">
                       <div className="bg-[var(--bg-input)] p-3 rounded-2xl border border-[var(--border)] space-y-1">
                          <div className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Eye className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">View</span>
                          </div>
                          <input 
                            type="number" 
                            value={metrics.views || ''}
                            onChange={(e) => setMetrics(prev => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                            placeholder="0 (Auto)"
                            className="w-full bg-transparent border-none p-0 text-lg font-bold text-[var(--text-main)] focus:ring-0 placeholder:text-[var(--text-muted)]"
                          />
                       </div>
                       <div className="bg-[var(--bg-input)] p-3 rounded-2xl border border-[var(--border)] space-y-1">
                          <div className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Heart className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">Like</span>
                          </div>
                          <input 
                            type="number" 
                            value={metrics.likes || ''}
                            onChange={(e) => setMetrics(prev => ({ ...prev, likes: parseInt(e.target.value) || 0 }))}
                            placeholder="0 (Auto)"
                            className="w-full bg-transparent border-none p-0 text-lg font-bold text-[var(--text-main)] focus:ring-0 placeholder:text-[var(--text-muted)]"
                          />
                       </div>
                       <div className="bg-[var(--bg-input)] p-3 rounded-2xl border border-[var(--border)] space-y-1">
                          <div className="flex items-center gap-1 text-[var(--text-muted)]">
                            <MessageCircle className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">Comm</span>
                          </div>
                          <input 
                            type="number" 
                            value={metrics.comments || ''}
                            onChange={(e) => setMetrics(prev => ({ ...prev, comments: parseInt(e.target.value) || 0 }))}
                            placeholder="0 (Auto)"
                            className="w-full bg-transparent border-none p-0 text-lg font-bold text-[var(--text-main)] focus:ring-0 placeholder:text-[var(--text-muted)]"
                          />
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="text-sm font-bold text-[var(--text-muted)] flex items-center gap-2">
                              <Aperture className="w-4 h-4" />
                              Метод анализа
                           </h3>
                           
                           {/* Method Toggle */}
                           <div className="flex bg-[var(--bg-input)] p-1 rounded-lg border border-[var(--border)]">
                             <button
                               onClick={() => setAnalysisMethod('vision')}
                               className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${analysisMethod === 'vision' ? 'bg-[var(--accent)] text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                             >
                               AI Vision (Экран)
                             </button>
                             <button
                               onClick={() => setAnalysisMethod('search')}
                               className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${analysisMethod === 'search' ? 'bg-purple-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                             >
                               Web Search (Ссылка)
                             </button>
                           </div>
                        </div>

                        <div className="flex flex-col gap-3">
                           {/* Dynamic Action Button based on Method */}
                           {analysisMethod === 'vision' ? (
                               !isRecording ? (
                                <button 
                                  onClick={startScreenCapture}
                                  disabled={!videoUrlInput.trim()}
                                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-500/20 flex items-center justify-between px-6 group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                      <ScanEye className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                      <div className="text-base">Запустить AI Захват</div>
                                      <div className="text-[10px] opacity-70 font-normal">
                                        Выберите "Эту вкладку" во всплывающем окне
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                                </button>
                               ) : (
                                 <button 
                                  onClick={stopScreenCapture}
                                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-3"
                                >
                                  <StopCircle className="w-6 h-6" />
                                  Остановить запись и Анализировать
                                </button>
                               )
                           ) : (
                                <button 
                                  onClick={processSearchAnalysis}
                                  disabled={!videoUrlInput.trim()}
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-purple-500/20 flex items-center justify-between px-6 group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                      <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                      <div className="text-base">Анализировать через Search</div>
                                      <div className="text-[10px] opacity-70 font-normal">
                                        Поиск метрик и транскрипции в сети
                                      </div>
                                    </div>
                                  </div>
                                  <Search className="w-5 h-5 opacity-50 group-hover:scale-110 transition-transform" />
                                </button>
                           )}

                           {/* File Upload Alternative */}
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="w-full bg-[var(--bg-input)] hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] py-3 rounded-2xl font-medium text-sm transition-all border border-[var(--border)] flex items-center justify-center gap-2"
                           >
                             <FileVideo className="w-4 h-4" />
                             Или загрузить файл с устройства
                           </button>
                           <input 
                              type="file" 
                              className="hidden" 
                              ref={fileInputRef} 
                              accept="video/*" 
                              onChange={handleFileUpload}
                            />
                        </div>
                    </div>

                  </div>

                  {/* Right: Player Preview */}
                  <div 
                    ref={playerContainerRef}
                    className={`bg-black rounded-3xl overflow-hidden border border-[var(--border)] relative group transition-all duration-500 ease-in-out flex items-center justify-center shadow-inner ${
                      !videoUrlInput ? 'h-[500px]' : 
                      (selectedPlatform === 'youtube' && !isYouTubeShorts) 
                        ? 'aspect-video w-full' 
                        : 'aspect-[9/16] max-h-[700px] w-full'
                    }`}
                  >
                    {videoUrlInput ? (
                       <UniversalPlayer url={videoUrlInput} />
                    ) : (
                       <div className="text-center p-8 opacity-50">
                          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                          <p className="text-gray-500">Плеер готов к работе</p>
                       </div>
                    )}
                    
                    {/* Recording Overlay - REMOVED animate-pulse */}
                    {isRecording && (
                       <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 z-50 shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full" />
                          REC
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {analysis.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 animate-in slide-in-from-bottom-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{analysis.error}</p>
                </div>
              )}
            </div>
          )}

          {view === 'dashboard' && analysis.passport && (
            <Dashboard 
              passport={analysis.passport} 
              videoUrl={analysis.videoUrl} 
            />
          )}

          {view === 'generate' && analysis.passport && (
            <ScriptGenerator 
              passport={analysis.passport} 
              gemini={gemini} 
            />
          )}

          {view === 'history' && (
             <History 
               history={history} 
               gemini={gemini} 
               onDelete={(id) => setHistory(prev => prev.filter(i => i.id !== id))}
               onSelect={(item) => {
                 setAnalysis({ 
                   isAnalyzing: false, 
                   passport: item.passport, 
                   videoUrl: item.videoUrl, 
                   error: null 
                 });
                 setView('dashboard');
               }}
             />
          )}
          
          {view === 'roadmap' && (
             <SuggestionMap gemini={gemini} history={history} />
          )}
        </div>
      </main>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  theme?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, disabled, onClick, theme }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? (theme === 'chechen' ? 'bg-[#00733E] border border-[#FFD700] shadow-lg' : 'bg-[var(--accent)] text-white font-medium shadow-lg') 
        : disabled
          ? 'text-[var(--text-muted)] cursor-not-allowed opacity-40'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
    }`}
  >
    <span className={`${active ? (theme === 'chechen' ? 'text-[#FFD700]' : 'text-white') : 'text-[var(--text-muted)] group-hover:text-[var(--accent)]'} transition-colors`}>
      {icon}
    </span>
    <span className={`text-sm whitespace-nowrap ${active && theme === 'chechen' ? 'text-[#FFD700] font-bold' : ''}`}>{label}</span>
  </button>
);

export default App;