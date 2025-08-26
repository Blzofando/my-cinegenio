"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
    <section ref={heroRef} className={`hero ${hidden ? "hero--hidden" : "hero--visible"}`} style={{ position: "relative" }}>
      <div style={{ position: "absolute", right: 14, top: 8, zIndex: 30 }}>
        <LevelBadge level={7} />
      </div>

      <div className="hero-left" style={{ maxWidth: "62%" }}>
        <div className="hero-title text-neon" style={{ lineHeight: 1 }}>
          <div style={{ fontWeight: 900 }}>CineGênio</div>
          <div className="text-indigo-300 font-semibold" style={{ fontSize: 20, marginTop: 4 }}>Pessoal</div>
        </div>

        <div className="hero-sub">Seu assistente de cinema.</div>

        <div className="mt-6" style={{ maxWidth: 360 }}>
          {/* CTA wide (visualmente ocupa 2 colunas) */}
          <Link href="/chat" className="cta-wide">
            <span style={{ fontSize: 20 }}>💬</span>
            <span style={{ fontSize: 16 }}>Fale com o Gênio</span>
          </Link>
        </div>
      </div>

      <div className="hero-decor" aria-hidden>
        <img src="/claquete-neon.png" alt="claquete" style={{ maxWidth: 160, width: "28vw", height: "auto", borderRadius: 10 }} />
      </div>
    </section>
  );
}
