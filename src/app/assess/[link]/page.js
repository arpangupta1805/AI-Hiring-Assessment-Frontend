"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button, Input, Card } from "@/components/ui";
import { Camera, Check, AlertCircle } from "lucide-react";

const STEPS = ["verify", "photo", "consent"];

export default function AssessmentEntryPage() {
    const router = useRouter();
    const params = useParams();
    const [step, setStep] = useState("verify");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [assessmentInfo, setAssessmentInfo] = useState(null);
    const [candidateAssessmentId, setCandidateAssessmentId] = useState(null);

    // Form state
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Webcam state
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [photoData, setPhotoData] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);

    // Consent state
    const [consents, setConsents] = useState({
        terms: false,
        proctoring: false,
        data: false,
    });

    useEffect(() => {
        fetchAssessmentInfo();
    }, [params.link]);

    const fetchAssessmentInfo = async () => {
        try {
            const response = await api.getAssessmentInfo(params.link);
            if (response.success) {
                setAssessmentInfo(response.data);
            } else {
                setError("Invalid assessment link");
            }
        } catch (err) {
            setError(err.message || "Failed to load assessment");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name.trim() || !email.trim()) {
            setError("Please enter your name and email");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const response = await api.registerCandidate(params.link, { name, email });
            if (response.success) {
                setCandidateAssessmentId(response.data.candidateAssessmentId);
                setOtpSent(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            setError("Please enter the OTP");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            const response = await api.verifyCandidateEmail(candidateAssessmentId, otp);
            if (response.success) {
                setStep("photo");
                startCamera();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            setError("Unable to access camera. Please allow camera permissions.");
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0);
            const data = canvas.toDataURL("image/jpeg", 0.8);
            setPhotoData(data);

            // Stop camera
            const stream = video.srcObject;
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            setCameraActive(false);
        }
    };

    const handlePhotoSubmit = async () => {
        if (!photoData) {
            setError("Please capture your photo");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            await api.capturePhoto(candidateAssessmentId, photoData);
            setStep("consent");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConsent = async () => {
        if (!consents.terms || !consents.proctoring || !consents.data) {
            setError("Please accept all consent requirements");
            return;
        }
        setSubmitting(true);
        setError("");

        try {
            await api.acceptConsent(candidateAssessmentId);
            // Store candidateAssessmentId for next pages
            sessionStorage.setItem("candidateAssessmentId", candidateAssessmentId);
            router.push(`/assess/${params.link}/resume`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-[var(--text-muted)]">Loading...</div>
            </div>
        );
    }

    if (error && !assessmentInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6">
                <Card padding="lg" className="max-w-md text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-[var(--status-error-text)]" />
                    <h1 className="text-xl font-light text-[var(--text-primary)] mb-2">
                        Invalid Link
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        This assessment link is invalid or has expired.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
            <div className="w-full max-w-md">
                {/* Company Info */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                        {assessmentInfo?.companyName || "Assessment"}
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {assessmentInfo?.roleTitle || "Candidate Assessment"}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, index) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${STEPS.indexOf(step) >= index
                                        ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                                    }`}
                            >
                                {STEPS.indexOf(step) > index ? <Check size={16} /> : index + 1}
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`w-8 h-0.5 ${STEPS.indexOf(step) > index
                                        ? "bg-[var(--accent)]"
                                        : "bg-[var(--border-default)]"
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                <Card padding="lg">
                    {error && (
                        <div className="mb-4 p-3 bg-[var(--status-error-bg)] text-[var(--status-error-text)] rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step: Verify Email */}
                    {step === "verify" && (
                        <div>
                            <h2 className="text-lg font-light text-[var(--text-primary)] mb-6">
                                Verify Your Identity
                            </h2>

                            {!otpSent ? (
                                <div className="space-y-4">
                                    <Input
                                        label="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                    />
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                    />
                                    <Button
                                        className="w-full"
                                        onClick={handleRegister}
                                        loading={submitting}
                                    >
                                        Send Verification Code
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                                        We sent a verification code to {email}
                                    </p>
                                    <Input
                                        label="Verification Code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                    />
                                    <Button
                                        className="w-full"
                                        onClick={handleVerifyOTP}
                                        loading={submitting}
                                    >
                                        Verify
                                    </Button>
                                    <button
                                        onClick={() => { setOtpSent(false); setOtp(""); }}
                                        className="w-full text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        Use different email
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step: Capture Photo */}
                    {step === "photo" && (
                        <div>
                            <h2 className="text-lg font-light text-[var(--text-primary)] mb-2">
                                Capture Your Photo
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">
                                This photo will be used for verification during the assessment
                            </p>

                            <div className="relative aspect-video bg-[var(--bg-secondary)] rounded-lg overflow-hidden mb-4">
                                {photoData ? (
                                    <img src={photoData} alt="Captured" className="w-full h-full object-cover" />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            <div className="flex gap-3">
                                {photoData ? (
                                    <>
                                        <Button
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => { setPhotoData(null); startCamera(); }}
                                        >
                                            Retake
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={handlePhotoSubmit}
                                            loading={submitting}
                                        >
                                            Continue
                                        </Button>
                                    </>
                                ) : (
                                    <Button className="w-full" onClick={capturePhoto} disabled={!cameraActive}>
                                        <Camera size={18} />
                                        Capture Photo
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step: Consent */}
                    {step === "consent" && (
                        <div>
                            <h2 className="text-lg font-light text-[var(--text-primary)] mb-2">
                                Consent & Agreement
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">
                                Please read and accept the following requirements
                            </p>

                            <div className="space-y-4 mb-6">
                                {[
                                    { key: "terms", label: "I agree to the Terms of Service and Assessment Rules" },
                                    { key: "proctoring", label: "I understand that this assessment is proctored and my activity will be monitored" },
                                    { key: "data", label: "I consent to the collection and processing of my assessment data" },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={consents[item.key]}
                                            onChange={(e) => setConsents({ ...consents, [item.key]: e.target.checked })}
                                            className="mt-1"
                                        />
                                        <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                                    </label>
                                ))}
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleConsent}
                                loading={submitting}
                                disabled={!consents.terms || !consents.proctoring || !consents.data}
                            >
                                Continue to Resume Upload
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
