// src/app/chat/[chatId]/page.tsx

"use client";

import React, { useState, useRef, useEffect, useContext, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getAdvancedAIChatResponse, getChatSession, saveChatSession, ChatMessage } from '@/lib/chatService';
import RecommendationCard from '@/components/RecommendationCard';
import DetailsModal from '@/components/shared/DetailsModal';
import { WatchlistContext } from '@/contexts/WatchlistContext';
import { DisplayableItem, WatchlistItem } from '@/types';
import Image from 'next/image';

const UserMessage = ({ text }: { text: string }) => ( <div className="flex justify-end"><div className="bg-indigo-600 text-white rounded-lg rounded-br-none px-4 py-2 max-w-lg">{text}</div></div> );
const ItemsCarousel = ({ items, onItemClick }: { items: DisplayableItem[], onItemClick: (item: DisplayableItem) => void }) => ( <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">{items.map(item => ( <div key={item.id} className="flex-shrink-0 w-32 text-center cursor-pointer group" onClick={() => onItemClick(item)}><div className="relative overflow-hidden rounded-lg shadow-lg"><Image src={item.posterUrl || '/placeholder.png'} alt={`Pôster de ${item.title}`} width={150} height={225} className="w-full h-48 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"/></div><p className="text-xs text-white mt-2 truncate group-hover:text-indigo-400">{item.title}</p></div> ))}</div> );
const ModelResponse = ({ response, onItemClick }: { response: any, onItemClick: (item: DisplayableItem) => void }) => { switch (response.type) { case 'recommendation': return <RecommendationCard recommendation={response.data.recommendation} />; case 'list': return ( <div className="flex justify-start w-full"><div className="bg-gray-700 text-white rounded-lg rounded-bl-none p-4 max-w-full w-full">{response.data.text && <p className="mb-3">{response.data.text}</p>}<ItemsCarousel items={response.data.list} onItemClick={onItemClick} /></div></div> ); case 'text': default: return ( <div className="flex justify-start"><div className="bg-gray-700 text-white rounded-lg rounded-bl-none px-4 py-2 max-w-lg">{response.data.text || "Desculpe, não consegui processar a resposta."}</div></div> ); }};
const LoadingIndicator = () => ( <div className="flex justify-start"><div className="bg-gray-700 text-white rounded-lg rounded-bl-none px-4 py-2"><div className="flex items-center gap-2"><span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span><span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span><span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span></div></div></div> );

export default function ChatConversationPage({ params }: { params: { chatId: string } }) {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(params.chatId === 'new' ? null : params.chatId);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Começa true para carregar o histórico
    const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
    const [isSaving, startSavingTransition] = useTransition();
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);
    const { addToWatchlist, isInWatchlist } = useContext(WatchlistContext);

    useEffect(() => {
        if (params.chatId && params.chatId !== 'new') {
            setIsLoading(true);
            getChatSession(params.chatId).then(history => {
                setMessages(history);
                setIsLoading(false);
            });
            setCurrentSessionId(params.chatId);
        } else {
            setMessages([]);
            setIsLoading(false);
            setCurrentSessionId(null);
        }
    }, [params.chatId]);

    useEffect(() => { endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

    const handleCarouselItemClick = (item: DisplayableItem) => setSelectedItem(item);
    
    const handleAddToWatchlist = (item: DisplayableItem) => {
        const watchlistItem: WatchlistItem = { id: item.id, tmdbMediaType: item.tmdbMediaType, title: item.title, posterUrl: item.posterUrl, addedAt: Date.now() };
        addToWatchlist(watchlistItem);
        setSelectedItem(null);
    };

    const renderDetailsModalActions = () => {
        if (!selectedItem) return null;
        const isItemInWatchlist = isInWatchlist(selectedItem.id);
        return ( <> <button onClick={() => handleAddToWatchlist(selectedItem)} disabled={isItemInWatchlist} className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">{isItemInWatchlist ? 'Já está na Watchlist' : 'Adicionar à Watchlist'}</button> <button onClick={() => setSelectedItem(null)} className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Fechar</button> </> );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = newMessages.slice(-10);
            const aiResponseData = await getAdvancedAIChatResponse(input, history);
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: JSON.stringify(aiResponseData) }] };
            const finalMessages = [...newMessages, modelMessage];
            setMessages(finalMessages);

            startSavingTransition(async () => {
                const newSessionId = await saveChatSession(currentSessionId, finalMessages);
                if (!currentSessionId || currentSessionId === 'new') {
                    setCurrentSessionId(newSessionId);
                    router.replace(`/chat/${newSessionId}`, { scroll: false });
                }
            });
        } catch (error) {
            console.error("Erro no chat:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: JSON.stringify({ type: 'text', data: { text: "Desculpe, ocorreu um erro." }}) }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {selectedItem && ( <DetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} actions={renderDetailsModalActions()} /> )}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !isLoading && <div className="text-center text-gray-500 pt-10">Comece enviando uma mensagem...</div>}
                {messages.map((msg, index) => (msg.role === 'user' ? <UserMessage key={index} text={msg.parts[0].text} /> : <ModelResponse key={index} response={JSON.parse(msg.parts[0].text)} onItemClick={handleCarouselItemClick} />))}
                {isLoading && <LoadingIndicator />}
                <div ref={endOfMessagesRef} />
            </div>
            <div className="p-4 bg-gray-900/50 border-t border-white/10">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Converse com o Gênio..." className="flex-grow bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Enviar</button>
                </form>
            </div>
        </div>
    );
}