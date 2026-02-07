"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Check } from "lucide-react";

const steps = [
    { id: "parsing", label: "Parsing Job Description" },
    { id: "extracting", label: "Extracting Skills & Requirements" },
    { id: "rubric", label: "Creating Evaluation Rubric" },
];

export default function ProcessingPage() {
    const router = useRouter();
    const params = useParams();
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        const processJD = async () => {

            console.log("🚀 Starting JD processing for:", params.jdId);

            try {
                // Simulate step progression
                for (let i = 0; i < steps.length; i++) {
                    if (!mounted) return;
                    setCurrentStep(i);

                    if (i === 0) {
                        try {
                            console.log("⚡️ Triggering synchronous api.parseJD...");
                            const res = await api.parseJD(params.jdId);
                            console.log("✅ JD parsed successfully:", res);

                            if (!res.success) {
                                throw new Error(res.error || "Parsing failed");
                            }
                        } catch (err) {
                            console.error("❌ JD processing error:", err);
                            throw err;
                        }
                    }

                    // Wait between steps for visual effect
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }

                // All done, redirect to setup
                if (mounted) {
                    setCurrentStep(steps.length);
                    setTimeout(() => {
                        router.push(`/admin/setup/${params.jdId}`);
                    }, 500);
                }
            } catch (err) {
                if (mounted) {
                    setError(err.message || "Failed to process job description");
                }
            }
        };

        processJD();

        return () => {
            mounted = false;
        };
    }, [params.jdId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <h1 className="text-2xl font-light text-[var(--text-primary)] mb-2">
                        Analyzing Your JD
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Our AI is extracting key information
                    </p>
                </div>

                {error ? (
                    <div className="text-center">
                        <p className="text-[var(--status-error-text)] mb-4">{error}</p>
                        <button
                            onClick={() => router.push("/")}
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline"
                        >
                            Go back and try again
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`
                  flex items-center gap-4 p-4 rounded-lg
                  transition-all duration-300
                  ${index <= currentStep ? "bg-[var(--bg-elevated)]" : "bg-transparent"}
                `}
                            >
                                <div
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${index < currentStep
                                            ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                            : index === currentStep
                                                ? "bg-[var(--bg-secondary)] border-2 border-[var(--accent)]"
                                                : "bg-[var(--bg-secondary)]"}
                  `}
                                >
                                    {index < currentStep ? (
                                        <Check size={16} />
                                    ) : (
                                        <span className="text-sm text-[var(--text-muted)]">
                                            {index + 1}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={`
                    text-sm transition-colors duration-300
                    ${index <= currentStep
                                            ? "text-[var(--text-primary)]"
                                            : "text-[var(--text-muted)]"}
                  `}
                                >
                                    {step.label}
                                </span>
                                {index === currentStep && (
                                    <div className="ml-auto">
                                        <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
