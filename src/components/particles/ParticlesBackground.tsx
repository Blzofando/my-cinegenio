"use client";

import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const particlesOptions: any = {
  fullScreen: { enable: false },
  particles: {
    number: { value: 70, density: { enable: true, area: 1400 } }, // menos partículas
    color: { value: "#ffffff" },
    opacity: {
      value: 0.055,
      random: { enable: true, minimumValue: 0.02 },
      anim: { enable: true, speed: 0.12, opacity_min: 0.02, sync: false }
    },
    size: {
      value: 1.2,
      random: { enable: true, minimumValue: 0.5 }
    },
    move: {
      enable: true,
      speed: 0.12, // mais lento
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" }
    },
    shape: { type: "circle" },
    twinkle: {
      particles: {
        enable: true,
        frequency: 0.008,
        opacity: 0.8
      }
    }
  },
  interactivity: {
    detectsOn: "canvas",
    events: { onHover: { enable: false }, onClick: { enable: false } }
  },
  background: { color: "transparent" },
  retina_detect: true
};

export default function ParticlesBackground({ className = "" }: { className?: string }) {
  const particlesInit = useCallback(async (engine: any) => {
    await loadFull(engine);
  }, []);

  return (
    <div className={`absolute inset-0 -z-20 pointer-events-none ${className}`}>
      <Particles init={particlesInit as any} options={particlesOptions as any} />
    </div>
  );
}
