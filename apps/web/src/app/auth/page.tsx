"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HeroForm } from "@/components/HeroForm";
import { ArrowLeft } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#04040a] font-sans relative overflow-hidden">
      {/* LEFT COLUMN: AUTH PANEL */}
      <div className="w-full lg:w-[48%] min-h-[100dvh] flex flex-col justify-center px-6 md:px-16 py-12 bg-[#06060c] border-r border-white/[0.04] relative z-10">
        <div className="max-w-[520px] w-full mx-auto space-y-8">
          {/* Back Button */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back to home
            </Link>
          </div>

          {/* Form wrapper */}
          <HeroForm />
        </div>
      </div>

      {/* RIGHT COLUMN: SIMPLE SHOWCASE (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[52%] min-h-[100dvh] flex-col justify-between p-20 bg-gradient-to-br from-[#080815] to-[#04040a] relative overflow-hidden select-none">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Ambient background glows */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-purple-900/15 blur-[160px] animate-[float-glow-1_30s_infinite_alternate_ease-in-out]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-blue-900/15 blur-[160px] animate-[float-glow-2_35s_infinite_alternate_ease-in-out_2s]" />

        {/* Empty top slot */}
        <div />

        {/* Central Clean Typography Block - Cozy copy */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">SyncVerse Watch Rooms</span>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            Watch and listen <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">together with friends.</span>
          </h1>
          <p className="text-base text-neutral-400 leading-relaxed font-light font-sans">
            SyncVerse makes it easy to hang out online. Create a room, share the link, and enjoy videos, music, and screen shares together in real-time. Completely free, no setup required.
          </p>
        </div>

        {/* Simple Footer Copy (Human-friendly) */}
        <div className="relative z-10 flex justify-between items-center text-xs text-neutral-600 font-medium">
          <span>Free Watch Parties</span>
          <span>No Extensions Needed</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-glow-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(50px, 70px) scale(1.1); }
          100% { transform: translate(-30px, -50px) scale(0.9); }
        }
        @keyframes float-glow-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-60px, -40px) scale(1.05); }
          100% { transform: translate(40px, 60px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
