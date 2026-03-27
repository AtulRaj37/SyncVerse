"use client";

import { useEffect, useState } from "react";
import { useSocketStore } from "@/store/useSocketStore";
import { useUserStore } from "@/store/useUserStore";
import { History, Play, RefreshCw, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface WatchHistoryItem {
    id: string;
    mediaUrl: string;
    title: string | null;
    timestamp: string;
}

export function WatchHistoryPanel({ roomId }: { roomId: string }) {
    const { token } = useUserStore();
    const { changeMedia, roomState } = useSocketStore();
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch history");
            const data = await res.json();
            setHistory(data.history || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [roomId, token]);

    // Simple listener to auto-refresh history when a new video is played locally
    useEffect(() => {
        if (roomState?.currentMedia?.mediaId) {
            // Re-fetch history to grab the latest record
            fetchHistory();
        }
    }, [roomState?.currentMedia?.mediaId]);

    const handlePlayHistory = (item: WatchHistoryItem) => {
        changeMedia(item.mediaUrl, (item.title as any) || 'WEB_STREAM');
    };

    if (loading && history.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 text-neutral-500">
                <RefreshCw size={24} className="animate-spin text-purple-500" />
                <p className="text-xs uppercase tracking-widest font-semibold">Loading History</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-4 flex flex-col items-center justify-center text-red-400 gap-2">
                <XCircle size={32} />
                <p className="text-sm font-semibold text-center">{error}</p>
                <button 
                    onClick={fetchHistory}
                    className="mt-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-semibold text-white transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <History size={20} className="text-neutral-600" />
                </div>
                <h3 className="text-sm font-bold text-neutral-300">No History Yet</h3>
                <p className="text-[10px] uppercase tracking-widest leading-relaxed">
                    Videos and streams played in this room will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto w-full custom-scrollbar p-3 space-y-2">
            <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Recent Plays</p>
                <button onClick={fetchHistory} className="text-neutral-500 hover:text-purple-400 transition" title="Refresh">
                    <RefreshCw size={12} />
                </button>
            </div>
            
            {history.map((item) => {
                const isPlaying = roomState?.currentMedia?.mediaId === item.mediaUrl;
                
                return (
                    <div 
                        key={item.id}
                        className={`group relative flex flex-col gap-2 p-3 rounded-xl transition-all border ${
                            isPlaying 
                            ? "bg-purple-500/10 border-purple-500/30" 
                            : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                        }`}
                    >
                        <div className="flex items-start justify-between min-w-0">
                            <div className="flex-1 min-w-0 pr-2">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#121212] flex w-fit gap-1 text-purple-400 uppercase mb-1.5">
                                    {item.title || "WEB"}
                                </span>
                                <p className="text-xs font-semibold text-white truncate max-w-full" title={item.mediaUrl}>
                                    {item.mediaUrl}
                                </p>
                            </div>
                            
                            <button
                                onClick={() => handlePlayHistory(item)}
                                disabled={isPlaying}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-md transition-colors shrink-0 ${
                                    isPlaying 
                                    ? "bg-purple-600 cursor-default opacity-50" 
                                    : "bg-[#1f1f26] border border-white/10 hover:bg-purple-500 hover:border-purple-400 group-hover:scale-105"
                                }`}
                            >
                                <Play size={14} className={isPlaying ? "text-white" : "text-purple-300 group-hover:text-white"} />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-500">
                            <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
