"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Globe, Mic, Monitor, Zap, Shield, Play, Music, ChevronDown, Star, Tv, MessageSquare, Radio, Github, Check, Lock, Unlock, Users, Laptop } from "lucide-react";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";

const FRAME_COUNT = 150; // User can adjust this based on actual frame count in /sync_frames/

// ------------------------------------------------------------
// GSAP Check
// ------------------------------------------------------------
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ------------------------------------------------------------
// Lenis Setup
// ------------------------------------------------------------
function useLenis() {
  useEffect(() => {
    let lenis: any;
    const init = async () => {
      const Lenis = (await import("lenis")).default;
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true } as any);
      let id: number;
      const r = (time: number) => { lenis.raf(time); id = requestAnimationFrame(r); };
      id = requestAnimationFrame(r);
      return () => { cancelAnimationFrame(id); lenis.destroy(); };
    };
    const c = init();
    return () => { c.then(f => f?.()); };
  }, []);
}

// ------------------------------------------------------------
// Simple scroll reveal
// ------------------------------------------------------------
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold });
    o.observe(ref.current);
    return () => o.disconnect();
  }, [threshold]);
  return { ref, v };
}

// ------------------------------------------------------------
// Cinematic Canvas 
// ------------------------------------------------------------
function CinematicHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const act1Ref = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const act3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frames: HTMLImageElement[] = [];
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new window.Image();
      const num = i.toString().padStart(4, "0");
      img.src = `/sync_frames/frame_${num}.webp`;
      frames.push(img);
    }

    const state = { frame: 0 };

    function renderFrame() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = frames[state.frame];
      if (img && img.complete && img.naturalWidth !== 0) {
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (canvas.width - img.width * ratio) / 2;
        const centerShiftY = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      }
    }

    frames[0].onload = () => renderFrame();

    let resizeTimer: any;
    const setSize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        renderFrame();
      }, 50);
    };
    setSize();
    window.addEventListener("resize", setSize);

    const gsapCtx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=2500",
          scrub: 0.2,
          pin: true,
        }
      });
      tl.to(state, { frame: FRAME_COUNT - 1, snap: "frame", ease: "none", onUpdate: renderFrame, duration: 2 }, 0);
      tl.to(act1Ref.current, { y: -100, opacity: 0, filter: "blur(10px)", duration: 0.3 }, 0);
      tl.to(act2Ref.current, { rotationY: 0, x: 0, opacity: 1, duration: 0.4 }, 0.6)
        .to(act2Ref.current, { opacity: 0, y: -100, duration: 0.4 }, 1.2);
      tl.to(act3Ref.current, { y: 0, opacity: 1, duration: 0.4 }, 1.5);
    }, containerRef);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", setSize);
      gsapCtx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] bg-[#030309] text-white overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-[5]" style={{ boxShadow: "inset 0 0 150px rgba(3,3,9,0.9)" }} />

      {/* Act I */}
      <div ref={act1Ref} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center z-10">
        <h1 className="font-outfit text-[clamp(4rem,14vw,11rem)] font-black tracking-tighter leading-[0.8] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] pointer-events-auto">
          SYNCVERSE
        </h1>
        <p className="font-outfit text-white text-xl md:text-3xl font-medium tracking-wide max-w-2xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] pointer-events-auto">
          Never Watch Alone. Frame-Perfect Media Sync.
        </p>
      </div>

      {/* Act II */}
      <div ref={act2Ref} className="absolute inset-0 flex items-center justify-end px-[10%] pointer-events-none z-10 opacity-0" style={{ transform: "rotateY(-15deg) translateX(100px)" }}>
        <div className="backdrop-blur-2xl bg-black/40 border border-white/20 rounded-3xl p-10 max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <h2 className="font-outfit text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Zero-Latency Rooms.
          </h2>
          <p className="font-outfit text-white/95 text-xl leading-relaxed font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Experience movies and music in perfect harmony. SyncVerse coordinates playback states globally with sub-millisecond precision.
          </p>
        </div>
      </div>

      {/* Act III */}
      <div ref={act3Ref} className="absolute bottom-[20vh] left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10 opacity-0 transform translate-y-10">
        <div className="backdrop-blur-lg bg-[#030309]/50 border border-cyan-500/20 px-8 py-6 rounded-3xl flex flex-col items-center gap-5 shadow-[0_0_60px_rgba(6,182,212,0.15)]">
          <span className="text-sm uppercase tracking-[0.2em] font-bold text-cyan-400">
            Powered by Real-Time Infrastructure
          </span>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <div className="relative overflow-hidden px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200">
              WebSockets
              <div className="absolute inset-0 w-8 bg-purple-400/50 blur-[10px] -skew-x-12 animate-[slide_3s_ease-in-out_infinite]" />
            </div>
            <div className="w-5 h-px bg-gradient-to-r from-purple-500 to-cyan-500" />
            <div className="relative overflow-hidden px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
              WebRTC
              <div className="absolute inset-0 w-8 bg-cyan-400/50 blur-[10px] -skew-x-12 animate-[slide_3s_ease-in-out_infinite_0.5s]" />
            </div>
            <div className="w-5 h-px bg-gradient-to-r from-cyan-500 to-pink-500" />
            <div className="relative overflow-hidden px-4 py-2 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-200">
              Redis Pub/Sub
              <div className="absolute inset-0 w-8 bg-pink-400/50 blur-[10px] -skew-x-12 animate-[slide_3s_ease-in-out_infinite_1s]" />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide {
          0% { transform: translateX(-150%); }
          50% { transform: translateX(250%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------
// Navbar
// ------------------------------------------------------------
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#030309]/80 backdrop-blur-2xl border-b border-white/[0.04]" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-20">
        <div className="flex items-center gap-3">
          <Image src="/logos/logo-icon.png" alt="Icon" width={32} height={32} />
          <span className="font-outfit font-black text-2xl tracking-[0.15em] text-white drop-shadow-md">
            SYNCVERSE
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-sm text-white/70 font-medium">
          {[["features", "Features"], ["how-it-works", "How it Works"], ["faq", "FAQ"]].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors">{label}</button>
          ))}
        </nav>
        <div className="flex items-center gap-3 w-fit">
          <Link
            href="/auth"
            className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          >
            Login
          </Link>
          <Link
            href="/auth"
            className="hidden sm:flex group items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5"
          >
            Get Started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ------------------------------------------------------------
// Legacy Premium Components Extracted
// ------------------------------------------------------------
const STATS = [
  { v: "< 50ms", l: "Sync Latency" },
  { v: "10", l: "Users Per Room" },
  { v: "4", l: "Media Sources" },
  { v: "WebRTC", l: "P2P Video" },
];

function StatsStrip() {
  const { ref, v } = useReveal();
  return (
    <section ref={ref as any} className="relative z-20 border-y border-white/[0.04] bg-[#030309] py-12 pt-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(168,85,247,0.05)]">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
        {STATS.map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 14 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay: i * 0.06 }} className="flex flex-col items-center text-center gap-1">
            <span className="text-[2rem] sm:text-[2.5rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 leading-none">{s.v}</span>
            <span className="text-[10px] text-neutral-600 font-semibold uppercase tracking-[0.18em] mt-1">{s.l}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function MarqueeSection() {
  const content = "NO INSTALLS  •  SUB-50MS LATENCY  •  WEBRTC POWERED  •  P2P SCREEN SHARE  •  ZERO SERVER LOAD  •  FRAME-PERFECT SYNC  •  ";
  return (
    <div className="relative z-10 py-5 overflow-hidden border-b border-white/[0.04] bg-[#0c0c14] flex items-center">
      <div className="absolute left-0 w-24 h-full bg-gradient-to-r from-[#030309] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 w-24 h-full bg-gradient-to-l from-[#030309] to-transparent z-10 pointer-events-none" />
      <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 25, ease: "linear", repeat: Infinity }} className="flex whitespace-pre text-neutral-600 font-bold text-[11px] tracking-[0.25em]">
        <span>{content.repeat(4)}</span>
        <span>{content.repeat(4)}</span>
      </motion.div>
    </div>
  );
}

const FEATURES = [
  { icon: <Zap size={20} />, color: "purple", title: "Frame-Perfect Sync", desc: "Every pause, seek, and speed change lands simultaneously for all viewers. Our adaptive clock engine compensates for network drift in real time.", bullets: ["Sub-50ms latency", "Drift auto-correction", "Works over any connection"] },
  { icon: <Monitor size={20} />, color: "blue", title: "P2P Screen Share", desc: "Stream your desktop, a window, or a tab directly to your friends via WebRTC — no server load, no quality cap.", bullets: ["Up to 60 FPS", "System audio included", "Zero bandwidth hit on server"] },
  { icon: <Music size={20} />, color: "pink", title: "Collaborative Queues", desc: "Build playlists together in real time. Drag, reorder, shuffle, and repeat — everyone hears the same beat at the same millisecond.", bullets: ["YouTube + SoundCloud", "Local files supported", "Drag-to-reorder queue"] },
  { icon: <MessageSquare size={20} />, color: "green", title: "Live Chat & Reactions", desc: "React with floating emoji bursts, drop a GIF into the chat, or just type. Built-in social layer so you never miss a moment.", bullets: ["GIF support via Giphy", "Floating emoji reactions", "Fullscreen chat overlay"] },
  { icon: <Shield size={20} />, color: "amber", title: "DJ Mode", desc: "Lock all playback controls to the host only. Run the perfect movie night without someone accidentally rewinding to the beginning.", bullets: ["Host-only playback", "Per-room toggle", "Guest access still allowed"] },
  { icon: <Globe size={20} />, color: "cyan", title: "Zero-Install", desc: "No extensions, no desktop app. Works natively in any modern browser — Chrome, Firefox, Safari, and Edge.", bullets: ["Mobile friendly", "Progressive Web App", "Runs on any OS"] },
];

// ------------------------------------------------------------
// Interactive Feature Showcase Widgets
// ------------------------------------------------------------
function SyncDemoWidget() {
  const [synced, setSynced] = useState(false);
  const [latency, setLatency] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setSynced(prev => {
        const next = !prev;
        setLatency(next ? 0 : Math.floor(Math.random() * 20) + 30);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#06060c] rounded-xl border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden font-outfit select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:14px_24px]" />
      
      <div className="flex justify-between items-center z-10 mb-3">
        <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Latency Analyzer</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors duration-300 ${synced ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
          {synced ? "SYNCED" : `DRIFT: +${latency}ms`}
        </span>
      </div>

      <div className="space-y-3 z-10 mb-3">
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-neutral-400">
            <span>Room Host (Source)</span>
            <span className="text-purple-400 font-bold">1:24.45</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" 
              animate={{ width: ["30%", "85%"] }} 
              transition={{ duration: 8, ease: "linear", repeat: Infinity }} 
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-neutral-400">
            <span>You (Client)</span>
            <span className={synced ? "text-purple-400 font-bold transition-colors duration-300" : "text-amber-400 font-bold transition-colors duration-300"}>
              {synced ? "1:24.45 (0ms drift)" : `1:24.41 (-40ms lag)`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
            {synced ? (
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" 
                animate={{ width: ["30%", "85%"] }} 
                transition={{ duration: 8, ease: "linear", repeat: Infinity }} 
              />
            ) : (
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full" 
                animate={{ width: ["28%", "83%"] }} 
                transition={{ duration: 8, ease: "linear", repeat: Infinity }} 
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-neutral-500 z-10 pt-2 border-t border-white/5">
        <span>Drift Auto-Correction</span>
        <span className={synced ? "text-neutral-500" : "text-purple-400 font-bold animate-pulse"}>
          {synced ? "Idle" : "Applying 1.05x correction..."}
        </span>
      </div>
    </div>
  );
}

function P2PShareWidget() {
  return (
    <div className="w-full bg-[#06060c] rounded-xl border border-white/5 p-4 flex items-center justify-around relative overflow-hidden font-outfit select-none min-h-[90px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff02_1px,transparent_1px)] bg-[size:10px_10px]" />
      
      <div className="flex flex-col items-center gap-1 z-10">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Laptop size={14} />
        </div>
        <span className="text-[9px] text-neutral-400 font-bold">Sharer</span>
      </div>

      <div className="flex-1 max-w-[60px] h-1 bg-neutral-900 relative rounded-full overflow-hidden mx-2">
        <motion.div 
          className="absolute top-0 h-full w-4 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          animate={{ left: ["-20%", "120%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="flex flex-col items-center gap-1 opacity-40 z-10">
        <div className="w-6 h-6 rounded-full bg-neutral-850 border border-neutral-700 flex items-center justify-center text-neutral-500 text-[8px] font-bold">
          SRV
        </div>
        <span className="text-[7px] text-neutral-500">Bypassed</span>
      </div>

      <div className="flex-1 max-w-[60px] h-1 bg-neutral-900 relative rounded-full overflow-hidden mx-2">
        <motion.div 
          className="absolute top-0 h-full w-4 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          animate={{ left: ["-20%", "120%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.75 }}
        />
      </div>

      <div className="flex flex-col items-center gap-1 z-10">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Users size={14} />
        </div>
        <span className="text-[9px] text-neutral-400 font-bold">Viewer</span>
      </div>
    </div>
  );
}

function QueueDemoWidget() {
  const [tracks, setTracks] = useState([
    { id: 1, title: "1. Daft Punk - One More Time", active: true },
    { id: 2, title: "2. Interstellar Theme", active: false },
    { id: 3, title: "3. Lofi Hip Hop Beats", active: false },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTracks(prev => {
        const copy = [...prev];
        const last = copy.pop()!;
        copy.unshift(last);
        return copy.map((t, idx) => ({
          ...t,
          title: `${idx + 1}. ${t.title.substring(3)}`,
          active: idx === 0
        }));
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#06060c] rounded-xl border border-white/5 p-3 flex flex-col gap-1.5 relative overflow-hidden font-outfit select-none justify-center min-h-[90px]">
      {tracks.map((t) => (
        <motion.div 
          key={t.id} 
          layout
          className={`px-3 py-1.5 rounded-lg border text-[10px] flex items-center justify-between transition-all duration-350 ${t.active ? "bg-pink-500/10 border-pink-500/30 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.15)]" : "bg-neutral-900/40 border-white/5 text-neutral-400"}`}
        >
          <span className="font-semibold truncate">{t.title}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {t.active && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />}
            <span className="text-[8px] text-neutral-500">{t.active ? "PLAYING" : "QUEUED"}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ReactionsDemoWidget() {
  const [reactions, setReactions] = useState<{ id: number; x: number; emoji: string }[]>([]);
  const nextId = useRef(0);

  const spawnEmoji = (emoji: string) => {
    const id = nextId.current++;
    const x = Math.random() * 80 + 10;
    setReactions(prev => [...prev, { id, x, emoji }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 1800);
  };

  useEffect(() => {
    const emojis = ["🔥", "💖", "🎉", "😮", "😂", "👍"];
    const interval = setInterval(() => {
      spawnEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#06060c] rounded-xl border border-white/5 p-3 flex flex-col justify-between relative overflow-hidden font-outfit select-none min-h-[120px]">
      <div className="relative flex-1 w-full overflow-hidden min-h-[50px]">
        <AnimatePresence>
          {reactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, scale: 0.5, x: `${r.x}%`, y: "75px" }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1, 0.8], y: "5px" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="absolute text-sm pointer-events-none"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5 justify-center z-10 pt-1.5 border-t border-white/5">
        {["🔥", "💖", "🎉", "😮"].map(emoji => (
          <button 
            key={emoji}
            onClick={() => spawnEmoji(emoji)}
            className="w-7 h-7 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center text-xs hover:bg-neutral-850 active:scale-95 transition-all text-neutral-300 hover:text-white"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function DJModeDemoWidget() {
  const [djMode, setDjMode] = useState(true);

  return (
    <div className="w-full bg-[#06060c] rounded-xl border border-white/5 p-3 flex flex-col justify-between relative overflow-hidden font-outfit select-none min-h-[120px]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500">Room Security</span>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full transition-colors duration-300 ${djMode ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]" : "bg-neutral-800 text-neutral-400"}`}>
          {djMode ? "DJ MODE ON" : "SHARED PLAYBACK"}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 py-1.5">
        <motion.div 
          animate={{ scale: djMode ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 2, repeat: djMode ? Infinity : 0 }}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${djMode ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"}`}
        >
          {djMode ? <Lock size={12} /> : <Unlock size={12} />}
        </motion.div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-white font-bold">{djMode ? "Host Controls Only" : "Anyone Can Control"}</span>
          <span className="text-[8px] text-neutral-500">{djMode ? "Guests locked from pausing" : "Collaborative session"}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
        <span className="text-[9px] text-neutral-400">DJ Access Toggle</span>
        <button 
          onClick={() => setDjMode(!djMode)}
          className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${djMode ? "bg-amber-500" : "bg-neutral-800"}`}
        >
          <motion.div 
            layout 
            className="w-3 h-3 rounded-full bg-white absolute top-0.5 shadow-md"
            animate={{ left: djMode ? "17px" : "2px" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
    </div>
  );
}

function ZeroInstallWidget() {
  return (
    <div className="w-full bg-[#06060c] rounded-xl border border-white/5 p-3 flex flex-col justify-between relative overflow-hidden font-outfit select-none min-h-[120px]">
      <div className="w-full bg-[#0a0a14] rounded border border-white/5 p-1 flex items-center gap-1.5">
        <div className="flex gap-0.5 shrink-0">
          <span className="w-1 h-1 rounded-full bg-red-500/40" />
          <span className="w-1 h-1 rounded-full bg-yellow-500/40" />
          <span className="w-1 h-1 rounded-full bg-green-500/40" />
        </div>
        <div className="flex-1 bg-black/40 rounded px-1.5 py-0.5 text-[8px] text-neutral-500 font-medium truncate flex items-center gap-1">
          <Globe size={8} /> syncverse.tv/room/x9a2k
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-2 py-2">
        <div className="flex gap-2 text-neutral-400">
          {["Chrome", "Safari", "Firefox"].map((b, i) => (
            <motion.div
              key={b}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
              className="text-[8px] font-bold px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-neutral-300"
            >
              {b}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-[8px] text-center text-neutral-500 pt-1 border-t border-white/5">
        Zero extensions required. Native browser sync.
      </div>
    </div>
  );
}

const colorMap = {
  purple: { border: "border-purple-500/10 hover:border-purple-500/35", icon: "bg-purple-500/10 text-purple-400", bullet: "text-purple-400" },
  blue:   { border: "border-blue-500/10 hover:border-blue-500/35",     icon: "bg-blue-500/10 text-blue-400",   bullet: "text-blue-400" },
  pink:   { border: "border-pink-500/10 hover:border-pink-500/35",     icon: "bg-pink-500/10 text-pink-400",   bullet: "text-pink-400" },
  green:  { border: "border-emerald-500/10 hover:border-emerald-500/35", icon: "bg-emerald-500/10 text-emerald-400", bullet: "text-emerald-400" },
  amber:  { border: "border-amber-500/10 hover:border-amber-500/35",   icon: "bg-amber-500/10 text-amber-400",  bullet: "text-amber-400" },
  cyan:   { border: "border-cyan-500/10 hover:border-cyan-500/35",     icon: "bg-cyan-500/10 text-cyan-400",   bullet: "text-cyan-400" },
} as any;

function FeaturesSection() {
  const { ref, v } = useReveal();
  return (
    <section id="features" ref={ref as any} className="relative z-10 py-28 px-6 overflow-hidden bg-[#030309]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-20 max-w-2xl">
          <span className="inline-block mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-purple-400">What's inside</span>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-black text-white leading-tight mb-5">Everything a watch party<br />could ever need.</h2>
          <p className="text-neutral-500 text-lg leading-relaxed font-light">Built from scratch around real-time collaboration — not bolt-on features.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Large Card: Frame-Perfect Sync */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={v ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.55, delay: 0.05 }} 
            className={`lg:col-span-7 p-7 rounded-2xl border ${colorMap[FEATURES[0].color].border} bg-[#0c0c14]/50 backdrop-blur-md transition-all duration-400 group relative overflow-hidden flex flex-col justify-between`}
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-purple-600/5 blur-3xl group-hover:bg-purple-600/10 transition-colors duration-700 pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${colorMap[FEATURES[0].color].icon}`}>{FEATURES[0].icon}</div>
                <h3 className="text-white font-bold text-xl mb-3">{FEATURES[0].title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-5">{FEATURES[0].desc}</p>
                <ul className="space-y-1.5">{FEATURES[0].bullets.map(b => (<li key={b} className={`flex items-center gap-2 text-xs font-medium ${colorMap[FEATURES[0].color].bullet}`}><Check size={12} className="shrink-0" /> {b}</li>))}</ul>
              </div>
              <div className="md:col-span-5 w-full">
                <SyncDemoWidget />
              </div>
            </div>
          </motion.div>

          {/* Medium Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Card 2: P2P Screen Share */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }} 
              animate={v ? { opacity: 1, y: 0 } : {}} 
              transition={{ duration: 0.5, delay: 0.1 }} 
              className={`p-6 rounded-2xl border ${colorMap[FEATURES[1].color].border} bg-[#0c0c14]/50 backdrop-blur-md transition-all duration-400 group relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMap[FEATURES[1].color].icon}`}>{FEATURES[1].icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{FEATURES[1].title}</h3>
                  <p className="text-neutral-500 text-xs leading-relaxed">{FEATURES[1].desc}</p>
                </div>
              </div>
              <P2PShareWidget />
            </motion.div>

            {/* Card 3: Collaborative Queues */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }} 
              animate={v ? { opacity: 1, y: 0 } : {}} 
              transition={{ duration: 0.5, delay: 0.17 }} 
              className={`p-6 rounded-2xl border ${colorMap[FEATURES[2].color].border} bg-[#0c0c14]/50 backdrop-blur-md transition-all duration-400 group relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMap[FEATURES[2].color].icon}`}>{FEATURES[2].icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-base mb-1.5">{FEATURES[2].title}</h3>
                  <p className="text-neutral-500 text-xs leading-relaxed">{FEATURES[2].desc}</p>
                </div>
              </div>
              <QueueDemoWidget />
            </motion.div>
          </div>

          {/* Bottom row cards */}
          {/* Card 4: Live Chat & Reactions */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={v ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.5, delay: 0.22 }} 
            className={`lg:col-span-4 p-6 rounded-2xl border ${colorMap[FEATURES[3].color].border} bg-[#0c0c14]/50 backdrop-blur-md transition-all duration-400 group relative overflow-hidden flex flex-col justify-between`}
          >
            <div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${colorMap[FEATURES[3].color].icon}`}>{FEATURES[3].icon}</div>
              <h3 className="text-white font-semibold text-base mb-2">{FEATURES[3].title}</h3>
              <p className="text-neutral-500 text-xs leading-relaxed mb-4">{FEATURES[3].desc}</p>
            </div>
            <div className="mt-auto pt-2 space-y-4">
              <ReactionsDemoWidget />
              <ul className="space-y-1.5 pt-2 border-t border-white/5">{FEATURES[3].bullets.map(b => (<li key={b} className={`flex items-center gap-1.5 text-[11px] font-medium ${colorMap[FEATURES[3].color].bullet}`}><Check size={11} className="shrink-0" /> {b}</li>))}</ul>
            </div>
          </motion.div>

          {/* Card 5: DJ Mode */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={v ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.5, delay: 0.29 }} 
            className={`lg:col-span-4 p-6 rounded-2xl border ${colorMap[FEATURES[4].color].border} bg-[#0c0c14]/50 backdrop-blur-md transition-all duration-400 group relative overflow-hidden flex flex-col justify-between`}
          >
            <div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${colorMap[FEATURES[4].color].icon}`}>{FEATURES[4].icon}</div>
              <h3 className="text-white font-semibold text-base mb-2">{FEATURES[4].title}</h3>
              <p className="text-neutral-500 text-xs leading-relaxed mb-4">{FEATURES[4].desc}</p>
            </div>
            <div className="mt-auto pt-2 space-y-4">
              <DJModeDemoWidget />
              <ul className="space-y-1.5 pt-2 border-t border-white/5">{FEATURES[4].bullets.map(b => (<li key={b} className={`flex items-center gap-1.5 text-[11px] font-medium ${colorMap[FEATURES[4].color].bullet}`}><Check size={11} className="shrink-0" /> {b}</li>))}</ul>
            </div>
          </motion.div>

          {/* Card 6: Zero-Install */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={v ? { opacity: 1, y: 0 } : {}} 
            transition={{ duration: 0.5, delay: 0.36 }} 
            className={`lg:col-span-4 p-6 rounded-2xl border ${colorMap[FEATURES[5].color].border} bg-[#0c0c14]/50 backdrop-blur-md transition-all duration-400 group relative overflow-hidden flex flex-col justify-between`}
          >
            <div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${colorMap[FEATURES[5].color].icon}`}>{FEATURES[5].icon}</div>
              <h3 className="text-white font-semibold text-base mb-2">{FEATURES[5].title}</h3>
              <p className="text-neutral-500 text-xs leading-relaxed mb-4">{FEATURES[5].desc}</p>
            </div>
            <div className="mt-auto pt-2 space-y-4">
              <ZeroInstallWidget />
              <ul className="space-y-1.5 pt-2 border-t border-white/5">{FEATURES[5].bullets.map(b => (<li key={b} className={`flex items-center gap-1.5 text-[11px] font-medium ${colorMap[FEATURES[5].color].bullet}`}><Check size={11} className="shrink-0" /> {b}</li>))}</ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", icon: "🏠", title: "Create a Room", body: "One click. Name it, pick private or public, and your room is live." },
  { n: "02", icon: "🔗", title: "Share the Link", body: "Send a 6-character code or a direct URL. No sign-up required for guests." },
  { n: "03", icon: "▶️", title: "Play Anything", body: "Paste a YouTube link, upload a local file, or share your screen." },
  { n: "04", icon: "❤️", title: "Enjoy in Sync", body: "Every pause, skip, and reaction stays in perfect lock-step for everyone." },
];

function HowSection() {
  const { ref, v } = useReveal();
  return (
    <section id="how-it-works" className="relative z-10 py-28 px-6 overflow-hidden bg-[#030309]">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-[140px] pointer-events-none" />
      <div className="max-w-5xl mx-auto" ref={ref as any}>
        <motion.div initial={{ opacity: 0, y: 22 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-16 text-center">
          <span className="inline-block mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">Getting started</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-black text-white">Up and running in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">60 seconds.</span></h2>
        </motion.div>
        <div className="relative">
          <div className="hidden md:block absolute top-9 left-[calc(12.5%+1px)] right-[calc(12.5%+1px)] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 28 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.09 }} className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full border border-white/15 bg-[#0c0c14] flex items-center justify-center text-sm font-black text-neutral-400 z-10 relative">{s.n}</div>
                </div>
                <div className="text-2xl">{s.icon}</div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1.5">{s.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: "Alex Chen", handle: "@alexc", text: "Me and my friends use this every weekend for anime nights. The fact that I don't need to force anyone to install an extension is a total game changer. It just works.", star: 5 },
  { name: "Sarah Jenkins", handle: "@sarah_j", text: "The P2P screen share is ridiculously fast. We were sharing a 60fps game stream and the latency was virtually non-existent. Best watch party app I've used.", star: 5 },
  { name: "David Kim", handle: "@davidk_dev", text: "As a developer, I appreciate the absolute perfection of the video sync clock. It never drifts. You can tell this was built with performance as the absolute #1 priority.", star: 5 },
];

function TestimonialsSection() {
  const { ref, v } = useReveal();
  return (
    <section ref={ref as any} className="relative z-10 py-28 px-6 bg-[#030309]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-16 text-center">
          <span className="inline-block mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-pink-400">Loved by users</span>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black text-white">Don't just take our word for it.</h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.handle} initial={{ opacity: 0, y: 30 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }} className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
              <div className="flex gap-1 mb-6 text-amber-500">
                {[...Array(t.star)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-neutral-300 text-[15px] leading-relaxed mb-8">"{t.text}"</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden">{t.name.charAt(0)}</div>
                <div>
                  <h4 className="text-white text-sm font-bold">{t.name}</h4>
                  <p className="text-neutral-500 text-xs">{t.handle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Is SyncVerse free?", a: "Yes — completely free. No credit card, no trial limit. Create a room and start watching." },
  { q: "Do my friends need an account?", a: "No. Anyone can join as a Guest with just a display name. Accounts unlock saved playlists and profiles." },
  { q: "How does screen sharing work?", a: "We use WebRTC — the same peer-to-peer tech as Google Meet. Video travels browser-to-browser, not through our server." },
  { q: "Can I share Netflix or Prime?", a: "Not directly — those platforms use HDCP DRM which prevents browser capture. YouTube, local files, SoundCloud and desktop apps work perfectly." },
  { q: "How many people can join a room?", a: "Up to 10 users per room." },
];

function FAQSection() {
  const { ref, v } = useReveal();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" ref={ref as any} className="relative z-10 py-28 px-6 bg-[#030309]">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400">FAQ</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-black text-white">Got questions?</h2>
          <p className="text-neutral-500 mt-3 font-light">Quick answers before you start your first room.</p>
        </motion.div>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <motion.div key={f.q} initial={{ opacity: 0, y: 14 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.42, delay: i * 0.06 }} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${open === i ? "border-purple-500/30 bg-purple-500/[0.04]" : "border-white/[0.04] bg-[#0c0c14] hover:border-white/[0.1]"}`}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left gap-4">
                <span className="text-white font-medium text-sm">{f.q}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.22 }} className="shrink-0 text-neutral-600 text-xl leading-none">+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div key="b" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }}>
                    <p className="px-6 pb-5 text-neutral-400 text-sm leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Footer CTA
// ------------------------------------------------------------
function Footer() {
  return (
    <footer className="relative z-20 bg-[#0c0c14] py-20 px-6 border-t border-white/[0.04]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full border border-purple-500/25 bg-purple-500/8 text-purple-300 text-[11px] font-bold uppercase tracking-[0.18em]">
           <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Always Free
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Your next movie night<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">starts right now.</span></h2>
        <p className="text-neutral-500 text-base mb-10 leading-relaxed font-light">No downloads, no sign-up hassle. Just open the page, create a room, and send the link.</p>
        <Link
          href="/auth"
          className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-lg transition-all shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:shadow-[0_0_80px_rgba(6,182,212,0.5)] hover:-translate-y-1"
        >
          Get Started
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <div className="mt-20 pt-10 border-t border-white/[0.05] w-full flex justify-between items-center text-xs text-neutral-600">
          <p>Designed & developed by <a href="https://atulraj-portfolio.vercel.app/" target="_blank" rel="noreferrer" className="text-purple-500 font-bold hover:text-cyan-400 transition-colors">Atul Raj</a> &copy; {new Date().getFullYear()}</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white transition-colors">GitHub</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ------------------------------------------------------------
// Root
// ------------------------------------------------------------
export default function LandingPage() {
  useLenis();

  return (
    <main className="bg-[#030309] font-sans">
      <NavBar />
      <CinematicHero />
      <StatsStrip />
      <MarqueeSection />
      <FeaturesSection />
      <HowSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
