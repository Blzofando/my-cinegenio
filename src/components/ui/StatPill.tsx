// src/components/ui/StatPill.tsx

import React from "react";

interface StatPillProps {
  icon: string;
  text: string;
}

const StatPill: React.FC<StatPillProps> = ({ icon, text }) => (
  <div className="px-3 py-1 rounded-full bg-gray-800/60 text-gray-300 flex items-center gap-2 text-sm border border-gray-700">
    <span>{icon}</span>
    <span>{text}</span>
  </div>
);

export default StatPill;