// src/components/ui/SectionTitle.tsx

import React from "react";

interface SectionTitleProps {
    children: React.ReactNode;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => (
  <h2 className="text-xl text-gray-300 uppercase tracking-widest flex items-center gap-3">
    <span className="w-8 h-[2px] bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
    {children}
  </h2>
);

export default SectionTitle;