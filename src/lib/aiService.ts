// src/lib/aiService.ts
"use server";

import { ACTIVE_AI_PROVIDER } from '@/config/ai';

// Importa todas as funções de ambos os serviços, usando um alias para evitar conflitos de nome.
import * as geminiService from './gemini';
import * as openaiService from './openai';

import { AllManagedWatchedData, Recommendation, DuelResult, Challenge } from '@/types';
// Importa o tipo da resposta do chat de um dos serviços para garantir consistência
import type { AIChatResponse } from './gemini'; 

// Tipos para a resposta da IA para garantir consistência
type WeeklyRelevantsAIResponse = { categories: { categoryTitle: string; items: { title: string; year: number; media_type: 'movie' | 'tv'; reason: string; }[] }[] };
type PersonalizedRadarAIResponse = { releases: { id: number; tmdbMediaType: 'movie' | 'tv'; title: string; reason: string; }[] };

// --- CAMADA DE ABSTRAÇÃO ---

/**
 * Formata os dados assistidos. A lógica é idêntica em ambos os serviços,
 * então podemos chamar qualquer um deles.
 * CORREÇÃO: Adicionado 'async' para cumprir o requisito de Server Action.
 */
export const formatWatchedDataForPrompt = async (data: AllManagedWatchedData): Promise<string> => {
    // Como a implementação é a mesma, podemos simplesmente escolher um.
    return geminiService.formatWatchedDataForPrompt(data);
};

export const fetchRecommendation = async (prompt: string): Promise<Omit<Recommendation, 'posterUrl'>> => {
    console.log(`aiService: Roteando chamada 'fetchRecommendation' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.fetchRecommendation(prompt);
    }
    return geminiService.fetchRecommendation(prompt);
};

export const fetchDuelAnalysis = async (prompt: string): Promise<DuelResult> => {
    console.log(`aiService: Roteando chamada 'fetchDuelAnalysis' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.fetchDuelAnalysis(prompt);
    }
    return geminiService.fetchDuelAnalysis(prompt);
};

export const fetchWeeklyRelevants = async (prompt: string): Promise<WeeklyRelevantsAIResponse> => {
    console.log(`aiService: Roteando chamada 'fetchWeeklyRelevants' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.fetchWeeklyRelevants(prompt);
    }
    return geminiService.fetchWeeklyRelevants(prompt);
};

export const fetchPersonalizedRadar = async (prompt: string): Promise<PersonalizedRadarAIResponse> => {
    console.log(`aiService: Roteando chamada 'fetchPersonalizedRadar' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.fetchPersonalizedRadar(prompt);
    }
    return geminiService.fetchPersonalizedRadar(prompt);
};

export const fetchLoveProbability = async (prompt: string): Promise<number> => {
    console.log(`aiService: Roteando chamada 'fetchLoveProbability' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.fetchLoveProbability(prompt);
    }
    return geminiService.fetchLoveProbability(prompt);
};

export const fetchWeeklyChallenge = async (prompt: string): Promise<Omit<Challenge, 'id' | 'status'>> => {
    console.log(`aiService: Roteando chamada 'fetchWeeklyChallenge' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.fetchWeeklyChallenge(prompt);
    }
    return geminiService.fetchWeeklyChallenge(prompt);
};

export const fetchBestTMDbMatch = async (prompt: string): Promise<number | null> => {
    console.log(`aiService: Roteando chamada 'fetchBestTMDbMatch' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.fetchBestTMDbMatch(prompt);
    }
    return geminiService.fetchBestTMDbMatch(prompt);
};

// --- NOVAS FUNÇÕES ROTEADAS (Específicas para o Chat) ---

export const generateAdvancedChatResponse = async (prompt: string): Promise<AIChatResponse> => {
    console.log(`aiService: Roteando chamada 'generateAdvancedChatResponse' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.generateAdvancedChatResponse(prompt);
    }
    return geminiService.generateAdvancedChatResponse(prompt);
};

export const generateChatTitle = async (prompt: string): Promise<{ title: string }> => {
    console.log(`aiService: Roteando chamada 'generateChatTitle' para o provedor: ${ACTIVE_AI_PROVIDER}`);
    if (ACTIVE_AI_PROVIDER === 'openai') {
        return openaiService.generateChatTitle(prompt);
    }
    return geminiService.generateChatTitle(prompt);
};