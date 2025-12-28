
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { StylePassport, ScriptLine, EngagementMetrics, HistoryItem, RoadmapData, ContentIdea } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeViaSearch(url: string, platform: string): Promise<StylePassport> {
    const promptText = `
      Цель: Глубокий анализ видео по ссылке: ${url} (Платформа: ${platform}).

      ЭТАП 1: ПОИСК ТОЧНЫХ МЕТРИК (КРИТИЧЕСКИ ВАЖНО)
      Используй Google Search, чтобы найти актуальную страницу видео или сторонние аналитические сервисы.
      Ты должен извлечь ТОЧНЫЕ числа:
      - Просмотры (Views)
      - Лайки (Likes)
      - Комментарии (Comments)
      
      ВНИМАНИЕ: Если ты не нашел точных цифр, ставь 0. ЗАПРЕЩЕНО выдумывать, усреднять или генерировать случайные числа. Пользователь проверяет точность, обман недопустим.

      ЭТАП 2: АНАЛИЗ КОНТЕНТА
      - Найди описание, транскрипцию, комментарии пользователей или пересказ видео.
      - Определи стиль автора, темп речи (WPM), эмоциональный фон и структуру удержания.
      
      На основе найденных данных сформируй полный StylePassport.
      Выдай результат СТРОГО в формате JSON.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: promptText }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creator_profile_summary: { type: Type.STRING },
            retention_formula_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            engagement_metrics: {
               type: Type.OBJECT,
               properties: {
                 views: { type: Type.NUMBER },
                 likes: { type: Type.NUMBER },
                 comments: { type: Type.NUMBER },
                 engagement_rate: { type: Type.STRING },
                 virality_score: { type: Type.NUMBER }
               },
               required: ["views", "likes", "comments", "engagement_rate", "virality_score"]
            },
            style_metrics: {
              type: Type.OBJECT,
              properties: {
                words_per_minute: { type: Type.NUMBER },
                dominant_emotion: { type: Type.STRING },
                emotional_spectrum: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      score: { type: Type.NUMBER }
                    },
                    required: ["label", "score"]
                  }
                },
                signature_phrases: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["words_per_minute", "dominant_emotion", "emotional_spectrum", "signature_phrases"]
            },
            video_structure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time_range: { type: Type.STRING },
                  segment_type: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["time_range", "segment_type", "description"]
              }
            }
          },
          required: ["creator_profile_summary", "retention_formula_insights", "style_metrics", "video_structure"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as StylePassport;
  }

  async analyzeVideo(videoBase64: string, mimeType: string, metrics?: EngagementMetrics): Promise<StylePassport> {
    
    let promptText = "Проведи глубокий технический анализ видео. Рассчитай метрики и выяви структуру удержания. Выдай результат СТРОГО в формате JSON согласно системным инструкциям.";
    
    if (metrics) {
      const hasUserMetrics = metrics.views > 0 || metrics.likes > 0 || metrics.comments > 0;

      promptText += `\n\nВХОДНЫЕ МЕТРИКИ (ОТ ПОЛЬЗОВАТЕЛЯ):
      - Просмотры: ${metrics.views}
      - Лайки: ${metrics.likes}
      - Комментарии: ${metrics.comments}`;

      if (!hasUserMetrics) {
        promptText += `\n\nВАЖНО: Пользователь НЕ ввел метрики (значения равны 0). 
        ТВОЯ ЗАДАЧА: Внимательно посмотри на видеокадры. Если на экране виден интерфейс плеера (YouTube, TikTok, Instagram) с цифрами (лайки, просмотры), ИЗВЛЕКИ ИХ визуально (OCR).
        - Ищи текст рядом с иконками сердца, глаза, облачка сообщения.
        - Распознай 'K' как тысячи (x1000) и 'M' как миллионы (x1000000).
        - Если интерфейса не видно, сделай приблизительную оценку виральности (Virality Score) на основе качества контента, но в полях views/likes поставь 0.`;
      } else {
        promptText += `\n\nЗАДАЧА: Используй предоставленные пользователем цифры для расчета Engagement Rate и Virality Score.`;
      }
    }

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { data: videoBase64, mimeType } },
            { text: promptText }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creator_profile_summary: { type: Type.STRING },
            retention_formula_insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            engagement_metrics: {
               type: Type.OBJECT,
               properties: {
                 views: { type: Type.NUMBER },
                 likes: { type: Type.NUMBER },
                 comments: { type: Type.NUMBER },
                 engagement_rate: { type: Type.STRING },
                 virality_score: { type: Type.NUMBER }
               },
               required: ["views", "likes", "comments", "engagement_rate", "virality_score"]
            },
            style_metrics: {
              type: Type.OBJECT,
              properties: {
                words_per_minute: { type: Type.NUMBER },
                dominant_emotion: { type: Type.STRING },
                emotional_spectrum: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      score: { type: Type.NUMBER }
                    },
                    required: ["label", "score"]
                  }
                },
                signature_phrases: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["words_per_minute", "dominant_emotion", "emotional_spectrum", "signature_phrases"]
            },
            video_structure: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time_range: { type: Type.STRING },
                  segment_type: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["time_range", "segment_type", "description"]
              }
            }
          },
          required: ["creator_profile_summary", "retention_formula_insights", "style_metrics", "video_structure"]
        }
      }
    });

    return JSON.parse(response.text || '{}') as StylePassport;
  }

  async generateScript(topic: string, passport: StylePassport): Promise<ScriptLine[]> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: `На основе проверенного Паспорта стиля: ${JSON.stringify(passport)}, напиши сценарий для темы: "${topic}". Сценарий должен МАТЕМАТИЧЕСКИ соответствовать темпу (WPM) и визуальной плотности оригинала. Язык вывода: РУССКИЙ.` }
          ]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + " ВАЖНО: Весь генерируемый контент (визуал, аудио) должен быть на РУССКОМ ЯЗЫКЕ.",
        thinkingConfig: { thinkingBudget: 2000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time_range: { type: Type.STRING },
              visual: { type: Type.STRING },
              audio: { type: Type.STRING }
            },
            required: ["time_range", "visual", "audio"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]') as ScriptLine[];
  }

  async compareVideos(items: HistoryItem[]): Promise<string> {
    const dataForComparison = items.map((item, index) => ({
      id: index + 1,
      platform: item.platform,
      metrics: item.passport.engagement_metrics,
      summary: item.passport.creator_profile_summary,
      emotions: item.passport.style_metrics.dominant_emotion,
      wpm: item.passport.style_metrics.words_per_minute,
      structure: item.passport.video_structure
    }));

    const promptText = `
      У меня есть ${items.length} видео для анализа. Вот их данные в формате JSON:
      ${JSON.stringify(dataForComparison, null, 2)}

      ТВОЯ ЗАДАЧА: Провести сравнительный анализ и выдать результат в формате ЧИСТОГО ТЕКСТА (Clean Business Text).
      
      ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
      1. НЕ ИСПОЛЬЗУЙ таблицы Markdown (символы | и -). Это выглядит грязно.
      2. НЕ ИСПОЛЬЗУЙ жирный шрифт через звездочки (**текст**). 
      3. НЕ ИСПОЛЬЗУЙ заголовки через решетки (###).
      4. Используй ЗАГЛАВНЫЕ БУКВЫ для заголовков разделов.
      5. Используй простые дефисы (-) или цифры для списков.
      6. Делай двойные отступы между блоками для читаемости.

      СТРУКТУРА ОТВЕТА:

      1. СВОДНАЯ ТАБЛИЦА (Текстовый вид)
      Для каждого видео напиши строку: Видео N - Платформа - Показатели - Краткая суть - Вердикт.

      2. ГЛУБОКИЙ СРАВНИТЕЛЬНЫЙ АНАЛИЗ
      Сравни видео по пунктам: Крючок, Формат, Структура, Визуал, Аудио, Эмоции, CTA.
      Пиши в формате: "Крючок: Видео 1 делает так, а Видео 2 делает иначе..."

      3. ПОЧЕМУ ЭТО ВЗЛЕТЕЛО (Факторы успеха лучшего видео)

      4. ГДЕ БЫЛИ ОШИБКИ (Проблемы худшего видео)

      5. СТРАТЕГИЧЕСКИЕ РЕКОМЕНДАЦИИ (5-7 пунктов)

      6. ГИПОТЕЗА ДЛЯ СЛЕДУЮЩЕГО ВИДЕО (Рецепт)

      Язык: Русский. Стиль: Профессиональный, лаконичный, без лишнего визуального шума.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: promptText }],
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
      }
    });

    return response.text || "Не удалось сгенерировать сравнение.";
  }

  async generateInterestMap(interestA: string, interestB: string): Promise<RoadmapData> {
    const promptText = `
      Задача: Создай "Карту Интересов" на основе СИНТЕЗА двух тем.
      
      ВХОДНЫЕ ДАННЫЕ:
      - Интерес 1: "${interestA}"
      - Интерес 2: "${interestB}"

      ТВОЯ ЦЕЛЬ:
      1. Найти ТОЧКУ ПЕРЕСЕЧЕНИЯ (Fusion). Что получается, если объединить эти две темы? (Например: Футбол + Плавание = Водное поло; Кодинг + Дизайн = Creative Coding).
      2. Построить граф вокруг этого пересечения, предложив смежные хобби, профессии и ниши.

      ТРЕБОВАНИЯ К ВИЗУАЛИЗАЦИИ (Координаты X/Y):
      - Центр карты (X=50, Y=50) - это само Пересечение (Intersection).
      - Вокруг него расположи 6-10 связанных узлов (Related).
      - Используй пространство (0-100%), чтобы они не накладывались.
      
      ТИПЫ УЗЛОВ:
      - 'intersection': Центральный результат смешивания.
      - 'related': Смежные области, ниши, профессии.
      - 'core': Исходные интересы (Интерес 1 и Интерес 2).

      ФОРМАТ JSON:
      {
        "nodes": [
           { "id": "1", "label": "Результат Смеси", "description": "Почему это круто", "type": "intersection", "x": 50, "y": 50 },
           { "id": "2", "label": "Интерес 1", "description": "Исходный", "type": "core", "x": 10, "y": 50 },
           { "id": "3", "label": "Интерес 2", "description": "Исходный", "type": "core", "x": 90, "y": 50 }
        ],
        "edges": [
          { "from": "2", "to": "1" },
          { "from": "3", "to": "1" }
        ]
      }
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['core', 'intersection', 'related'] },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ["id", "label", "description", "type", "x", "y"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING }
                },
                required: ["from", "to"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    return JSON.parse(response.text || '{"nodes":[], "edges":[]}') as RoadmapData;
  }

  async generateContentIdeas(topic: string, historyContext?: StylePassport): Promise<ContentIdea[]> {
     let contextPrompt = "";
     if (historyContext) {
        contextPrompt = `
        КОНТЕКСТ АВТОРА (Style DNA):
        - Темп речи: ${historyContext.style_metrics.words_per_minute} слов/мин.
        - Доминирующая эмоция: ${historyContext.style_metrics.dominant_emotion}.
        - Формула удержания: ${historyContext.retention_formula_insights.slice(0, 2).join(', ')}.
        
        ЗАДАЧА: Адаптируй идеи под этот стиль. Если автор агрессивный - идеи должны быть дерзкими. Если спокойный - идеи должны быть глубокими.
        `;
     } else {
        contextPrompt = "У автора нет истории. Предложи универсальные виральные форматы.";
     }

     const promptText = `
       Тема: "${topic}".
       ${contextPrompt}

       Сгенерируй 3 конкретные идеи для видео (Shorts/Reels) на эту тему.
       Формат JSON:
       [
         {
           "title": "Заголовок",
           "hook": "Первые 3 секунды (визуал + текст)",
           "format": "Тип видео (ASMR, Talking Head, Skit, Tutorial)",
           "why_it_works": "Психологическое обоснование виральности"
         }
       ]
     `;

     const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ text: promptText }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        hook: { type: Type.STRING },
                        format: { type: Type.STRING },
                        why_it_works: { type: Type.STRING }
                    },
                    required: ["title", "hook", "format", "why_it_works"]
                }
            }
        }
     });

     return JSON.parse(response.text || '[]') as ContentIdea[];
  }
}
