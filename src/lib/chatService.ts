// src/lib/chatService.ts

"use server";

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getWatchedItems, getWatchlistItems } from './firestore';
import { AllManagedWatchedData, Challenge, WatchlistItem, WeeklyRelevants, DisplayableItem } from '@/types';
import { runJsonMode, formatWatchedDataForPrompt } from './gemini';
import { getTMDbDetails, searchByTitleAndYear } from './tmdb';
import type { FunctionDeclarationSchema } from "@google/generative-ai";
import { SchemaType } from "@google/generative-ai";

export type ChatMessage = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

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
                        title: { type: SchemaType.STRING },
                        year: { type: SchemaType.INTEGER },
                        media_type: { type: SchemaType.STRING, enum: ['movie', 'tv'], format: "enum" },
                        analysis: { type: SchemaType.STRING },
                        synopsis: { type: SchemaType.STRING },
                        genre: { type: SchemaType.STRING },
                        type: { type: SchemaType.STRING, enum: ['Filme', 'Série', 'Anime', 'Programa'], format: "enum" },
                        probabilities: { type: SchemaType.OBJECT, properties: {} }
                    },
                },
                list: {
                    type: SchemaType.ARRAY,
                    description: "Uma lista de itens. Importante: os itens DEVERIAM ser do desafio ou watchlist se perguntado.",
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

export const getAdvancedAIChatResponse = async (
    currentMessage: string,
    history: ChatMessage[]
) => {
    try {
        console.log("--- AÇÃO DO CHAT INICIADA ---");
        
        // Coleta de Dados
        const watchedItems = await getWatchedItems();
        const watchedData: AllManagedWatchedData = watchedItems.reduce((acc, item) => {
            const rating = item.rating || 'meh';
            acc[rating].push(item);
            return acc;
        }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);

        const watchlistItems = await getWatchlistItems();
        const now = new Date();
        const weekId = `${now.getFullYear()}-${Math.ceil((((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)}`;
        const challengeSnap = await getDoc(doc(db, 'challenges', weekId));
        const challenge: Challenge | null = challengeSnap.exists() ? challengeSnap.data() as Challenge : null;
        const relevantsSnap = await getDoc(doc(db, 'weeklyRelevants', 'currentList'));
        const weeklyRelevants: WeeklyRelevants | null = relevantsSnap.exists() ? relevantsSnap.data() as WeeklyRelevants : null;
    
        const tasteProfile = await formatWatchedDataForPrompt(watchedData);
        const watchlistText = watchlistItems.map(item => `- ${item.title} (ID: ${item.id})`).join('\n') || 'Nenhuma';
        const challengeText = challenge ? `Desafio "${challenge.challengeType}": ${challenge.reason}\nItens do desafio:\n${challenge.steps.map(s => `- ${s.title} (ID: ${s.tmdbId})`).join('\n')}` : 'Nenhum desafio ativo';
        const relevantsText = weeklyRelevants?.categories.map(cat => `Categoria "${cat.categoryTitle}":\n` + cat.items.map(i => `- ${i.title} (ID: ${i.id})`).join('\n')).join('\n\n') || 'Nenhuma lista de relevantes encontrada';

        // Prompt com instruções mais rígidas
        const prompt = `
            Você é o CineGênio, um assistente especialista.
            Analise o contexto e o histórico para responder à última mensagem do usuário.
            Sempre retorne no formato JSON definido. Decida o 'type' da resposta ('text', 'recommendation', 'list') com base na intenção.

            **REGRA CRÍTICA:** Se o usuário pedir para listar itens de uma seção específica (ex: "quais os filmes do desafio?"), sua resposta DEVE ser do tipo 'list' e o campo 'data.list' DEVE conter os itens EXATOS daquela seção, usando os IDs fornecidos no contexto. NÃO invente itens.

            ### CONTEXTO DO USUÁRIO ###
            # PERFIL DE GOSTO:
            ${tasteProfile}
            # ITENS NA WATCHLIST:
            ${watchlistText}
            # DESAFIO DA SEMANA ATUAL:
            ${challengeText}
            # RELEVANTES DESTA SEMANA:
            ${relevantsText}

            ### HISTÓRICO DA CONVERSA RECENTE ###
            ${history.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n')}

            ### MENSAGEM ATUAL DO USUÁRIO ###
            user: ${currentMessage}
        `;

        const aiResponse = await runJsonMode(prompt, chatResponseSchema) as { type: 'text' | 'recommendation' | 'list', data: { text?: string; recommendation?: any; list?: any[] } };
        
        console.log("RAW AI Response:", JSON.stringify(aiResponse, null, 2));

        // Validação e Enriquecimento para RECOMENDAÇÃO ÚNICA
        if (aiResponse.type === 'recommendation' && aiResponse.data.recommendation) {
            console.log("Enriquecendo a recomendação com dados do TMDb...");
            const rec = aiResponse.data.recommendation;
            const tmdbResult = await searchByTitleAndYear(rec.title, rec.year, rec.media_type);
            if (tmdbResult) {
                aiResponse.data.recommendation.id = tmdbResult.id;
                aiResponse.data.recommendation.posterUrl = tmdbResult.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}` : undefined;
            }
        }

        // NOVA VALIDAÇÃO E ENRIQUECIMENTO PARA LISTAS
        if (aiResponse.type === 'list' && aiResponse.data.list) {
            console.log("Enriquecendo a lista com dados do TMDb...");
            const enrichedList = await Promise.all(
                aiResponse.data.list.map(async (item: any) => {
                    if (!item.id || !item.tmdbMediaType) return item; // Retorna o item como está se faltar dados
                    try {
                        const details = await getTMDbDetails(item.id, item.tmdbMediaType);
                        return {
                            ...item,
                            title: details.title || details.name,
                            posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
                        };
                    } catch {
                        return item; // Se a busca falhar, retorna o item original
                    }
                })
            );
            aiResponse.data.list = enrichedList;
        }
        
        console.log("Processamento concluído.");
        return aiResponse;

    } catch (error) {
        console.error("ERRO CRÍTICO NA SERVER ACTION DO CHAT:", error);
        return { type: 'text', data: { text: "Desculpe, ocorreu um erro no servidor ao processar sua solicitação." } };
    }
};