"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ParticlesBackground from "@/components/particles/ParticlesBackground";
import Hero from "@/components/hero/Hero";
import FeatureCard from "@/components/ui/FeatureCard";
import FooterButton from "@/components/ui/FooterButton";
import AchievementToast from "@/components/extras/AchievementToast";
import ConfettiOnComplete from "@/components/extras/ConfettiOnComplete";
import Logo from "@/components/ui/Logo";
import LevelBadge from "@/components/ui/LevelBadge";
import StatPill from "@/components/ui/StatPill";

export default function HomePage() {
  const [achievement, setAchievement] = useState(false);
  const SHOW_PARTICLES = true;

  const triggerAchievement = () => {
    setAchievement(true);
    setTimeout(() => setAchievement(false), 4000);
  };

  return (
    <main className="min-h-screen w-full text-white relative overflow-hidden">
      <div className="fixed inset-0 -z-30" aria-hidden>
        <div className="animated-gradient absolute inset-0" />
        <div className="absolute inset-0 gradient-overlay" />
      </div>
      {SHOW_PARTICLES && <ParticlesBackground />}

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex flex-col h-screen p-8">
        <div className="flex-grow grid grid-cols-2 gap-12">
          {/* Coluna Esquerda */}
          <div className="flex flex-col items-center justify-center h-full">
            <Logo className="hero-title" subtext="Seu assistente de cinema e séries." />
            <div className="mt-8">
              <Image 
                src="/rolo-neon.png" 
                alt="Rolo de filme" 
                width={200} 
                height={200} 
                className="img-glow hero-decor" 
                priority 
              />
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="flex flex-col h-full justify-between">
            {/* Badges */}
            <div className="flex items-center gap-4 flex-wrap w-full max-w-xl mx-auto justify-center">
              <LevelBadge level={7} />
              <StatPill icon="🔥" text="10 desafios" />
              <StatPill icon="🎬" text="250 títulos" />
            </div>

            {/* Ações centralizadas */}
            <div className="flex flex-col justify-center flex-grow">
              <div className="grid grid-cols-3 gap-4 w-full max-w-xl mx-auto">
                <FeatureCard icon="💡" title="Sugestão Personalizada" href="/suggestion" />
                <FeatureCard icon="🎲" title="Sugestão Aleatória" href="/random" />
                <FeatureCard icon="📡" title="Radar" href="/radar" />
                <div onClick={triggerAchievement}>
                  <FeatureCard icon="🏆" title="Desafio" href="/challenge" />
                </div>
                <FeatureCard icon="⚔️" title="Duelo" href="/duel" />
                <FeatureCard icon="🗓️" title="Relevantes" href="/weekly-relevants" />
              </div>

              {/* CTA abaixo da grade */}
              <div className="w-full max-w-xl mx-auto mt-8">
                <Link href="/chat" className="cta-centered">
                  <span style={{ fontSize: 20 }}>💬</span>
                  <span style={{ marginLeft: 10, fontWeight: 800 }}>Fale com o Gênio</span>
                </Link>
              </div>
            </div>

            {/* Links no rodapé da coluna */}
            <nav className="flex items-center gap-8 w-full max-w-xl mx-auto justify-center mt-4">
              <FooterButton icon="📚" text="Minha Coleção" href="/collection" />
              <FooterButton icon="📋" text="Watchlist" href="/watchlist" />
              <FooterButton icon="📊" text="Meus Insights" href="/stats" />
            </nav>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT (inalterado) */}
      <div className="lg:hidden">
        <div className="app-header" />
        <Hero />
        <div className="mobile-content px-4">
          <div style={{ marginTop: 12 }}>
            <Link href="/chat" className="cta-centered" aria-label="Fale com o Gênio">
              <span style={{ fontSize: 20 }}>💬</span>
              <span style={{ marginLeft: 10, fontWeight: 800 }}>Fale com o Gênio</span>
            </Link>
          </div>
          <div className="content-spacer" />
          <section className="mb-6" aria-label="Funções principais">
            <div className="feature-grid">
              <FeatureCard icon="💡" title="Sugestão Personalizada" href="/suggestion" />
              <FeatureCard icon="🎲" title="Sugestão Aleatória" href="/random" />
              <FeatureCard icon="📡" title="Radar de Lançamentos" href="/radar" />
              <FeatureCard icon="🏆" title="Desafio do Gênio" href="/challenge" onClick={triggerAchievement} />
              <FeatureCard icon="⚔️" title="Duelo de Títulos" href="/duel" />
              <FeatureCard icon="🗓️" title="Relevantes da Semana" href="/weekly-relevants" />
            </div>
          </section>
          <div style={{ height: "20px" }} />
        </div>
      </div>

      {/* Footer Fixo Mobile */}
      <footer className="footer-fixed lg:hidden" aria-hidden>
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            <FooterButton icon="📚" text="Minha Coleção" href="/collection" />
            <FooterButton icon="📋" text="Watchlist" href="/watchlist" />
            <FooterButton icon="📊" text="Meus Insights" href="/stats" />
          </div>
        </div>
      </footer>

      {/* Feedback */}
      <AchievementToast visible={achievement} message="🏆 Desafio iniciado! Boa sorte, Gênio." />
      <ConfettiOnComplete active={achievement} />
    </main>
  );
}
