"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SharedPlaylist } from "@syncverse/shared";
import {
    X, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
    ListMusic, Music2, ChevronDown, GripVertical
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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
    onReorder: (sourceIndex: number, destinationIndex: number) => void;
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
    onReorder,
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
            <DragDropContext onDragEnd={(result: DropResult) => {
                if (!result.destination) return;
                if (result.destination.index === result.source.index) return;
                onReorder(result.source.index, result.destination.index);
            }}>
                <Droppable droppableId="queue-list">
                    {(provided) => (
                        <div
                            className="flex-1 overflow-y-auto custom-scrollbar py-2"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {playlist.tracks.map((track, i) => {
                                const isCurrent = i === currentIndex;
                                return (
                                    <Draggable key={track.id} draggableId={track.id} index={i}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`w-full flex items-center gap-1 px-2 py-1.5 transition-all text-left ${snapshot.isDragging ? "bg-purple-900/50 shadow-2xl z-50 rounded-xl ring-1 ring-purple-500" : "hover:bg-white/5"
                                                    } ${isCurrent && !snapshot.isDragging ? "bg-purple-500/15" : ""}`}
                                            >
                                                {/* Drag Handle */}
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="p-2 text-neutral-600 hover:text-white cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
                                                >
                                                    <GripVertical size={14} />
                                                </div>

                                                <button
                                                    onClick={() => onJumpTo(i)}
                                                    className="flex-1 flex items-center gap-3 text-left min-w-0 py-1"
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
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded flex-shrink-0 mr-3">
                                                            Now Playing
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </motion.div>
    );
}
