
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { RoadmapData, RoadmapNode, ContentIdea, HistoryItem } from '../types';
import { 
  Network, 
  Sparkles, 
  Map as MapIcon, 
  Target,
  User,
  Zap,
  Loader2,
  BookOpen,
  Briefcase,
  Lightbulb,
  Plus,
  ArrowRightCircle,
  X
} from 'lucide-react';

interface SuggestionMapProps {
  gemini: GeminiService;
  history: HistoryItem[]; // Need history for personalized ideas
}

export const SuggestionMap: React.FC<SuggestionMapProps> = ({ gemini, history }) => {
  const [interestA, setInterestA] = useState('');
  const [interestB, setInterestB] = useState('');
  
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  
  // Interaction State
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[] | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  // Drag State
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const predefinedCategories = [
    "Спорт", "IT", "Арт", "Бизнес", "Наука", "Кулинария", "Игры", "Лайфстайл"
  ];

  const handleGenerateMap = async () => {
    if (!interestA.trim() || !interestB.trim()) return;
    setIsGeneratingMap(true);
    setRoadmap(null);
    setSelectedNode(null);
    setContentIdeas(null);
    try {
      const data = await gemini.generateInterestMap(interestA, interestB);
      setRoadmap(data);
    } catch (error) {
      console.error("Map generation failed", error);
    } finally {
      setIsGeneratingMap(false);
    }
  };

  const handleNodeClick = async (node: RoadmapNode) => {
    // If dragging recently occurred, don't trigger click
    if (draggingNodeId) return;

    setSelectedNode(node);
    setContentIdeas(null);
    setIsGeneratingIdeas(true);

    try {
        // Use the latest history item for context if available
        const latestHistory = history.length > 0 ? history[0].passport : undefined;
        const ideas = await gemini.generateContentIdeas(node.label, latestHistory);
        setContentIdeas(ideas);
    } catch (error) {
        console.error("Idea generation failed", error);
    } finally {
        setIsGeneratingIdeas(false);
    }
  };

  // --- Drag & Drop Logic ---

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation(); // Prevent clearing selection
    setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !containerRef.current || !roadmap) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to 0-100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setRoadmap(prev => {
        if (!prev) return null;
        return {
            ...prev,
            nodes: prev.nodes.map(n => 
                n.id === draggingNodeId ? { ...n, x: clampedX, y: clampedY } : n
            )
        };
    });
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  useEffect(() => {
      // Global mouse up to catch drops outside the node
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header & Mixer Inputs */}
      <div className="flex-shrink-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-xl z-20 relative">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
           <div className="space-y-2 lg:w-1/3">
              <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
                 <Network className="w-6 h-6 text-purple-500" />
                 Синтез Интересов
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                 Смешайте два увлечения или профессии, чтобы найти уникальную нишу.
              </p>
           </div>
           
           <div className="flex-1 w-full flex flex-col md:flex-row items-center gap-4">
              
              {/* Input A */}
              <div className="relative w-full group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-purple-500 transition-colors" />
                 </div>
                 <input 
                   type="text"
                   list="categoriesA" 
                   value={interestA}
                   onChange={(e) => setInterestA(e.target.value)}
                   placeholder="Интерес 1 (напр. Футбол)"
                   className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-inner"
                 />
                 <datalist id="categoriesA">
                    {predefinedCategories.map(c => <option key={c} value={c} />)}
                 </datalist>
                 {/* Dropdown Tab Indicator */}
                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[var(--text-muted)] pointer-events-none"></div>
                 </div>
              </div>

              <Plus className="w-6 h-6 text-[var(--text-muted)] flex-shrink-0" />

              {/* Input B */}
              <div className="relative w-full group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                 </div>
                 <input 
                   type="text"
                   list="categoriesB" 
                   value={interestB}
                   onChange={(e) => setInterestB(e.target.value)}
                   placeholder="Интерес 2 (напр. Плавание)"
                   className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                 />
                 <datalist id="categoriesB">
                    {predefinedCategories.map(c => <option key={c} value={c} />)}
                 </datalist>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[var(--text-muted)] pointer-events-none"></div>
                 </div>
              </div>

              <button 
                onClick={handleGenerateMap}
                disabled={isGeneratingMap || !interestA || !interestB}
                className="w-full md:w-auto h-12 px-8 bg-[var(--accent)] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-105 whitespace-nowrap"
              >
                {isGeneratingMap ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGeneratingMap ? 'Синтез...' : 'Смешать'}
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Map Area */}
        <div 
            className="flex-1 bg-[#050505] rounded-3xl border border-[var(--border)] relative overflow-hidden shadow-2xl group cursor-crosshair"
            ref={containerRef}
            onMouseMove={handleMouseMove}
        >
            
            {/* Decorative Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ 
                backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
                }} 
            />
            
            {!roadmap && !isGeneratingMap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-30 pointer-events-none">
                <Network className="w-24 h-24 mb-4" />
                <p className="text-lg font-mono">Введите два интереса для поиска пересечений...</p>
            </div>
            )}

            {isGeneratingMap && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/50 backdrop-blur-sm pointer-events-none">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-[var(--accent)] animate-pulse" />
                    </div>
                </div>
                <p className="mt-4 text-[var(--accent)] font-bold animate-pulse">ИИ ищет точки соприкосновения...</p>
            </div>
            )}

            {roadmap && (
            <div className="w-full h-full relative">
                {/* SVG Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" opacity="0.5" />
                    </marker>
                </defs>
                {roadmap.edges.map((edge, i) => {
                    const fromNode = roadmap.nodes.find(n => n.id === edge.from);
                    const toNode = roadmap.nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    return (
                    <line 
                        key={i}
                        x1={`${fromNode.x}%`} 
                        y1={`${fromNode.y}%`} 
                        x2={`${toNode.x}%`} 
                        y2={`${toNode.y}%`} 
                        stroke={toNode.type === 'intersection' ? 'var(--accent)' : 'var(--text-muted)'} 
                        strokeWidth={toNode.type === 'intersection' ? "2" : "1"} 
                        strokeDasharray="5,5"
                        strokeOpacity="0.4"
                    />
                    );
                })}
                </svg>

                {/* Nodes */}
                {roadmap.nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isCore = node.type === 'core';
                    const isIntersection = node.type === 'intersection';
                    
                    let nodeColor = 'bg-[var(--bg-card)] border-[var(--border)]'; 
                    let glowColor = '';
                    let icon = <BookOpen className="w-4 h-4" />;
                    let size = 'w-12 h-12';
                    
                    if (isCore) {
                        nodeColor = 'bg-[var(--bg-input)] border-gray-500';
                        icon = <User className="w-4 h-4" />;
                    } else if (isIntersection) {
                        nodeColor = 'bg-[var(--accent)] border-blue-400';
                        glowColor = 'shadow-[var(--accent)]/50 shadow-2xl';
                        icon = <Sparkles className="w-6 h-6 text-white" />;
                        size = 'w-16 h-16';
                    } else {
                        icon = <Lightbulb className="w-4 h-4 text-yellow-500" />;
                    }

                    return (
                        <div
                        key={node.id}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        onClick={() => handleNodeClick(node)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-shadow duration-300 z-10 hover:z-20`}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        >
                            {/* Pulsing effect for intersection */}
                            {isIntersection && (
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 bg-[var(--accent)]`}></div>
                            )}
                            
                            {/* Node Circle */}
                            <div className={`
                                ${size} rounded-full flex items-center justify-center text-white shadow-xl border-2 transition-transform
                                ${nodeColor} ${isSelected ? 'ring-4 ring-white/20 scale-110' : 'hover:scale-105'} ${glowColor}
                            `}>
                                {icon}
                            </div>

                            {/* Label */}
                            <div className={`
                                absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-black/80 backdrop-blur border border-[var(--border)]
                                text-xs font-bold text-[var(--text-main)] shadow-lg pointer-events-none
                            `}>
                                {node.label}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
        </div>

        {/* Right Sidebar: Content Ideas */}
        {selectedNode && (
            <div className="w-96 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right-10 flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--text-main)]">{selectedNode.label}</h3>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">
                            {selectedNode.type === 'intersection' ? 'Точка Роста' : 'Смежная Ниша'}
                        </p>
                    </div>
                    <button 
                       onClick={() => setSelectedNode(null)}
                       className="p-1 hover:bg-[var(--bg-input)] rounded-full text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6 italic">
                    "{selectedNode.description}"
                </p>

                <div className="flex-1 space-y-4">
                    <h4 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Контент-Идеи {history.length > 0 ? '(Адаптировано)' : '(Тренды)'}
                    </h4>

                    {isGeneratingIdeas ? (
                        <div className="py-10 flex flex-col items-center text-[var(--text-muted)] space-y-3">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="text-xs">Генерация виральных форматов...</span>
                        </div>
                    ) : contentIdeas ? (
                        contentIdeas.map((idea, idx) => (
                            <div key={idx} className="bg-[var(--bg-input)] rounded-2xl p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-colors group">
                                <h5 className="font-bold text-[var(--text-main)] text-sm mb-2 group-hover:text-[var(--accent)] transition-colors">
                                    {idea.title}
                                </h5>
                                <div className="space-y-2 text-xs text-[var(--text-muted)]">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-[var(--text-main)] w-10 shrink-0">Хук:</span>
                                        <span className="italic">"{idea.hook}"</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-[var(--text-main)] w-10 shrink-0">Формат:</span>
                                        <span>{idea.format}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-[var(--border)] text-[10px] opacity-70">
                                        💡 {idea.why_it_works}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-[var(--text-muted)] opacity-50">
                            Нет идей
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
