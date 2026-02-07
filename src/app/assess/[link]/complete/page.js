"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui";
import { Check } from "lucide-react";

export default function CompletePage() {
    useEffect(() => {
        // Clear session storage
        sessionStorage.removeItem("candidateAssessmentId");

        // Exit fullscreen if active
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
            <div className="w-full max-w-md text-center">
                <Card padding="lg">
                    <div className="w-20 h-20 rounded-full bg-[var(--status-success-bg)] flex items-center justify-center mx-auto mb-6">
                        <Check size={40} className="text-[var(--status-success-text)]" />
                    </div>

                    <h1 className="text-2xl font-light text-[var(--text-primary)] mb-4">
                        Assessment Submitted
                    </h1>

                    <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                        Thank you for completing the assessment. Your responses have been recorded
                        and will be reviewed by the hiring team.
                    </p>

                    <div className="border-t border-[var(--border-default)] pt-6">
                        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                            What happens next?
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            You will receive an email once your assessment has been evaluated.
                            This typically takes 3-5 business days.
                        </p>
                    </div>
                </Card>

                <p className="mt-8 text-sm text-[var(--text-muted)]">
                    You may safely close this window.
                </p>
            </div>
        </div>
    );
}
