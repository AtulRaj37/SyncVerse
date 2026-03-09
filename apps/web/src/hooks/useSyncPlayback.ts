import { useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../store/useSocketStore';
import { RoomState } from '@syncverse/shared';

// Drift Thresholds
const MAX_ALLOWED_DRIFT_SEC = 2.0;  // Only hard-seek if drift > 2s (generous to avoid snap-back)
const SOFT_SYNC_DRIFT_SEC = 0.3;    // Soft rate-adjust if drift > 0.3s

// How long to suppress drift-correction after a user manually seeks (ms)
// Must be long enough for: network RTT + server round-trip + S2C_PLAYBACK_UPDATE arrival
const SEEK_LOCK_DURATION_MS = 6000;

export const useSyncPlayback = (playerRef: React.RefObject<any>) => {
    const { roomState, sendMediaCommand, reportState } = useSocketStore();
    const [localPlaybackRate, setLocalPlaybackRate] = useState(1.0);

    // Keep a ref to roomState so the interval always reads the latest value
    // without needing to be torn down and recreated on every roomState change.
    // This is the KEY fix — the interval is created once and reads live data.
    const roomStateRef = useRef<RoomState | null>(null);
    roomStateRef.current = roomState;

    // Throttle state reporting
    const lastReportTime = useRef(0);

    // Seek lock — suppresses drift correction for SEEK_LOCK_DURATION_MS after any user seek
    const seekLockUntil = useRef<number>(0);

    // Playback rate ref to avoid stale closure in setLocalPlaybackRate comparisons
    const localPlaybackRateRef = useRef(1.0);

    // Sync Logic Engine — created ONCE, reads live roomState via ref
    useEffect(() => {
        const interval = setInterval(() => {
            const player = playerRef.current;
            const rs = roomStateRef.current;

            if (!player || !rs?.playback) return;

            let actualCurrentTime: number;
            if (typeof player.getCurrentTime === 'function') {
                actualCurrentTime = player.getCurrentTime();
            } else if (typeof player.currentTime === 'number') {
                actualCurrentTime = player.currentTime;
            } else {
                return;
            }
            if (typeof actualCurrentTime !== 'number' || isNaN(actualCurrentTime)) return;

            // If within seek lock window — skip ALL correction (user is mid-seek)
            if (Date.now() < seekLockUntil.current) {
                // Still report health so other users see us as active
                if (Date.now() - lastReportTime.current > 2000) {
                    reportState(actualCurrentTime, 'SYNCED');
                    lastReportTime.current = Date.now();
                }
                return;
            }

            // 1. Calculate Expected Time from server state
            let expectedTime = rs.playback.currentTime;
            if (rs.status === 'PLAYING') {
                const timeSinceUpdateSec = (Date.now() - rs.playback.updatedAt) / 1000;
                expectedTime += timeSinceUpdateSec * rs.playback.playbackRate;
            }

            // 2. Calculate Drift
            const drift = expectedTime - actualCurrentTime;
            const absDrift = Math.abs(drift);

            let currentStatus: 'SYNCED' | 'DRIFTING' | 'BUFFERING' = 'SYNCED';

            // 3. Correction Logic (only while PLAYING)
            if (rs.status === 'PLAYING') {
                if (absDrift > MAX_ALLOWED_DRIFT_SEC) {
                    // Hard seek — only for genuinely large drifts
                    console.log(`[Sync] Hard seek: drift=${drift.toFixed(3)}s → seekTo ${expectedTime.toFixed(3)}s`);
                    if (typeof player.seekTo === 'function') {
                        player.seekTo(expectedTime, 'seconds');
                    } else {
                        player.currentTime = expectedTime;
                    }
                    if (localPlaybackRateRef.current !== 1.0) {
                        localPlaybackRateRef.current = 1.0;
                        setLocalPlaybackRate(1.0);
                    }
                    currentStatus = 'BUFFERING';
                } else if (absDrift > SOFT_SYNC_DRIFT_SEC) {
                    currentStatus = 'DRIFTING';
                    const targetRate = drift > 0 ? 1.05 : 0.95;
                    if (localPlaybackRateRef.current !== targetRate) {
                        localPlaybackRateRef.current = targetRate;
                        setLocalPlaybackRate(targetRate);
                    }
                } else {
                    if (localPlaybackRateRef.current !== 1.0) {
                        localPlaybackRateRef.current = 1.0;
                        setLocalPlaybackRate(1.0);
                    }
                }
            } else {
                // PAUSED / IDLE — reset rate
                if (localPlaybackRateRef.current !== 1.0) {
                    localPlaybackRateRef.current = 1.0;
                    setLocalPlaybackRate(1.0);
                }
            }

            // 4. Report Health every 2 seconds
            if (Date.now() - lastReportTime.current > 2000) {
                reportState(actualCurrentTime, currentStatus);
                lastReportTime.current = Date.now();
            }

        }, 500); // Poll every 500ms

        return () => clearInterval(interval);
        // Empty deps — interval is created ONCE. roomState is read via roomStateRef.current inside.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Player Control Wrappers
    const handlePlay = () => {
        if (playerRef.current) {
            const time = typeof playerRef.current.getCurrentTime === 'function'
                ? playerRef.current.getCurrentTime()
                : playerRef.current.currentTime;
            sendMediaCommand('PLAY', time);
        }
    };

    const handlePause = () => {
        if (playerRef.current) {
            const time = typeof playerRef.current.getCurrentTime === 'function'
                ? playerRef.current.getCurrentTime()
                : playerRef.current.currentTime;
            sendMediaCommand('PAUSE', time);
        }
    };

    const handleSeek = (seekTime: number) => {
        // Lock drift correction for long enough to survive the server round-trip
        seekLockUntil.current = Date.now() + SEEK_LOCK_DURATION_MS;
        sendMediaCommand('SEEK', seekTime);
    };

    return {
        localPlaybackRate,
        handlePlay,
        handlePause,
        handleSeek,
        seekLockUntil,
    };
};
