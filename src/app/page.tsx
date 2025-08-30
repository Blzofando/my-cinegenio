// src/app/page.tsx

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
    <main className="min-h-screen w-full text-white relative overflow-hidden bg-radial main-with-fixed-header">
      <div className="fixed inset-0 -z-30" aria-hidden>
        <div className="animated-gradient absolute inset-0" />
        <div className="absolute inset-0 gradient-overlay" />
      </div>
      {SHOW_PARTICLES && <ParticlesBackground />}
      
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:flex flex-col h-screen p-8">
        <header className="w-full flex justify-between items-center mb-8 flex-shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <LevelBadge level={7} />
            <StatPill icon="🔥" text="10 desafios" />
            <StatPill icon="🎬" text="250 títulos" />
          </div>
          <nav className="flex items-center gap-6">
            <FooterButton icon="📚" text="Minha Coleção" href="/collection" />
            <FooterButton icon="📋" text="Watchlist" href="/watchlist" />
            <FooterButton icon="📊" text="Meus Insights" href="/stats" />
          </nav>
        </header>
        <div className="flex-grow grid grid-cols-2 gap-8 items-center -mt-8">
          <div className="grid grid-cols-2 gap-6">
            <FeatureCard className="feature-card" icon="💡" title="Sugestão Personalizada" href="/suggestion" />
            <FeatureCard className="feature-card" icon="🎲" title="Sugestão Aleatória" href="/random" />
            <FeatureCard className="feature-card" icon="📡" title="Radar de Lançamentos" href="/radar" />
            {/* CORREÇÃO AQUI: o onClick é passado diretamente para o componente */}
            <FeatureCard className="feature-card" icon="🏆" title="Desafio do Gênio" href="/challenge" onClick={triggerAchievement} />
            <FeatureCard className="feature-card" icon="⚔️" title="Duelo de Títulos" href="/duel" />
            <FeatureCard className="feature-card" icon="🗓️" title="Relevantes da Semana" href="/weekly-relevants" />
          </div>
          <div className="relative flex flex-col items-center justify-center h-full">
            <Logo className="text-8xl" />
            <div className="absolute flex items-center justify-center gap-4 opacity-60 -z-20">
              <Image src="/rolo-neon.png" alt="Rolo de filme" width={260} height={260} className="img-glow translate-x-10" />
              <Image src="/claquete-neon.png" alt="Claquete" width={220} height={220} className="img-glow -translate-x-10" />
            </div>
            <div className="mt-8 w-3/4">
              <Link href="/chat" className="cta-wide">
                <span style={{ fontSize: 22 }}>💬</span>
                <span style={{ fontSize: 18 }}>Fale com o Gênio</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT */}
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
              <FeatureCard className="feature-card" icon="💡" title="Sugestão Personalizada" href="/suggestion" />
              <FeatureCard className="feature-card" icon="🎲" title="Sugestão Aleatória" href="/random" />
              <FeatureCard className="feature-card" icon="📡" title="Radar de Lançamentos" href="/radar" />
              {/* CORREÇÃO AQUI: o onClick é passado diretamente para o componente */}
              <FeatureCard className="feature-card" icon="🏆" title="Desafio do Gênio" href="/challenge" onClick={triggerAchievement} />
              <FeatureCard className="feature-card" icon="⚔️" title="Duelo de Títulos" href="/duel" />
              <FeatureCard className="feature-card" icon="🗓️" title="Relevantes da Semana" href="/weekly-relevants" />
            </div>
          </section>
          <div style={{ height: "20px" }} />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer-fixed lg:hidden" aria-hidden>
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            <FooterButton icon="📚" text="Minha Coleção" href="/collection" />
            <FooterButton icon="📋" text="Watchlist" href="/watchlist" />
            <FooterButton icon="📊" text="Meus Insights" href="/stats" />
          </div>
        </div>
      </footer>

      {/* FEEDBACK */}
      <AchievementToast visible={achievement} message="🏆 Desafio iniciado! Boa sorte, Gênio." />
      <ConfettiOnComplete active={achievement} />
    </main>
  );
}