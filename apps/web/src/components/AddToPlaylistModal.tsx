"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { SharedPlaylist } from "@syncverse/shared";
import { X, Plus, ListMusic, Check, Loader2, ChevronRight, Music } from "lucide-react";

interface AddToPlaylistModalProps {
    mediaId: string;
    mediaTitle?: string;
    mediaSource: string;
    onClose: () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL!;

export function AddToPlaylistModal({ mediaId, mediaTitle: mediaTitleProp, mediaSource, onClose }: AddToPlaylistModalProps) {
    const { token } = useUserStore();

    const [playlists, setPlaylists] = useState<SharedPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Auto-fetched or prop-provided title
    const [resolvedTitle, setResolvedTitle] = useState(mediaTitleProp || "");
    const [fetchingTitle, setFetchingTitle] = useState(!mediaTitleProp);

    // New playlist form toggle
    const [showNewForm, setShowNewForm] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [creating, setCreating] = useState(false);

    // Track which playlists the track was just added to (for success feedback)
    const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
    const [addingTo, setAddingTo] = useState<string | null>(null);

    // Fetch user's playlists
    useEffect(() => {
        if (!token) return;
        fetch(`${API}/api/playlists`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { setPlaylists(d.playlists || []); setLoading(false); })
            .catch(() => { setError("Failed to load playlists."); setLoading(false); });
    }, [token]);

    // Detect source type
    const getSource = (): "YOUTUBE" | "SOUNDCLOUD" | null => {
        if (mediaSource === "YOUTUBE") return "YOUTUBE";
        if (mediaSource === "SOUNDCLOUD") return "SOUNDCLOUD";
        if (mediaId?.includes("youtube.com") || mediaId?.includes("youtu.be")) return "YOUTUBE";
        if (mediaId?.includes("soundcloud.com")) return "SOUNDCLOUD";
        return null;
    };

    const source = getSource();

    // Auto-fetch title via oEmbed if not already provided
    useEffect(() => {
        if (mediaTitleProp) { setResolvedTitle(mediaTitleProp); setFetchingTitle(false); return; }
        if (!source || !mediaId) { setFetchingTitle(false); return; }
        setFetchingTitle(true);
        let url = mediaId;
        if (source === "YOUTUBE" && !url.startsWith("http")) {
            url = `https://www.youtube.com/watch?v=${url}`;
        }
        const oEmbedUrl = source === "YOUTUBE"
            ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
            : `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        fetch(oEmbedUrl)
            .then(r => r.json())
            .then(d => { if (d.title) setResolvedTitle(d.title); })
            .catch(() => { })
            .finally(() => setFetchingTitle(false));
    }, [mediaId, mediaTitleProp, source]);

    const effectiveTitle = resolvedTitle || mediaId;
    const addToPlaylist = async (playlistId: string) => {
        if (!token || !source) return;
        setAddingTo(playlistId);
        setError("");
        try {
            const res = await fetch(`${API}/api/playlists/${playlistId}/tracks`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: effectiveTitle, mediaId, source }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add");
            setAddedTo(prev => new Set(prev).add(playlistId));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAddingTo(null);
        }
    };

    // Create new playlist and immediately add the track
    const createAndAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlaylistName.trim() || !token || !source) return;
        setCreating(true);
        setError("");
        try {
            // 1. Create playlist
            const createRes = await fetch(`${API}/api/playlists`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newPlaylistName.trim() }),
            });
            const createData = await createRes.json();
            if (!createRes.ok) throw new Error(createData.error || "Failed to create playlist");
            const created: SharedPlaylist = createData.playlist;

            // 2. Add current track to new playlist
            const addRes = await fetch(`${API}/api/playlists/${created.id}/tracks`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: effectiveTitle, mediaId, source }),
            });
            if (!addRes.ok) throw new Error("Playlist created, but couldn't add track.");

            setPlaylists(prev => [created, ...prev]);
            setAddedTo(prev => new Set(prev).add(created.id));
            setNewPlaylistName("");
            setShowNewForm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-[#141419] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/30">
                        <div className="flex items-center gap-2">
                            <ListMusic size={16} className="text-purple-400" />
                            <h2 className="text-sm font-bold text-white tracking-wide">Add to Playlist</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Current Track Info */}
                    <div className="px-5 py-3 bg-purple-500/10 border-b border-purple-500/20">
                        <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold mb-1">Now Playing</p>
                        {fetchingTitle ? (
                            <div className="flex items-center gap-2 text-neutral-400">
                                <Loader2 size={13} className="animate-spin" />
                                <span className="text-xs">Fetching song title...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 min-w-0">
                                <Music size={13} className="text-purple-400 flex-shrink-0" />
                                <p className="text-sm text-white font-medium truncate">{effectiveTitle}</p>
                            </div>
                        )}
                        {!source && (
                            <p className="text-xs text-amber-400 mt-1">⚠️ Only YouTube & SoundCloud tracks can be saved.</p>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-4 max-h-72 overflow-y-auto custom-scrollbar">
                        {error && (
                            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{error}</p>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-neutral-500 text-sm">
                                <Loader2 size={16} className="animate-spin" /> Loading playlists...
                            </div>
                        ) : playlists.length === 0 && !showNewForm ? (
                            <div className="text-center py-6 text-neutral-500 text-sm">
                                <ListMusic size={28} className="mx-auto mb-2 opacity-30" />
                                <p>No playlists yet.</p>
                                <button
                                    onClick={() => setShowNewForm(true)}
                                    className="mt-3 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition"
                                >
                                    Create Your First Playlist
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {playlists.map(pl => {
                                    const isAdded = addedTo.has(pl.id);
                                    const isAdding = addingTo === pl.id;
                                    return (
                                        <button
                                            key={pl.id}
                                            disabled={isAdded || isAdding || !source || fetchingTitle}
                                            onClick={() => addToPlaylist(pl.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left group ${isAdded
                                                ? "border-green-500/30 bg-green-500/10 cursor-default"
                                                : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-purple-500/30 cursor-pointer"
                                                } disabled:opacity-60`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isAdded ? "bg-green-500/20" : "bg-purple-500/20"}`}>
                                                    {isAdded ? (
                                                        <Check size={13} className="text-green-400" />
                                                    ) : (
                                                        <ListMusic size={13} className="text-purple-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{pl.name}</p>
                                                    <p className="text-xs text-neutral-500">{pl.tracks.length} track{pl.tracks.length !== 1 ? "s" : ""}</p>
                                                </div>
                                            </div>
                                            {isAdding ? (
                                                <Loader2 size={15} className="animate-spin text-purple-400 flex-shrink-0" />
                                            ) : isAdded ? (
                                                <span className="text-xs text-green-400 font-semibold flex-shrink-0">Added!</span>
                                            ) : (
                                                <ChevronRight size={15} className="text-neutral-600 group-hover:text-white transition flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Create New Playlist Form */}
                        <AnimatePresence>
                            {showNewForm && (
                                <motion.form
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={createAndAdd}
                                    className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3 overflow-hidden"
                                >
                                    <p className="text-xs font-semibold text-neutral-300 mb-2 uppercase tracking-wider">New Playlist Name</p>
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newPlaylistName}
                                            onChange={e => setNewPlaylistName(e.target.value)}
                                            placeholder="e.g. Vibes & Chill"
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition placeholder:text-neutral-600"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newPlaylistName.trim() || creating || !source}
                                            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition flex items-center gap-1.5"
                                        >
                                            {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewForm(false)}
                                            className="px-2 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-sm rounded-lg transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {!showNewForm && (
                        <div className="px-4 py-3 border-t border-white/10 bg-black/20">
                            <button
                                onClick={() => setShowNewForm(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/30 text-white text-sm font-semibold rounded-xl transition-all group"
                            >
                                <Plus size={15} className="text-purple-400 group-hover:rotate-90 transition-transform duration-200" />
                                Create New Playlist & Add
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
