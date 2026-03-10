"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useUserStore } from "@/store/useUserStore";
import { useSocketStore } from "@/store/useSocketStore";
import { useSyncPlayback } from "@/hooks/useSyncPlayback";
import { useWebRTC } from "@/hooks/useWebRTC";
import dynamic from "next/dynamic";

const Player = dynamic(() => import("react-player/lazy"), { ssr: false }) as any;
const LightRays = dynamic(() => import("@/components/LightRays"), { ssr: false });
import { QueuePanel } from "@/components/QueuePanel";

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { ReactionLayer } from "@/components/ReactionLayer";
import { MediaSelector } from "@/components/MediaSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PlaylistManager } from "@/components/PlaylistManager";
import { MessageSquare, X, Link as LinkIcon, LogOut, User, Users, Settings, Check, ListMusic, Play, AlertTriangle } from "lucide-react";
import { SharedPlaylist } from "@syncverse/shared";

export default function RoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const { id: currentUserId, token, name, avatarUrl, bio, createdAt } = useUserStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [roomData, setRoomData] = useState<any>(null);

    const { connect, disconnect, roomState, isConnected, chatMessages, sendChatMessage, sendEmote, changeMedia, roomFull, sharedPlaylist, clearSharedPlaylist, updateQueue } = useSocketStore();
    const { localStream, remoteStream, startScreenShare, stopScreenShare } = useWebRTC();

    const playerRef = useRef<any>(null);
    const { localPlaybackRate, handlePlay, handlePause, handleSeek } = useSyncPlayback(playerRef);

    const [chatInput, setChatInput] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [copied, setCopied] = useState<"link" | "code" | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Playlist / Queue state
    const [showPlaylistManager, setShowPlaylistManager] = useState(false);
    const playlistQueue = roomState?.activeQueue?.playlist || null;
    const currentTrackIndex = roomState?.activeQueue?.trackIndex || 0;
    const [showQueue, setShowQueue] = useState(false);
    const [shuffle, setShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState<"NONE" | "ONE" | "ALL">("NONE");
    const shuffledOrderRef = useRef<number[]>([]);

    // Player View Modes
    const [playerMode, setPlayerMode] = useState<'NORMAL' | 'FULLSCREEN' | 'MINI_PLAYER'>('NORMAL');
    const playerContainerRef = useRef<HTMLDivElement>(null);

    // Floating Chat
    const [isChatSlidePanelOpen, setIsChatSlidePanelOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Emoji & GIF Pickers
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [gifSearchQuery, setGifSearchQuery] = useState("");
    const [gifs, setGifs] = useState<any[]>([]);
    const [isSearchingGifs, setIsSearchingGifs] = useState(false);

    // Resizable Sidebar
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 280 && newWidth <= 800) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => setIsResizing(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.classList.add('select-none', 'cursor-col-resize');

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('select-none', 'cursor-col-resize');
        };
    }, [isResizing]);

    // ── Playlist queue helpers ────────────────────────────────────────
    const handleTrackPlay = (playlist: SharedPlaylist, index: number) => {
        const track = playlist.tracks[index];
        if (!track) return;
        updateQueue({ playlist, trackIndex: index });
        changeMedia(track.mediaId, track.source as any);
    };

    const handleNext = () => {
        if (!playlistQueue || playlistQueue.tracks.length === 0) return;
        const len = playlistQueue.tracks.length;
        if (shuffle) {
            // Pick a random different index
            const next = Math.floor(Math.random() * len);
            handleTrackPlay(playlistQueue, next);
        } else if (repeatMode === "ONE") {
            handleTrackPlay(playlistQueue, currentTrackIndex);
        } else {
            const next = currentTrackIndex + 1;
            if (next < len) {
                handleTrackPlay(playlistQueue, next);
            } else if (repeatMode === "ALL") {
                handleTrackPlay(playlistQueue, 0);
            } else {
                // Reached end of playlist
                updateQueue(null);
            }
        }
    };

    const handlePrev = () => {
        if (!playlistQueue) return;
        const prev = Math.max(0, currentTrackIndex - 1);
        handleTrackPlay(playlistQueue, prev);
    };

    const handleEnded = () => {
        if (playlistQueue) {
            handleNext();
        }
    };

    const handleCopy = (type: "link" | "code") => {
        if (type === "link") {
            const url = roomData?.roomCode ? `${window.location.origin}/join/${roomData.roomCode}` : window.location.href;
            navigator.clipboard.writeText(url);
        } else {
            navigator.clipboard.writeText(roomData?.roomCode || id);
        }
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const fetchGifs = async (query?: string) => {
        setIsSearchingGifs(true);
        try {
            const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
            if (!apiKey) {
                console.warn("NEXT_PUBLIC_GIPHY_API_KEY is missing!");
                setGifs([]);
                return;
            }
            const endpoint = query
                ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20`;
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("Failed to fetch GIFs");
            const data = await res.json();
            setGifs(data.data || []);
        } catch (err) {
            console.error("Giphy error:", err);
            setGifs([]);
        } finally {
            setIsSearchingGifs(false);
        }
    };

    useEffect(() => {
        if (showGifPicker && gifs.length === 0 && !gifSearchQuery) {
            fetchGifs();
        }
    }, [showGifPicker]);

    useEffect(() => {
        if (!showGifPicker) return;
        const timeout = setTimeout(() => {
            if (gifSearchQuery) fetchGifs(gifSearchQuery);
            else if (gifs.length === 0) fetchGifs(); // fetch trending if cleared
        }, 500);
        return () => clearTimeout(timeout);
    }, [gifSearchQuery, showGifPicker]);

    // Auto-scroll chat & handle unread count
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

        // If chat is functionally hidden (e.g. fullscreen but panel is closed), bump unread count
        if (playerMode === 'FULLSCREEN' && !isChatSlidePanelOpen && chatMessages.length > 0) {
            // Only increment if the newest message is NOT from the current user
            const lastMsg = chatMessages[chatMessages.length - 1];
            if (lastMsg.userId !== currentUserId) {
                setUnreadCount(prev => prev + 1);
            }
        }
    }, [chatMessages, playerMode, isChatSlidePanelOpen, currentUserId]);

    // Fullscreen event listener sync
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setPlayerMode(prev => prev === 'FULLSCREEN' ? 'NORMAL' : prev);
                setIsChatSlidePanelOpen(false); // Make sure to close overlay chat when exiting FS
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            if (playerContainerRef.current) {
                await playerContainerRef.current.requestFullscreen().catch(err => console.error("Error attempting to enable fullscreen:", err));
                setPlayerMode('FULLSCREEN');
            }
        } else {
            await document.exitFullscreen();
            setPlayerMode('NORMAL');
        }
    };

    const toggleMiniPlayer = () => {
        if (playerMode === 'FULLSCREEN') document.exitFullscreen();
        setPlayerMode(prev => prev === 'MINI_PLAYER' ? 'NORMAL' : 'MINI_PLAYER');
    };

    // Attach stream to video element when source is SCREEN
    useEffect(() => {
        if (roomState?.currentMedia?.source === 'SCREEN' && playerRef.current) {
            // If the element is technically an HTMLVideoElement and not a ReactPlayer instance
            const videoEl = playerRef.current as HTMLVideoElement;
            if (videoEl && typeof videoEl.play === 'function') {
                videoEl.srcObject = localStream || remoteStream || null;
            }
        }
    }, [roomState?.currentMedia?.source, localStream, remoteStream]);

    useEffect(() => {
        if (!token || !name) {
            // User is not authenticated, redirect to home to join as guest, but preserve the room they tried to join
            router.push(`/?join=${id}`);
            return;
        }

        const fetchRoom = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error("Room not found or unauthorized");
                }

                const data = await res.json();
                setRoomData(data.room);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();

        // Connect to Socket
        if (token && id) {
            connect(token, id as string, { name: name!, avatarUrl: avatarUrl as any, bio, createdAt });
        }

        return () => {
            disconnect(); // Clean up on unmount
        };
    }, [id, token, name, router, connect, disconnect]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">{error}</h2>
                <button
                    onClick={() => router.push("/")}
                    className="px-6 py-2 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition"
                >
                    Return Home
                </button>
            </div>
        );
    }

    // Room Full Blocker
    if (roomFull) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#0b0b0f]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-[#141419] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
                >
                    <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Room is Full</h2>
                    <p className="text-neutral-400 mb-6">Maximum 10 users allowed in a room.</p>
                    <button
                        onClick={() => router.push("/")}
                        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition"
                    >
                        Return Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-neutral-950 flex flex-col">
            {/* Top Navbar */}
            <header className="h-[80px] border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-2xl flex items-center px-8 justify-between sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-6">
                    {/* Brand Identity */}
                    <div
                        className="flex items-center gap-1.5 cursor-pointer group"
                        onClick={() => router.push("/")}
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md group-hover:bg-purple-500/50 transition-colors duration-300"></div>
                            <Image
                                src="/logos/logo-icon.png"
                                alt="SyncVerse Icon"
                                width={44}
                                height={44}
                                className="h-11 w-11 object-contain relative z-10 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <Image
                            src="/logos/logo-text.png"
                            alt="SyncVerse"
                            width={140}
                            height={32}
                            className="h-6 w-auto object-contain hidden sm:block opacity-95 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] ml-1"
                        />
                    </div>

                    {/* Divider & Room Name + User Count */}
                    {roomData?.name && (
                        <>
                            <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent hidden md:block mx-1"></div>
                            <div className="hidden md:flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                    <span className="text-[10px] uppercase tracking-[0.25em] text-purple-200/70 font-bold leading-none">Live Room</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-purple-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] truncate max-w-[200px] lg:max-w-[400px]">
                                        {roomData.name}
                                    </p>
                                    {roomState && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 flex items-center gap-1">
                                            <Users size={10} />
                                            {Object.keys(roomState.users).length} / 10
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4 relative">
                    {/* Invite Dropdown Panel */}
                    <div className="relative">
                        <button
                            onClick={() => setIsInviteOpen(!isInviteOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 md:gap-2 md:px-4 md:py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] md:text-xs font-semibold shadow-sm transition-all"
                        >
                            <LinkIcon size={14} className="w-3 h-3 md:w-4 md:h-4" /> Invite
                        </button>
                        <AnimatePresence>
                            {isInviteOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute top-12 right-0 w-80 glass-panel border border-white/10 shadow-2xl rounded-xl p-5 z-50 bg-[#141419] backdrop-blur-xl"
                                >
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <LinkIcon size={16} className="text-purple-400" /> Invite to Room
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Room Code */}
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Room Code</label>
                                            <div className="flex bg-[#0B0B0F] border border-white/10 rounded-lg overflow-hidden focus-within:border-purple-500/50 transition-colors">
                                                <input
                                                    type="text"
                                                    value={roomData?.roomCode || id}
                                                    readOnly
                                                    className="flex-1 bg-transparent text-sm text-white px-3 focus:outline-none selection:bg-purple-500/30"
                                                />
                                                <button
                                                    onClick={() => handleCopy("code")}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 transition-colors border-l border-white/10 w-20 flex justify-center items-center"
                                                >
                                                    {copied === "code" ? <span className="text-green-400">Copied!</span> : "Copy"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Invite Link */}
                                        <div>
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Invite Link</label>
                                            <div className="flex bg-[#0B0B0F] border border-white/10 rounded-lg overflow-hidden focus-within:border-purple-500/50 transition-colors">
                                                <input
                                                    type="text"
                                                    value={roomData?.roomCode ? `${window.location.origin}/join/${roomData.roomCode}` : window.location.href}
                                                    readOnly
                                                    className="flex-1 bg-transparent text-sm text-white px-3 focus:outline-none selection:bg-purple-500/30"
                                                />
                                                <button
                                                    onClick={() => handleCopy("link")}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 transition-colors border-l border-white/10 w-20 flex justify-center items-center"
                                                >
                                                    {copied === "link" ? <span className="text-green-400">Copied!</span> : "Copy"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>


                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    {!useUserStore.getState().isGuest && (
                        <button
                            onClick={() => setShowPlaylistManager(true)}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-purple-600/30 text-white text-sm font-bold rounded-xl transition-colors border border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.5)] whitespace-nowrap"
                        >
                            <ListMusic size={16} className="text-purple-400" />
                            <span>Playlists</span>
                        </button>
                    )}

                    {/* User Profile Dropdown Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 relative rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-purple-500 hover:scale-105 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all overflow-hidden"
                    >
                        {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : name?.charAt(0).toUpperCase()}
                    </button>

                    {/* Profile Dropdown Menu */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-12 right-0 w-48 glass-panel border border-white/10 shadow-2xl rounded-xl overflow-hidden z-50 bg-[#141419] backdrop-blur-xl"
                            >
                                <div className="p-3 border-b border-white/5">
                                    <p className="text-sm font-bold text-white truncate">{name}</p>
                                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{useUserStore.getState().isGuest ? 'Guest Mode' : 'Pro Account'}</p>
                                </div>
                                <div className="p-1">
                                    {useUserStore.getState().isGuest ? (
                                        <button onClick={() => { useUserStore.getState().logout(); router.push('/'); }} className="w-full text-left px-3 py-2 text-xs text-purple-400 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
                                            <User size={14} /> Upgrade to Account
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => router.push('/settings')} className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
                                                <Settings size={14} /> Settings
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => { disconnect(); useUserStore.getState().logout(); router.push('/'); }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors mt-1"
                                    >
                                        <LogOut size={14} /> Logout {useUserStore.getState().isGuest && 'Guest'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* LightRays Background */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <LightRays
                        raysOrigin="top-center"
                        raysColor="#ffffff"
                        raysSpeed={1}
                        lightSpread={1}
                        rayLength={1.4}
                        pulsating={false}
                        fadeDistance={0.8}
                        saturation={1.7}
                        followMouse={true}
                        mouseInfluence={0.15}
                        noiseAmount={0}
                        distortion={0}
                    />
                </div>

                {/* Media Player Area */}
                <div className="flex-1 flex flex-col items-center relative overflow-hidden z-10 w-full px-6 pt-4 pb-0">

                    <motion.div
                        ref={playerContainerRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`w-full max-w-5xl flex-1 min-h-0 bg-black/80 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] ring-1 ring-white/10 relative glass-panel pointer-events-auto flex items-center justify-center group transition-all duration-300 ${playerMode === 'MINI_PLAYER' ? 'fixed bottom-24 right-4 md:bottom-6 md:right-6 !w-40 md:!w-72 !h-40 md:!h-48 !max-w-none shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] cursor-pointer rounded-xl ring-purple-500/50 bg-[#000]' : ''
                            } ${playerMode === 'FULLSCREEN' ? '!max-w-none !rounded-none !ring-0 w-full h-full bg-[#000]' : ''}`}
                    >
                        {/* Player View Controls */}
                        {roomState?.currentMedia && (
                            <div className="absolute top-4 right-4 z-[60] flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMiniPlayer(); }}
                                    className="p-2 bg-black/60 hover:bg-purple-600/80 rounded-lg text-white backdrop-blur-md transition-colors border border-white/10 shadow-lg pointer-events-auto"
                                    title={playerMode === 'MINI_PLAYER' ? "Restore Player" : "Mini Player"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        {playerMode === 'MINI_PLAYER' ? (
                                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                        ) : (
                                            <rect x="12" y="14" width="10" height="7" rx="1" ry="1" />
                                        )}
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                                    className="p-2 bg-black/60 hover:bg-purple-600/80 rounded-lg text-white backdrop-blur-md transition-colors border border-white/10 shadow-lg pointer-events-auto"
                                    title={playerMode === 'FULLSCREEN' ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        {playerMode === 'FULLSCREEN' ? (
                                            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                                        ) : (
                                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Floating Chat Drawer for Fullscreen Mode */}
                        {playerMode === 'FULLSCREEN' && (
                            <>
                                <button
                                    onClick={() => setIsChatSlidePanelOpen(!isChatSlidePanelOpen)}
                                    className="absolute bottom-8 right-8 z-[60] flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white shadow-[0_10px_30px_rgba(168,85,247,0.5)] transition-transform hover:scale-105"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
                                    <span className="font-bold tracking-wide">Live Chat</span>
                                    {unreadCount > 0 && !isChatSlidePanelOpen && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-neutral-900 animate-bounce">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </div>
                                    )}
                                </button>

                                {/* Chat Slide Panel */}
                                <div className={`absolute inset-y-0 right-0 w-80 bg-neutral-900/95 backdrop-blur-3xl border-l border-white/10 z-[50] transition-transform duration-300 transform ${isChatSlidePanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                                    <div className="p-4 border-b border-white/10 font-semibold text-sm tracking-widest text-neutral-400 flex justify-between items-center uppercase bg-black/20">
                                        <span>Live Chat</span>
                                        <button onClick={() => setIsChatSlidePanelOpen(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20 transition"><X size={14} /></button>
                                    </div>
                                    <div className="p-4 h-[calc(100%-120px)] overflow-y-auto space-y-4 custom-scrollbar">
                                        {chatMessages.map((msg, idx) => {
                                            const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            return (
                                                <div key={`fs-chat-${idx}`} className={`flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition group`}>
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden shrink-0 mt-0.5">
                                                        {msg.name ? msg.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-2 mb-0.5">
                                                            <span className="text-xs font-semibold text-white">{msg.name}</span>
                                                            <span className="text-[9px] text-neutral-500">{time}</span>
                                                        </div>
                                                        {msg.type === 'GIF' && msg.gifUrl ? (
                                                            <div className="mt-1 bg-white/5 rounded-lg overflow-hidden max-w-[200px] inline-block">
                                                                <img src={msg.gifUrl} alt="GIF" loading="lazy" className="w-full h-auto object-contain" />
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-neutral-300 break-words">
                                                                {msg.text}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="p-3 border-t border-white/10 shrink-0 relative">
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full right-0 mb-2 z-[70]">
                                                <Picker data={data} onEmojiSelect={(emoji: any) => {
                                                    setChatInput(prev => prev + emoji.native);
                                                    setShowEmojiPicker(false);
                                                }} theme="dark" previewPosition="none" navPosition="bottom" />
                                            </div>
                                        )}
                                        {showGifPicker && (
                                            <div className="absolute bottom-full right-0 mb-2 w-[300px] h-[350px] bg-[#141419] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[70]">
                                                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40">
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Search Giphy..."
                                                        value={gifSearchQuery}
                                                        onChange={(e) => setGifSearchQuery(e.target.value)}
                                                        className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder-neutral-500"
                                                    />
                                                    <button onClick={() => setShowGifPicker(false)} className="text-neutral-400 hover:text-white transition"><X size={16} /></button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 custom-scrollbar">
                                                    {isSearchingGifs && gifs.length === 0 ? (
                                                        <div className="col-span-2 text-center text-neutral-500 text-xs py-10 animate-pulse">Loading GIFs...</div>
                                                    ) : gifs.length === 0 ? (
                                                        <div className="col-span-2 text-center text-neutral-500 text-xs py-10">No GIFs found.</div>
                                                    ) : (
                                                        gifs.map((gif) => (
                                                            <div key={gif.id} className="relative h-24 rounded-lg overflow-hidden bg-white/5 cursor-pointer group" onClick={() => {
                                                                sendChatMessage({ type: 'GIF', gifUrl: gif.images.fixed_height.url });
                                                                setShowGifPicker(false);
                                                            }}>
                                                                <img src={gif.images.fixed_height_small.url} alt={gif.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (chatInput.trim()) {
                                                    sendChatMessage({ text: chatInput, type: 'TEXT' });
                                                    setChatInput("");
                                                }
                                            }}
                                            className="flex gap-2 relative"
                                        >
                                            <div className="flex-1 flex items-center bg-black/50 border border-white/10 rounded-full focus-within:border-purple-500 transition-colors">
                                                <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} className="pl-3 pr-1.5 py-2 text-neutral-400 hover:text-purple-400 transition" title="Emojis">
                                                    🙂
                                                </button>
                                                <button type="button" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} className="px-1.5 py-2 text-neutral-400 hover:text-purple-400 transition font-bold text-[10px] tracking-wider uppercase" title="GIFs">
                                                    GIF
                                                </button>
                                                <input
                                                    type="text"
                                                    placeholder="Message..."
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    className="flex-1 bg-transparent px-2 py-2 text-xs text-white focus:outline-none placeholder:text-neutral-600"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!chatInput.trim()}
                                                className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors shrink-0 p-2 self-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" /></svg>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}

                        {roomState?.currentMedia ? (
                            <div className="absolute inset-0 w-full h-full">
                                {roomState.currentMedia.source === 'LOCAL' ? (
                                    <video
                                        ref={playerRef}
                                        src={undefined}
                                        className="w-full h-full object-contain"
                                        onPlay={handlePlay}
                                        onPause={handlePause}
                                        onSeeked={(e) => handleSeek(e.currentTarget.currentTime)}
                                        onEnded={handleEnded}
                                        // The video element must explicitly track playback speeds
                                        onRateChange={(e) => {
                                            if (e.currentTarget.playbackRate !== localPlaybackRate) {
                                                e.currentTarget.playbackRate = localPlaybackRate;
                                            }
                                        }}
                                        autoPlay={roomState.status === 'PLAYING'}
                                        controls={true} // Give standard fallback controls for native scrub parsing
                                    />
                                ) : roomState.currentMedia.source === 'SCREEN' ? (
                                    <video
                                        ref={playerRef}
                                        autoPlay
                                        playsInline
                                        muted={!!localStream} // Mute our own screen share to avoid echo
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <Player
                                        ref={playerRef}
                                        url={(() => {
                                            const { source, mediaId } = roomState.currentMedia;
                                            if (source === 'YOUTUBE') {
                                                let finalUrl = mediaId;
                                                if (!finalUrl.includes('youtube.com') && !finalUrl.includes('youtu.be')) {
                                                    finalUrl = `https://www.youtube.com/watch?v=${finalUrl}`;
                                                } else if (!finalUrl.startsWith('http')) {
                                                    finalUrl = `https://${finalUrl}`;
                                                }
                                                return finalUrl.replace('music.youtube.com', 'www.youtube.com');
                                            }
                                            return mediaId;
                                        })()}
                                        width="100%"
                                        height="100%"
                                        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto', zIndex: 10 }}
                                        playing={roomState.status === 'PLAYING'}
                                        playbackRate={localPlaybackRate}
                                        onPlay={handlePlay}
                                        onPause={handlePause}
                                        onSeek={handleSeek}
                                        onEnded={handleEnded}
                                        onBuffer={() => useSocketStore.getState().reportState(playerRef.current.getCurrentTime(), 'BUFFERING')}
                                        onBufferEnd={() => useSocketStore.getState().reportState(playerRef.current.getCurrentTime(), 'SYNCED')}
                                        controls={true}
                                        config={{
                                            youtube: {
                                                playerVars: { origin: typeof window !== 'undefined' ? window.location.origin : '' }
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <div className="flex items-center justify-center gap-2 mb-6">
                                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse animation-delay-200"></span>
                                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse animation-delay-400"></span>
                                </div>
                                <h2 className="text-xl font-medium text-white mb-2">Room is Idle</h2>
                                <p className="text-neutral-400 text-sm">Paste a link or upload a file to start watching!</p>
                            </div>
                        )}

                        {/* Floating Reactions Overlay */}
                        <ReactionLayer />

                        {/* Queue Panel Overlay */}
                        <AnimatePresence>
                            {showQueue && playlistQueue && (
                                <QueuePanel
                                    playlist={playlistQueue}
                                    currentIndex={currentTrackIndex}
                                    shuffle={shuffle}
                                    repeatMode={repeatMode}
                                    onClose={() => setShowQueue(false)}
                                    onJumpTo={(idx) => handleTrackPlay(playlistQueue, idx)}
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    onToggleShuffle={() => setShuffle(!shuffle)}
                                    onToggleRepeat={() => setRepeatMode(prev => prev === "NONE" ? "ONE" : prev === "ONE" ? "ALL" : "NONE")}
                                    onReorder={(src, dest) => {
                                        const newTracks = Array.from(playlistQueue.tracks);
                                        const [moved] = newTracks.splice(src, 1);
                                        newTracks.splice(dest, 0, moved);

                                        let newIndex = currentTrackIndex;
                                        if (src === currentTrackIndex) {
                                            newIndex = dest;
                                        } else if (src < currentTrackIndex && dest >= currentTrackIndex) {
                                            newIndex--;
                                        } else if (src > currentTrackIndex && dest <= currentTrackIndex) {
                                            newIndex++;
                                        }

                                        const newQueue = {
                                            playlist: { ...playlistQueue, tracks: newTracks },
                                            trackIndex: newIndex
                                        };
                                        useSocketStore.getState().updateQueue(newQueue);
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Active Playlist Control Bar */}
                    {playlistQueue && (
                        <div className="w-full max-w-5xl shrink-0 mt-2 z-20">
                            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <ListMusic size={14} className="text-purple-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{playlistQueue.tracks[currentTrackIndex]?.title || "Unknown Track"}</p>
                                        <p className="text-neutral-500 text-xs truncate">Playlist: {playlistQueue.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={handlePrev} className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors bg-white/5 hover:bg-white/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                                    </button>
                                    <button onClick={handleNext} className="p-2 text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                                    </button>
                                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                                    <button
                                        onClick={() => setShowQueue(!showQueue)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${showQueue ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-neutral-400 hover:text-white"}`}
                                    >
                                        <ListMusic size={12} />
                                        Queue
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Always visible Media Selector at the bottom */}
                    <div className="w-full max-w-5xl shrink-0 py-2 z-20">
                        <MediaSelector onStartScreenShare={startScreenShare} />
                    </div>
                </div>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar (Chat / Active Users) */}
                <aside
                    style={{ width: `${sidebarWidth}px` }}
                    className={`border-l border-white/10 glass-panel flex flex-col z-50 bg-neutral-900/95 backdrop-blur-xl shrink-0 h-full fixed inset-y-0 right-0 max-w-full lg:relative lg:flex lg:z-20 lg:h-auto ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} ${!isResizing && 'transition-transform duration-300'}`}
                >
                    {/* Drag Handle */}
                    <div
                        onMouseDown={() => setIsResizing(true)}
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-purple-500/50 active:bg-purple-500 z-[60] transition-colors group"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-white/20 rounded-full group-hover:bg-white/80 group-active:bg-white transition-colors"></div>
                    </div>

                    {/* Active Roster */}
                    <div className="p-4 border-b border-white/10 relative">
                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute top-4 right-4 lg:hidden p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex justify-between items-center mb-4 pr-8">
                            <span className="font-semibold text-sm tracking-widest text-neutral-400 uppercase">Room Roster</span>
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">{roomState?.users ? Object.keys(roomState.users).length : 0} Online</span>
                        </div>
                        <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                            {roomState?.users && Object.values(roomState.users).map((user) => {
                                const isHost = user.userId === roomData?.hostId;
                                // Determine indicator color based on sync health
                                let statusColor = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
                                if (user.status === 'BUFFERING') statusColor = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]";
                                if (user.status === 'DRIFTING') statusColor = "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]";

                                return (
                                    <div key={user.userId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default group">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden">
                                                {user.profile.avatarUrl ? (
                                                    <img src={user.profile.avatarUrl} alt={user.profile.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    user.profile.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#121212] rounded-full ${statusColor}`}></div>
                                        </div>
                                        <div className="flex flex-col flex-1 truncate">
                                            <span className="text-sm font-medium text-white flex items-center justify-between gap-2">
                                                <span className="truncate group-hover:text-purple-300 transition-colors">{user.profile.name}</span>
                                                {isHost && <span className="text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded shadow-sm shrink-0">HOST</span>}
                                            </span>
                                            <span className="text-[10px] text-neutral-500">{user.status}</span>
                                        </div>

                                        {/* Hover Card (Mini Profile) */}
                                        <div className="absolute right-full top-0 mr-4 w-60 bg-[#141419] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none translate-x-2 group-hover:translate-x-0">
                                            <div className="h-12 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-t-xl overflow-hidden relative">
                                                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIyIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==')]"></div>
                                            </div>
                                            <div className="p-4 relative">
                                                <div className="absolute -top-6 left-3 p-1 bg-[#141419] rounded-full">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden">
                                                        {user.profile.avatarUrl ? (
                                                            <img src={user.profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                                        ) : (
                                                            user.profile.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-5">
                                                    <h4 className="text-sm font-bold text-white leading-tight">{user.profile.name}</h4>
                                                    <p className="text-[9px] text-purple-400 uppercase tracking-widest font-semibold mt-0.5">MEMBER</p>

                                                    {user.profile.bio && (
                                                        <p className="mt-3 text-xs text-neutral-300 leading-snug line-clamp-3">
                                                            {user.profile.bio}
                                                        </p>
                                                    )}

                                                    {user.profile.createdAt && (
                                                        <div className="mt-4 pt-3 border-t border-white/10">
                                                            <h5 className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Member Since</h5>
                                                            <p className="text-xs text-neutral-400 mt-0.5">{new Date(user.profile.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10 font-semibold text-sm tracking-widest text-neutral-400 flex justify-between items-center uppercase bg-black/20">
                        <span>Live Chat</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                        {chatMessages.length === 0 ? (
                            <div className="text-center text-neutral-500 text-sm italic mt-10">
                                No messages yet. Say hello!
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <AnimatePresence initial={false}>
                                    {chatMessages.map((msg, idx) => {
                                        const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <motion.div
                                                key={`${msg.userId}-${msg.timestamp}-${idx}`}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition group"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden shrink-0">
                                                    {msg.name ? msg.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-sm font-semibold text-white">{msg.name}</span>
                                                        <span className="text-[10px] text-neutral-500">{time}</span>
                                                    </div>
                                                    {msg.type === 'GIF' && msg.gifUrl ? (
                                                        <div className="mt-1 bg-white/5 rounded-lg overflow-hidden max-w-[240px] shadow-sm inline-block">
                                                            <img src={msg.gifUrl} alt="GIF" loading="lazy" className="w-full h-auto object-contain" />
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-neutral-300 break-words leading-relaxed max-w-[80%] md:max-w-none">
                                                            {msg.text}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-white/10 relative shrink-0">
                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-4 mb-2 z-[70] max-h-64 sm:max-h-none overflow-y-auto custom-scrollbar rounded-xl">
                                <Picker data={data} onEmojiSelect={(emoji: any) => {
                                    setChatInput(prev => prev + emoji.native);
                                    setShowEmojiPicker(false);
                                }} theme="dark" previewPosition="none" navPosition="bottom" />
                            </div>
                        )}
                        {showGifPicker && (
                            <div className="absolute bottom-full right-4 left-4 md:left-auto mb-2 w-[calc(100%-2rem)] md:w-full md:max-w-lg h-[350px] bg-[#141419] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[70]">
                                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search Giphy..."
                                        value={gifSearchQuery}
                                        onChange={(e) => setGifSearchQuery(e.target.value)}
                                        className="bg-transparent border-none text-white text-sm focus:outline-none w-full placeholder-neutral-500"
                                    />
                                    <button onClick={() => setShowGifPicker(false)} className="p-2 -mr-2 text-neutral-400 hover:text-white transition"><X size={18} /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 custom-scrollbar">
                                    {isSearchingGifs && gifs.length === 0 ? (
                                        <div className="col-span-2 text-center text-neutral-500 text-xs py-10 animate-pulse">Loading GIFs...</div>
                                    ) : gifs.length === 0 ? (
                                        <div className="col-span-2 text-center text-neutral-500 text-xs py-10">No GIFs found.</div>
                                    ) : (
                                        gifs.map((gif) => (
                                            <div key={gif.id} className="relative h-24 rounded-lg overflow-hidden bg-white/5 cursor-pointer group" onClick={() => {
                                                sendChatMessage({ type: 'GIF', gifUrl: gif.images.fixed_height.url });
                                                setShowGifPicker(false);
                                            }}>
                                                <img src={gif.images.fixed_height_small.url} alt={gif.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (chatInput.trim()) {
                                    sendChatMessage({ text: chatInput, type: 'TEXT' });
                                    setChatInput("");
                                }
                            }}
                            className="flex gap-2 relative"
                        >
                            <div className="flex-1 flex items-center bg-black/50 border border-white/10 rounded-full focus-within:border-purple-500 transition-colors">
                                <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} className="pl-4 pr-1.5 py-3 md:py-2 text-neutral-400 hover:text-purple-400 transition" title="Emojis">
                                    🙂
                                </button>
                                <button type="button" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} className="px-2 py-2 text-neutral-400 hover:text-purple-400 transition font-bold text-xs uppercase" title="GIFs">
                                    GIF
                                </button>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className="flex-1 bg-transparent px-2 py-3 text-sm text-white focus:outline-none placeholder:text-neutral-600"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-purple-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors shrink-0 self-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-1">
                                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </aside>

                {/* Mobile Floating Chat Trigger */}
                <AnimatePresence>
                    {!isSidebarOpen && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20 }}
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden fixed bottom-6 right-6 z-[45] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full px-5 py-3 shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center gap-2 font-bold transition-transform hover:scale-105 active:scale-95"
                        >
                            <MessageSquare size={20} /> Chat
                        </motion.button>
                    )}
                </AnimatePresence>

            </main>

            {/* ── Playlist Manager Modal Overlay ── */}
            <AnimatePresence>
                {showPlaylistManager && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowPlaylistManager(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <PlaylistManager
                                inRoom={true}
                                onClose={() => setShowPlaylistManager(false)}
                                onPlayPlaylist={(playlist) => {
                                    if (playlist.tracks.length > 0) {
                                        updateQueue({ playlist, trackIndex: 0 });
                                        const track = playlist.tracks[0];
                                        changeMedia(track.mediaId, track.source as any);
                                    }
                                    setShowPlaylistManager(false);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Shared Playlist Notification ── */}
            <AnimatePresence>
                {sharedPlaylist && (
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] bg-[#1a1a24] border border-purple-500/30 rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4 min-w-[320px] max-w-sm"
                    >
                        <ListMusic size={24} className="text-purple-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-400 mb-0.5">
                                <span className="text-white font-semibold">{sharedPlaylist.username}</span> shared a playlist
                            </p>
                            <p className="text-sm font-bold text-white truncate">{sharedPlaylist.playlist.name}</p>
                            <p className="text-[10px] text-neutral-500">{sharedPlaylist.playlist.tracks.length} track{sharedPlaylist.playlist.tracks.length !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => {
                                    if (sharedPlaylist.playlist.tracks.length > 0) {
                                        updateQueue({ playlist: sharedPlaylist.playlist, trackIndex: 0 });
                                        const track = sharedPlaylist.playlist.tracks[0];
                                        changeMedia(track.mediaId, track.source as any);
                                    }
                                    clearSharedPlaylist();
                                }}
                                className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center gap-1"
                            >
                                <Play size={12} /> Play
                            </button>
                            <button onClick={clearSharedPlaylist} className="text-neutral-500 hover:text-white transition">
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
