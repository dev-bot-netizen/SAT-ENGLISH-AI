

import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (initialSeconds: number, onEnd: () => void) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);
    
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    const onEndRef = useRef(onEnd);
    // This ref will store the target Date.now() value for when the timer should end.
    const endTimeRef = useRef<number | null>(null);

    useEffect(() => {
        onEndRef.current = onEnd;
    }, [onEnd]);
    
    const pauseTimer = useCallback(() => {
        setIsRunning(false);
    }, []);

    const resumeTimer = useCallback(() => {
        setIsRunning(true);
    }, []);

    // Effect to auto-start the timer on initial mount
    useEffect(() => {
        setIsRunning(true);
    }, []);

    // Main timer logic effect
    useEffect(() => {
        if (isRunning) {
            // Set the end time when the timer starts or resumes.
            // `timeLeft` holds the remaining seconds.
            endTimeRef.current = Date.now() + timeLeft * 1000;

            intervalRef.current = setInterval(() => {
                const remaining = Math.round((endTimeRef.current! - Date.now()) / 1000);

                if (remaining <= 0) {
                    clearInterval(intervalRef.current!);
                    setIsRunning(false);
                    setTimeLeft(0);
                    onEndRef.current();
                } else {
                    setTimeLeft(remaining);
                }
            }, 250); // Check more frequently to keep UI responsive
        } else if (intervalRef.current) {
            // If paused, clear the interval. The current `timeLeft` is preserved.
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    return { timeLeft, isRunning, pauseTimer, resumeTimer };
};