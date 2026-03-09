"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketStore } from "@/store/useSocketStore";

interface Reaction {
    id: string; // unique internal id for animation keying
    emoji: string;
    xOffset: number; // Random horizontal variance
}

export const ReactionLayer = () => {
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const { socket } = useSocketStore();

    useEffect(() => {
        if (!socket) return;

        const handleEmote = ({ emoji }: { userId: string, emoji: string }) => {
            const newReaction: Reaction = {
                id: Math.random().toString(36).substring(7),
                emoji,
                xOffset: Math.random() * 60 - 30 // -30px to +30px random variance
            };

            setReactions(prev => [...prev, newReaction]);

            // Auto-cleanup from DOM after animation completes (2.5s)
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== newReaction.id));
            }, 2500);
        };

        socket.on('S2C_EMOTE', handleEmote);

        return () => {
            socket.off('S2C_EMOTE', handleEmote);
        };
    }, [socket]);

    return (
        <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none overflow-hidden z-50">
            <AnimatePresence>
                {reactions.map((reaction) => (
                    <motion.div
                        key={reaction.id}
                        initial={{ opacity: 0, y: 50, x: `calc(50% + ${reaction.xOffset}px)`, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -200, scale: [0.5, 1.2, 1, 0.8] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.5, ease: "easeOut" }}
                        className="absolute bottom-4 left-0 right-0 text-center text-4xl"
                    >
                        {reaction.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
