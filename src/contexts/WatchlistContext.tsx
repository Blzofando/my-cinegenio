// src/contexts/WatchlistContext.tsx

"use client"; // ESSENCIAL: Isso marca o componente como um "Client Component"

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client'; // Caminho corrigido para a config do cliente
import { WatchlistItem } from '@/types'; // Caminho corrigido para os tipos
import { addToWatchlist, removeFromWatchlist } from '@/lib/firestore';

interface IWatchlistContext {
    watchlist: WatchlistItem[];
    addToWatchlist: (item: WatchlistItem) => Promise<void>;
    removeFromWatchlist: (id: number) => Promise<void>;
    isInWatchlist: (id: number) => boolean;
}

export const WatchlistContext = createContext<IWatchlistContext>({
    watchlist: [],
    addToWatchlist: async () => {},
    removeFromWatchlist: async () => {},
    isInWatchlist: () => false,
});

export const WatchlistProvider = ({ children }: { children: React.ReactNode }) => {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

    useEffect(() => {
        const collectionRef = collection(db, 'watchlist');
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            const items: WatchlistItem[] = [];
            querySnapshot.forEach((doc) => {
                items.push(doc.data() as WatchlistItem);
            });
            setWatchlist(items.sort((a, b) => b.addedAt - a.addedAt));
        });

        return () => unsubscribe();
    }, []);

    const handleAddItem = useCallback(async (item: WatchlistItem) => {
        try {
            await addToWatchlist(item);
        } catch (error) {
            console.error("Failed to add to watchlist:", error);
        }
    }, []);

    const handleRemoveItem = useCallback(async (id: number) => {
        try {
            await removeFromWatchlist(id);
        } catch (error) {
            console.error("Failed to remove from watchlist:", error);
        }
    }, []);

    const isInWatchlist = useCallback((id: number) => {
        return watchlist.some(item => item.id === id);
    }, [watchlist]);

    return (
        <WatchlistContext.Provider value={{ watchlist, addToWatchlist: handleAddItem, removeFromWatchlist: handleRemoveItem, isInWatchlist }}>
            {children}
        </WatchlistContext.Provider>
    );
};