
export interface VideoSegment {
  time_range: string;
  segment_type: 'Hook' | 'Body' | 'Climax' | 'CTA' | 'Bridge';
  description: string;
}

export interface EmotionalAxis {
  label: string;
  score: number; // 0-100
}

export interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  engagement_rate?: string; // Calculated field
  virality_score?: number; // 0-100 AI score
}

export interface StyleMetrics {
  words_per_minute: number;
  dominant_emotion: string; // Keep for backward compatibility/summary
  emotional_spectrum: EmotionalAxis[]; // New detailed breakdown
  signature_phrases: string[];
}

export interface StylePassport {
  creator_profile_summary: string;
  retention_formula_insights: string[];
  style_metrics: StyleMetrics;
  video_structure: VideoSegment[];
  engagement_metrics?: EngagementMetrics; // New field
}

export interface ScriptLine {
  time_range: string;
  visual: string;
  audio: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  passport: StylePassport;
  videoUrl: string | null;
  platform: string;
  thumbnail?: string;
}

export interface RoadmapNode {
  id: string;
  label: string;
  description: string;
  type: 'core' | 'intersection' | 'related'; // Changed types
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface RoadmapEdge {
  from: string;
  to: string;
}

export interface RoadmapData {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

export interface ContentIdea {
  title: string;
  hook: string;
  format: string;
  why_it_works: string;
}

export type AppView = 'upload' | 'dashboard' | 'generate' | 'history' | 'roadmap';

export interface AnalysisState {
  isAnalyzing: boolean;
  passport: StylePassport | null;
  videoUrl: string | null;
  error: string | null;
}
