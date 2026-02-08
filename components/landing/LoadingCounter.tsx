"use client";

import { useEffect, useState } from "react";

interface LoadingCounterProps {
    duration?: number;
    onComplete?: () => void;
}

export function LoadingCounter({
    duration = 1000,
    onComplete,
}: LoadingCounterProps) {
    const [count, setCount] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const startTime = Date.now();
        const endTime = startTime + duration;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const currentCount = Math.floor(progress * 100);

            setCount(currentCount);

            if (now < endTime) {
                requestAnimationFrame(animate);
            } else {
                setCount(100);
                setIsComplete(true);
                onComplete?.();
            }
        };

        requestAnimationFrame(animate);
    }, [duration, onComplete]);

    return (
        <div className="flex items-center justify-center w-full h-full relative">
            {/* Loading text */}
            <div
                className="absolute left-12 bottom-12 text-primary text-sm tracking-widest font-mono"
                style={{
                    opacity: isComplete ? 0 : 1,
                    transition: "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                LOADING...
            </div>

            {/* Counter */}
            <div
                className="text-primary font-bold select-none"
                style={{
                    fontSize: "clamp(80px, 20vw, 200px)",
                    fontStyle: "italic",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    opacity: isComplete ? 0 : 1,
                    transition: "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                {count.toString().padStart(3, "0")}
            </div>
        </div>
    );
}
