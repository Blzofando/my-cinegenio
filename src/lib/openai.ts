"use server";

import OpenAI from 'openai';
import { AI_MODELS } from '@/config/ai';
import { AllManagedWatchedData, Recommendation, DuelResult, Challenge, ChallengeStep, ManagedWatchedItem } from '@/types';

// Tipos para compatibilidade
type WeeklyRelevantsAIResponse = { categories: { categoryTitle: string; items: { title: string; year: number; media_type: 'movie' | 'tv'; reason: string; }[] }[] };
type PersonalizedRadarAIResponse = { releases: { id: number; tmdbMediaType: 'movie' | 'tv'; title: string; reason: string; }[] };
type AIRawRecommendation = Recommendation & { year: number; media_type: 'movie' | 'tv' };
export type AIChatResponse = { type: 'text' | 'recommendation' | 'list', data: { text?: string; recommendation?: AIRawRecommendation; list?: { id: number; tmdbMediaType: 'movie' | 'tv', title: string }[] } };

// --- CONFIGURAÇÃO DA IA ---
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
    console.warn("A chave da API da OpenAI não foi configurada no servidor. Usando mocks.");
}
const openai = new OpenAI({ apiKey: API_KEY });

// --- Função Auxiliar para forçar JSON ---
async function runJsonMode<T>(systemPrompt: string, userPrompt: string, modelName: string): Promise<T> {
    if (!API_KEY) throw new Error("A chave da API da OpenAI não está disponível.");

    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
    });

    const jsonString = response.choices[0].message.content;
    if (!jsonString) {
        throw new Error("A IA (OpenAI) não retornou uma resposta JSON válida.");
    }
    try {
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Erro ao fazer parse da resposta JSON da OpenAI:", jsonString, e);
        throw new Error("A IA (OpenAI) retornou um JSON malformado.");
    }
}

// --- LÓGICA DO SERVIÇO ---
// A formatação é independente da IA, então a replicamos aqui para manter a interface consistente.
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

// --- Funções de Chamada à IA ---
export const fetchRecommendation = async (prompt: string): Promise<Omit<Recommendation, 'posterUrl'>> => {
    if (!API_KEY) return { id: 129, tmdbMediaType: 'movie', title: "Mock OpenAI: A Viagem de Chihiro (2001)", type: 'Anime', genre: "Animação/Fantasia", synopsis: "Mock synopsis", probabilities: { amei: 85, gostei: 10, meh: 4, naoGostei: 1 }, analysis: "Mock analysis" };
    const systemPrompt = "Você é um especialista em cinema e séries. Sua tarefa é gerar uma recomendação. Responda APENAS com um objeto JSON válido que corresponda à seguinte estrutura: { id: number, tmdbMediaType: 'movie' | 'tv', title: string, type: 'Filme' | 'Série' | 'Anime' | 'Programa', genre: string, synopsis: string, probabilities: { amei: number, gostei: number, meh: number, naoGostei: number }, analysis: string }";
    const modelName = AI_MODELS.openai.recommendation;
    return runJsonMode<Omit<Recommendation, 'posterUrl'>>(systemPrompt, prompt, modelName);
};

export const fetchDuelAnalysis = async (prompt: string): Promise<DuelResult> => {
    if (!API_KEY) return { title1: { title: "Mock 1 OpenAI", analysis: "Análise 1", probability: 80, posterUrl: "" }, title2: { title: "Mock 2 OpenAI", analysis: "Análise 2", probability: 70, posterUrl: "" }, verdict: "Veredito Mock OpenAI" };
    const systemPrompt = "Você é um crítico de cinema. Analise um duelo entre dois títulos. Responda APENAS com um objeto JSON válido com a estrutura: { title1: { title: string, analysis: string, probability: number }, title2: { title: string, analysis: string, probability: number }, verdict: string }";
    const modelName = AI_MODELS.openai.recommendation;
    return runJsonMode<DuelResult>(systemPrompt, prompt, modelName);
};

export const fetchWeeklyRelevants = async (prompt: string): Promise<WeeklyRelevantsAIResponse> => {
    if (!API_KEY) return { categories: [] };
    const systemPrompt = "Você é um curador de conteúdo. Gere categorias de itens relevantes. Responda APENAS com um objeto JSON válido com a estrutura: { categories: [{ categoryTitle: string, items: [{ title: string, year: number, media_type: 'movie' | 'tv', reason: string }] }] }";
    const modelName = AI_MODELS.openai.recommendation;
    return runJsonMode<WeeklyRelevantsAIResponse>(systemPrompt, prompt, modelName);
};

export const fetchPersonalizedRadar = async (prompt: string): Promise<PersonalizedRadarAIResponse> => {
    if (!API_KEY) return { releases: [] };
    const systemPrompt = "Você é um recomendador de conteúdo. Gere uma lista de lançamentos futuros. Responda APENAS com um objeto JSON válido com a estrutura: { releases: [{ id: number, tmdbMediaType: 'movie' | 'tv', title: string, reason: string }] }";
    const modelName = AI_MODELS.openai.recommendation;
    return runJsonMode<PersonalizedRadarAIResponse>(systemPrompt, prompt, modelName);
};

export const fetchLoveProbability = async (prompt: string): Promise<number> => {
    if (!API_KEY) return Math.floor(Math.random() * 31) + 70;
    const systemPrompt = "Analise o título e o perfil do usuário para calcular a probabilidade de ele AMAR o título. A probabilidade deve ser um número inteiro entre 0 e 100. Responda APENAS com um objeto JSON válido com a estrutura: { loveProbability: number }";
    const modelName = AI_MODELS.openai.recommendation;
    const result = await runJsonMode<{ loveProbability: number }>(systemPrompt, prompt, modelName);
    return result.loveProbability;
};

export const fetchWeeklyChallenge = async (prompt: string): Promise<Omit<Challenge, 'id' | 'status'>> => {
    if (!API_KEY) return { 
        challengeType: "Maratona Clássicos do Terror (OpenAI)", 
        reason: "Mock OpenAI", 
        steps: [
            { title: "O Exorcista (1973)", tmdbId: 9552, tmdbMediaType: 'movie', completed: false, posterUrl: "" },
            { title: "O Iluminado (1980)", tmdbId: 694, tmdbMediaType: 'movie', completed: false, posterUrl: "" },
            { title: "Psicose (1960)", tmdbId: 539, tmdbMediaType: 'movie', completed: false, posterUrl: "" },
        ] as ChallengeStep[]
    };
    const systemPrompt = "Você é um criador de desafios. Gere um desafio semanal. Responda APENAS com um objeto JSON válido com a estrutura: { challengeType: string, reason: string, steps: [{ title: string, tmdbId: number, tmdbMediaType: 'movie' | 'tv' }] }";
    const modelName = AI_MODELS.openai.recommendation;
    return runJsonMode<Omit<Challenge, 'id' | 'status'>>(systemPrompt, prompt, modelName);
};

export const fetchBestTMDbMatch = async (prompt: string): Promise<number | null> => {
    if (!API_KEY) return null;
    const modelName = AI_MODELS.openai.chat;
    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
            { role: "system", content: "Você é um assistente que encontra o ID de um filme ou série no TMDb. Responda APENAS com o número do ID." },
            { role: "user", content: prompt }
        ],
    });
    const text = response.choices[0].message.content?.trim();
    if (!text) return null;
    const parsedId = parseInt(text, 10);
    return !isNaN(parsedId) ? parsedId : null;
};

// --- NOVAS FUNÇÕES (Específicas para o Chat) ---
export const generateAdvancedChatResponse = async (prompt: string): Promise<AIChatResponse> => {
    if (!API_KEY) return { type: 'text', data: { text: "Mock de chat OpenAI: A API não está configurada." } };

    const systemPrompt = `Você é o CineGênio. Sua tarefa é responder ao usuário. Analise o contexto e a mensagem e retorne APENAS um objeto JSON válido com a estrutura: { type: 'text' | 'recommendation' | 'list', data: { text?: string, recommendation?: { title: string, year: number, tmdbMediaType: 'movie' | 'tv', analysis: string, synopsis: string, genre: string, type: 'Filme' | 'Série' | 'Anime' | 'Programa', probabilities: object }, list?: [{ id: number, tmdbMediaType: 'movie' | 'tv', title: string }] } }. Se o usuário pedir uma lista de algo que está no contexto (desafio, watchlist), use o tipo 'list' e retorne os IDs exatos.`;
    const modelName = AI_MODELS.openai.chat;
    
    return runJsonMode<AIChatResponse>(systemPrompt, prompt, modelName);
};

export const generateChatTitle = async (prompt: string): Promise<{ title: string }> => {
    if (!API_KEY) return { title: "Mock de Título OpenAI" };
    
    const systemPrompt = `Gere um título curto e objetivo (máximo 5 palavras) para a conversa. Responda APENAS com um objeto JSON válido com a estrutura: { title: string }`;
    const modelName = AI_MODELS.openai.chat;

    return runJsonMode<{ title: string }>(systemPrompt, prompt, modelName);
};

