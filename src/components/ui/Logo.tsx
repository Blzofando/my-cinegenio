// src/components/ui/Logo.tsx

import React from "react";

interface LogoProps {
  className?: string;
  subtext?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "", subtext }) => {
  return (
    <div className="text-left">
      <div className={className}>
        <div className="text-neon">CineGênio</div>
        <div className="subtitle">Pessoal</div>
      </div>
      {subtext && <p className="hero-sub">{subtext}</p>}
    </div>
  );
};

export default Logo;