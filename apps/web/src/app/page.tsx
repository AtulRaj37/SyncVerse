"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useUserStore } from "@/store/useUserStore";
import { Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
import { HeroForm } from "@/components/HeroForm";

const Galaxy = dynamic(() => import("@/components/Galaxy"), { ssr: false }) as any;
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

export default function LandingPage() {
  const { isLowEnd } = useDevicePerformance();

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#060610] font-sans flex flex-col items-center justify-center relative">

      {/* Galaxy Backgroundddd — window-level mouse events are listened to inside Galaxy.jsx */}
      <div className="fixed inset-0 z-0" style={{ background: '#060610' }}>
        {!isLowEnd && (
          <Galaxy
            starSpeed={0}
            density={1.7}
            hueShift={140}
            speed={0.7}
            glowIntensity={0.3}
            saturation={0.8}
            mouseRepulsion={true}
            repulsionStrength={0.5}
            twinkleIntensity={0.55}
            rotationSpeed={0.1}
            transparent={true}
          />
        )}
      </div>

      {/* All content in one screen but can scroll if needed */}
      <main className="relative z-10 w-full flex flex-col items-center justify-center px-4 gap-5">

        {/* Compact Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <Image
            src="/logos/logo-transparent.png"
            alt="SyncVerse"
            width={200}
            height={55}
            priority
            style={{ width: 'auto' }}
            className="mb-3 drop-shadow-[0_0_24px_rgba(168,85,247,0.7)] hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            Watch and Listen{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Together</span>
          </h1>
          <p className="text-sm text-neutral-400 max-w-xs font-light">
            Sync video &amp; audio with anyone, instantly.
          </p>
        </motion.div>

        {/* Auth Card — completely isolated from page root state */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="w-full max-w-md"
        >
          <HeroForm />
        </motion.div>

        {/* Developer Credit Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-6 text-center pointer-events-none"
        >
          <p className="text-xs text-neutral-500 font-medium tracking-wide">
            Designed & Developed by <span className="text-purple-400 font-bold whitespace-nowrap">Atul Raj</span> © {new Date().getFullYear()}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
