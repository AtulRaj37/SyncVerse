"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function JoinCodePage() {
    const { code } = useParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "error">("loading");

    useEffect(() => {
        if (!code) return;

        const checkRoom = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/by-code/${code}`);
                if (!res.ok) {
                    setStatus("error");
                    return;
                }
                const data = await res.json();

                // Found the room, redirect to actual UUID route
                router.replace(`/room/${data.room.id}`);
            } catch (error) {
                console.error("Failed to join by code", error);
                setStatus("error");
            }
        };

        checkRoom();
    }, [code, router]);

    return (
        <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center font-sans p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 rounded-2xl border border-white/5 bg-[#141419]/90 backdrop-blur-xl shadow-2xl text-center max-w-sm w-full"
            >
                {status === "loading" ? (
                    <>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse animation-delay-200"></span>
                            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse animation-delay-400"></span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Joining Room...</h2>
                        <p className="text-sm text-neutral-400">Resolving invite code "{code}"</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-3 tracking-tight">Room Not Found</h2>
                        <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
                            The invite link has expired or the room no longer exists.
                        </p>
                        <button
                            onClick={() => router.replace("/")}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-bold transition-colors"
                        >
                            Return Home
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
