"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { api } from "@/lib/api";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

/**
 * useProctoring Hook
 * Handles all proctoring functionality including:
 * - Tab/window focus monitoring
 * - Fullscreen enforcement
 * - Copy/paste prevention
 * - Periodic screenshot capture (silently)
 */
export function useProctoring({ candidateAssessmentId, enabled = true }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violations, setViolations] = useState([]);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);
    const modelRef = useRef(null);
    const [modelLoading, setModelLoading] = useState(false);
    const isDetectingRef = useRef(false); // Concurrency guard

    // Log event to backend
    const logEvent = useCallback(async (eventType, evidence = {}, severity = "low", screenshot = null) => {
        // Only log if we have both candidateAssessmentId and session token
        if (!candidateAssessmentId) return;

        // Check if session token exists
        if (typeof window !== "undefined" && !sessionStorage.getItem("sessionToken")) {
            console.log("[Proctoring Debug] No session token, skipping event:", eventType);
            return;
        }

        console.log("[Proctoring Debug] Logging event:", eventType, evidence);

        try {
            // Get optional context from session storage or state if needed
            // For now we just pass what was given
            const response = await api.logProctoringEvent({
                eventType,
                evidence,
                severity,
                screenshot,
                timestamp: new Date().toISOString(),
                // Context is usually handled by the backend from the session, 
                // but we can pass it if we have it
                context: {
                    section: sessionStorage.getItem("currentSection") || undefined,
                    questionIndex: parseInt(sessionStorage.getItem("currentQuestionIndex") || "0"),
                }
            });

            if (response.success) {
                setViolations((prev) => [...prev, { eventType, timestamp: new Date() }]);
            } else {
                console.warn("Proctoring event failed:", eventType, response.error);
            }
        } catch (err) {
            // Silently log error - don't crash the assessment
            console.warn("Proctoring event not logged:", eventType, err.message);
        }
    }, [candidateAssessmentId]);

    // Capture screenshot
    const captureScreenshot = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return null;

        try {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, 320, 240);
            return canvas.toDataURL("image/jpeg", 0.6);
        } catch (err) {
            return null;
        }
    }, []);

    // Initialize camera
    const initCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 },
            });
            streamRef.current = stream;

            // Create hidden video and canvas
            const video = document.createElement("video");
            video.srcObject = stream;
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            videoRef.current = video;

            const canvas = document.createElement("canvas");
            canvasRef.current = canvas;

            await video.play();
        } catch (err) {
            logEvent("camera_denied", { error: err.message }, "high");
        }
    }, [logEvent]);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Load AI Model
    const loadModel = useCallback(async () => {
        if (modelRef.current || modelLoading) return;
        try {
            setModelLoading(true);
            console.log("[Proctoring AI] Loading COCO-SSD model...");
            await tf.ready();
            const loadedModel = await cocoSsd.load();
            modelRef.current = loadedModel;
            console.log("[Proctoring AI] Model loaded successfully");
        } catch (err) {
            console.error("[Proctoring AI] Model load failed:", err);
        } finally {
            setModelLoading(false);
        }
    }, [modelLoading]);

    // Run AI Detection on current frame
    const runDetection = useCallback(async () => {
        if (!modelRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
        if (isDetectingRef.current) return; // Skip if previous detection is still running

        isDetectingRef.current = true;

        try {
            const predictions = await modelRef.current.detect(videoRef.current);

            // Check for multiple people
            const persons = predictions.filter(p => p.class === "person");
            if (persons.length > 1) {
                console.warn("[Proctoring AI] Multiple faces/people detected!");
                logEvent("multiple_faces", {
                    count: persons.length,
                    confidence: persons[0].score
                }, "high");
            } else if (persons.length === 0) {
                // Optional: log "no_face" if you want to be strict
                // logEvent("no_face", {}, "medium");
            }

            // Check for mobile devices
            const devices = predictions.filter(p => ["cell phone", "laptop", "tablet"].includes(p.class));
            if (devices.length > 0) {
                console.warn("[Proctoring AI] Electronic device detected!", devices[0].class);
                logEvent("device_detected", {
                    device: devices[0].class,
                    confidence: devices[0].score
                }, "high");
            }

        } catch (err) {
            console.error("[Proctoring AI] Detection error:", err);
        } finally {
            isDetectingRef.current = false;
        }
    }, [logEvent]);

    // Enter fullscreen
    const enterFullscreen = useCallback(async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } catch (err) {
            logEvent("fullscreen_failed", { error: err.message }, "medium");
        }
    }, [logEvent]);

    // Exit fullscreen
    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    // Setup event listeners
    useEffect(() => {
        if (!enabled) return;

        // Visibility change (tab switch)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logEvent("tab_switch", { action: "left" }, "high");
            } else {
                logEvent("tab_switch", { action: "returned" }, "low");
            }
        };

        // Window blur (switching windows)
        const handleBlur = () => {
            logEvent("window_blur", {}, "medium");
        };

        // Fullscreen change
        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setIsFullscreen(isNowFullscreen);
            if (!isNowFullscreen) {
                logEvent("fullscreen_exit", {}, "high");
            }
        };

        // Copy/paste prevention
        const handleCopy = (e) => {
            e.preventDefault();
            logEvent("copy_attempt", {}, "medium");
        };

        const handlePaste = (e) => {
            e.preventDefault();
            logEvent("paste_attempt", {}, "medium");
        };

        const handleCut = (e) => {
            e.preventDefault();
            logEvent("cut_attempt", {}, "medium");
        };

        // Context menu prevention
        const handleContextMenu = (e) => {
            e.preventDefault();
            logEvent("right_click", {}, "low");
        };

        // Add listeners
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("copy", handleCopy);
        document.addEventListener("paste", handlePaste);
        document.addEventListener("cut", handleCut);
        document.addEventListener("contextmenu", handleContextMenu);

        // Initialize camera
        initCamera();

        // Load model
        loadModel();

        // Periodic screenshot capture (every 60 seconds)
        const screenshotInterval = setInterval(async () => {
            console.log("[Proctoring Debug] Capturing periodic screenshot...");
            const screenshot = await captureScreenshot();
            if (screenshot) {
                logEvent("periodic_check", { description: "Regular interval check" }, "low", screenshot);
            }
        }, 60000);

        // AI Detection Interval (every 1 second for faster feedback)
        const aiInterval = setInterval(() => {
            runDetection();
        }, 1000);

        // Cleanup
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("copy", handleCopy);
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("cut", handleCut);
            document.removeEventListener("contextmenu", handleContextMenu);
            clearInterval(screenshotInterval);
            clearInterval(aiInterval);
            stopCamera();
        };
    }, [enabled, logEvent, initCamera, captureScreenshot, stopCamera, loadModel, runDetection]);

    return {
        isFullscreen,
        violations,
        enterFullscreen,
        exitFullscreen,
        logEvent,
        captureScreenshot,
    };
}
