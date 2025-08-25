// src/types.ts (Completo e Corrigido)

export type MediaType = 'Filme' | 'Série' | 'Anime' | 'Programa';
export type Rating = 'amei' | 'gostei' | 'meh' | 'naoGostei';

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  link: string;
  flatrate?: WatchProvider[];
}

export interface WatchedItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
}

export interface ManagedWatchedItem extends WatchedItem {
  rating: Rating;
  synopsis?: string;
  createdAt: number;
  posterUrl?: string;
  voteAverage?: number;
  watchProviders?: WatchProviders;
}

export interface WatchlistItem {
    id: number;
    tmdbMediaType: 'movie' | 'tv';
    title: string;
    posterUrl?: string;
    addedAt: number;
    loveProbability?: number;
    // Campos adicionados para o cache de detalhes
    synopsis?: string;
    watchProviders?: WatchProviders;
    genre?: string;
    voteAverage?: number;
    type?: MediaType;
}

// ESTRUTURA DO DESAFIO ATUALIZADA
export interface ChallengeStep {
    title: string; // Título já formatado com o ano
    tmdbId: number;
    tmdbMediaType: 'movie' | 'tv'; // Tipo de mídia guardado
    posterUrl?: string; // Pôster já guardado
    completed: boolean;
}

export interface Challenge {
    id: string; 
    challengeType: string;
    reason: string;
    status: 'active' | 'completed' | 'lost';
    // Um desafio agora é sempre uma lista de passos, mesmo que tenha apenas um.
    steps: ChallengeStep[];
}


export interface RadarItem {
    id: number;
    tmdbMediaType: 'movie' | 'tv';
    title: string;
    posterUrl?: string;
    releaseDate: string;
    type: 'movie' | 'tv';
    listType: 'upcoming' | 'now_playing' | 'top_rated_provider' | 'trending'; 
    providerId?: number;
    nextEpisodeToAir?: {
        air_date: string;
        episode_number: number;
        season_number: number;
    };
    reason?: string; // <--- ADICIONE ESTA LINHA
}
export type TMDbRadarItem = RadarItem;
export type RelevantRadarItem = RadarItem;

export type AllManagedWatchedData = {
  [key in Rating]: ManagedWatchedItem[];
};

export interface Recommendation {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
  synopsis: string;
  probabilities: {
    amei: number;
    gostei: number;
    meh: number;
    naoGostei: number;
  };
  analysis: string;
  posterUrl?: string;
}

export interface DuelResult {
    title1: {
        title: string;
        posterUrl?: string;
        analysis: string;
        probability: number;
    };
    title2: {
        title: string;
        posterUrl?: string;
        analysis: string;
        probability: number;
    };
    verdict: string;
}

export interface TMDbSearchResult {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    popularity: number;
    media_type: 'movie' | 'tv';
    poster_path: string | null;
    genre_ids: number[];
    release_date?: string;
    first_air_date?: string;
}

export type SuggestionFilters = {
    category: MediaType | null;
    genres: string[];
    keywords: string;
};

// --- NOVOS TIPOS PARA "RELEVANTES DA SEMANA" ---

export interface WeeklyRelevantItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
  genre: string;
  synopsis: string;
  reason: string; // O motivo pelo qual a IA recomendou este item
}

export interface WeeklyRelevantCategory {
  categoryTitle: string;
  items: WeeklyRelevantItem[];
}

export interface WeeklyRelevants {
  generatedAt: number; // Usaremos um timestamp para saber quando a lista foi gerada
  categories: WeeklyRelevantCategory[];
}

export enum View {
  MENU,
  RANDOM,
  SUGGESTION,
  PREDICT,
  COLLECTION,
  STATS,
  WATCHLIST,
  DUEL,
  RADAR,
  WEEKLY_RELEVANTS,
  CHALLENGE,
  CHAT
}

// --- NOVO TIPO PARA O MODAL COMPARTILHADO ---
export interface DisplayableItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
}