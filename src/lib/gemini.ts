// src/lib/gemini.ts
"use server";

import { GoogleGenerativeAI, FunctionCallingMode, SchemaType } from "@google/generative-ai";
import type { FunctionDeclarationSchema } from "@google/generative-ai";
import { AI_MODELS } from '@/config/ai';
import { AllManagedWatchedData, ManagedWatchedItem, Recommendation, DuelResult, Challenge } from '@/types';

// Tipos para a resposta da IA
type WeeklyRelevantsAIResponse = { categories: { categoryTitle: string; items: { title: string; year: number; media_type: 'movie' | 'tv'; reason: string; }[] }[] };
type PersonalizedRadarAIResponse = { releases: { id: number; tmdbMediaType: 'movie' | 'tv'; title: string; reason: string; }[] };
type AIRawRecommendation = Recommendation & { year: number; media_type: 'movie' | 'tv' };
export type AIChatResponse = { type: 'text' | 'recommendation' | 'list', data: { text?: string; recommendation?: AIRawRecommendation; list?: { id: number; tmdbMediaType: 'movie' | 'tv', title: string }[] } };


// --- CONFIGURAÇÃO DA IA ---
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn("A chave da API do Gemini não foi configurada no servidor. Usando mocks.");
}
const genAI = new GoogleGenerativeAI(API_KEY || "");
const getModel = (modelName: string) => genAI.getGenerativeModel({ model: modelName });

// --- SCHEMAS ---
const recommendationSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        id: { type: SchemaType.INTEGER },
        tmdbMediaType: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" },
        title: { type: SchemaType.STRING },
        type: { type: SchemaType.STRING, enum: ['Filme', 'Série', 'Anime', 'Programa'], format: "enum" },
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

const duelSchema: FunctionDeclarationSchema = { /* ... seu schema de duel ... */ } as any;
const radarSchema: FunctionDeclarationSchema = { /* ... seu schema de radar ... */ } as any;
const probabilitySchema: FunctionDeclarationSchema = { /* ... seu schema de probability ... */ } as any;
const weeklyRelevantsSchema: FunctionDeclarationSchema = { /* ... seu schema de weekly relevants ... */ } as any;
const challengeSchema: FunctionDeclarationSchema = { /* ... seu schema de challenge ... */ } as any;


// --- NOVOS SCHEMAS (Movidos do chatService.ts) ---
const chatResponseSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        type: { type: SchemaType.STRING, enum: ['text', 'recommendation', 'list'], format: "enum" },
        data: {
            type: SchemaType.OBJECT,
            properties: {
                text: { type: SchemaType.STRING, description: "A resposta em texto, se for uma conversa." },
                recommendation: {
                    type: SchemaType.OBJECT,
                    properties: {
                        title: { type: SchemaType.STRING }, year: { type: SchemaType.INTEGER }, media_type: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" },
                        analysis: { type: SchemaType.STRING }, synopsis: { type: SchemaType.STRING }, genre: { type: SchemaType.STRING },
                        type: { type: SchemaType.STRING, enum: ['Filme', 'Série', 'Anime', 'Programa'], format: "enum" },
                        probabilities: { type: SchemaType.OBJECT, properties: {} }
                    },
                },
                list: {
                    type: SchemaType.ARRAY, description: "Uma lista de itens.",
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            id: { type: SchemaType.INTEGER },
                            tmdbMediaType: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" },
                            title: { type: SchemaType.STRING },
                        }
                    }
                }
            },
        },
    },
    required: ['type', 'data']
};

const chatTitleSchema: FunctionDeclarationSchema = {
    type: SchemaType.OBJECT,
    properties: {
        title: { type: SchemaType.STRING, description: "Um título curto e conciso (máximo 5 palavras) para a conversa." }
    },
    required: ["title"]
};


// --- Função Auxiliar ---
export async function runJsonMode(prompt: string, schema: FunctionDeclarationSchema, modelName: string) {
    if (!API_KEY) throw new Error("A chave da API do Gemini não está disponível.");
    const model = getModel(modelName);
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ functionDeclarations: [{ name: "extract_data", description: "Extrai dados estruturados do texto.", parameters: schema }] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.ANY, allowedFunctionNames: ["extract_data"] } }
    });

    const call = result.response.functionCalls()?.[0];
    if (call) return call.args;

    console.warn("A IA (Gemini) não retornou uma chamada de função. Tentando extrair texto.", result.response.text());
    throw new Error("A IA (Gemini) não retornou uma resposta estruturada válida.");
}


// --- Funções de Chamada à IA (Existentes) ---
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

export const fetchRecommendation = async (prompt: string): Promise<Omit<Recommendation, 'posterUrl'>> => {
    if (!API_KEY) return { id: 129, tmdbMediaType: 'movie', title: "Mock: A Viagem de Chihiro (2001)", type: 'Anime', genre: "Animação/Fantasia", synopsis: "Mock synopsis", probabilities: { amei: 85, gostei: 10, meh: 4, naoGostei: 1 }, analysis: "Mock analysis" };
    const modelName = AI_MODELS.gemini.recommendation;
    return await runJsonMode(prompt, recommendationSchema, modelName) as Omit<Recommendation, 'posterUrl'>;
};

export const fetchWeeklyRelevants = async (prompt: string): Promise<WeeklyRelevantsAIResponse> => {
    if (!API_KEY) return { categories: [] };
    const modelName = AI_MODELS.gemini.weeklyRelevants;
    return await runJsonMode(prompt, weeklyRelevantsSchema, modelName) as WeeklyRelevantsAIResponse;
};

export const fetchDuelAnalysis = async (prompt: string): Promise<DuelResult> => {
    if (!API_KEY) return { title1: { title: "Mock 1", analysis: "Análise 1", probability: 80, posterUrl: "" }, title2: { title: "Mock 2", analysis: "Análise 2", probability: 70, posterUrl: "" }, verdict: "Veredito Mock" };
    const modelName = AI_MODELS.gemini.duel;
    return await runJsonMode(prompt, duelSchema, modelName) as DuelResult;
};

export const fetchPersonalizedRadar = async (prompt: string): Promise<PersonalizedRadarAIResponse> => {
    if (!API_KEY) return { releases: [] };
    const modelName = AI_MODELS.gemini.personalizedRadar;
    return await runJsonMode(prompt, radarSchema, modelName) as PersonalizedRadarAIResponse;
};

export const fetchBestTMDbMatch = async (prompt: string): Promise<number | null> => {
    if (!API_KEY) return null;
    const modelName = AI_MODELS.gemini.tmdbMatch;
    const model = getModel(modelName);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsedId = parseInt(text, 10);
    return !isNaN(parsedId) ? parsedId : null;
};

export const fetchLoveProbability = async (prompt: string): Promise<number> => {
    if (!API_KEY) return Math.floor(Math.random() * 31) + 70;
    const modelName = AI_MODELS.gemini.probability;
    const result = await runJsonMode(prompt, probabilitySchema, modelName) as { loveProbability: number };
    return result.loveProbability;
};

export const fetchWeeklyChallenge = async (prompt: string): Promise<Omit<Challenge, 'id' | 'status'>> => {
    if (!API_KEY) return { challengeType: "Maratona Clássicos do Terror", reason: "Você adora suspense...", steps: [] };
    const modelName = AI_MODELS.gemini.challenge;
    return await runJsonMode(prompt, challengeSchema, modelName) as Omit<Challenge, 'id' | 'status'>;
};


// --- NOVAS FUNÇÕES (Específicas para o Chat) ---
export const generateAdvancedChatResponse = async (prompt: string): Promise<AIChatResponse> => {
    const modelName = AI_MODELS.gemini.chat;
    return await runJsonMode(prompt, chatResponseSchema, modelName) as AIChatResponse;
};

export const generateChatTitle = async (prompt: string): Promise<{ title: string }> => {
    const modelName = AI_MODELS.gemini.chat;
    return await runJsonMode(prompt, chatTitleSchema, modelName) as { title: string };
};