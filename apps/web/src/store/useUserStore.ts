import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    id: string | null;
    name: string | null;
    email: string | null;
    bio: string | null;
    isGuest: boolean;
    avatarUrl: string | null;
    token: string | null;
    createdAt: string | null;
    setAuth: (user: { id: string; name: string; email?: string | null; bio?: string | null; isGuest?: boolean; avatarUrl: string | null; createdAt?: string }, token: string) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            id: null,
            name: null,
            email: null,
            bio: null,
            isGuest: true,
            avatarUrl: null,
            token: null,
            createdAt: null,
            setAuth: (user, token) =>
                set({ id: user.id, name: user.name, email: user.email || null, bio: user.bio || null, isGuest: user.isGuest ?? true, avatarUrl: user.avatarUrl, createdAt: user.createdAt || null, token }),
            logout: () => set({ id: null, name: null, email: null, bio: null, isGuest: true, avatarUrl: null, createdAt: null, token: null }),
        }),
        {
            name: 'syncverse-auth',
        }
    )
);
