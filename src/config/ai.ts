// @/src/config/ai.ts

type AIProvider = 'gemini' | 'openai';

// --- PAINEL DE CONTROLE PRINCIPAL ---
/**
 * Altere esta variável para 'openai' para usar o ChatGPT em todo o aplicativo,
 * ou 'gemini' para usar o Google Gemini.
 * Esta é a única chave que você precisa mudar para trocar o provedor de IA.
 */
export const ACTIVE_AI_PROVIDER: AIProvider = 'openai';

// --- Modelos Específicos por Função ---
/**
 * Aqui você pode definir os modelos exatos que cada serviço (gemini, openai)
 * usará para cada função específica (chat, recommendation).
 * Isso permite otimizar o custo e o desempenho para cada tarefa.
 */
export const AI_MODELS = {
  gemini: {
    
    chat: 'gemini-2.5-pro',
    
    recommendation: 'gemini-2.5-flash',

    challenge: 'gemini-2.5-pro',

    probability: 'gemini-2.5-flash',

    personalizedRadar: 'gemini-2.5-pro',

    weeklyRelevants: 'gemini-2.5-pro',

    duel: 'gemini-2.5-flash',

    tmdbMatch: 'gemini-2.5-flash',
    // Adicione outros modelos para outras funções aqui.
  },
  openai: {
    
    chat: 'gpt-5-mini',
    
    recommendation: 'gpt-5-nano',

    challenge: 'gpt-5-mini',

    probability: 'gpt-5-nano',

    personalizedRadar: 'gpt-5-mini',

    weeklyRelevants: 'gpt-5-mini',

    duel: 'gpt-5-nano',

    tmdbMatch: 'gpt-5-nano',
  },
};


