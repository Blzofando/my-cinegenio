// src/lib/radar.ts

"use server";

import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { AllManagedWatchedData, RelevantRadarItem, TMDbRadarItem, TMDbSearchResult } from '@/types';
import { getNowPlayingMovies, getOnTheAirTV, getTopRatedOnProvider, getTrending, getUpcomingMovies } from './tmdb';
import { fetchPersonalizedRadar, formatWatchedDataForPrompt } from './gemini';
import { setRelevantReleases, setTMDbRadarCache, getWatchedItems } from './firestore';

// --- LÓGICA PARA O RADAR GERAL (TMDb) ---

const METADATA_TMDb_ID = 'tmdbRadarMetadata';
const UPDATE_INTERVAL_DAYS_TMDb = 1;

const shouldUpdateTMDbRadar = async (): Promise<boolean> => {
    const metadataRef = doc(db, 'metadata', METADATA_TMDb_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados do Radar TMDb não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp).toDate();
    const daysSinceLastUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLastUpdate >= UPDATE_INTERVAL_DAYS_TMDb) {
        console.log(`Já se passaram ${daysSinceLastUpdate.toFixed(1)} dias. Nova atualização do Radar TMDb necessária.`);
        return true;
    }

    console.log(`Cache do Radar TMDb está atualizado. Última atualização há ${daysSinceLastUpdate.toFixed(1)} dias.`);
    return false;
};

const toTMDbRadarItem = (item: TMDbSearchResult, listType: TMDbRadarItem['listType'], providerId?: number): TMDbRadarItem | null => {
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return null;
    
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const fullTitle = item.title || item.name;
    const yearRegex = /\(\d{4}\)/;
    const titleWithYear = yearRegex.test(fullTitle || '') 
        ? fullTitle 
        : `${fullTitle} (${new Date(releaseDate).getFullYear()})`;

    const radarItem: TMDbRadarItem = {
        id: item.id,
        tmdbMediaType: mediaType,
        title: titleWithYear || 'Título Desconhecido',
        releaseDate: releaseDate,
        type: mediaType,
        listType: listType,
    };
    
    if (item.poster_path) {
        radarItem.posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }
    if (providerId) {
        radarItem.providerId = providerId;
    }
    
    return radarItem;
};

export const updateTMDbRadarCache = async (): Promise<void> => {
    if (!(await shouldUpdateTMDbRadar())) return;

    console.log("SERVER ACTION: Iniciando atualização do cache do Radar TMDb...");

    const PROVIDER_IDS = { netflix: 8, prime: 119, max: 1899, disney: 337 };

    try {
        const [ nowPlayingMovies, trending, topNetflix, topPrime, topMax, topDisney ] = await Promise.all([
            getNowPlayingMovies(),
            getTrending(),
            getTopRatedOnProvider(PROVIDER_IDS.netflix),
            getTopRatedOnProvider(PROVIDER_IDS.prime),
            getTopRatedOnProvider(PROVIDER_IDS.max),
            getTopRatedOnProvider(PROVIDER_IDS.disney)
        ]);

        const allItems = [
            ...nowPlayingMovies.map(m => toTMDbRadarItem(m, 'now_playing')),
            ...trending.map(t => toTMDbRadarItem(t, 'trending')),
            ...topNetflix.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.netflix)),
            ...topPrime.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.prime)),
            ...topMax.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.max)),
            ...topDisney.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.disney))
        ].filter((i): i is TMDbRadarItem => !!i);

        const allItemsMap = new Map<string, TMDbRadarItem>();
        allItems.forEach(item => {
            const uniqueId = `${item.listType}-${item.providerId || ''}-${item.id}`;
            if (!allItemsMap.has(uniqueId)) {
                allItemsMap.set(uniqueId, item);
            }
        });

        await setTMDbRadarCache(Array.from(allItemsMap.values()));
        await setDoc(doc(db, 'metadata', METADATA_TMDb_ID), { lastUpdate: new Date() });

        console.log(`Cache do Radar TMDb atualizado! ${allItemsMap.size} itens salvos.`);
    } catch (error) {
        console.error("Falha ao atualizar o cache do Radar TMDb:", error);
    }
};

// --- LÓGICA PARA O RADAR RELEVANTE (IA) ---

const METADATA_RELEVANT_ID = 'relevantRadarMetadata';
const UPDATE_INTERVAL_DAYS_RELEVANT = 7;

const shouldUpdateRelevantRadar = async (): Promise<boolean> => {
    const metadataRef = doc(db, 'metadata', METADATA_RELEVANT_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados do Radar Relevante não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp)?.toDate() || new Date(0);
    const daysSinceLastUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLastUpdate >= UPDATE_INTERVAL_DAYS_RELEVANT) {
        console.log(`Já se passaram ${daysSinceLastUpdate.toFixed(1)} dias. Nova atualização do Radar Relevante (IA) necessária.`);
        return true;
    }

    console.log(`Cache do Radar Relevante está atualizado. Última atualização há ${daysSinceLastUpdate.toFixed(1)} dias.`);
    return false;
};

const toRelevantRadarItem = (item: TMDbSearchResult, reason: string): RelevantRadarItem | null => {
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return null;

    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const fullTitle = item.title || item.name;
    const yearRegex = /\(\d{4}\)/;
    const titleWithYear = yearRegex.test(fullTitle || '') 
        ? fullTitle 
        : `${fullTitle} (${new Date(releaseDate).getFullYear()})`;
    
    const radarItem: RelevantRadarItem = {
        id: item.id,
        tmdbMediaType: mediaType,
        title: titleWithYear || 'Título Desconhecido',
        releaseDate: releaseDate,
        type: mediaType,
        reason: reason,
        listType: 'upcoming',
    };

    if (item.poster_path) {
        radarItem.posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }
    
    return radarItem;
};

export const updateRelevantReleases = async (): Promise<void> => {
    if (!(await shouldUpdateRelevantRadar())) return;

    console.log("SERVER ACTION: Iniciando atualização do Radar Relevante (IA)...");
    try {
        const watchedItems = await getWatchedItems();
        const watchedData: AllManagedWatchedData = {
            amei: watchedItems.filter(i => i.rating === 'amei'),
            gostei: watchedItems.filter(i => i.rating === 'gostei'),
            meh: watchedItems.filter(i => i.rating === 'meh'),
            naoGostei: watchedItems.filter(i => i.rating === 'naoGostei'),
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [upcomingMovies, onTheAirShows] = await Promise.all([getUpcomingMovies(), getOnTheAirTV()]);

        const futureContent = [...upcomingMovies, ...onTheAirShows].filter(item => {
            const releaseDate = new Date(item.release_date || item.first_air_date || '');
            return releaseDate >= today;
        });

        if (futureContent.length === 0) {
            console.log("Nenhum conteúdo futuro encontrado para análise da IA.");
            return;
        }
        
        const releasesForPrompt = futureContent.map(r => `- ${r.title || r.name} (ID: ${r.id})`).join('\n');
        const formattedData = await formatWatchedDataForPrompt(watchedData);
        const prompt = `Analise o perfil e a lista de lançamentos e selecione até 20 que sejam mais relevantes.\n\n**PERFIL:**\n${formattedData}\n\n**LANÇAMENTOS:**\n${releasesForPrompt}`;
        
        const aiResult = await fetchPersonalizedRadar(prompt);

        const relevantItems = aiResult.releases
            .map(release => {
                const original = futureContent.find(r => r.id === release.id);
                return original ? toRelevantRadarItem(original, release.reason) : null;
            })
            .filter((item): item is RelevantRadarItem => item !== null);
        
        await setRelevantReleases(relevantItems);
        await setDoc(doc(db, 'metadata', METADATA_RELEVANT_ID), { lastUpdate: new Date() });

        console.log(`Radar Relevante (IA) atualizado! ${relevantItems.length} itens salvos.`);
    } catch (error) {
        console.error("Falha ao atualizar o Radar Relevante (IA):", error);
    }
};