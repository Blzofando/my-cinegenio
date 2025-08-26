// src/components/extras/ConfettiOnComplete.tsx

"use client"; // Precisa ser client component por causa do hook useWindowSize

import React from "react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

interface ConfettiProps {
    active: boolean;
}

const ConfettiOnComplete: React.FC<ConfettiProps> = ({ active }) => {
  const { width, height } = useWindowSize();
  
  if (!active) return null;
  
  return (
    <Confetti 
        width={width} 
        height={height} 
        recycle={false} 
        numberOfPieces={400} 
        gravity={0.1}
    />
  );
};

export default ConfettiOnComplete;