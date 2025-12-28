
import React, { useState } from 'react';
import { StylePassport, ScriptLine } from '../types';
import { GeminiService } from '../services/geminiService';
import { downloadFile } from '../utils/download';
import { 
  Wand2, 
  Sparkles, 
  Copy, 
  Check, 
  MessageCircle, 
  Eye,
  Loader2,
  AlertCircle,
  Download,
  FileText,
  FileJson,
  FileType
} from 'lucide-react';

interface ScriptGeneratorProps {
  passport: StylePassport;
  gemini: GeminiService;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ passport, gemini }) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<ScriptLine[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDownloads, setShowDownloads] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await gemini.generateScript(topic, passport);
      setScript(result);
    } catch (err) {
      setError("Ошибка генерации. Пожалуйста, попробуйте снова.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!script) return;
    const text = script.map(line => `[${line.time_range}]\nВизуал: ${line.visual}\nАудио: ${line.audio}\n`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-[var(--text-main)]">Генеративный Продюсер</h2>
        <p className="text-[var(--text-muted)] max-w-xl mx-auto text-lg leading-relaxed">
          Примените выявленный ДНК-код удержания к новой теме. AI скопирует темп, стиль завязки и визуальные паттерны автора.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-2xl relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-[var(--text-main)]">
          <Wand2 className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Тема нового видео</label>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Обзор нового iPhone или Фишки продуктивности..."
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-6 py-4 text-[var(--text-main)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--text-muted)]"
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="bg-[var(--accent)] hover:bg-blue-700 disabled:bg-[var(--bg-input)] disabled:text-[var(--text-muted)] text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20"
              >
                {isGenerating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
                {isGenerating ? 'Создаем...' : 'Создать сценарий'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold block mb-1 w-full">Активные ограничения стиля:</span>
            {passport.retention_formula_insights.slice(0, 3).map((insight, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-[10px] font-bold">
                {insight}
              </span>
            ))}
            <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-xl text-[10px] font-bold">
              Цель: {passport.style_metrics.words_per_minute} сл/мин
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500 animate-in slide-in-from-left-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Output Section */}
      {script && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-6 duration-600">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--text-main)]">
              <Eye className="w-5 h-5 text-[var(--accent)]" />
              Готовый сценарий для продакшена
            </h3>
            
            <div className="flex items-center gap-2">
                 <div className="relative">
                    <button 
                        onClick={() => setShowDownloads(!showDownloads)}
                        className="flex items-center gap-2 text-xs font-bold bg-[var(--bg-input)] hover:bg-[var(--border)] text-[var(--text-main)] px-4 py-2 rounded-xl transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Скачать
                    </button>
                    {showDownloads && (
                        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50">
                            <button 
                                onClick={() => downloadFile(script, `script_${topic.slice(0,10)}`, 'txt')}
                                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <FileText className="w-4 h-4" /> .TXT (Текст)
                            </button>
                            <button 
                                onClick={() => downloadFile(script, `script_${topic.slice(0,10)}`, 'json')}
                                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <FileJson className="w-4 h-4" /> .JSON (Данные)
                            </button>
                            <button 
                                onClick={() => downloadFile(script, `script_${topic.slice(0,10)}`, 'doc')}
                                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-input)] flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            >
                                <FileType className="w-4 h-4" /> .DOC (Word)
                            </button>
                        </div>
                    )}
                 </div>
                 
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-input)] hover:bg-[var(--border)] px-4 py-2 rounded-xl"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Скопировано!' : 'Копировать всё'}
                </button>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-input)] border-b border-[var(--border)]">
                    <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] w-28">Тайминг</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] w-1/2">
                      <div className="flex items-center gap-2"><Sparkles className="w-3 h-3 text-yellow-500" /> Визуальный ряд</div>
                    </th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-2"><MessageCircle className="w-3 h-3 text-[var(--accent)]" /> Текст / Аудио</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {script.map((line, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-input)] transition-colors group">
                      <td className="px-6 py-10 align-top">
                        <span className="text-xs font-mono font-bold text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                          {line.time_range}
                        </span>
                      </td>
                      <td className="px-6 py-10 align-top">
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed bg-[var(--bg-input)] p-4 rounded-2xl italic border border-[var(--border)]">
                          {line.visual}
                        </p>
                      </td>
                      <td className="px-6 py-10 align-top">
                        <p className="text-base text-[var(--text-main)] font-medium leading-relaxed tracking-tight">
                          {line.audio}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl border border-[var(--border)] text-center">
            <p className="text-sm text-[var(--text-muted)]">
              💡 Этот сценарий был создан на основе профиля: <span className="text-[var(--text-main)] font-bold italic">"{passport.creator_profile_summary.split(',')[0]}"</span>.
              <br/>
              Все визуальные приемы и речевые обороты адаптированы под вашу тему.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
