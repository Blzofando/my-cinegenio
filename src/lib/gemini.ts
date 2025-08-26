// src/lib/gemini.ts
"use server";

import { GoogleGenerativeAI, FunctionCallingMode, SchemaType } from "@google/generative-ai";
import type { FunctionDeclarationSchema } from "@google/generative-ai";
import { AllManagedWatchedData, ManagedWatchedItem, Recommendation, DuelResult, Challenge } from '@/types';

// Tipos para a resposta da IA
type WeeklyRelevantsAIResponse = { categories: { categoryTitle: string; items: { title: string; year: number; media_type: 'movie' | 'tv'; reason: string; }[] }[] };
type PersonalizedRadarAIResponse = { releases: { id: number; tmdbMediaType: 'movie' | 'tv'; title: string; reason: string; }[] };

// --- CONFIGURAÇÃO DA IA ---
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn("A chave da API do Gemini não foi configurada no servidor. Usando mocks.");
}
const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


// --- Schemas da IA (CORRIGIDOS com a propriedade 'format: "enum"') ---
const recommendationSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        id: { type: SchemaType.INTEGER },
        tmdbMediaType: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" }, // <-- CORREÇÃO
        title: { type: SchemaType.STRING },
        type: { type: SchemaType.STRING, enum: ['Filme', 'Série', 'Anime', 'Programa'], format: "enum" }, // <-- CORREÇÃO
        genre: { type: SchemaType.STRING },
        synopsis: { type: SchemaType.STRING },
        probabilities: {
            type: SchemaType.OBJECT,
            properties: {
                amei: { type: SchemaType.INTEGER },
                gostei: { type: SchemaType.INTEGER },
                meh: { type: SchemaType.INTEGER },
                naoGostei: { type: SchemaType.INTEGER }
            },
            required: ["amei", "gostei", "meh", "naoGostei"]
        },
        analysis: { type: SchemaType.STRING }
    },
    required: ["id", "tmdbMediaType", "title", "type", "genre", "synopsis", "probabilities", "analysis"]
};

const duelSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        title1: {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING },
                analysis: { type: SchemaType.STRING },
                probability: { type: SchemaType.INTEGER }
            },
            required: ["title", "analysis", "probability"]
        },
        title2: {
            type: SchemaType.OBJECT,
            properties: {
                title: { type: SchemaType.STRING },
                analysis: { type: SchemaType.STRING },
                probability: { type: SchemaType.INTEGER }
            },
            required: ["title", "analysis", "probability"]
        },
        verdict: { type: SchemaType.STRING }
    },
    required: ["title1", "title2", "verdict"]
};

const radarSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        releases: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.INTEGER },
                    // A correção está aqui:
                    tmdbMediaType: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" },
                    title: { type: SchemaType.STRING },
                    reason: { type: SchemaType.STRING }
                },
                required: ["id", "tmdbMediaType", "title", "reason"]
            }
        }
    },
    required: ["releases"]
};

const probabilitySchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        loveProbability: { type: SchemaType.INTEGER }
    },
    required: ["loveProbability"]
};

const weeklyRelevantsSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        categories: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    categoryTitle: { type: SchemaType.STRING },
                    items: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                title: { type: SchemaType.STRING },
                                year: { type: SchemaType.INTEGER },
                                media_type: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" }, // <-- CORREÇÃO
                                reason: { type: SchemaType.STRING }
                            },
                        }
                    }
                },
            }
        }
    },
};


const challengeSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        challengeType: { type: SchemaType.STRING },
        reason: { type: SchemaType.STRING },
        steps: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    tmdbId: { type: SchemaType.INTEGER },
                    tmdbMediaType: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" } // <-- CORREÇÃO
                },
            }
        }
    },
};


// --- Função Auxiliar ---
async function runJsonMode(prompt: string, schema: FunctionDeclarationSchema) {
    if (!API_KEY) throw new Error("A chave da API do Gemini não está disponível.");
    
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations: [{ name: "extract_data", description: "Extrai dados estruturados do texto.", parameters: schema }] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY, allowedFunctionNames: ["extract_data"] } }
    });
    
    const call = result.response.functionCalls()?.[0];
    if (call) {
        return call.args;
    }
    throw new Error("A IA não retornou uma resposta estruturada válida.");
}


// --- LÓGICA DO SERVIÇO ---
export const formatWatchedDataForPrompt = async (data: AllManagedWatchedData): Promise<string> => {
    const formatList = (list: ManagedWatchedItem[]) => list.map(item => `- ${item.title} (Tipo: ${item.type}, Gênero: ${item.genre})`).join('\n') || 'Nenhum';
    return `
**Amei (obras que considero perfeitas, alvo principal para inspiração):**
${formatList(data.amei)}

**Gostei (obras muito boas, boas pistas do que faltou para ser 'amei'):**
${formatList(data.gostei)}

**Indiferente (obras que achei medianas, armadilhas a evitar):**
${formatList(data.meh)}

**Não Gostei (obras que não me agradaram, elementos a excluir completamente):**
${formatList(data.naoGostei)}
    `.trim();
};


// --- Funções de Chamada à IA (usando o novo padrão) ---
export const fetchRecommendation = async (prompt: string): Promise<Omit<Recommendation, 'posterUrl'>> => {
    if (!API_KEY) return { id: 129, tmdbMediaType: 'movie', title: "Mock: A Viagem de Chihiro (2001)", type: 'Anime', genre: "Animação/Fantasia", synopsis: "Mock synopsis", probabilities: { amei: 85, gostei: 10, meh: 4, naoGostei: 1 }, analysis: "Mock analysis" };
    return await runJsonMode(prompt, recommendationSchema) as Omit<Recommendation, 'posterUrl'>;
};

export const fetchWeeklyRelevants = async (prompt: string): Promise<WeeklyRelevantsAIResponse> => {
    if (!API_KEY) return { categories: [/*...*/] };
    return await runJsonMode(prompt, weeklyRelevantsSchema) as WeeklyRelevantsAIResponse;
};

export const fetchDuelAnalysis = async (prompt: string): Promise<DuelResult> => {
    if (!API_KEY) return { title1: { title: "Mock 1", analysis: "Análise 1", probability: 80, posterUrl: "" }, title2: { title: "Mock 2", analysis: "Análise 2", probability: 70, posterUrl: "" }, verdict: "Veredito Mock" };
    return await runJsonMode(prompt, duelSchema) as DuelResult;
};

export const fetchPersonalizedRadar = async (prompt: string): Promise<PersonalizedRadarAIResponse> => {
    if (!API_KEY) return { releases: [] };
    return await runJsonMode(prompt, radarSchema) as PersonalizedRadarAIResponse;
};

export const fetchBestTMDbMatch = async (prompt: string): Promise<number | null> => {
    if (!API_KEY) return null;
    const result = await model.generateContent(prompt); // Chamada simples sem JSON mode
    const text = result.response.text().trim();
    const parsedId = parseInt(text, 10);
    return !isNaN(parsedId) ? parsedId : null;
};

export const fetchLoveProbability = async (prompt: string): Promise<number> => {
    if (!API_KEY) return Math.floor(Math.random() * 31) + 70;
    const result = await runJsonMode(prompt, probabilitySchema) as { loveProbability: number };
    return result.loveProbability;
};

export const fetchWeeklyChallenge = async (prompt: string): Promise<Omit<Challenge, 'id' | 'status'>> => {
    if (!API_KEY) return { 
        challengeType: "Maratona Clássicos do Terror", 
        reason: "Você adora suspense, mas que tal explorar as raízes do terror com estes clássicos?",
        steps: [
            { title: "O Exorcista (1973)", tmdbId: 9552, tmdbMediaType: 'movie', completed: false, posterUrl: "" },
            { title: "O Iluminado (1980)", tmdbId: 694, tmdbMediaType: 'movie', completed: false, posterUrl: "" },
            { title: "Psicose (1960)", tmdbId: 539, tmdbMediaType: 'movie', completed: false, posterUrl: "" },
        ]
    };
    return await runJsonMode(prompt, challengeSchema) as Omit<Challenge, 'id' | 'status'>;
};