"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SharedPlaylist } from "@syncverse/shared";
import {
    X, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
    ListMusic, Music2, ChevronDown
} from "lucide-react";

interface QueuePanelProps {
    playlist: SharedPlaylist;
    currentIndex: number;
    shuffle: boolean;
    repeatMode: "NONE" | "ONE" | "ALL";
    onClose: () => void;
    onJumpTo: (index: number) => void;
    onPrev: () => void;
    onNext: () => void;
    onToggleShuffle: () => void;
    onToggleRepeat: () => void;
}

export function QueuePanel({
    playlist,
    currentIndex,
    shuffle,
    repeatMode,
    onClose,
    onJumpTo,
    onPrev,
    onNext,
    onToggleShuffle,
    onToggleRepeat,
}: QueuePanelProps) {
    const RepeatIcon = repeatMode === "ONE" ? Repeat1 : Repeat;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 z-[80] bg-black/90 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col"
            style={{ maxHeight: "55%" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                    <ListMusic size={15} className="text-purple-400" />
                    <span className="text-white text-sm font-semibold truncate max-w-[180px]">{playlist.name}</span>
                    <span className="text-neutral-500 text-xs">
                        {currentIndex + 1} / {playlist.tracks.length}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleShuffle}
                        className={`p-2 rounded-lg transition-all ${shuffle ? "text-purple-400 bg-purple-500/20" : "text-neutral-500 hover:text-white"}`}
                        title="Shuffle"
                    >
                        <Shuffle size={14} />
                    </button>
                    <button
                        onClick={onPrev}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Previous"
                    >
                        <SkipBack size={14} />
                    </button>
                    <button
                        onClick={onNext}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Next"
                    >
                        <SkipForward size={14} />
                    </button>
                    <button
                        onClick={onToggleRepeat}
                        className={`p-2 rounded-lg transition-all ${repeatMode !== "NONE" ? "text-purple-400 bg-purple-500/20" : "text-neutral-500 hover:text-white"}`}
                        title={`Repeat: ${repeatMode}`}
                    >
                        <RepeatIcon size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-all ml-1"
                    >
                        <ChevronDown size={16} />
                    </button>
                </div>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                {playlist.tracks.map((track, i) => {
                    const isCurrent = i === currentIndex;
                    return (
                        <motion.button
                            key={track.id}
                            initial={false}
                            onClick={() => onJumpTo(i)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left hover:bg-white/5 ${isCurrent ? "bg-purple-500/15" : ""}`}
                        >
                            {/* Number / Playing indicator */}
                            <div className="w-6 flex items-center justify-center flex-shrink-0">
                                {isCurrent ? (
                                    <div className="flex gap-0.5 items-end h-4">
                                        {[0, 1, 2].map((j) => (
                                            <motion.span
                                                key={j}
                                                className="w-0.5 bg-purple-400 rounded-full"
                                                animate={{ height: ["40%", "100%", "40%"] }}
                                                transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.2, ease: "easeInOut" }}
                                                style={{ display: "block" }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-neutral-600 text-xs">{i + 1}</span>
                                )}
                            </div>

                            {/* Track icon */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCurrent ? "bg-purple-500/30" : "bg-white/5"
                                }`}>
                                <Music2 size={13} className={isCurrent ? "text-purple-400" : "text-neutral-500"} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isCurrent ? "text-purple-300" : "text-white"}`}>
                                    {track.title}
                                </p>
                                <p className="text-neutral-600 text-xs truncate">{track.source}</p>
                            </div>

                            {/* Playing badge */}
                            {isCurrent && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Now Playing
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
