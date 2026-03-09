"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Particle = { id: number; x: number; y: number; size: number; delay: number; duration: number };

export function GlobalLoading() {
    const [visible, setVisible] = useState(true);
    // Particles generated client-side only — avoids SSR/hydration mismatch from Math.random()
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        setParticles(
            Array.from({ length: 22 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 3 + 1,
                delay: Math.random() * 3,
                duration: Math.random() * 4 + 3,
            }))
        );
        const timer = setTimeout(() => setVisible(false), 2400);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <style>{`
        .sv-loader {
          width: 90px;
          height: 14px;
          background:
            radial-gradient(circle 7px at bottom,#a855f7 92%,#0000) calc(100%/2) 0,
            radial-gradient(circle 7px at top   ,#a855f7 92%,#0000) calc(100%/2) 100%,
            conic-gradient(from 135deg at top   ,#a855f7 90deg,#0000 0) 0 0,
            conic-gradient(from -45deg at bottom,#a855f7 90deg,#0000 0) 0 100%;
          background-size: calc(100%/2) 50%;
          background-repeat: repeat-x;
          animation: svl13 3s infinite;
          filter: drop-shadow(0 0 8px rgba(168,85,247,0.9));
        }
        @keyframes svl13 {
          0%       { background-position: calc(100%/2) 0, calc(100%/2) 100%, 0 0, 0 100% }
          20%, 30% { background-position: calc(3*100%/4) 0, calc(100%/4) 100%, calc(100%/4) 0, calc(100%/-4) 100% }
          45%, 55% { background-position: 100% 0, 0 100%, calc(100%/2) 0, calc(100%/-2) 100% }
          70%, 80% { background-position: calc(5*100%/4) 0, calc(100%/-4) 100%, calc(3*100%/4) 0, calc(3*100%/-4) 100% }
          100%     { background-position: calc(3*100%/2) 0, calc(100%/-2) 100%, 100% 0, -100% 100% }
        }
        @keyframes orbit-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1) rotate(0deg); }
          50%       { opacity: 0.35; transform: scale(1.06) rotate(180deg); }
        }
        @keyframes orbit-pulse-rev {
          0%, 100% { opacity: 0.1; transform: scale(1) rotate(0deg); }
          50%       { opacity: 0.25; transform: scale(1.04) rotate(-180deg); }
        }
        @keyframes scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.06; }
          90%  { opacity: 0.06; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .sv-shimmer-text {
          background: linear-gradient(90deg,#6366f1,#a855f7,#ec4899,#a855f7,#6366f1);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 2.5s linear infinite;
        }
      `}</style>

            <AnimatePresence>
                {visible && (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
                        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#060610] overflow-hidden"
                    >
                        {/* Scan line */}
                        <div
                            className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-purple-400/10 to-transparent pointer-events-none z-0"
                            style={{ animation: "scan 2.8s linear infinite" }}
                        />

                        {/* Deep glow blobs */}
                        <div className="absolute inset-0 pointer-events-none">
                            <motion.div
                                className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-700/25 blur-[140px]"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.div
                                className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[140px]"
                                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            />
                            <motion.div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pink-600/15 blur-[100px]"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            />
                        </div>

                        {/* Floating particles — only rendered after client mount */}
                        {particles.map((p) => (
                            <motion.div
                                key={p.id}
                                className="absolute rounded-full bg-white"
                                style={{
                                    left: `${p.x}%`,
                                    top: `${p.y}%`,
                                    width: p.size,
                                    height: p.size,
                                    opacity: 0,
                                }}
                                animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0] }}
                                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
                            />
                        ))}

                        {/* Center content */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="relative z-10 flex flex-col items-center gap-7"
                        >
                            {/* Orbital rings */}
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-52 h-52 rounded-full border border-purple-500/20" style={{ animation: "orbit-pulse 4s ease-in-out infinite" }} />
                                <div className="absolute w-64 h-64 rounded-full border border-blue-400/15" style={{ animation: "orbit-pulse-rev 5s ease-in-out infinite" }} />
                                <motion.div
                                    className="absolute w-44 h-44 rounded-full border border-pink-500/20"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                    style={{ borderTopColor: "rgba(168,85,247,0.5)", borderRightColor: "transparent" }}
                                />
                                <motion.div
                                    className="absolute w-56 h-56 rounded-full border border-blue-500/20"
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                                    style={{ borderBottomColor: "rgba(59,130,246,0.4)", borderLeftColor: "transparent" }}
                                />
                                {/* Logo with breathing glow */}
                                <motion.div
                                    animate={{
                                        filter: [
                                            "drop-shadow(0 0 20px rgba(168,85,247,0.6))",
                                            "drop-shadow(0 0 40px rgba(168,85,247,1))",
                                            "drop-shadow(0 0 20px rgba(168,85,247,0.6))",
                                        ],
                                    }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <Image
                                        src="/logos/logo-transparent.png"
                                        alt="SyncVerse"
                                        width={200}
                                        height={55}
                                        priority
                                        className="relative z-10"
                                    />
                                </motion.div>
                            </div>

                            {/* Chain loader */}
                            <div className="sv-loader" />

                            {/* Shimmer label */}
                            <p className="sv-shimmer-text text-sm tracking-[0.25em] uppercase font-semibold">
                                Loading SyncVerse...
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
