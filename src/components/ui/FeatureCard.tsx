// src/components/ui/FeatureCard.tsx
"use client";

import React from "react";
import Link from "next/link";

interface FeatureCardProps {
  icon?: React.ReactNode | string;
  title: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * FeatureCard — componente simples e acessível que aceita className.
 * Usa Link quando href existe; caso contrário, usa button/div para onClick.
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ icon = "🔹", title, href, onClick, className = "" }) => {
  const classes = `${className} `.trim();

  const content = (
    <div className={classes} role={href ? "link" : onClick ? "button" : "article"} onClick={onClick}>
      <div className="feature-icon" aria-hidden>
        {icon}
      </div>
      <div className="feature-title">{title}</div>
    </div>
  );

  if (href) {
    // Next Link aceita className directly in v13+. Wrapping ensures semantics and accessibility.
    return (
      <Link href={href} className={classes} aria-label={title}>
        <div className="feature-icon" aria-hidden>{icon}</div>
        <div className="feature-title">{title}</div>
      </Link>
    );
  }

  return content;
};

export default FeatureCard;
