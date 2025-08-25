// src/components/MainMenu.tsx

import React from 'react';
import Link from 'next/link'; // Importa o componente de Link do Next.js

// --- Sub-componentes do Menu (nenhuma mudança aqui) ---
const FeatureCard = ({ icon, title, href }: { icon: string; title: string; href: string; }) => (
    <Link href={href} className="bg-gray-800/50 border border-transparent hover:border-indigo-500 hover:bg-gray-800/80 p-6 rounded-2xl text-left transition-all duration-300 group">
        <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-110">{icon}</div>
        <h3 className="font-bold text-white text-lg">{title}</h3>
    </Link>
);

const MobileMenuButton = ({ icon, text, href }: { icon: string, text: string, href: string }) => (
    <Link href={href} className="bg-gray-800/70 hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl w-full flex items-center justify-start space-x-4 transition-all duration-300">
        <span className="text-2xl">{icon}</span>
        <span className="text-lg">{text}</span>
    </Link>
);

const FooterButton = ({ icon, text, href }: { icon: string, text: string, href: string }) => (
    <Link href={href} className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold">{text}</span>
    </Link>
);

// --- Componente Principal do Menu ---
// Note que ele não recebe mais a prop 'setView'
const MainMenu: React.FC = () => {
    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
            {/* ... (seus SVGs de fundo não mudam) ... */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
             <svg className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-indigo-800/50 w-32 h-32 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v20h19V2H2.5zM7 2v20M12 2v20M17 2v20M2 7h20M2 12h20M2 17h20"/></svg>
             <svg className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 text-fuchsia-800/50 w-32 h-32 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M18.8 9.8L12 16l-6.8-6.2L2 12.2V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.8l-3.2-3.2zM2 6l5 6L12 6l5 6 5-6z"/></svg>
             <svg className="absolute top-1/2 right-1/3 transform -translate-x-1/2 -translate-y-1/2 text-purple-800/50 w-28 h-28 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v20h19V2H2.5zM7 2v20M12 2v20M17 2v20M2 7h20M2 12h20M2 17h20"/></svg>
             <svg className="absolute bottom-1/3 left-1/3 transform translate-x-1/2 translate-y-1/2 text-blue-800/50 w-36 h-36 rotate-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M18.8 9.8L12 16l-6.8-6.2L2 12.2V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.8l-3.2-3.2zM2 6l5 6L12 6l5 6 5-6z"/></svg>
            </div>

            <div className="relative z-10 min-h-screen flex flex-col p-4">
                {/* ---- VISUALIZAÇÃO PARA DESKTOP ---- */}
                <div className="hidden lg:flex flex-grow items-center justify-center">
                    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="text-left">
                            <h1 className="text-6xl font-extrabold tracking-tight">CineGênio <span className="text-indigo-400">Pessoal</span></h1>
                            <p className="mt-4 text-2xl text-gray-400">Seu assistente de entretenimento pessoal.</p>
                            <Link href="/chat" className="mt-10 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-fuchsia-500/40 transition-all duration-300 transform hover:scale-105 text-xl">
                                💬 Fale com o Gênio
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FeatureCard icon="💡" title="Sugestão Personalizada" href="/suggestion" />
                            <FeatureCard icon="🎲" title="Sugestão Aleatória" href="/random" />
                            <FeatureCard icon="📡" title="Radar de Lançamentos" href="/radar" />
                            <FeatureCard icon="🏆" title="Desafio do Gênio" href="/challenge" />
                            <FeatureCard icon="⚔️" title="Duelo de Títulos" href="/duel" />
                            <FeatureCard icon="🗓️" title="Relevantes da Semana" href="/weekly-relevants" />
                        </div>
                    </div>
                </div>

                {/* ---- VISUALIZAÇÃO PARA MOBILE ---- */}
                <div className="lg:hidden flex flex-col flex-grow justify-center text-center pb-24">
                    <div className="mb-12">
                         <h1 className="text-5xl font-extrabold tracking-tight">CineGênio <span className="text-indigo-400">Pessoal</span></h1>
                         <p className="mt-4 text-lg text-gray-400">Seu assistente de cinema e séries.</p>
                    </div>
                    <div className="space-y-3">
                        <MobileMenuButton icon="💬" text="Fale com o Gênio" href="/chat" />
                        <MobileMenuButton icon="💡" text="Sugestão Personalizada" href="/suggestion" />
                        <MobileMenuButton icon="📡" text="Radar de Lançamentos" href="/radar" />
                        <MobileMenuButton icon="🗓️" text="Relevantes da Semana" href="/weekly-relevants" />
                        <MobileMenuButton icon="🏆" text="Desafio do Gênio" href="/challenge" />
                        <MobileMenuButton icon="🎲" text="Sugestão Aleatória" href="/random" />
                        <MobileMenuButton icon="⚔️" text="Duelo de Títulos" href="/duel" />
                    </div>
                </div>

                {/* Rodapé Fixo (Mobile) */}
                <footer className="fixed bottom-0 left-0 w-full bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700 z-20 lg:hidden">
                    <div className="flex justify-around items-center max-w-md mx-auto">
                        <FooterButton icon="📚" text="Minha Coleção" href="/collection" />
                        <FooterButton icon="📋" text="Watchlist" href="/watchlist" />
                        <FooterButton icon="📊" text="Meus Insights" href="/stats" />
                    </div>
                </footer>

                {/* Rodapé (Desktop) */}
                <footer className="w-full max-w-md mx-auto bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 mt-8 flex-shrink-0 hidden lg:block">
                    <div className="flex justify-around items-center">
                        <FooterButton icon="📚" text="Minha Coleção" href="/collection" />
                        <FooterButton icon="📋" text="Watchlist" href="/watchlist" />
                        <FooterButton icon="📊" text="Meus Insights" href="/stats" />
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MainMenu;