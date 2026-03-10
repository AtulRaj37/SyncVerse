import { useState, useEffect } from 'react';

export const useDevicePerformance = () => {
    const [isLowEnd, setIsLowEnd] = useState(false);

    useEffect(() => {
        // Detect mobile by screen width or user agent
        const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);

        // Detect hardware concurrency (CPU cores)
        const cores = navigator.hardwareConcurrency || 4;

        // Detect device memory (RAM in GB, experimental API)
        const memory = (navigator as any).deviceMemory || 4;

        // Condition for low-end device
        if (isMobile || cores <= 4 || memory < 4) {
            setIsLowEnd(true);
        }
    }, []);

    return { isLowEnd };
};
