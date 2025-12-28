
import React, { useRef } from 'react';
import { 
  ResponsiveContainer, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';
import { StylePassport } from '../types';
import { UniversalPlayer } from './UniversalPlayer';
import { 
  Zap, 
  TrendingUp, 
  BrainCircuit,
  Clock,
  PlayCircle,
  Fingerprint,
  Layers,
  Eye,
  Heart,
  MessageCircle,
  BarChart3
} from 'lucide-react';

interface DashboardProps {
  passport: StylePassport;
  videoUrl: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ passport, videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const jumpToTime = (timeRange: string) => {
    // Only attempt to control the video if it's a native file (ref exists)
    if (videoRef.current) {
      const [start] = timeRange.split('-').map(t => {
        const parts = t.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0];
      });
      videoRef.current.currentTime = start;
      videoRef.current.play();
    }
  };

  // Fallback data if emotional_spectrum is missing, now in Russian
  const radarData = passport.style_metrics.emotional_spectrum || [
    { label: 'Энергия', score: 70 },
    { label: 'Авторитет', score: 60 },
    { label: 'Эмпатия', score: 40 },
    { label: 'Юмор', score: 30 },
    { label: 'Напряжение', score: 50 },
  ];

  const structureCounts = passport.video_structure.reduce((acc, curr) => {
    acc[curr.segment_type] = (acc[curr.segment_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSegmentBg = (type: string) => {
    switch (type) {
      case 'Hook': return 'bg-red-500';
      case 'CTA': return 'bg-green-500';
      case 'Climax': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const isExternalVideo = !videoUrl?.startsWith('blob:');

  // Updated to Russian locale
  const formatCompact = (num: number) => new Intl.NumberFormat('ru-RU', { notation: "compact", compactDisplay: "short" }).format(num);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Popularity Metrics Section (New) */}
      {passport.engagement_metrics && (
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-3xl p-6 shadow-xl">
           <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-[var(--text-main)]">Анализ Популярности</h2>
              <div className="ml-auto flex items-center gap-2">
                 <span className="text-sm text-[var(--text-muted)]">Виральность:</span>
                 <span className="text-xl font-black text-[var(--text-main)]">{passport.engagement_metrics.virality_score || 85}/100</span>
              </div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--bg-input)] rounded-2xl p-4 flex flex-col items-center justify-center border border-[var(--border)]">
                 <Eye className="w-5 h-5 text-[var(--text-muted)] mb-1" />
                 <span className="text-2xl font-bold text-[var(--text-main)]">{formatCompact(passport.engagement_metrics.views)}</span>
                 <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Просмотры</span>
              </div>
              <div className="bg-[var(--bg-input)] rounded-2xl p-4 flex flex-col items-center justify-center border border-[var(--border)]">
                 <Heart className="w-5 h-5 text-red-400 mb-1" />
                 <span className="text-2xl font-bold text-[var(--text-main)]">{formatCompact(passport.engagement_metrics.likes)}</span>
                 <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Лайки</span>
              </div>
              <div className="bg-[var(--bg-input)] rounded-2xl p-4 flex flex-col items-center justify-center border border-[var(--border)]">
                 <MessageCircle className="w-5 h-5 text-blue-400 mb-1" />
                 <span className="text-2xl font-bold text-[var(--text-main)]">{formatCompact(passport.engagement_metrics.comments)}</span>
                 <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Комменты</span>
              </div>
              <div className="bg-[var(--bg-input)] rounded-2xl p-4 flex flex-col items-center justify-center border border-[var(--border)]">
                 <span className="text-2xl font-bold text-green-500">{passport.engagement_metrics.engagement_rate || "N/A"}</span>
                 <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Вовлеченность (ER)</span>
              </div>
           </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Zap className="w-5 h-5 text-yellow-500" />} 
          label="Скорость речи" 
          value={`${passport.style_metrics.words_per_minute} сл/мин`} 
          desc="Интенсивность подачи"
        />
        <StatCard 
          icon={<BrainCircuit className="w-5 h-5 text-purple-500" />} 
          label="Тональность" 
          value={passport.style_metrics.dominant_emotion.split(' ').slice(0, 2).join(' ')} 
          desc="Основной вайб"
        />
        <StatCard 
          icon={<TrendingUp className="w-5 h-5 text-green-500" />} 
          label="Крючок удержания" 
          value={`${passport.video_structure[0]?.time_range.split('-')[1] || '03'} сек`} 
          desc="Время до первого спада"
        />
        
        {/* Custom Structure Card */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--text-muted)] transition-all group shadow-lg flex flex-col justify-between">
           <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-[var(--bg-input)] rounded-xl group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Структура</span>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-bold text-[var(--text-main)] tracking-tight">{passport.video_structure.length}</span>
                 <span className="text-xs text-[var(--text-muted)] font-medium">блоков</span>
              </div>

              {/* Visual Bar */}
              <div className="flex h-2 w-full rounded-full overflow-hidden bg-[var(--bg-input)]">
                  {passport.video_structure.map((seg, i) => (
                      <div 
                        key={i} 
                        className={`h-full ${getSegmentBg(seg.segment_type)} flex-1 border-r border-black/10 last:border-0 opacity-80 hover:opacity-100 transition-opacity`} 
                        title={`${seg.segment_type} (${seg.time_range})`}
                      />
                  ))}
              </div>

              {/* Breakdown Legend */}
              <div className="flex flex-wrap gap-2">
                 {Object.entries(structureCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-1.5 bg-[var(--bg-input)] px-2 py-1 rounded-lg border border-[var(--border)]">
                       <div className={`w-1.5 h-1.5 rounded-full ${getSegmentBg(type)}`} />
                       <span className="text-[10px] text-[var(--text-muted)] font-medium">
                         {type} <span className="text-[var(--text-main)] opacity-50">x</span>{count}
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video & Structure */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-3xl overflow-hidden border border-[var(--border)] aspect-video relative group shadow-2xl">
             <UniversalPlayer url={videoUrl} videoRef={videoRef} />
          </div>

          <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[var(--text-main)]">
              <Clock className="w-5 h-5 text-blue-500" />
              Интерактивная шкала и Структура
            </h3>
            <div className="space-y-3">
              {passport.video_structure.map((segment, idx) => (
                <div 
                  key={idx}
                  onClick={() => jumpToTime(segment.time_range)}
                  className={`group flex items-center gap-6 p-4 rounded-2xl hover:bg-[var(--bg-input)] border border-transparent hover:border-[var(--border)] transition-all ${!isExternalVideo ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="text-xs font-mono text-[var(--text-muted)] w-20 flex-shrink-0">{segment.time_range}</div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest w-24 text-center flex-shrink-0 ${
                    segment.segment_type === 'Hook' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    segment.segment_type === 'CTA' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    segment.segment_type === 'Climax' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  }`}>
                    {segment.segment_type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible">
                      {segment.description}
                    </p>
                  </div>
                  {!isExternalVideo && (
                    <PlayCircle className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            {isExternalVideo && (
              <p className="text-[10px] text-[var(--text-muted)] mt-4 text-center italic">
                * Интерактивная навигация доступна только при прямой загрузке файла.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Deep Analytics */}
        <div className="space-y-8">
          
          {/* Emotional DNA Radar */}
          <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg flex flex-col h-[400px] overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-2">
               <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-500">
                 <Fingerprint className="w-5 h-5" />
                 ДНК Эмоций
               </h3>
               <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">5-ОСЕВОЙ АНАЛИЗ</span>
            </div>
            
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="var(--border)" strokeDasharray="3 3" radialLines={false} />
                  <PolarAngleAxis 
                    dataKey="label" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: '600' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Интенсивность"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="#10b981"
                    fillOpacity={0.15}
                    isAnimationActive={true}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', color: 'var(--text-main)' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
             
             {/* Overlay Summary */}
             <div className="w-full px-4 pb-2">
                 <p className="text-xs text-center text-[var(--text-muted)] italic border-t border-[var(--border)] pt-3">
                   "{passport.style_metrics.dominant_emotion}"
                 </p>
              </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-purple-500">Коронные Фразы</h3>
            <div className="flex flex-wrap gap-2">
              {passport.style_metrics.signature_phrases.map((phrase, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--text-muted)] italic group hover:bg-[var(--border)] transition-colors cursor-default">
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>
          
           <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-blue-500">Психология Удержания</h3>
            <ul className="space-y-4">
              {passport.retention_formula_insights.slice(0, 4).map((insight, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-[var(--text-muted)] leading-relaxed items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  desc: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, desc }) => (
  <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--text-muted)] transition-all group shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2.5 bg-[var(--bg-input)] rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-main)] tracking-tight">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-2">{desc}</p>
    </div>
  </div>
);
