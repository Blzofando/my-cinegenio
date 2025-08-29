// src/app/chat/page.tsx

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { getAdvancedAIChatResponse, ChatMessage } from '@/lib/chatService';
import RecommendationCard from '@/components/RecommendationCard';
import Image from 'next/image';

// Componente para a mensagem do usuário
const UserMessage = ({ text }: { text: string }) => (
    <div className="flex justify-end">
        <div className="bg-indigo-600 text-white rounded-lg rounded-br-none px-4 py-2 max-w-lg">
            {text}
        </div>
    </div>
);

// Componente para o carrossel de itens da IA
const ItemsCarousel = ({ items }: { items: { id: number; title: string; posterUrl?: string }[] }) => (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {items.map(item => (
            <div key={item.id} className="flex-shrink-0 w-32 text-center">
                <Image 
                    src={item.posterUrl || '/placeholder.png'} 
                    alt={`Pôster de ${item.title}`}
                    width={150}
                    height={225}
                    className="w-full h-48 object-cover rounded-lg shadow-lg"
                />
                <p className="text-xs text-white mt-2 truncate">{item.title}</p>
            </div>
        ))}
    </div>
);

// Componente para a resposta da IA
const ModelResponse = ({ response }: { response: any }) => {
    switch (response.type) {
        case 'recommendation':
            return <RecommendationCard recommendation={response.data.recommendation} />;

        case 'list':
            return (
                <div className="flex justify-start w-full">
                    <div className="bg-gray-700 text-white rounded-lg rounded-bl-none p-4 max-w-full w-full">
                        {response.data.text && <p className="mb-3">{response.data.text}</p>}
                        <ItemsCarousel items={response.data.list} />
                    </div>
                </div>
            );

        case 'text':
        default:
            return (
                <div className="flex justify-start">
                    <div className="bg-gray-700 text-white rounded-lg rounded-bl-none px-4 py-2 max-w-lg">
                        {response.data.text || "Desculpe, não consegui processar a resposta."}
                    </div>
                </div>
            );
    }
};

// Componente para o indicador de "digitando..."
const LoadingIndicator = () => (
    <div className="flex justify-start">
        <div className="bg-gray-700 text-white rounded-lg rounded-bl-none px-4 py-2">
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
        </div>
    </div>
);

const examplePlaceholders = [
    "Me recomende um filme de terror...",
    "Quais os relevantes da semana?",
    "Me sugira algo da minha watchlist...",
    "Duelo: Interestelar vs A Origem",
    "Qual o desafio desta semana?",
];

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [placeholder, setPlaceholder] = useState('');
    const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

    // Efeito para a animação de digitação no placeholder
    useEffect(() => {
        let currentPhraseIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        let timeoutId: NodeJS.Timeout;

        const type = () => {
            const currentPhrase = examplePlaceholders[currentPhraseIndex];
            if (isDeleting) {
                if (currentCharIndex > 0) {
                    setPlaceholder(currentPhrase.substring(0, currentCharIndex - 1));
                    currentCharIndex--;
                } else {
                    isDeleting = false;
                    currentPhraseIndex = (currentPhraseIndex + 1) % examplePlaceholders.length;
                }
            } else {
                if (currentCharIndex < currentPhrase.length) {
                    setPlaceholder(currentPhrase.substring(0, currentCharIndex + 1));
                    currentCharIndex++;
                } else {
                    isDeleting = true;
                    timeoutId = setTimeout(type, 2000);
                    return;
                }
            }
            timeoutId = setTimeout(type, isDeleting ? 50 : 100);
        };
        type();
        return () => clearTimeout(timeoutId);
    }, []);

    // Efeito para rolar para a última mensagem
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

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
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Erro no chat:", error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: JSON.stringify({ type: 'text', data: { text: "Desculpe, ocorreu um erro ao contatar a IA." }}) }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto">
            {/* Histórico de Mensagens */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => {
                    if (msg.role === 'user') {
                        return <UserMessage key={index} text={msg.parts[0].text} />;
                    } else {
                        try {
                            const parsedContent = JSON.parse(msg.parts[0].text);
                            return <ModelResponse key={index} response={parsedContent} />;
                        } catch {
                            return <ModelResponse key={index} response={{ type: 'text', data: { text: "Erro ao ler a resposta da IA." }}} />;
                        }
                    }
                })}
                {isLoading && <LoadingIndicator />}
                <div ref={endOfMessagesRef} />
            </div>

            {/* Formulário de Envio */}
            <div className="p-4 bg-gray-900 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        className="flex-grow bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                    <button 
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
}