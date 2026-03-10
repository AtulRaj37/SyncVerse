"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { motion } from "framer-motion";
import { Camera, Save, ArrowLeft, User as UserIcon } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const { id, name: storedName, bio: storedBio, avatarUrl: storedAvatar, token, isGuest, createdAt, setAuth } = useUserStore();

    const [name, setName] = useState(storedName || "");
    const [bio, setBio] = useState(storedBio || "");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(storedAvatar);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Redirect guests back to home page
    useEffect(() => {
        if (!token || isGuest) {
            router.push("/");
        }
    }, [token, isGuest, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ text: "Image must be less than 5MB", type: "error" });
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ text: "", type: "" });

        try {
            // 1. Upload Avatar if changed
            let newAvatarUrl = storedAvatar;
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);

                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/avatar`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (!uploadRes.ok) throw new Error("Failed to upload avatar");
                const uploadData = await uploadRes.json();
                newAvatarUrl = uploadData.user.avatarUrl;
            }

            // 2. Update Profile Name & Bio
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, bio }),
            });

            if (!profileRes.ok) throw new Error("Failed to update profile");
            const profileData = await profileRes.json();

            // Update local store
            setAuth({
                id: profileData.user.id,
                name: profileData.user.name,
                email: profileData.user.email,
                bio: profileData.user.bio,
                isGuest: profileData.user.isGuest,
                avatarUrl: newAvatarUrl,
                createdAt: profileData.user.createdAt
            }, token!);

            setMessage({ text: "Profile updated successfully!", type: "success" });
        } catch (err: any) {
            setMessage({ text: err.message, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (isGuest) return null; // Prevent flash before redirect

    const memberSinceDate = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Just now";

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-neutral-200 font-sans flex justify-center py-12 px-4 selection:bg-purple-500/30">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">

                {/* Header Row */}
                <div className="col-span-1 md:col-span-3 mb-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="text-3xl font-extrabold text-white mt-4 tracking-tight">User Settings</h1>
                </div>

                {/* Left Col: Settings Form */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#141419] border border-white/5 rounded-2xl p-6 shadow-xl"
                    >
                        <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                            <UserIcon size={16} className="text-purple-400" /> My Profile
                        </h2>

                        {/* Avatar Upload */}
                        <div className="flex items-center gap-6 mb-8">
                            <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-neutral-800 shrink-0" onClick={() => fileInputRef.current?.click()}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-3xl font-bold text-white">
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-opacity">
                                    <Camera size={24} className="text-white drop-shadow-md" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-1">Profile Picture</h3>
                                <p className="text-xs text-neutral-500 mb-2">JPEG, PNG, GIF. Max 5MB.</p>
                                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors">
                                    Change Avatar
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wide">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#0B0B0F] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        {/* Bio Input */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wide">About Me</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={160}
                                rows={3}
                                placeholder="Write a short bio..."
                                className="w-full bg-[#0B0B0F] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            />
                            <div className="text-right mt-1 text-[10px] text-neutral-600">{bio.length} / 160</div>
                        </div>

                        {/* Save Button */}
                        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
                            <span className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                {message.text}
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                            >
                                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Right Col: Profile Preview Card */}
                <div className="col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className="bg-[#141419] border border-white/5 rounded-2xl overflow-hidden shadow-2xl sticky top-12"
                    >
                        {/* Banner */}
                        <div className="h-24 bg-gradient-to-r from-purple-900 to-indigo-900 w-full relative">
                            {/* SVG Mesh Pattern Overlay */}
                            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIyIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==')]"></div>
                        </div>

                        <div className="p-5 relative">
                            <div className="absolute -top-12 left-4 p-1.5 bg-[#141419] rounded-full">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-green-500 border-4 border-[#141419] rounded-full z-10"></div>
                            </div>

                            <div className="mt-12">
                                <h3 className="text-xl font-bold text-white tracking-tight">{name || "Your Name"}</h3>
                                <p className="text-xs text-purple-400 mt-1 uppercase tracking-widest font-semibold flex items-center gap-1">
                                    PRO MEMBER
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-bold text-neutral-400 mb-2 uppercase tracking-wider">About Me</h4>
                                <p className="text-sm text-neutral-300 leading-relaxed font-light break-words">
                                    {bio || "You haven't added a bio yet."}
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5">
                                <h4 className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-wider">SyncVerse Member Since</h4>
                                <p className="text-sm text-neutral-300 font-medium">
                                    {memberSinceDate}
                                </p>
                            </div>

                            {/* Developer Credit Footer */}
                            <div className="mt-6 pt-3 border-t border-white/10 text-center flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <p className="text-[10px] text-neutral-400 font-medium tracking-wide">
                                    Designed by <span className="text-purple-400 font-bold whitespace-nowrap">Atul Raj</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
