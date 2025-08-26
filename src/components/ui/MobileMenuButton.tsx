// src/components/ui/MobileMenuButton.tsx

import React from "react";
import Link from "next/link";

interface MobileMenuButtonProps {
  icon: string;
  text: string;
  href: string;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ icon, text, href }) => (
  <Link 
    href={href} 
    className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white font-bold py-5 px-6 rounded-xl w-full flex items-center justify-start space-x-4 shadow-lg transition-transform duration-300 hover:scale-105"
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-lg">{text}</span>
  </Link>
);

export default MobileMenuButton;