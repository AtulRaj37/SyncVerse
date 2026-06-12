import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { Eye, EyeOff, Mail, Lock, User, Tv, Plus, Link as LinkIcon, ArrowRight, UserPlus, Key, Compass, Hash } from "lucide-react";

type AuthMode = 'SELECT' | 'GUEST' | 'LOGIN' | 'REGISTER';

export function HeroForm() {
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
    const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

    useEffect(() => {
        if (token) {
            setAuthMode('GUEST');
        }
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const joinParam = params.get("join");
            if (joinParam) {
                setJoinUrl(joinParam);
                setActiveTab('join');
                if (!token) setAuthMode('GUEST');
            }
        }
    }, [token]);

    const handleAuthAndCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomName && authMode === 'GUEST' && activeTab === 'create') {
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

            if (roomName && activeTab === 'create') {
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
            setError("Please enter a Display Name to join as guest.");
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

            router.push(`/room/${extracted}`);
        } catch (err: any) {
            setError(err.message || "Failed to join room.");
            setLoading(false);
        }
    };

    return (
        <div className="w-full font-outfit">
            <div className="rounded-2xl border border-white/[0.08] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl bg-[#0b0b12]/90 overflow-hidden">
                <div className="p-10 md:p-12">
                    <AnimatePresence mode="wait">

                        {/* AUTH SELECTION SCREEN */}
                        {!token && authMode === 'SELECT' && (
                            <motion.div 
                                key="select" 
                                initial={{ opacity: 0, y: 12 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -12 }} 
                                className="flex flex-col gap-6"
                            >
                                <div className="text-center mb-3">
                                    <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">Access SyncVerse</h2>
                                    <p className="text-base text-neutral-400 mt-2 font-light">Select how you want to join the network</p>
                                </div>

                                {/* Option 1: Guest Card */}
                                <button
                                    onClick={() => setAuthMode('GUEST')}
                                    className="w-full text-left p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-purple-500/30 transition-all duration-300 group flex items-start gap-5 cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <Compass size={28} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                                            Continue as Guest <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-purple-400" />
                                        </h3>
                                        <p className="text-sm text-neutral-400 font-light leading-relaxed">Instantly join or launch watch parties with a temporary display name. No signup needed.</p>
                                    </div>
                                </button>

                                {/* Option 2: Account Card */}
                                <button
                                    onClick={() => setAuthMode('LOGIN')}
                                    className="w-full text-left p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-blue-500/30 transition-all duration-300 group flex items-start gap-5 cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                        <Key size={28} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                                            Sign In / Register <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-blue-400" />
                                        </h3>
                                        <p className="text-sm text-neutral-400 font-light leading-relaxed">Access saved playlists, custom avatar configurations, and customized room presets.</p>
                                    </div>
                                </button>
                            </motion.div>
                        )}

                        {/* LOGIN / REGISTER INLINE CARD */}
                        {(authMode === 'LOGIN' || authMode === 'REGISTER') && (
                            <motion.div 
                                key="auth" 
                                initial={{ opacity: 0, x: 15 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -15 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5 mb-2">
                                    <h2 className="text-xl font-bold text-white">{authMode === 'LOGIN' ? 'Member Login' : 'Create Account'}</h2>
                                    <button 
                                        onClick={() => { setAuthMode('SELECT'); setError(""); }} 
                                        className="text-neutral-400 hover:text-white text-sm transition-colors cursor-pointer font-medium"
                                    >
                                        ← Back
                                    </button>
                                </div>

                                <form onSubmit={handleAuthAndCreate} className="space-y-5">
                                    {authMode === 'REGISTER' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Your Name</label>
                                            <div className="relative">
                                                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                <input 
                                                    type="text" 
                                                    value={name} 
                                                    onChange={(e) => setName(e.target.value)} 
                                                    required 
                                                    placeholder="e.g. Austin"
                                                    className="w-full pl-14 pr-4 py-3.5 bg-black/40 border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 rounded-xl focus:outline-none text-white text-base transition-all placeholder:text-neutral-600" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
                                            {authMode === 'LOGIN' ? 'Email or Username' : 'Email Address'}
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input
                                                type="text"
                                                placeholder={authMode === 'LOGIN' ? 'name@example.com' : 'you@example.com'}
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full pl-14 pr-4 py-3.5 bg-black/40 border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 rounded-xl focus:outline-none text-white text-base transition-all placeholder:text-neutral-600"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Password</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                value={password} 
                                                onChange={(e) => setPassword(e.target.value)} 
                                                required 
                                                placeholder="••••••••"
                                                className="w-full pl-14 pr-12 py-3.5 bg-black/40 border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 rounded-xl focus:outline-none text-white text-base transition-all placeholder:text-neutral-600" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)} 
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {error && (
                                        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_4px_30px_rgba(168,85,247,0.35)] transition-all duration-350 disabled:opacity-50 text-sm uppercase tracking-wider cursor-pointer mt-2"
                                    >
                                        {loading ? "Processing..." : (authMode === 'LOGIN' ? "Sign In" : "Register & Start")}
                                    </button>
                                </form>

                                <div className="text-center pt-2">
                                    <button 
                                        onClick={() => { setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(""); }} 
                                        className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors cursor-pointer"
                                    >
                                        {authMode === 'LOGIN' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* DASHBOARD MODE (GUEST OR SIGNED IN) */}
                        {(token || authMode === 'GUEST') && (
                            <motion.div 
                                key="dashboard" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="space-y-6"
                            >
                                {/* Dashboard Profile Bar */}
                                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5 mb-2">
                                    <div>
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2 leading-none">
                                            Hello, {storedName || name || "Guest"}
                                            {token && !isGuest && (
                                                <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-black tracking-widest">PRO</span>
                                            )}
                                        </h2>
                                        {token && isGuest && (
                                            <button 
                                                onClick={() => { setAuthMode('REGISTER'); useUserStore.getState().logout(); }} 
                                                className="text-xs text-purple-400 hover:underline mt-2 font-medium block cursor-pointer"
                                            >
                                                Upgrade to Account
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        {token ? (
                                            <button 
                                                onClick={() => { useUserStore.getState().logout(); setName(""); setAuthMode('SELECT'); }} 
                                                className="text-red-400 hover:text-red-300 text-sm transition-colors font-medium cursor-pointer"
                                            >
                                                Sign Out
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => { setAuthMode('SELECT'); setError(""); }} 
                                                className="text-neutral-400 hover:text-white text-sm transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Custom Tab Switcher */}
                                <div className="bg-black/40 border border-white/[0.06] p-1.5 rounded-2xl flex gap-1.5 select-none">
                                    <button 
                                        type="button"
                                        onClick={() => { setActiveTab('create'); setError(""); }}
                                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'create' ? "bg-white/5 text-white shadow" : "text-neutral-500 hover:text-neutral-300"}`}
                                    >
                                        Create Room
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => { setActiveTab('join'); setError(""); }}
                                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === 'join' ? "bg-white/5 text-white shadow" : "text-neutral-500 hover:text-neutral-300"}`}
                                    >
                                        Join Room
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {/* TAB: CREATE ROOM */}
                                    {activeTab === 'create' && (
                                        <motion.form 
                                            key="createForm" 
                                            initial={{ opacity: 0, y: 5 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.2 }}
                                            onSubmit={handleAuthAndCreate} 
                                            className="space-y-5"
                                        >
                                            {!token && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Your Display Name</label>
                                                    <div className="relative">
                                                        <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                        <input 
                                                            type="text" 
                                                            value={name} 
                                                            onChange={(e) => setName(e.target.value)} 
                                                            required 
                                                            placeholder="e.g. Austin" 
                                                            className="w-full pl-14 pr-4 py-3.5 bg-black/40 border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 rounded-xl focus:outline-none text-white text-base transition-all placeholder:text-neutral-600" 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Room Name</label>
                                                <div className="relative">
                                                    <Tv size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                    <input 
                                                        type="text" 
                                                        value={roomName} 
                                                        onChange={(e) => setRoomName(e.target.value)} 
                                                        required 
                                                        placeholder="e.g. Movie Night 🍿" 
                                                        className="w-full pl-14 pr-4 py-3.5 bg-black/40 border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 rounded-xl focus:outline-none text-white text-base transition-all placeholder:text-neutral-600" 
                                                    />
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm text-center">
                                                    {error}
                                                </div>
                                            )}

                                            <button 
                                                type="submit" 
                                                disabled={loading} 
                                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(168,85,247,0.25)] transition-all disabled:opacity-50 text-sm uppercase tracking-wider cursor-pointer"
                                            >
                                                {loading ? "Creating room..." : "Launch Room"}
                                            </button>
                                        </motion.form>
                                    )}

                                    {/* TAB: JOIN ROOM */}
                                    {activeTab === 'join' && (
                                        <motion.form 
                                            key="joinForm" 
                                            initial={{ opacity: 0, y: 5 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ duration: 0.2 }}
                                            onSubmit={handleJoinRoom} 
                                            className="space-y-5"
                                        >
                                            {!token && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Your Display Name</label>
                                                    <div className="relative">
                                                        <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                        <input 
                                                            type="text" 
                                                            value={name} 
                                                            onChange={(e) => setName(e.target.value)} 
                                                            required 
                                                            placeholder="e.g. Austin" 
                                                            className="w-full pl-14 pr-4 py-3.5 bg-black/40 border border-white/[0.08] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl focus:outline-none text-white text-base transition-all placeholder:text-neutral-600" 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Room Code or URL</label>
                                                <div className="relative">
                                                    <Hash size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                    <input
                                                        type="text"
                                                        value={joinUrl}
                                                        onChange={(e) => setJoinUrl(e.target.value)}
                                                        required
                                                        placeholder="e.g. syncverse.tv/room/x9a2k"
                                                        className="w-full pl-14 pr-4 py-3.5 bg-black/40 border border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl focus:outline-none text-white text-base transition-all placeholder:text-neutral-600"
                                                    />
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm text-center">
                                                    {error}
                                                </div>
                                            )}

                                            <button 
                                                type="submit" 
                                                disabled={loading || !joinUrl} 
                                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.25)] transition-all disabled:opacity-50 text-sm uppercase tracking-wider cursor-pointer"
                                            >
                                                {loading ? "Connecting..." : "Connect to Stream"}
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
