"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HeroForm } from "@/components/HeroForm";
import { ArrowLeft, Tv } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden bg-[#04040a] px-4 py-8 font-sans">
      {/* Ambient background glows */}
      <div className="fixed inset-0 -z-20 overflow-hidden bg-[#04040a]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] animate-[float-glow-1_25s_infinite_alternate_ease-in-out]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] animate-[float-glow-2_30s_infinite_alternate_ease-in-out_2s]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(120,60,255,0.06),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_100%,rgba(60,100,255,0.04),transparent)] pointer-events-none" />
      </div>

      <div className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN: AUTH FORM PANEL */}
        <div className="lg:col-span-5 w-full flex flex-col justify-center">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back to home
            </Link>
          </div>

          {/* Logo Header */}
          <div className="mb-6">
            <Link href="/">
              <Image 
                src="/logos/logo-transparent.png" 
                alt="SyncVerse" 
                width={200} 
                height={50} 
                priority 
                style={{ width: "auto", height: "42px" }}
                className="drop-shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </div>

          {/* Form Container */}
          <div className="w-full relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-3xl blur-xl opacity-30" />
            <HeroForm />
          </div>
        </div>

        {/* RIGHT COLUMN: GRAPHICS SHOWCASE PANEL (Desktop Only) */}
        <div className="lg:col-span-7 hidden lg:flex flex-col justify-between bg-[#0c0c14]/40 border border-white/[0.06] rounded-3xl p-10 min-h-[520px] backdrop-blur-xl relative overflow-hidden self-stretch">
          {/* Subtle grid layer */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Headline and text */}
          <div className="relative z-10 max-w-md">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">SyncVerse Live Engine</span>
            <h1 className="text-3xl font-black text-white leading-tight tracking-tight mt-3">
              Never Watch Alone. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Frame-Perfect media rooms.</span>
            </h1>
            <p className="text-sm text-neutral-400 mt-4 leading-relaxed font-light">
              Experience movies, playlists, and live desktop screenshares in complete synchronization. If a viewer drifts, the local playback speed adjusts automatically.
            </p>
          </div>

          {/* Mock Synced Player UI Preview */}
          <div className="w-full bg-[#06060c]/80 border border-white/[0.06] rounded-2xl p-5 relative z-10 shadow-2xl mt-8">
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-3 mb-4">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active Stream Preview</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
            </div>

            {/* Video Player Box Mock */}
            <div className="aspect-video bg-neutral-950 rounded-xl relative overflow-hidden border border-white/5 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-neutral-900 to-cyan-900/20" />
              <div className="z-10 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 animate-pulse">
                  <Tv size={24} />
                </div>
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">SyncVerse Room #x9a2k</span>
              </div>

              {/* Client Sync Indicators overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">A</div>
                  <div className="text-[10px]">
                    <span className="text-white block font-bold leading-none">Austin (Host)</span>
                    <span className="text-neutral-500 text-[8px]">01:45.22 • Synced</span>
                  </div>
                </div>
                <div className="w-6 h-px bg-white/10" />
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">S</div>
                  <div className="text-[10px]">
                    <span className="text-white block font-bold leading-none">Sophia (Viewer)</span>
                    <span className="text-neutral-500 text-[8px]">01:45.22 • Synced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Micro stats banner */}
          <div className="flex justify-between items-center border-t border-white/[0.06] pt-6 mt-6 text-xs text-neutral-500 relative z-10 select-none">
            <span>RTC Signalling: Active</span>
            <span>Drift Limit: &lt;50ms</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-glow-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, 60px) scale(1.1); }
          100% { transform: translate(-20px, -40px) scale(0.9); }
        }
        @keyframes float-glow-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, -30px) scale(1.05); }
          100% { transform: translate(30px, 50px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
