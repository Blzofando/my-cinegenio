// src/components/ui/FooterButton.tsx

import React from "react";
import Link from "next/link";

interface FooterButtonProps {
  icon: string;
  text: string;
  href: string;
}

const FooterButton: React.FC<FooterButtonProps> = ({ icon, text, href }) => (
  <Link 
    href={href} 
    className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors hover:scale-110 duration-200"
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-xs font-bold">{text}</span>
  </Link>
);

export default FooterButton;