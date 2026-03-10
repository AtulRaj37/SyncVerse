"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";

interface DraggableChatButtonProps {
    onClick: () => void;
    unreadCount: number;
    hidden: boolean;
}

export function DraggableChatButton({ onClick, unreadCount, hidden }: DraggableChatButtonProps) {
    const [pos, setPos] = useState({ x: -1, y: -1 });
    const posRef = useRef({ x: 0, y: 0 });
    const dragging = useRef(false);
    const startTouch = useRef({ cx: 0, cy: 0, bx: 0, by: 0 });
    const moved = useRef(false);

    const BTN = 56;
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    useEffect(() => {
        const initX = window.innerWidth - BTN - 16;
        const initY = window.innerHeight - BTN - 32;
        posRef.current = { x: initX, y: initY };
        setPos({ x: initX, y: initY });
    }, []);

    if (hidden || pos.x < 0) return null;

    /* ── Mouse drag ─────────────────────────── */
    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;
        moved.current = false;
        startTouch.current = { cx: e.clientX, cy: e.clientY, bx: posRef.current.x, by: posRef.current.y };

        const onMove = (me: MouseEvent) => {
            if (!dragging.current) return;
            const dx = me.clientX - startTouch.current.cx;
            const dy = me.clientY - startTouch.current.cy;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
            const nx = clamp(startTouch.current.bx + dx, 4, window.innerWidth - BTN - 4);
            const ny = clamp(startTouch.current.by + dy, 4, window.innerHeight - BTN - 4);
            posRef.current = { x: nx, y: ny };
            setPos({ x: nx, y: ny });
        };
        const onUp = () => {
            dragging.current = false;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    /* ── Touch drag ─────────────────────────── */
    const onTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        moved.current = false;
        startTouch.current = { cx: t.clientX, cy: t.clientY, bx: posRef.current.x, by: posRef.current.y };
    };
    const onTouchMove = (e: React.TouchEvent) => {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - startTouch.current.cx;
        const dy = t.clientY - startTouch.current.cy;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved.current = true;
        const nx = clamp(startTouch.current.bx + dx, 4, window.innerWidth - BTN - 4);
        const ny = clamp(startTouch.current.by + dy, 4, window.innerHeight - BTN - 4);
        posRef.current = { x: nx, y: ny };
        setPos({ x: nx, y: ny });
    };
    const onTouchEnd = () => {
        if (!moved.current) onClick();
    };

    const handleClick = () => {
        if (!moved.current) onClick();
    };

    return (
        <button
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={handleClick}
            style={{ left: pos.x, top: pos.y, touchAction: "none", userSelect: "none" }}
            className="lg:hidden fixed z-[45] w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-[0_0_18px_rgba(168,85,247,0.55)] flex items-center justify-center cursor-grab active:cursor-grabbing"
            title="Open Chat"
        >
            <MessageSquare size={20} />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg border-2 border-black pointer-events-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </button>
    );
}
