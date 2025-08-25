// src/app/chat/page.tsx

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Hook de navegação do Next.js
import { SuggestionFilters, MediaType } from '@/types';

export default function ChatPage() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter(); // Inicializa o roteador

    const handleSendMessage = () => {
        const lowerCaseMessage = message.toLowerCase();
        setError(null);
        
        // Navegação simples para outras páginas
        if (lowerCaseMessage.includes('coleção')) return router.push('/collection');
        if (lowerCaseMessage.includes('lista') || lowerCaseMessage.includes('watchlist')) return router.push('/watchlist');
        if (lowerCaseMessage.includes('duelo')) return router.push('/duel');
        if (lowerCaseMessage.includes('radar') || lowerCaseMessage.includes('lançamentos')) return router.push('/radar');
        if (lowerCaseMessage.includes('desafio')) return router.push('/challenge');

        // Lógica de extração de filtros para a página de sugestão
        if (lowerCaseMessage.includes('sugestão') || lowerCaseMessage.includes('recomenda')) {
            let textToProcess = ` ${lowerCaseMessage} `;
            
            const categories: { [key: string]: MediaType } = { 'filme': 'Filme', 'série': 'Série', 'anime': 'Anime', 'programa': 'Programa' };
            const genres = ['ação', 'comédia', 'drama', 'ficção científica', 'suspense', 'terror', 'romance', 'aventura', 'mistério', 'fantasia'];
            const junkWords = ['quero', 'uma', 'um', 'sugestão', 'de', 'recomenda', 'me', 'dá', 'pra'];

            const foundFilters: SuggestionFilters = { category: null, genres: [], keywords: '' };

            // Procura e remove a categoria
            for (const key in categories) {
                if (textToProcess.includes(` ${key} `)) {
                    foundFilters.category = categories[key];
                    textToProcess = textToProcess.replace(` ${key} `, ' ');
                }
            }

            // Procura e remove os gêneros
            for (const genre of genres) {
                if (textToProcess.includes(` ${genre} `)) {
                    const capitalizedGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
                    foundFilters.genres.push(capitalizedGenre);
                    textToProcess = textToProcess.replace(` ${genre} `, ' ');
                }
            }
            
            // Remove as palavras de preenchimento
            junkWords.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'g');
                textToProcess = textToProcess.replace(regex, '');
            });

            // O que sobra, limpo, vira palavra-chave
            foundFilters.keywords = textToProcess.trim().replace(/\s+/g, ' ');

            // Constrói a URL com os filtros e navega
            const queryParams = new URLSearchParams();
            if (foundFilters.category) queryParams.set('category', foundFilters.category);
            if (foundFilters.genres.length > 0) queryParams.set('genres', foundFilters.genres.join(','));
            if (foundFilters.keywords) queryParams.set('keywords', foundFilters.keywords);

            return router.push(`/suggestion?${queryParams.toString()}`);
        }

        // Se nenhum comando for reconhecido
        setError("Desculpe, ainda não consigo processar esse pedido. Tente usar palavras como 'sugestão', 'coleção', 'lista', 'duelo', 'radar' ou 'desafio'.");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-4xl font-bold text-white mb-2">Fale com o Gênio</h1>
                <p className="text-lg text-gray-400 max-w-2xl">
                    Peça por uma "sugestão de filme de terror com suspense" e veja a mágica acontecer.
                </p>
                {error && <p className="mt-4 text-yellow-400 bg-yellow-900/50 p-3 rounded-lg text-sm">{error}</p>}
            </div>

            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="w-full max-w-2xl mx-auto flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ex: Quero uma sugestão de filme..."
                        className="flex-grow bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    );
};