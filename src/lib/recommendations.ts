// src/lib/recommendations.ts

import { 
    AllManagedWatchedData,  
    Recommendation,  
    DuelResult, 
    RadarItem, 
    SuggestionFilters 
} from '@/types';

import { 
    searchTMDb,
    getTMDbDetails, 
    getUpcomingMovies, 
    getOnTheAirTV, 
    fetchPosterUrl,
    searchByTitleAndYear // Importação importante para a busca precisa
} from './tmdb';

import { 
    formatWatchedDataForPrompt, 
    fetchRecommendation, 
    fetchDuelAnalysis, 
    fetchPersonalizedRadar, 
    fetchLoveProbability 
} from './gemini';


// --- Funções de Orquestração ---

export const getRandomSuggestion = async (watchedData: AllManagedWatchedData, sessionExclude: string[] = []): Promise<Recommendation> => {
    const formattedData = await formatWatchedDataForPrompt(watchedData);
    
    const prompt = `Você é o "CineGênio Pessoal", um especialista em cinema. Analise o perfil de gosto do usuário e forneça UMA recomendação de filme ou série que ele provavelmente não conhece.

    **REGRA MAIS IMPORTANTE: NÃO INVENTE FILMES OU SÉRIES. Todos os títulos sugeridos devem existir de verdade e serem encontrados em bases de dados como o TMDb.**

    **LISTA DE EXCLUSÃO (NÃO SUGERIR NENHUM DESTES):**
    ${formattedData}
    ${sessionExclude.join('\n')}

    **PERFIL DO USUÁRIO (Use como inspiração):**
    ${formattedData}`;;
    
    const aiData = await fetchRecommendation(prompt);

    const titleWithoutYear = aiData.title.replace(/\s*\(\d{4}\)\s*/, '');
    const yearMatch = aiData.title.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    
    // Tentativa 1: Busca Precisa
    let tmdbResult = await searchByTitleAndYear(titleWithoutYear, year, aiData.tmdbMediaType);

    // Tentativa 2 (Fallback): Se a busca precisa falhar, tenta uma busca genérica
    if (!tmdbResult) {
        console.warn(`Busca precisa falhou para "${aiData.title}". Tentando busca genérica...`);
        const genericResults = await searchTMDb(titleWithoutYear);
        tmdbResult = genericResults[0] || null;
    }

    if (!tmdbResult) {
        throw new Error(`A IA sugeriu "${aiData.title}", mas não foi encontrado um resultado preciso no TMDb.`);
    }

    const details = await getTMDbDetails(tmdbResult.id, tmdbResult.media_type as 'movie'|'tv');
    const releaseDate = details.release_date || details.first_air_date;
    const finalYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

    return {
        ...aiData,
        id: details.id,
        tmdbMediaType: details.media_type as 'movie' | 'tv',
        title: `${details.title || details.name} (${finalYear})`,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
        genre: details.genres?.[0]?.name || 'Indefinido',
        synopsis: details.overview || aiData.synopsis,
        type: details.media_type === 'movie' ? 'Filme' : 'Série'
    };
};

export const getPersonalizedSuggestion = async (watchedData: AllManagedWatchedData, filters: SuggestionFilters, sessionExclude: string[] = []): Promise<Recommendation> => {
    const formattedData = await formatWatchedDataForPrompt(watchedData);
    const prompt = `Você é o "CineGênio Pessoal", um especialista em cinema. Encontre a recomendação PERFEITA que se encaixe nos filtros do usuário.

    **REGRA MAIS IMPORTANTE: NÃO INVENTE FILMES OU SÉRIES. Todos os títulos sugeridos devem existir de verdade e serem encontrados em bases de dados como o TMDb.**

    **LISTA DE EXCLUSÃO (NÃO SUGERIR NENHUM DESTES):**
    ${formattedData}
    ${sessionExclude.join('\n')}

    **FILTROS DO USUÁRIO (Prioridade máxima):**
    - Categoria: ${filters.category || 'Qualquer'}
    - Gêneros: ${filters.genres.join(', ') || 'Qualquer'}
    - Palavras-chave: ${filters.keywords || 'Nenhuma'}

    **PERFIL DO USUÁRIO (Use como inspiração):**
    ${formattedData}`;

    const aiData = await fetchRecommendation(prompt);

    const titleWithoutYear = aiData.title.replace(/\s*\(\d{4}\)\s*/, '');
    const yearMatch = aiData.title.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

    // Tentativa 1: Busca Precisa
    let tmdbResult = await searchByTitleAndYear(titleWithoutYear, year, aiData.tmdbMediaType);

    // Tentativa 2 (Fallback): Se a busca precisa falhar, tenta uma busca genérica
    if (!tmdbResult) {
        console.warn(`Busca precisa falhou para "${aiData.title}". Tentando busca genérica...`);
        const genericResults = await searchTMDb(titleWithoutYear);
        tmdbResult = genericResults[0] || null;
    }
    
    if (!tmdbResult) {
        throw new Error(`A IA sugeriu "${aiData.title}", mas não foi encontrado um resultado preciso no TMDb.`);
    }

    const details = await getTMDbDetails(tmdbResult.id, tmdbResult.media_type as 'movie'|'tv');
    const releaseDate = details.release_date || details.first_air_date;
    const finalYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    
    return {
        ...aiData,
        id: details.id,
        tmdbMediaType: details.media_type as 'movie' | 'tv',
        title: `${details.title || details.name} (${finalYear})`,
        posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
        genre: details.genres?.[0]?.name || 'Indefinido',
        synopsis: details.overview || aiData.synopsis,
        type: details.media_type === 'movie' ? 'Filme' : 'Série'
    };
};

export const getPredictionAsRecommendation = async (item: { id: number; mediaType: 'movie' | 'tv' }, watchedData: AllManagedWatchedData): Promise<Recommendation> => {
    const details = await getTMDbDetails(item.id, item.mediaType);
    const title = details.title || details.name;

    const formattedData = await formatWatchedDataForPrompt(watchedData);
    const prompt = `Você é o "CineGênio Pessoal". Sua tarefa é analisar o título "${title}" e prever se o usuário vai gostar, com base no perfil de gosto dele. Use a busca na internet para encontrar informações sobre "${title}" (gênero, enredo, temas).

**PERFIL DO USUÁRIO:**
${formattedData}

**Sua Tarefa:**
Analise "${title}" e gere uma resposta completa no formato JSON, seguindo o schema, com probabilidades de gosto e uma análise detalhada.`;

    const recommendationData = await fetchRecommendation(prompt);
    const posterUrl = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined;
    return { ...recommendationData, title, posterUrl };
};

export const getLoveProbability = async (title: string, watchedData: AllManagedWatchedData): Promise<number> => {
    const formattedData = await formatWatchedDataForPrompt(watchedData);
    const prompt = `Você é o "CineGênio Pessoal". Analise o título "${title}" e preveja a probabilidade (0-100) de o usuário AMAR este título, com base no perfil de gosto dele. Retorne APENAS a probabilidade.

**PERFIL DO USUÁRIO:**
${formattedData}`;
    return await fetchLoveProbability(prompt);
}

export const getDuelAnalysis = async (item1: { id: number; mediaType: 'movie' | 'tv' }, item2: { id: number; mediaType: 'movie' | 'tv' }, watchedData: AllManagedWatchedData): Promise<DuelResult> => {
    const [details1, details2] = await Promise.all([
        getTMDbDetails(item1.id, item1.mediaType),
        getTMDbDetails(item2.id, item2.mediaType)
    ]);
    const title1 = details1.title || details1.name;
    const title2 = details2.title || details2.name;
    const formattedData = await formatWatchedDataForPrompt(watchedData);
    const prompt = `Você é o "CineGênio Pessoal". Sua tarefa é analisar um confronto entre dois títulos: "${title1}" e "${title2}". Compare ambos com o perfil de gosto do usuário e determine qual ele provavelmente preferiria. Use a busca na internet para encontrar informações sobre ambos os títulos.

**PERFIL DO USUÁRIO:**
${formattedData}`;

    const result = await fetchDuelAnalysis(prompt);
    const [poster1, poster2] = await Promise.all([
        fetchPosterUrl(result.title1.title),
        fetchPosterUrl(result.title2.title)
    ]);
    result.title1.posterUrl = poster1 ?? undefined;
    result.title2.posterUrl = poster2 ?? undefined;
    return result;
};

export const getPersonalizedRadar = async (watchedData: AllManagedWatchedData): Promise<RadarItem[]> => {
    const [movies, tvShows] = await Promise.all([getUpcomingMovies(), getOnTheAirTV()]);
    const allReleases = [...movies, ...tvShows];
    const releasesForPrompt = allReleases.map(r => `- ${r.title || r.name} (ID: ${r.id}, Tipo: ${r.media_type})`).join('\n');
    const formattedData = await formatWatchedDataForPrompt(watchedData);

    const prompt = `Você é o "CineGênio Pessoal". Sua tarefa é analisar uma lista de próximos lançamentos e séries no ar, e selecionar até 10 que sejam mais relevantes para o usuário, com base no seu perfil de gosto.

**PERFIL DO USUÁRIO:**
${formattedData}

**LISTA DE LANÇAMENTOS:**
${releasesForPrompt}`;

    const result = await fetchPersonalizedRadar(prompt);
    
    const enrichedReleases = await Promise.all(result.releases.map(async (release) => {
        const originalRelease = allReleases.find(r => r.id === release.id);
        return {
            id: release.id,
            tmdbMediaType: release.tmdbMediaType,
            title: release.title,
            reason: release.reason,
            posterUrl: originalRelease?.poster_path ? `https://image.tmdb.org/t/p/w500${originalRelease.poster_path}` : undefined,
            releaseDate: originalRelease?.release_date || originalRelease?.first_air_date || 'Em breve',
            type: release.tmdbMediaType,
            listType: 'upcoming'
        } as RadarItem;
    }));
    return enrichedReleases;
};