// src/components/ui/StatPill.tsx

import React from "react";

interface StatPillProps {
  icon: string;
  text: string;
}

const StatPill: React.FC<StatPillProps> = ({ icon, text }) => (
  // As classes antigas foram substituídas pela classe .badge-dark
  <div className="badge-dark">
    <span className="badge-emoji">{icon}</span>
    <span>{text}</span>
  </div>
);

export default StatPill;