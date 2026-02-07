"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useTimer Hook
 * Countdown timer for assessments
 */
export function useTimer(initialMinutes, onTimeUp) {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onTimeUp?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, onTimeUp]);

    const start = useCallback(() => setIsRunning(true), []);
    const pause = useCallback(() => setIsRunning(false), []);
    const reset = useCallback((minutes) => {
        setTimeLeft(minutes * 60);
        setIsRunning(false);
    }, []);

    const formatTime = () => {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return {
        timeLeft,
        isRunning,
        start,
        pause,
        reset,
        formatTime,
        isLowTime: timeLeft < 300, // < 5 minutes
    };
}
