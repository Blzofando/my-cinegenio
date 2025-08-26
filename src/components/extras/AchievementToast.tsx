// src/components/extras/AchievementToast.tsx

"use client"; // Precisa ser client component por causa do state e effect

import React, { useEffect, useState } from "react";

interface AchievementToastProps {
  message?: string;
  visible?: boolean;
}

const AchievementToast: React.FC<AchievementToastProps> = ({
  message = "Desafio concluído! +50 XP 🎉",
  visible = false,
}) => {
  const [show, setShow] = useState(visible);

  useEffect(() => {
      if(visible) {
          setShow(true);
          const timer = setTimeout(() => setShow(false), 4000); // O toast some após 4 segundos
          return () => clearTimeout(timer);
      } else {
          setShow(false);
      }
  }, [visible]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 transform transition-all duration-500 ease-in-out ${
        show ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
      }`}
    >
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 text-white px-4 py-3 rounded-xl shadow-lg">
        <div className="flex items-center gap-2">
          <span>🏆</span>
          <span className="font-semibold text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;