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

// ------------------------------------------------------------
// Interactive Product Showcase Dashboard
// ------------------------------------------------------------
const SHOWCASE_FEATURES = [
  {
    id: "sync",
    icon: <Zap size={18} />,
    title: "Frame-Perfect Sync",
    tagline: "Sub-50ms latency drift correction.",
    desc: "SyncVerse monitors playback state globally. If a viewer drifts due to network lag, our adaptive clock engine temporarily adjusts their playback rate until they are in perfect sync with the host.",
    bullets: ["Adaptive rate-adjustment (1.05x)", "Under 50ms latency target", "State synchronization across tabs"]
  },
  {
    id: "p2p",
    icon: <Monitor size={18} />,
    title: "P2P Screen Share",
    tagline: "High frame-rate WebRTC streaming.",
    desc: "Stream your desktop, windows, or specific tabs directly to peers. By utilizing WebRTC, video data flows peer-to-peer, keeping server load at absolute zero.",
    bullets: ["Up to 1080p 60 FPS video", "Direct browser-to-browser pipe", "Low bandwidth impact"]
  },
  {
    id: "queue",
    icon: <Music size={18} />,
    title: "Collaborative Queues",
    tagline: "Shared media queues in real time.",
    desc: "Everyone in the room can add, drag, and reorder tracks. The playlist syncs instantly, allowing a collaborative watch party experience.",
    bullets: ["YouTube & SoundCloud support", "Real-time queue reordering", "Smooth drag-and-drop animations"]
  },
  {
    id: "chat",
    icon: <MessageSquare size={18} />,
    title: "Live Chat & Reactions",
    tagline: "Floating reactions & text overlay.",
    desc: "React to critical movie moments with real-time emoji bursts and GIF integration. Text messages and reactions sync instantly across everyone's viewports.",
    bullets: ["Floating emoji burst layers", "Giphy integration built-in", "Zero layout shift overlay"]
  },
  {
    id: "dj",
    icon: <Shield size={18} />,
    title: "DJ Control Mode",
    tagline: "Host-only room governance.",
    desc: "Enforce room control with DJ Mode. When active, only the host can pause, play, seek, or change media sources, keeping the stream secure.",
    bullets: ["One-click DJ toggle", "Lock playback controls", "Prevent guest interruptions"]
  },
  {
    id: "install",
    icon: <Globe size={18} />,
    title: "Zero-Install Client",
    tagline: "Works natively in any modern browser.",
    desc: "No desktop client, no account creation, and no browser extension required. Guests click your short link and land straight in the synchronized stream.",
    bullets: ["Universal web support", "No account signup barrier", "Responsive mobile experience"]
  }
];

function ShowcaseDashboard({ activeTab }: { activeTab: string }) {
  // Demo States
  const [syncState, setSyncState] = useState({ hostTime: 12.45, peerTime: 12.41, synced: false });
  const [activeQueue, setActiveQueue] = useState([
    { id: 1, title: "Daft Punk - Get Lucky", source: "YouTube", playing: true },
    { id: 2, title: "Interstellar Soundtrack", source: "SoundCloud", playing: false },
    { id: 3, title: "Lofi Beats for Coding", source: "Local", playing: false }
  ]);
  const [djMode, setDjMode] = useState(true);
  const [chatReactions, setChatReactions] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const nextId = useRef(0);

  // Sync demo simulation
  useEffect(() => {
    if (activeTab !== "sync") return;
    const interval = setInterval(() => {
      setSyncState(prev => {
        if (prev.synced) {
          return { hostTime: 12.45, peerTime: 12.41, synced: false };
        } else {
          return { hostTime: 12.45, peerTime: 12.45, synced: true };
        }
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Queue demo simulation
  useEffect(() => {
    if (activeTab !== "queue") return;
    const interval = setInterval(() => {
      setActiveQueue(prev => {
        const copy = [...prev];
        const last = copy.pop()!;
        copy.unshift(last);
        return copy.map((item, idx) => ({ ...item, playing: idx === 0 }));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Reactions simulation
  useEffect(() => {
    if (activeTab !== "chat") return;
    const interval = setInterval(() => {
      const emojis = ["🔥", "💖", "😂", "👍", "🎉", "😲"];
      const id = nextId.current++;
      setChatReactions(prev => [...prev, { id, emoji: emojis[Math.floor(Math.random() * emojis.length)], x: Math.random() * 80 + 10 }]);
      setTimeout(() => {
        setChatReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    }, 1200);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <div className="w-full h-full min-h-[380px] bg-[#0c0c14]/40 border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden font-outfit backdrop-blur-xl">
      {/* Top Browser Bar */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
        </div>
        <div className="flex-1 max-w-sm bg-black/40 border border-white/[0.05] rounded-lg px-3 py-1 text-[10px] text-neutral-400 font-medium truncate flex items-center gap-2 mx-auto justify-center">
          <Globe size={10} className="text-neutral-500" />
          <span>syncverse.tv/room/dx8s91</span>
        </div>
        <div className="w-10" /> {/* Spacer to center URL bar */}
      </div>

      {/* Screen Content based on Active Tab */}
      <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden">
        
        {/* TAB 1: FRAME PERFECT SYNC */}
        {activeTab === "sync" && (
          <div className="w-full max-w-md space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Synchronization Sync Clock</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${syncState.synced ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                {syncState.synced ? "SYNCED (0ms drift)" : "DRIFT DETECTED: +40ms"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Host (Streamer)</span>
                  <span className="text-purple-400 font-mono font-bold">01:24.45</span>
                </div>
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" 
                    animate={{ width: ["30%", "90%"] }} 
                    transition={{ duration: 10, ease: "linear", repeat: Infinity }} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${syncState.synced ? "bg-purple-400" : "bg-amber-400"}`} /> You (Viewer)</span>
                  <span className={`font-mono font-bold transition-colors duration-300 ${syncState.synced ? "text-purple-400" : "text-amber-400"}`}>
                    {syncState.synced ? "01:24.45 (0ms)" : "01:24.41 (-40ms)"}
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                  {syncState.synced ? (
                    <motion.div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full" 
                      animate={{ width: ["30%", "90%"] }} 
                      transition={{ duration: 10, ease: "linear", repeat: Infinity }} 
                    />
                  ) : (
                    <motion.div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full" 
                      animate={{ width: ["28%", "88%"] }} 
                      transition={{ duration: 10, ease: "linear", repeat: Infinity }} 
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-neutral-500 border-t border-white/[0.05] pt-3">
              <span>Sync Correction Mechanism</span>
              <span className={syncState.synced ? "text-neutral-500" : "text-purple-400 font-bold animate-pulse"}>
                {syncState.synced ? "Idle (Monitoring)" : "Applying 1.05x catch-up rate..."}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: P2P SCREEN SHARE */}
        {activeTab === "p2p" && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            <div className="flex gap-16 items-center relative py-4 w-full justify-center">
              {/* Path Flow */}
              <div className="absolute left-[20%] right-[20%] h-0.5 bg-neutral-800 top-[42%] overflow-hidden">
                <motion.div 
                  className="h-full w-20 bg-gradient-to-r from-transparent via-blue-400 to-transparent absolute"
                  animate={{ left: ["-20%", "120%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Sender */}
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <Laptop size={20} />
                </div>
                <span className="text-xs font-bold text-white">Sharer</span>
              </div>

              {/* Bypassed Server Node */}
              <div className="flex flex-col items-center gap-1 opacity-20 z-10 scale-90">
                <div className="w-10 h-10 rounded-full bg-neutral-850 border border-neutral-700 flex items-center justify-center text-neutral-500 text-[10px] font-bold">
                  SRV
                </div>
                <span className="text-[9px] text-neutral-500">Central Server</span>
              </div>

              {/* Receiver */}
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <Users size={20} />
                </div>
                <span className="text-xs font-bold text-white">Peers</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-neutral-400 font-bold">Direct WebRTC Connection</p>
              <p className="text-[10px] text-neutral-600">Video streaming scales P2P. Bandwidth completely bypasses the server.</p>
            </div>
          </div>
        )}

        {/* TAB 3: COLLABORATIVE QUEUE */}
        {activeTab === "queue" && (
          <div className="w-full max-w-sm space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 block">Up Next Playlist</span>
            <div className="space-y-2">
              {activeQueue.map((item, idx) => (
                <motion.div 
                  key={item.id} 
                  layout
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all duration-300 ${item.playing ? "bg-pink-500/10 border-pink-500/30 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.1)]" : "bg-neutral-900/40 border-white/[0.04] text-neutral-400"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 font-mono">0{idx + 1}</span>
                    <span className="font-semibold truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5">{item.source}</span>
                    {item.playing && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: LIVE CHAT & REACTIONS */}
        {activeTab === "chat" && (
          <div className="w-full h-full min-h-[200px] flex flex-col justify-between relative">
            {/* Reaction Spawner Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <AnimatePresence>
                {chatReactions.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.6, x: `${r.x}%`, y: "160px" }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.3, 1.1, 0.9], y: "10px" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    className="absolute text-xl"
                  >
                    {r.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Mock chat feed */}
            <div className="space-y-3 p-2">
              <div className="bg-neutral-900/30 border border-white/[0.04] p-2.5 rounded-xl max-w-[80%] text-xs text-neutral-300">
                <span className="font-bold text-purple-400 block mb-0.5">Austin</span>
                That movie drop sync is insane!
              </div>
              <div className="bg-neutral-900/30 border border-white/[0.04] p-2.5 rounded-xl max-w-[80%] text-xs text-neutral-300 ml-auto">
                <span className="font-bold text-cyan-400 block mb-0.5 text-right">Sophia</span>
                Agreed, literally zero drift on my end.
              </div>
            </div>

            {/* Simulated chat input bar */}
            <div className="border-t border-white/[0.05] pt-3 flex gap-2 items-center">
              <div className="flex-1 bg-black/30 border border-white/5 rounded-full px-4 py-1.5 text-xs text-neutral-500">
                Type a message or react...
              </div>
              <div className="flex gap-1 shrink-0">
                {["🔥", "💖", "🎉"].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => {
                      const id = nextId.current++;
                      setChatReactions(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }]);
                      setTimeout(() => {
                        setChatReactions(prev => prev.filter(r => r.id !== id));
                      }, 2000);
                    }}
                    className="w-7 h-7 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-xs hover:bg-neutral-850 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DJ CONTROL MODE */}
        {activeTab === "dj" && (
          <div className="w-full max-w-sm space-y-5 text-center">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Security Engine</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors duration-300 ${djMode ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-neutral-800 text-neutral-400"}`}>
                {djMode ? "DJ MODE ON" : "SHARED ACCESS"}
              </span>
            </div>

            <div className="bg-neutral-900/30 border border-white/[0.04] p-5 rounded-2xl flex flex-col items-center gap-4">
              <motion.div 
                animate={{ scale: djMode ? [1, 1.04, 1] : 1 }}
                transition={{ duration: 2, repeat: djMode ? Infinity : 0 }}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 ${djMode ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-neutral-850 border-neutral-700 text-neutral-400"}`}
              >
                {djMode ? <Lock size={16} /> : <Unlock size={16} />}
              </motion.div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{djMode ? "Playback Controls Locked" : "Public Playback Controls"}</p>
                <p className="text-xs text-neutral-500">{djMode ? "Only Room Host has authority to seek or pause." : "Anyone can pause or control playback."}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/[0.05]">
              <span className="text-xs text-neutral-400">DJ Control Authority</span>
              <button 
                onClick={() => setDjMode(!djMode)}
                className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${djMode ? "bg-amber-500" : "bg-neutral-800"}`}
              >
                <motion.div 
                  layout 
                  className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 shadow-md"
                  animate={{ left: djMode ? "18px" : "2px" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: ZERO-INSTALL */}
        {activeTab === "install" && (
          <div className="w-full max-w-sm text-center space-y-4">
            <div className="flex justify-center gap-4 py-4">
              {["Chrome", "Safari", "Firefox", "Edge"].map((b, i) => (
                <motion.div
                  key={b}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                  className="text-[10px] font-bold px-3 py-1.5 bg-neutral-900 border border-white/[0.05] rounded-xl text-neutral-300 shadow-sm"
                >
                  {b}
                </motion.div>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Direct browser coordination</p>
              <p className="text-[10px] text-neutral-500">No account required for guests. Works out of the box in every major browser.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState("sync");
  const { ref, v } = useReveal();

  return (
    <section id="features" ref={ref as any} className="relative z-10 py-28 px-6 overflow-hidden bg-[#030309]">
      {/* Decorative center grid light */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-20 max-w-2xl">
          <span className="inline-block mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-purple-400">Features Tour</span>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-black text-white leading-tight mb-5">Everything a watch party<br />could ever need.</h2>
          <p className="text-neutral-500 text-lg leading-relaxed font-light">Built from scratch around real-time collaboration — not bolt-on features.</p>
        </motion.div>

        {/* Dynamic Product Showcase layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Navigation Cards */}
          <div className="lg:col-span-5 flex flex-col gap-3 justify-center">
            {SHOWCASE_FEATURES.map((feature) => {
              const active = activeTab === feature.id;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 cursor-pointer relative overflow-hidden group ${active ? "bg-white/[0.02] border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.3)]" : "bg-transparent border-transparent hover:bg-white/[0.01]"}`}
                >
                  {/* Hover Left Stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 transition-all duration-300 ${active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50 group-hover:opacity-40"}`} />
                  
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${active ? "bg-purple-500/10 text-purple-400" : "bg-neutral-900 text-neutral-500 group-hover:text-neutral-300"}`}>
                    {feature.icon}
                  </div>

                  <div className="space-y-1 pr-2">
                    <h3 className={`font-bold text-sm transition-colors duration-300 ${active ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"}`}>{feature.title}</h3>
                    <p className={`text-xs leading-relaxed transition-colors duration-300 ${active ? "text-neutral-400 font-normal" : "text-neutral-500 font-light"}`}>{feature.tagline}</p>
                    
                    {/* Expandable details when active */}
                    <AnimatePresence>
                      {active && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0, marginTop: 0 }} 
                          animate={{ height: "auto", opacity: 1, marginTop: 8 }} 
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden space-y-3"
                        >
                          <p className="text-[11px] text-neutral-500 font-light leading-relaxed">{feature.desc}</p>
                          <ul className="space-y-1 border-t border-white/[0.04] pt-2">
                            {feature.bullets.map(b => (
                              <li key={b} className="flex items-center gap-1.5 text-[10px] text-purple-400 font-medium">
                                <Check size={10} className="shrink-0" /> {b}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Dynamic Stage */}
          <div className="lg:col-span-7 flex items-center">
            <ShowcaseDashboard activeTab={activeTab} />
          </div>
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
