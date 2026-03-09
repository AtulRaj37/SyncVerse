"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useUserStore } from "@/store/useUserStore";
import { Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";

const Galaxy = dynamic(() => import("@/components/Galaxy"), { ssr: false });

type AuthMode = 'SELECT' | 'GUEST' | 'LOGIN' | 'REGISTER';

export default function LandingPage() {
  const router = useRouter();
  const { setAuth, name: storedName, token, isGuest } = useUserStore();

  const [authMode, setAuthMode] = useState<AuthMode>('SELECT');
  const [name, setName] = useState(storedName || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [roomName, setRoomName] = useState("");
  const [joinUrl, setJoinUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, skip auth selection, or read ?join parameter
  useEffect(() => {
    if (token) {
      setAuthMode('GUEST');
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get("join");
      if (joinParam) {
        setJoinUrl(joinParam);
        if (!token) setAuthMode('GUEST');
      }
    }
  }, [token]);

  const handleAuthAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName && authMode === 'GUEST') {
      setError("Please enter a room name.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      let currentToken = token;

      if (!currentToken || authMode === 'LOGIN' || authMode === 'REGISTER') {
        let endpoint = "guest";
        let body: any = { name };

        if (authMode === 'LOGIN') {
          endpoint = "login";
          body = { identifier: email, password };
        } else if (authMode === 'REGISTER') {
          endpoint = "register";
          body = { name, email, password };
        }

        const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const authData = await authRes.json();
        if (!authRes.ok) throw new Error(authData.error?.[0]?.message || authData.error || "Authentication failed");

        setAuth(authData.user, authData.token);
        currentToken = authData.token;

        if (authMode !== 'GUEST' && !roomName) {
          setAuthMode('GUEST');
          setLoading(false);
          return;
        }
      }

      if (roomName) {
        const roomRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ name: roomName, isPrivate: false }),
        });

        const roomData = await roomRes.json();
        if (!roomRes.ok) throw new Error(roomData.error || "Failed to create room");

        router.push(`/room/${roomData.room.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinUrl) return;

    if (!token && !name) {
      setError("Please enter a Display Name above to join as a guest.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let currentToken = token;

      if (!currentToken) {
        const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        const authData = await authRes.json();
        if (!authRes.ok) throw new Error(authData.error || "Failed to join as guest");

        setAuth(authData.user, authData.token);
        currentToken = authData.token;
      }

      let extracted = joinUrl.trim();
      if (joinUrl.includes("join/")) extracted = joinUrl.split("join/")[1]?.split("/")[0] || extracted;
      else if (joinUrl.includes("room/")) extracted = joinUrl.split("room/")[1]?.split("/")[0] || extracted;

      if (!extracted) throw new Error("Invalid code.");

      const endpoint = extracted.length <= 10 ? `by-code/${extracted}` : extracted;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${endpoint}`);
      if (!res.ok) throw new Error("Room not found.");

      const data = await res.json();
      router.push(`/room/${data.room.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to join room.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#060610] font-sans flex flex-col items-center justify-center relative">

      {/* Galaxy Backgroundddd — window-level mouse events are listened to inside Galaxy.jsx */}
      <div className="fixed inset-0 z-0" style={{ background: '#060610' }}>
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
      </div>

      {/* All content in one screen — no page scroll ever */}
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

        {/* Auth Card — height constrained so nothing pushes below viewport */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl bg-black/50">
            <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <AnimatePresence mode="wait">

                {/* AUTH SELECTION */}
                {!token && authMode === 'SELECT' && (
                  <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                    <h2 className="text-xl font-bold text-white mb-1 text-center">Welcome to SyncVerse</h2>
                    <button
                      onClick={() => setAuthMode('GUEST')}
                      className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                    >
                      Continue as Guest
                    </button>
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink-0 mx-3 text-neutral-500 text-xs uppercase tracking-widest">or</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>
                    <button
                      onClick={() => setAuthMode('LOGIN')}
                      className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                    >
                      Sign In / Create Account
                    </button>
                  </motion.div>
                )}

                {/* LOGIN / REGISTER */}
                {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
                  <motion.div key="auth" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="flex items-center mb-4">
                      <button onClick={() => setAuthMode('SELECT')} className="text-neutral-400 hover:text-white mr-3 text-sm">← Back</button>
                      <h2 className="text-lg font-bold text-white">{authMode === 'LOGIN' ? 'Sign In' : 'Create Account'}</h2>
                    </div>
                    <form onSubmit={handleAuthAndCreate} className="space-y-3">
                      {authMode === 'REGISTER' && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Your Name</label>
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm transition-all" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">
                          {authMode === 'LOGIN' ? 'Email / Username' : 'Email'}
                        </label>
                        <input
                          type="text"
                          placeholder={authMode === 'LOGIN' ? 'Enter email or username...' : ''}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm transition-all placeholder:text-neutral-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2.5 pr-10 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm transition-all" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                      <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm">
                        {loading ? "Processing..." : (authMode === 'LOGIN' ? "Sign In" : "Sign Up")}
                      </button>
                    </form>
                    <div className="mt-3 text-center">
                      <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="text-sm text-purple-400 hover:text-purple-300">
                        {authMode === 'LOGIN' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* DASHBOARD (guest or signed in) */}
                {(token || authMode === 'GUEST') && (
                  <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          Hello, {storedName || name || "Guest"}
                          {token && !isGuest && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full uppercase tracking-wider">PRO</span>}
                        </h2>
                        {token && isGuest && <button onClick={() => { setAuthMode('REGISTER'); useUserStore.getState().logout(); }} className="text-xs text-purple-400 hover:underline">Upgrade to Account</button>}
                      </div>
                      <div>
                        {token ? (
                          <button onClick={() => { useUserStore.getState().logout(); setName(""); setAuthMode('SELECT'); }} className="text-red-400 hover:text-red-300 text-xs transition-colors">Sign Out</button>
                        ) : (
                          <button onClick={() => setAuthMode('SELECT')} className="text-neutral-500 hover:text-white text-xs">Cancel</button>
                        )}
                      </div>
                    </div>

                    {/* Create Room */}
                    <form onSubmit={handleAuthAndCreate} className="space-y-3">
                      <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-widest">Create Room</h3>
                      {!token && (
                        <div>
                          <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Display Name</label>
                          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. DJ Khaleesi" className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm transition-all placeholder:text-neutral-600" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Room Name</label>
                        <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} required placeholder="e.g. Vibes & Chill" className="w-full px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 text-white text-sm transition-all placeholder:text-neutral-600" />
                      </div>
                      {error && <p className="text-red-400 text-xs">{error}</p>}
                      <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm">
                        {loading ? "Creating..." : "Create Room"}
                      </button>
                    </form>

                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink-0 mx-3 text-neutral-500 text-xs uppercase tracking-widest">or</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    {/* Join Room */}
                    <form onSubmit={handleJoinRoom}>
                      <label className="block text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-widest">Join Existing Room</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={joinUrl}
                          onChange={(e) => setJoinUrl(e.target.value)}
                          placeholder="Paste Room URL or Code"
                          className="flex-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm transition-all placeholder:text-neutral-600"
                        />
                        <button type="submit" disabled={!joinUrl} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                          Join
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
