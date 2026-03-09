"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/store/useUserStore";
import { SharedPlaylist, SharedTrack } from "@syncverse/shared";
import { X, Plus, Trash2, ListMusic, Play, Music, Loader2, Check } from "lucide-react";

interface PlaylistManagerProps {
    inRoom?: boolean;
    onClose: () => void;
    onPlayPlaylist: (playlist: SharedPlaylist) => void;
}

const API = process.env.NEXT_PUBLIC_API_URL!;

export function PlaylistManager({ inRoom = false, onClose, onPlayPlaylist }: PlaylistManagerProps) {
    const { token } = useUserStore();

    const [playlists, setPlaylists] = useState<SharedPlaylist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<SharedPlaylist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Create playlist form
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);

    // Add track form
    const [showAddTrack, setShowAddTrack] = useState(false);
    const [trackTitle, setTrackTitle] = useState("");
    const [trackUrl, setTrackUrl] = useState("");
    const [addingTrack, setAddingTrack] = useState(false);
    const [fetchingTitle, setFetchingTitle] = useState(false);
    const [titleFetched, setTitleFetched] = useState(false);
    const fetchAbortRef = useRef<AbortController | null>(null);

    // ── Fetch playlists ──────────────────────────────────────────────
    const fetchPlaylists = async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API}/api/playlists`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load playlists");
            setPlaylists(data.playlists);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlaylists(); }, [token]);

    // ── Create playlist ──────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !token) return;
        setCreating(true);
        try {
            const res = await fetch(`${API}/api/playlists`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create");
            setPlaylists((p) => [data.playlist, ...p]);
            setNewName("");
            setShowNewForm(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    // ── Delete playlist ──────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        if (!token) return;
        try {
            await fetch(`${API}/api/playlists/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setPlaylists((p) => p.filter((pl) => pl.id !== id));
            if (selectedPlaylist?.id === id) setSelectedPlaylist(null);
        } catch { /* silent */ }
    };

    // ── Auto-fetch title from oEmbed APIs ────────────────────────────
    useEffect(() => {
        setTitleFetched(false);
        if (!trackUrl.trim()) { setTrackTitle(""); return; }

        const source = detectSource(trackUrl);
        if (!source) return;

        // Cancel previous in-flight fetch
        if (fetchAbortRef.current) fetchAbortRef.current.abort();
        const ctrl = new AbortController();
        fetchAbortRef.current = ctrl;

        // Debounce 600ms
        const timer = setTimeout(async () => {
            setFetchingTitle(true);
            try {
                let oEmbedUrl = "";
                if (source === "YOUTUBE") {
                    oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trackUrl)}&format=json`;
                } else {
                    oEmbedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(trackUrl)}&format=json`;
                }
                const res = await fetch(oEmbedUrl, { signal: ctrl.signal });
                if (!res.ok) throw new Error("oEmbed failed");
                const data = await res.json();
                if (data.title) {
                    setTrackTitle(data.title);
                    setTitleFetched(true);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    // Title fetch failed silently — user can type manually
                }
            } finally {
                setFetchingTitle(false);
            }
        }, 600);

        return () => { clearTimeout(timer); ctrl.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackUrl]);

    // ── Add track ────────────────────────────────────────────────────
    const detectSource = (url: string): "YOUTUBE" | "SOUNDCLOUD" | null => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) return "YOUTUBE";
        if (url.includes("soundcloud.com")) return "SOUNDCLOUD";
        return null;
    };

    const handleAddTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlaylist || !token) return;
        const source = detectSource(trackUrl);
        if (!source) { setError("Only YouTube & SoundCloud URLs are supported."); return; }
        setAddingTrack(true);
        setError("");
        try {
            const res = await fetch(`${API}/api/playlists/${selectedPlaylist.id}/tracks`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: trackTitle.trim() || trackUrl, mediaId: trackUrl.trim(), source }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add track");
            const updated = { ...selectedPlaylist, tracks: [...selectedPlaylist.tracks, data.track] };
            setSelectedPlaylist(updated);
            setPlaylists((p) => p.map((pl) => pl.id === updated.id ? updated : pl));
            setTrackTitle("");
            setTrackUrl("");
            setTitleFetched(false);
            setShowAddTrack(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAddingTrack(false);
        }
    };

    // ── Remove track ─────────────────────────────────────────────────
    const handleRemoveTrack = async (trackId: string) => {
        if (!selectedPlaylist || !token) return;
        try {
            await fetch(`${API}/api/playlists/${selectedPlaylist.id}/tracks/${trackId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const updated = { ...selectedPlaylist, tracks: selectedPlaylist.tracks.filter((t) => t.id !== trackId) };
            setSelectedPlaylist(updated);
            setPlaylists((p) => p.map((pl) => pl.id === updated.id ? updated : pl));
        } catch { /* silent */ }
    };

    // ── Guest guard ──────────────────────────────────────────────────
    if (!token) {
        return (
            <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 w-full max-w-md text-center">
                <ListMusic className="mx-auto text-purple-400 mb-3" size={36} />
                <h2 className="text-white font-bold text-lg mb-2">Playlists require an account</h2>
                <p className="text-neutral-400 text-sm">Sign in or create a free account to manage playlists.</p>
                <button onClick={onClose} className="mt-5 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm transition-all">Close</button>
            </div>
        );
    }

    return (
        <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    {selectedPlaylist && (
                        <button onClick={() => { setSelectedPlaylist(null); setShowAddTrack(false); }} className="text-neutral-400 hover:text-white transition-colors text-sm">
                            ← Back
                        </button>
                    )}
                    <div>
                        <h2 className="text-white font-bold text-base flex items-center gap-2">
                            <ListMusic size={16} className="text-purple-400" />
                            {selectedPlaylist ? selectedPlaylist.name : "My Playlists"}
                        </h2>
                        {selectedPlaylist && (
                            <p className="text-neutral-500 text-xs">{selectedPlaylist.tracks.length} track{selectedPlaylist.tracks.length !== 1 ? "s" : ""}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedPlaylist && inRoom && (
                        <button
                            onClick={() => onPlayPlaylist(selectedPlaylist)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all"
                        >
                            <Play size={12} /> Play in Room
                        </button>
                    )}
                    {!selectedPlaylist && (
                        <button
                            onClick={() => setShowNewForm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg transition-all"
                        >
                            <Plus size={13} /> New Playlist
                        </button>
                    )}
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors p-1">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && <p className="text-red-400 text-xs px-5 pt-3">{error}</p>}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

                {/* Create new playlist form */}
                <AnimatePresence>
                    {showNewForm && !selectedPlaylist && (
                        <motion.form
                            key="new-form"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            onSubmit={handleCreate}
                            className="flex gap-2 mb-3"
                        >
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Playlist name..."
                                className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder:text-neutral-600"
                            />
                            <button type="submit" disabled={creating} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                                {creating ? "..." : "Create"}
                            </button>
                            <button type="button" onClick={() => setShowNewForm(false)} className="px-3 py-2 bg-white/5 border border-white/10 text-neutral-400 hover:text-white rounded-xl text-sm transition-all">
                                Cancel
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* PLAYLIST LIST */}
                {!selectedPlaylist && (
                    loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-12">
                            <Music size={32} className="mx-auto text-neutral-600 mb-3" />
                            <p className="text-neutral-500 text-sm">No playlists yet. Create one!</p>
                        </div>
                    ) : (
                        playlists.map((pl) => (
                            <motion.div
                                key={pl.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 cursor-pointer group transition-all"
                                onClick={() => setSelectedPlaylist(pl)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <ListMusic size={15} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{pl.name}</p>
                                        <p className="text-neutral-500 text-xs">{pl.tracks.length} track{pl.tracks.length !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {inRoom && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPlayPlaylist(pl); }}
                                            className="p-1.5 bg-purple-500/20 hover:bg-purple-500/40 rounded-lg text-purple-400 transition-all"
                                        >
                                            <Play size={13} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(pl.id); }}
                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/30 rounded-lg text-red-400 transition-all"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )
                )}

                {/* TRACK LIST */}
                {selectedPlaylist && (
                    <>
                        {selectedPlaylist.tracks.length === 0 ? (
                            <div className="text-center py-8">
                                <Music size={28} className="mx-auto text-neutral-600 mb-2" />
                                <p className="text-neutral-500 text-sm">No tracks yet.</p>
                            </div>
                        ) : (
                            selectedPlaylist.tracks.map((track, i) => (
                                <div key={track.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 group">
                                    <span className="text-neutral-600 text-xs w-5 text-right flex-shrink-0">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{track.title}</p>
                                        <p className="text-neutral-500 text-xs truncate">{track.source} · {track.mediaId}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveTrack(track.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 hover:bg-red-500/30 rounded-lg text-red-400 transition-all flex-shrink-0"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))
                        )}

                        {/* Add track form */}
                        <AnimatePresence>
                            {showAddTrack && (
                                <motion.form
                                    key="add-track"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    onSubmit={handleAddTrack}
                                    className="space-y-2 border border-white/10 rounded-xl p-4 bg-white/3 mt-2"
                                >
                                    <input
                                        autoFocus
                                        value={trackUrl}
                                        onChange={(e) => { setTrackUrl(e.target.value); setTitleFetched(false); }}
                                        placeholder="Paste YouTube or SoundCloud URL..."
                                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder:text-neutral-600"
                                    />
                                    <div className="relative">
                                        <input
                                            value={trackTitle}
                                            onChange={(e) => { setTrackTitle(e.target.value); setTitleFetched(false); }}
                                            placeholder={fetchingTitle ? "Fetching title..." : "Title (auto-filled from URL)"}
                                            className="w-full px-3 py-2 pr-8 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder:text-neutral-600 transition-all"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            {fetchingTitle && <Loader2 size={14} className="text-purple-400 animate-spin" />}
                                            {titleFetched && !fetchingTitle && <Check size={14} className="text-green-400" />}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={addingTrack || !trackUrl} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                                            {addingTrack ? "Adding..." : "Add Track"}
                                        </button>
                                        <button type="button" onClick={() => setShowAddTrack(false)} className="px-4 py-2 bg-white/5 border border-white/10 text-neutral-400 hover:text-white rounded-xl text-sm transition-all">
                                            Cancel
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {!showAddTrack && (
                            <button
                                onClick={() => setShowAddTrack(true)}
                                className="w-full py-2.5 border border-dashed border-white/15 hover:border-purple-500/50 text-neutral-500 hover:text-purple-400 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Add Track
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
