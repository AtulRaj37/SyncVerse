"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";

export function UserHydrator() {
    const { token, setAuth } = useUserStore();

    useEffect(() => {
        if (!token) return;

        const hydrate = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.user) {
                        setAuth(data.user, token);
                    }
                }
            } catch (err) {
                console.error("Failed to hydrate user", err);
            }
        };

        hydrate();
    }, [token, setAuth]);

    return null;
}
