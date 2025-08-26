// src/components/ui/Logo.tsx
import React from "react";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        {/* Texto do logo (neon) */}
        <div className={`font-extrabold tracking-tight text-white ${className}`}>
          <span className="text-neon text-2xl sm:text-3xl md:text-4xl">CineGênio</span>
          <span className="ml-2 text-indigo-300 font-semibold text-sm">Pessoal</span>
        </div>
      </div>

      <p className="mt-1 text-gray-300 text-sm max-w-xs">
        Seu assistente de cinema e séries — descubra o próximo filme ou série perfeito.
      </p>
    </div>
  );
};

export default Logo;
