"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HeroForm } from "@/components/HeroForm";
import dynamic from "next/dynamic";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { ArrowLeft } from "lucide-react";

const Galaxy = dynamic(() => import("@/components/Galaxy"), { ssr: false }) as any;

export default function AuthPage() {
  const { isLowEnd } = useDevicePerformance();

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden bg-[#060610] px-4 font-sans">
      {/* Background with slight glow */}
      <div className="fixed inset-0 -z-20 bg-[#060610]">
        {!isLowEnd && (
          <Galaxy starSpeed={0} density={1.2} hueShift={140} speed={0.4}
            glowIntensity={0.2} saturation={0.6} mouseRepulsion={true} repulsionStrength={0.3}
            twinkleIntensity={0.4} rotationSpeed={0.05} transparent={true} />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(120,60,255,0.12),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_100%,rgba(60,100,255,0.08),transparent)] pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}
          className="absolute -top-16 left-0"
        >
          <Link href="/" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </motion.div>

        {/* Logo Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <Link href="/">
            <Image 
              src="/logos/logo-transparent.png" 
              alt="SyncVerse" 
              width={200} 
              height={50} 
              priority 
              style={{ width: "auto", height: "45px" }}
              className="drop-shadow-[0_0_24px_rgba(168,85,247,0.5)] hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </motion.div>

        {/* Auth Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full relative"
        >
          {/* Subtle glow behind the card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl opacity-50" />
          
          {/* The actual form component */}
          <HeroForm />
        </motion.div>

        {/* Footer Credit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-8 text-xs text-neutral-600 font-medium tracking-wide"
        >
          Built for real connection by <span className="text-purple-400 font-bold">Atul Raj</span>
        </motion.div>
      </div>
    </div>
  );
}
