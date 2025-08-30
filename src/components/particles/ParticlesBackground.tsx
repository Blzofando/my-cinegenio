// src/components/particles/ParticlesBackground.tsx

"use client";

import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import type { Engine } from "tsparticles-engine";

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesOptions = {
    fullScreen: { enable: false },
    particles: {
      number: {
        value: 300, // Aumentamos a quantidade para parecer mais "poeira"
        density: { enable: true, value_area: 800 },
      },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: {
        value: 0.5,
        random: true, // Opacidade aleatória para dar profundidade
        anim: { enable: true, speed: 0.2, opacity_min: 0.1, sync: false },
      },
      size: {
        value: 1, // Partículas bem menores
        random: true,
        minimumValue: 0.5,
      },
      move: {
        enable: true,
        speed: 0.5, // Movimento lento mas perceptível
        direction: "none" as const,
        random: true, // Movimento totalmente aleatório
        straight: false,
        out_mode: "out" as const,
        bounce: false,
      },
    },
    interactivity: {
      detectsOn: "canvas" as const,
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
        resize: true,
      },
    },
    detectRetina: true,
  };

  return (
    <div className="absolute">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={particlesOptions}
      />
    </div>
  );
};

export default ParticlesBackground;