// src/components/hero/Hero.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import LevelBadge from "@/components/ui/LevelBadge";

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const heroEl = heroRef.current;
      if (!heroEl) return;
      setHidden(window.scrollY > heroEl.offsetHeight - 36);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className={`hero ${hidden ? "hero--hidden" : "hero--visible"}`}
      style={{ position: "relative" }}
      aria-label="Hero CineGênio"
    >
      {/* badge no canto superior direito */}
      <div style={{ position: "absolute", right: 14, top: 8, zIndex: 30 }}>
        <LevelBadge level={7} />
      </div>

      {/* conteúdo esquerdo: título + frase (SEM CTA aqui) */}
      <div className="hero-left" style={{ maxWidth: "62%" }}>
        <div className="hero-title text-neon" style={{ lineHeight: 1 }}>
          <div style={{ fontWeight: 900, fontSize: "64px" }}>CineGênio</div>
          <div className="subtitle" style={{ fontSize: 22, marginTop: 6 }}>Pessoal</div>
        </div>

        <div className="hero-sub" style={{ marginTop: 10 }}>Seu assistente de cinema.</div>
      </div>

      {/* decor direita: CLAQUETE maior (aumentei pra 220) */}
      <div className="hero-decor" aria-hidden>
        <Image
          src="/claquete-neon.png"
          alt="Claquete"
          width={220}
          height={220}
          style={{ borderRadius: 12 }}
          priority={false}
        />
      </div>
    </section>
  );
}
