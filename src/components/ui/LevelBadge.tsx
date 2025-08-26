import React from "react";

interface LevelBadgeProps { level?: number; }

const LevelBadge: React.FC<LevelBadgeProps> = ({ level = 1 }) => {
  return (
    <div className="relative inline-flex items-center">
      <div className="badge-dark">
        <span className="badge-emoji">🎖️</span>
        <span style={{ fontSize: 12, fontWeight: 700 }}>Nível {level}</span>
      </div>
    </div>
  );
};

export default LevelBadge;
