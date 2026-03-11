"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketStore } from "@/store/useSocketStore";
import { useUserStore } from "@/store/useUserStore";

export const MediaSelector = ({ onStartScreenShare }: { onStartScreenShare?: () => void }) => {
    const { roomState, changeMedia, setLocalFileUrl, selectLocalFile } = useSocketStore();
    const { id: currentUserId } = useUserStore();

    const [mode, setMode] = useState<"YOUTUBE" | "LOCAL" | "SCREEN">("YOUTUBE");
    const [urlInput, setUrlInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // All users have permission to use the Media Selector now

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlInput.trim()) return;

        // Pass explicit URLs to the server. ReactPlayer v2 handles domain routing cleanly.
        changeMedia(urlInput, mode);
        setUrlInput("");
    };

    const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setLocalFileUrl(url);
        changeMedia('local', 'LOCAL');
        selectLocalFile(file.name, file.size);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleScreenShare = () => {
        changeMedia('screen', 'SCREEN');
        if (onStartScreenShare) {
            onStartScreenShare();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl mx-auto glass-panel p-6 border-white/10 rounded-2xl flex flex-col gap-4 mt-8"
        >
            <h3 className="text-white font-medium text-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
                </svg>
                Select Media
            </h3>

            {/* Source Tabs */}
            <div className="flex gap-2 p-1 bg-black/40 rounded-lg">
                {(["YOUTUBE", "LOCAL", "SCREEN"] as const).map(src => (
                    <button
                        key={src}
                        onClick={() => setMode(src)}
                        className={`flex-1 py-1.5 px-1 truncate text-xs font-semibold rounded-md transition-colors ${mode === src ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                    >
                        {src === 'YOUTUBE' ? 'YOUTUBE / YT MUSIC' : src}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <AnimatePresence mode="wait">
                <motion.form
                    key={mode}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleUrlSubmit}
                    className="flex flex-col gap-3"
                >
                    {mode === 'YOUTUBE' ? (
                        <div className="flex gap-2">
                            <input
                                type="url"
                                placeholder={"Paste YouTube Video or YT Music Playlist URL"}
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-neutral-600"
                            />
                            <button
                                type="submit"
                                disabled={!urlInput.trim()}
                                className="px-5 rounded-xl bg-purple-600 font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors"
                            >
                                Play
                            </button>
                        </div>
                    ) : mode === 'LOCAL' ? (
                        <div className="flex flex-col gap-2">
                            {roomState?.currentMedia?.source === 'LOCAL' && roomState.currentMedia.localFileName && (
                                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 text-center flex flex-col gap-1 mb-2">
                                    <span className="text-xs text-purple-300">Host selected:</span>
                                    <span className="text-sm font-semibold text-purple-100">{roomState.currentMedia.localFileName}</span>
                                    <span className="text-xs text-white/60 mt-1">Load the same file to sync playback.</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="video/*,audio/*,.mkv"
                                onChange={handleLocalFileSelect}
                                ref={fileInputRef}
                                className="hidden"
                                id="local-file-upload"
                            />
                            <label
                                htmlFor="local-file-upload"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-center text-white cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                Choose File
                            </label>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-left flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-yellow-500 font-semibold text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
                                    Blank Screen Sharing Movies?
                                </div>
                                <p className="text-xs text-neutral-300 leading-relaxed">
                                    Sharing premium content (Netflix/Prime) or hardware-accelerated VLC/YouTube videos will result in a <strong className="text-white">black screen</strong> for viewers due to Anti-Piracy DRM.
                                    <br/><br/>
                                    <strong>How to fix:</strong> Open your browser settings and turn off <em className="text-purple-300">"Use graphics acceleration when available"</em>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleScreenShare}
                                className="w-full rounded-xl bg-purple-600 font-semibold text-sm text-white hover:bg-purple-500 transition-colors py-3 flex items-center justify-center gap-2"
                            >
                                Start Screen Share
                            </button>
                        </div>
                    )}
                </motion.form>
            </AnimatePresence>
        </motion.div>
    );
};
