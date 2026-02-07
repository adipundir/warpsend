"use client";

import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

interface GlobeProps {
    size?: number;
    className?: string;
    showArcs?: boolean;
    autoRotate?: boolean;
    scale?: number;
}

export function Globe({
    size = 400,
    className = "",
    showArcs = false,
    autoRotate = true,
    scale = 1,
}: GlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
    const phiRef = useRef(0);

    const onResize = useCallback(() => {
        if (canvasRef.current) {
            canvasRef.current.width = size * 2;
            canvasRef.current.height = size * 2;
        }
    }, [size]);

    useEffect(() => {
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [onResize]);

    useEffect(() => {
        if (!canvasRef.current) return;

        let width = size * 2;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width,
            height: width,
            phi: 0,
            theta: 0.3,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.6, 0.3, 0.9], // Purple base
            markerColor: [0.8, 0.5, 1], // Light purple markers
            glowColor: [0.5, 0.2, 0.8], // Purple glow
            markers: showArcs
                ? [
                    { location: [37.7749, -122.4194], size: 0.08 }, // San Francisco
                    { location: [51.5074, -0.1278], size: 0.08 }, // London
                    { location: [35.6762, 139.6503], size: 0.08 }, // Tokyo
                    { location: [-33.8688, 151.2093], size: 0.08 }, // Sydney
                    { location: [1.3521, 103.8198], size: 0.08 }, // Singapore
                ]
                : [],
            onRender: (state) => {
                if (autoRotate) {
                    state.phi = phiRef.current;
                    phiRef.current += 0.01;
                }
                state.width = width;
                state.height = width;
            },
        });

        globeRef.current = globe;

        return () => {
            globe.destroy();
        };
    }, [size, showArcs, autoRotate]);

    return (
        <div
            className={`relative ${className}`}
            style={{
                width: size,
                height: size,
                transform: `scale(${scale})`,
                transition: "transform 0.5s ease-out",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    contain: "layout paint size",
                    cursor: "grab",
                }}
            />
        </div>
    );
}
