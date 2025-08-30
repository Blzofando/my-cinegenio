// src/components/ui/FeatureCard.tsx

"use client";

import React from "react";
import Link from "next/link";
import { clsx } from "clsx"; // Usaremos clsx para juntar as classes

interface FeatureCardProps {
  icon?: React.ReactNode | string;
  title: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon = "🔹", title, href, onClick, className = "" }) => {
  // Classes base para o efeito 3D sutil
  const baseClasses = "feature-card transition-transform duration-200 ease-in-out transform hover:-translate-y-1";

  const content = (
    <div 
      className={clsx(baseClasses, className)} 
      role={href ? "link" : onClick ? "button" : "article"} 
      onClick={onClick}
    >
      <div className="feature-icon" aria-hidden>{icon}</div>
      <div className="feature-title">{title}</div>
    </div>
  );

  if (href && onClick) {
    // Para o card do Desafio que tem link E onClick
    return <div onClick={onClick}>{content}</div>;
  }
  
  if (href) {
    return (
      <Link href={href} className={clsx(baseClasses, className)} aria-label={title}>
        <div className="feature-icon" aria-hidden>{icon}</div>
        <div className="feature-title">{title}</div>
      </Link>
    );
  }

  return content;
};

export default FeatureCard;