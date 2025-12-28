
import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { GeminiService } from '../services/geminiService';
import { downloadFile } from '../utils/download';
import { 
  History as HistoryIcon, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  BarChart2, 
  Loader2, 
  Eye, 
  Heart, 
  MessageCircle,
  Calendar,
  Music2,
  Download,
  FileText,
  FileJson,
  FileType
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from './BrandIcons';

interface HistoryProps {
  history: HistoryItem[];
  gemini: GeminiService;
  onDelete: (id: string) => void;
  onSelect: (item: HistoryItem) => void; // To view in dashboard
}

export const History: React.FC<HistoryProps> = ({ history, gemini, onDelete, onSelect }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 5) return prev; // Limit to 5
        return [...prev, id];
      }
    });
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setIsComparing(true);
    setComparisonResult(null);
    try {
      const itemsToCompare = history.filter(item => selectedIds.includes(item.id));
      const result = await gemini.compareVideos(itemsToCompare);
      setComparisonResult(result);
    } catch (error) {
      console.error(error);
      setComparisonResult("Ошибка при сравнении. Попробуйте еще раз.");
    } finally {
      setIsComparing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch(platform.toLowerCase()) {
      case 'youtube': return <YoutubeIcon className="w-4 h-4 text-red-500" />;
      case 'tiktok': return <Music2 className="w-4 h-4 text-[#00f2ea]" />;
      case 'instagram': return <InstagramIcon className="w-4 h-4 text-pink-500" />;
      default: return <HistoryIcon className="w-4 h-4" />;
    }
  };

  const formatCompact = (num: number) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--text-main)] flex items-center gap-3">
          <HistoryIcon className="w-8 h-8 text-[var(--text-muted)]" />
          История Анализов
        </h2>
        
        <div className="flex items-center gap-4">
           <span className="text-sm text-[var(--text-muted)]">
             Выбрано: {selectedIds.length} / 5
           </span>
           <button 
             onClick={handleCompare}
             disabled={selectedIds.length < 2 || isComparing}
             className="bg-[var(--accent)] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
           >
             {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
             Сравнить
           </button>
        </div>
      </div>

      {comparisonResult && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 shadow-2xl space-y-6 relative">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
             <h3 className="text-xl font-bold text-[var(--text-main)]">Результат Сравнения</h3>
             
             <div className="flex items-center gap-4">
                 <div className="relative">
                    <button 
                        onClick={() => setShowDownloads(!showDownloads)}
                        className="flex items-center gap-2 text-sm font-bold bg-[var(--bg-input)] hover:bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-1.5 rounded-lg border border-[var(--border)] transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Скачать
                    </button>
                    {showDownloads && (
                        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50">
                            <button 
                                onClick={() => downloadFile(comparisonResult, 'comparison_analysis', 'txt')}
                                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <FileText className="w-4 h-4" /> .TXT (Текст)
                            </button>
                            <button 
                                onClick={() => downloadFile({ text: comparisonResult }, 'comparison_analysis', 'json')}
                                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <FileJson className="w-4 h-4" /> .JSON (Данные)
                            </button>
                            <button 
                                onClick={() => downloadFile(comparisonResult, 'comparison_analysis', 'doc')}
                                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <FileType className="w-4 h-4" /> .DOC (Word)
                            </button>
                        </div>
                    )}
                 </div>
                 <button onClick={() => setComparisonResult(null)} className="text-sm text-[var(--text-muted)] hover:text-red-500">Закрыть</button>
             </div>
          </div>
          
          <div className="prose prose-invert max-w-none prose-p:text-[var(--text-muted)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {comparisonResult}
          </div>
        </div>
      )}

      {history.length === 0 ? (
         <div className="text-center py-20 bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] border-dashed">
            <HistoryIcon className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4 opacity-20" />
            <p className="text-[var(--text-muted)]">История пуста. Проанализируйте первое видео!</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const metrics = item.passport.engagement_metrics;
            const hasVideoUrl = item.videoUrl && !item.videoUrl.startsWith('blob:');

            return (
              <div 
                key={item.id} 
                className={`relative bg-[var(--bg-card)] border transition-all duration-300 rounded-2xl overflow-hidden group hover:shadow-xl
                  ${isSelected ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]'}
                `}
              >
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex items-start justify-between gap-3 bg-[var(--bg-input)]/50">
                   <div className="flex items-center gap-2">
                      <div className="p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border)]">
                        {getPlatformIcon(item.platform)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                           {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                           {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                   </div>
                   
                   <button 
                     onClick={() => toggleSelection(item.id)}
                     className={`p-2 rounded-full transition-colors ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                   >
                     {isSelected ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                   </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <div className="min-h-[60px]">
                    <h4 className="font-bold text-[var(--text-main)] line-clamp-2 leading-tight">
                      {item.passport.creator_profile_summary.split('.')[0] || "Анализ видео"}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {item.passport.style_metrics.dominant_emotion}
                    </p>
                  </div>

                  {metrics && (
                     <div className="grid grid-cols-3 gap-2 py-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border)]">
                        <div className="flex flex-col items-center justify-center p-1">
                           <Eye className="w-3 h-3 text-[var(--text-muted)] mb-1" />
                           <span className="text-xs font-bold">{formatCompact(metrics.views)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1 border-x border-[var(--border)]">
                           <Heart className="w-3 h-3 text-red-400 mb-1" />
                           <span className="text-xs font-bold">{formatCompact(metrics.likes)}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1">
                           <MessageCircle className="w-3 h-3 text-blue-400 mb-1" />
                           <span className="text-xs font-bold">{formatCompact(metrics.comments)}</span>
                        </div>
                     </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={() => onSelect(item)}
                      className="flex-1 bg-[var(--bg-input)] hover:bg-[var(--bg-main)] text-[var(--text-main)] py-2 rounded-lg text-xs font-bold transition-colors border border-[var(--border)]"
                    >
                      Открыть отчет
                    </button>
                    {hasVideoUrl && (
                      <a 
                        href={item.videoUrl!} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-[var(--bg-input)] hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-blue-500 rounded-lg border border-[var(--border)] transition-colors"
                        title="Открыть видео"
                      >
                         <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="p-2 bg-[var(--bg-input)] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 rounded-lg border border-[var(--border)] transition-colors"
                      title="Удалить из истории"
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
