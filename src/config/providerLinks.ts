// src/config/providerLinks.ts

"use client"; // Funções que interagem com 'window' precisam rodar no cliente.

export type ProviderDeepLink = {
    scheme: string;   // deep link do app
    fallback: string; // fallback web
};

// Mapeamento dos provedores (keys padronizadas)
export const providerDeepLinks: Record<string, ProviderDeepLink> = {
    netflix: { scheme: "nflx://", fallback: "https://www.netflix.com" },
    prime: { scheme: "primevideo://", fallback: "https://www.primevideo.com" },
    disney: { scheme: "disneyplus://", fallback: "https://www.disneyplus.com" },
    star: { scheme: "starplus://", fallback: "https://www.starplus.com" },
    max: { scheme: "hbomax://", fallback: "https://www.max.com" },
    appletv: { scheme: "tv://", fallback: "https://tv.apple.com" },
    paramount: { scheme: "paramountplus://", fallback: "https://www.paramountplus.com" },
    globoplay: { scheme: "globoplay://", fallback: "https://globoplay.globo.com" },
    crunchyroll: { scheme: "crunchyroll://", fallback: "https://www.crunchyroll.com" },
    youtube: { scheme: "vnd.youtube://", fallback: "https://www.youtube.com" },
    claro: { scheme: "clarovideo://", fallback: "https://www.clarovideo.com" },
    looke: { scheme: "looke://", fallback: "https://www.looke.com.br" }
};

// Mapeamento dos nomes que vêm da API do TMDB para as nossas keys
export const tmdbProviderMap: Record<string, string> = {
    "Netflix": "netflix",
    "Amazon Prime Video": "prime",
    "Disney Plus": "disney",
    "Star Plus": "star",
    "Max": "max",
    "HBO Max": "max",
    "Apple TV Plus": "appletv",
    "Apple TV+": "appletv",
    "Paramount Plus": "paramount",
    "Paramount+": "paramount",
    "Globoplay": "globoplay",
    "Crunchyroll": "crunchyroll",
    "YouTube": "youtube",
    "Claro video": "claro",
    "Looke": "looke",
};

function openProviderLink(providerKey: string) {
    const provider = providerDeepLinks[providerKey];
    if (!provider) {
        console.warn(`Provedor ${providerKey} não mapeado.`);
        return;
    }

    // Tenta redirecionar para o deep link do app.
    window.location.href = provider.scheme;

    const start = Date.now();

    // Define um fallback para o site se o app não responder em 2 segundos.
    setTimeout(() => {
        const end = Date.now();
        if (document.hasFocus() && (end - start < 2200)) {
            window.location.href = provider.fallback;
        }
    }, 2000); 
}

// Função principal que será usada nos componentes
export function openProviderLinkFromTmdbName(tmdbName: string) {
    const providerKey = tmdbProviderMap[tmdbName];
    if (!providerKey) {
        console.warn(`Provedor "${tmdbName}" não mapeado.`);
        // Se não encontrarmos, abre uma busca no Google como fallback.
        const fallbackUrl = "https://www.google.com/search?q=" + encodeURIComponent(tmdbName);
        window.open(fallbackUrl, '_blank');
        return;
    }
    openProviderLink(providerKey);
}