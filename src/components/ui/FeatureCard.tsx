// src/components/ui/FeatureCard.tsx

"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { clsx } from "clsx";

interface FeatureCardProps {
  icon?: React.ReactNode | string;
  title: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon = "🔹", title, href, onClick, className = "" }) => {
  const router = useRouter();
  const baseClasses = "feature-card transition-transform duration-200 ease-in-out transform hover:-translate-y-1 h-full";

  const content = (
    <>
      <div className="feature-icon" aria-hidden>{icon}</div>
      <div className="feature-title">{title}</div>
    </>
  );

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
        e.preventDefault(); // Impede a navegação imediata do Link
        onClick();
        // Adiciona um pequeno delay para a animação do confetti começar antes de navegar
        setTimeout(() => {
            if(href) router.push(href);
        }, 100);
    }
  };

  if (href) {
    return (
      <Link href={href} onClick={handleClick} className={clsx(baseClasses, className)} aria-label={title}>
        {content}
      </Link>
    );
  }

  // Fallback para caso não tenha href (não deve acontecer no nosso menu)
  return (
    <div 
      className={clsx(baseClasses, className)} 
      role={onClick ? "button" : "article"} 
      onClick={onClick}
    >
      {content}
    </div>
  );
};

export default FeatureCard;