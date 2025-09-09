// src/components/hero/DesktopHero.tsx

import React from "react";
import Image from "next/image";
import Logo from "../ui/Logo";

const DesktopHero = () => {
    return (
        <div className="flex items-center justify-center gap-8">
            <Logo 
                className="hero-title" // Usa a classe do seu globals.css
                subtext="Seu assistente de cinema e séries — descubra o próximo filme ou série perfeito."
            />
            <Image 
                src="/rolo-neon.png" 
                alt="Rolo de filme" 
                width={200} 
                height={200} 
                className="img-glow hero-decor" // Usa as classes do seu globals.css
                priority 
            />
        </div>
    );
};

export default DesktopHero;