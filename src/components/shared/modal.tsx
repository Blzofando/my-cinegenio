// src/components/shared/modal.tsx

"use client";

import React from 'react';

// Este é o componente base que cria o fundo escuro e o container centralizado.
// Ele será usado por todos os outros modais.
const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" 
        onClick={onClose}
    >
        <div 
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" 
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

export default Modal;