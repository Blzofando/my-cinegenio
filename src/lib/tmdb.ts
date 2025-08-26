// src/lib/tmdb.ts

import { WatchProviders, TMDbSearchResult, WatchProvider } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestQueue: (() => Promise<any>)[] = [];
let isProcessing = false;
const DELAY_BETWEEN_REQUESTS = 250;

const processQueue = async () => {
    if (isProcessing || requestQueue.length === 0) return;
    isProcessing = true;
    const requestTask = requestQueue.shift();
    if (requestTask) {
        try {
            await requestTask();
        } catch {
            // Silencioso, o erro é tratado na chamada original
        }
    }
    setTimeout(() => {
        isProcessing = false;
        processQueue();
    }, DELAY_BETWEEN_REQUESTS);
};

const addToQueue = <T>(requestFn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        const task = () => requestFn().then(resolve).catch(reject);
        requestQueue.push(task);
        if (!isProcessing) processQueue();
    });
};

const internalSearchByTitleAndYear = async (title: string, year: number, mediaType: 'movie' | 'tv'): Promise<TMDbSearchResult | null> => {
    const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
    const yearParam = mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    const url = `${BASE_URL}/search/${endpoint}?query=${encodeURIComponent(title)}&${yearParam}=${year}&include_adult=false&language=pt-BR&page=1&api_key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Busca por ${title} (${year}) falhou com status: ${response.status}`);
        return null;
    }
    const data = await response.json();
    const result = data.results?.[0];
    if (result) {
        result.media_type = mediaType;
        return result;
    }
    return null;
};

const internalSearchTMDb = async (query: string): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=pt-BR&page=1&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`A busca no TMDb falhou com o status: ${response.status}`);
    const data = await response.json();
    return data.results?.filter((r: { media_type: string }) => (r.media_type === 'movie' || r.media_type === 'tv')) || [];
};

const internalGetTMDbDetails = async (id: number, mediaType: 'movie' | 'tv') => {
    const primaryUrl = `${BASE_URL}/${mediaType}/${id}?language=pt-BR&api_key=${API_KEY}&append_to_response=watch/providers,credits`;
    let response = await fetch(primaryUrl);

    if (response.status === 404) {
        console.warn(`[TMDbService] ID ${id} não encontrado como '${mediaType}'. Tentando tipo oposto.`);
        const fallbackMediaType = mediaType === 'movie' ? 'tv' : 'movie';
        const fallbackUrl = `${BASE_URL}/${fallbackMediaType}/${id}?language=pt-BR&api_key=${API_KEY}&append_to_response=watch/providers,credits`;
        response = await fetch(fallbackUrl);
    }
    
    if (response.status === 404) {
        const fallbackUrlEn = `${BASE_URL}/${mediaType}/${id}?language=en-US&api_key=${API_KEY}&append_to_response=watch/providers,credits`;
        response = await fetch(fallbackUrlEn);
    }

    if (!response.ok) {
        throw new Error(`A busca de detalhes no TMDb falhou com o status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.media_type) {
        const successfulUrl = new URL(response.url);
        data.media_type = successfulUrl.pathname.split('/')[2];
    }
    return data;
};

const internalGetUpcomingMovies = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/movie/upcoming?language=pt-BR&page=1&region=BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`A busca de próximos lançamentos de filmes falhou: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

const internalGetOnTheAirTV = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/tv/on_the_air?language=pt-BR&page=1&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`A busca de séries no ar falhou: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

const internalGetNowPlayingMovies = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/movie/now_playing?language=pt-BR&page=1&region=BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar filmes nos cinemas: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

const internalGetTopRatedOnProvider = async (providerId: number): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/discover/movie?language=pt-BR&watch_region=BR&sort_by=popularity.desc&with_watch_providers=${providerId}&page=1&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar Top 10 do provedor: ${response.status}`);
    const data = await response.json();
    return data.results?.slice(0, 10) || [];
};

const internalGetTrending = async (): Promise<TMDbSearchResult[]> => {
    const url = `${BASE_URL}/trending/all/week?language=pt-BR&api_key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar tendências: ${response.status}`);
    const data = await response.json();
    return data.results || [];
};

export const searchByTitleAndYear = (title: string, year: number, mediaType: 'movie' | 'tv') => {
    return addToQueue(() => internalSearchByTitleAndYear(title, year, mediaType));
};

export const searchTMDb = (query: string) => { 
    return addToQueue(() => internalSearchTMDb(query)); 
};

export const getTMDbDetails = (id: number, mediaType: 'movie' | 'tv') => {
    return addToQueue(() => internalGetTMDbDetails(id, mediaType));
};

type TMDbProviderData = {
  'watch/providers'?: {
    results?: {
      BR?: {
        link: string;
        flatrate?: WatchProvider[];
      };
    };
  };
};
export const getProviders = (data: TMDbProviderData): WatchProviders | undefined => {
    const providers = data?.['watch/providers']?.results?.BR;
    if (!providers) return undefined;
    return {
        link: providers.link,
        flatrate: providers.flatrate,
    };
};

export const fetchPosterUrl = async (title: string): Promise<string | null> => {
    try {
        const results = await searchTMDb(title.replace(/\s*\(\d{4}\)\s*/, ''));
        const bestResult = results?.[0];
        if (bestResult && bestResult.poster_path) {
            return `https://image.tmdb.org/t/p/w500${bestResult.poster_path}`;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching poster for "${title}":`, error);
        return null; 
    }
};

export const getUpcomingMovies = () => {
    return addToQueue(() => internalGetUpcomingMovies());
};

export const getOnTheAirTV = () => {
    return addToQueue(() => internalGetOnTheAirTV());
};

export const getNowPlayingMovies = () => {
    return addToQueue(() => internalGetNowPlayingMovies());
};

export const getTopRatedOnProvider = (id: number) => {
    return addToQueue(() => internalGetTopRatedOnProvider(id));
};

export const getTrending = () => {
    return addToQueue(() => internalGetTrending());
};