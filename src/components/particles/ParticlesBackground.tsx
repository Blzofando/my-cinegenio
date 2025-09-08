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
    fullScreen: { enable: false }, // Mantemos false para respeitar o container
    particles: {
      number: {
        value: 300,
        density: { enable: true, value_area: 800 },
      },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: {
        value: 0.5,
        random: true,
        anim: { enable: true, speed: 0.2, opacity_min: 0.1, sync: false },
      },
      size: {
        value: 1,
        random: true,
        minimumValue: 0.5,
      },
      move: {
        enable: true,
        speed: 0.5,
        direction: "none" as const,
        random: true,
        straight: false,
        out_mode: "out" as const,
        bounce: false,
      },
    },
    interactivity: {
      detectsOn: "canvas" as const,
      events: { resize: true },
    },
    detectRetina: true,
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
    </div>
  );
};

export default ParticlesBackground;
