"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" />;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/40 border border-black/10 dark:border-white/10 transition-colors backdrop-blur-md overflow-hidden"
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{
                    scale: isDark ? 1 : 0,
                    opacity: isDark ? 1 : 0,
                    rotate: isDark ? 0 : 90,
                }}
                transition={{ duration: 0.3, ease: "backOut" }}
                className="absolute inset-0 flex items-center justify-center text-purple-400"
            >
                <Moon size={18} />
            </motion.div>

            <motion.div
                initial={false}
                animate={{
                    scale: isDark ? 0 : 1,
                    opacity: isDark ? 0 : 1,
                    rotate: isDark ? -90 : 0,
                }}
                transition={{ duration: 0.3, ease: "backOut" }}
                className="absolute inset-0 flex items-center justify-center text-orange-500"
            >
                <Sun size={18} />
            </motion.div>
        </button>
    );
}
